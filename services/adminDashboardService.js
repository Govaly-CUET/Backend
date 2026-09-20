const Order = require('../models/orderModel');

const STATUS_KEYS = ['pending', 'in_progress', 'delivered', 'canceled'];

// Bangladesh is UTC+6 with no DST, so a fixed offset is enough — no
// need for a timezone library. Every bucket (hour-of-day, calendar
// day) is computed in this timezone, both on the JS side (for the
// x-axis labels) and inside the aggregation (via this same shift),
// so the two always line up.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const shiftToDhaka = { $add: ['$createdAt', DHAKA_OFFSET_MS] };

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${suffix}`;
});

/* ------------------------------------------------------------------ */
/*  Stat cards — Orders / Pending / In Progress / Delivered / Canceled */
/* ------------------------------------------------------------------ */

const getDateRange = (period) => {
  const now = new Date();
  const end = now;
  let start;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
  }

  return { start, end };
};

const getOrderStats = async (period) => {
  const { start, end } = getDateRange(period);

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$financialStatus',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
  ]);

  const byStatus = STATUS_KEYS.reduce((acc, key) => {
    acc[key] = { count: 0, amount: 0 };
    return acc;
  }, {});

  let totalCount = 0;
  let totalAmount = 0;

  rows.forEach((row) => {
    if (byStatus[row._id]) byStatus[row._id] = { count: row.count, amount: row.amount };
    totalCount += row.count;
    totalAmount += row.amount;
  });

  return {
    period,
    orders: { count: totalCount, amount: totalAmount },
    pending: byStatus.pending,
    in_progress: byStatus.in_progress,
    delivered: byStatus.delivered,
    canceled: byStatus.canceled,
  };
};

/* ------------------------------------------------------------------ */
/*  Trend charts — GMV, Net GMV, Govaly Revenue, Net Govaly Revenue,    */
/*  Seller Earning. All five share the same period-based granularity:  */
/*    today  -> 24 hourly buckets ("12 AM", "1 AM", ... "11 PM")        */
/*    week   -> 7 daily buckets, labeled by weekday ("Sun", "Mon", ...) */
/*    month  -> 30 daily buckets, labeled by date ("Sep 1", "Sep 2", ..)*/
/*                                                                       */
/*  Definitions:                                                        */
/*    GMV                = merchandise value across ALL orders, counted */
/*                         as soon as the order is placed — not gated   */
/*                         on shipment/payment status                   */
/*    Net GMV            = GMV minus the GMV of cancelled orders        */
/*    Govaly Revenue     = sum of govalyEarning as stored on ALL orders */
/*                         (the order model itself already zeroes this  */
/*                         out until sellerPayment = "paid", so this    */
/*                         naturally only counts paid orders — no extra */
/*                         filter needed here)                          */
/*    Net Govaly Revenue = Govaly Revenue minus cancelled orders' share */
/*    Seller Earning     = sum of sellerEarning as stored on ALL orders */
/*                         (same zeroing logic as govalyEarning above)  */
/* ------------------------------------------------------------------ */

const gmvExpression = {
  $sum: {
    $map: {
      input: '$items',
      as: 'it',
      in: { $multiply: ['$$it.quantity', '$$it.price'] },
    },
  },
};

// Enumerates every Dhaka-local calendar day between start/end
// (inclusive), returning { key: "YYYY-MM-DD", date } for each — date
// is a UTC-based pseudo-date whose UTC getters read as Dhaka-local.
const enumerateDhakaDays = (start, end) => {
  const shift = (d) => new Date(d.getTime() + DHAKA_OFFSET_MS);
  const startShifted = shift(start);
  const endShifted = shift(end);

  const startDay = Date.UTC(startShifted.getUTCFullYear(), startShifted.getUTCMonth(), startShifted.getUTCDate());
  const endDay = Date.UTC(endShifted.getUTCFullYear(), endShifted.getUTCMonth(), endShifted.getUTCDate());

  const days = [];
  for (let t = startDay; t <= endDay; t += 24 * 60 * 60 * 1000) {
    const d = new Date(t);
    days.push({ key: d.toISOString().slice(0, 10), date: d });
  }
  return days;
};

const formatDateLabel = (date) => `${MONTH_ABBR[date.getUTCMonth()]} ${date.getUTCDate()}`;

// Generic period-bucketed sum of `valueExpression` (a Mongo aggregation
// expression, e.g. gmvExpression or '$govalyEarning').
//   excludeCanceled: true  -> "Net" variants (skip financialStatus: 'canceled')
//   withOrderCount: true   -> also returns an `orders` count per bucket,
//                             used for the "Order: N" chip on GMV charts
//
// No sellerPayment filter here: GMV counts an order as soon as it's
// placed, regardless of shipment/payment status. govalyEarning and
// sellerEarning are summed as stored — the order model's own
// pre('validate') hook already zeroes those fields out until
// sellerPayment = "paid", so unpaid orders contribute 0 automatically.
const getBucketedSeries = async (period, valueExpression, { excludeCanceled = false, withOrderCount = false } = {}) => {
  const { start, end } = getDateRange(period);

  const baseMatch = { createdAt: { $gte: start, $lte: end } };
  if (excludeCanceled) baseMatch.financialStatus = { $ne: 'canceled' };

  if (period === 'today') {
    const groupStage = { _id: '$hour', value: { $sum: '$value' } };
    if (withOrderCount) groupStage.orders = { $sum: 1 };

    const rows = await Order.aggregate([
      { $match: baseMatch },
      { $project: { hour: { $hour: shiftToDhaka }, value: valueExpression } },
      { $group: groupStage },
    ]);

    const byHour = {};
    rows.forEach((r) => {
      byHour[r._id] = r;
    });

    return HOUR_LABELS.map((label, hour) => {
      const row = byHour[hour];
      const point = { label, value: row?.value || 0 };
      if (withOrderCount) point.orders = row?.orders || 0;
      return point;
    });
  }

  // week / month — one bucket per calendar day, oldest to newest.
  const days = enumerateDhakaDays(start, end);
  const groupStage = { _id: '$dayKey', value: { $sum: '$value' } };
  if (withOrderCount) groupStage.orders = { $sum: 1 };

  const rows = await Order.aggregate([
    { $match: baseMatch },
    { $project: { dayKey: { $dateToString: { format: '%Y-%m-%d', date: shiftToDhaka } }, value: valueExpression } },
    { $group: groupStage },
  ]);

  const byDay = {};
  rows.forEach((r) => {
    byDay[r._id] = r;
  });

  return days.map(({ key, date }) => {
    const row = byDay[key];
    const point = {
      label: period === 'week' ? WEEKDAY_LABELS[date.getUTCDay()] : formatDateLabel(date),
      value: row?.value || 0,
    };
    if (withOrderCount) point.orders = row?.orders || 0;
    return point;
  });
};

const getGmvTrend = (period) => getBucketedSeries(period, gmvExpression, { excludeCanceled: false, withOrderCount: true });
const getNetGmvTrend = (period) => getBucketedSeries(period, gmvExpression, { excludeCanceled: true, withOrderCount: true });
const getRevenueTrend = (period) => getBucketedSeries(period, '$govalyEarning', { excludeCanceled: false });
const getNetRevenueTrend = (period) => getBucketedSeries(period, '$govalyEarning', { excludeCanceled: true });
const getSellerEarningTrend = (period) => getBucketedSeries(period, '$sellerEarning', { excludeCanceled: false });

// @desc  All five period-scoped trend charts, fetched together.
const getTrendCharts = async (period) => {
  const [gmvTrend, netGmvTrend, revenueTrend, netRevenueTrend, sellerEarningTrend] = await Promise.all([
    getGmvTrend(period),
    getNetGmvTrend(period),
    getRevenueTrend(period),
    getNetRevenueTrend(period),
    getSellerEarningTrend(period),
  ]);

  return { gmvTrend, netGmvTrend, revenueTrend, netRevenueTrend, sellerEarningTrend };
};

module.exports = {
  getOrderStats,
  getTrendCharts,
};