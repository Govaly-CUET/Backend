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
/*  Trend charts — GMV, Govaly revenue, vendor earning.                 */
/*  Granularity follows the same "period" as the stat cards:            */
/*    today  -> 24 hourly buckets ("12 AM", "1 AM", ... "11 PM")        */
/*    week   -> 7 daily buckets, labeled by weekday ("Sun", "Mon", ...) */
/*    month  -> 30 daily buckets, labeled by date ("Sep 1", "Sep 2", ..)*/
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

// Runs one aggregation for a given value expression (GMV / revenue /
// vendor earning) and buckets it according to the period's granularity.
const getTrendBuckets = async (period, valueExpression) => {
  const { start, end } = getDateRange(period);

  if (period === 'today') {
    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, financialStatus: { $ne: 'canceled' } } },
      { $project: { hour: { $hour: shiftToDhaka }, value: valueExpression } },
      { $group: { _id: '$hour', value: { $sum: '$value' } } },
    ]);

    const byHour = {};
    rows.forEach((r) => {
      byHour[r._id] = r.value;
    });

    return HOUR_LABELS.map((label, hour) => ({ label, value: byHour[hour] || 0 }));
  }

  // week / month — one bucket per calendar day, oldest to newest.
  const days = enumerateDhakaDays(start, end);

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, financialStatus: { $ne: 'canceled' } } },
    { $project: { dayKey: { $dateToString: { format: '%Y-%m-%d', date: shiftToDhaka } }, value: valueExpression } },
    { $group: { _id: '$dayKey', value: { $sum: '$value' } } },
  ]);

  const byDay = {};
  rows.forEach((r) => {
    byDay[r._id] = r.value;
  });

  return days.map(({ key, date }) => ({
    label: period === 'week' ? WEEKDAY_LABELS[date.getUTCDay()] : formatDateLabel(date),
    value: byDay[key] || 0,
  }));
};

// GMV trend also carries an order count per bucket, for the "Order: N"
// chip shown above the GMV chart.
const getGmvTrend = async (period) => {
  const { start, end } = getDateRange(period);

  if (period === 'today') {
    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, financialStatus: { $ne: 'canceled' } } },
      { $project: { hour: { $hour: shiftToDhaka }, gmv: gmvExpression } },
      { $group: { _id: '$hour', value: { $sum: '$gmv' }, orders: { $sum: 1 } } },
    ]);
    const byHour = {};
    rows.forEach((r) => {
      byHour[r._id] = { value: r.value, orders: r.orders };
    });
    return HOUR_LABELS.map((label, hour) => ({
      label,
      value: byHour[hour]?.value || 0,
      orders: byHour[hour]?.orders || 0,
    }));
  }

  const days = enumerateDhakaDays(start, end);
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, financialStatus: { $ne: 'canceled' } } },
    { $project: { dayKey: { $dateToString: { format: '%Y-%m-%d', date: shiftToDhaka } }, gmv: gmvExpression } },
    { $group: { _id: '$dayKey', value: { $sum: '$gmv' }, orders: { $sum: 1 } } },
  ]);
  const byDay = {};
  rows.forEach((r) => {
    byDay[r._id] = { value: r.value, orders: r.orders };
  });

  return days.map(({ key, date }) => ({
    label: period === 'week' ? WEEKDAY_LABELS[date.getUTCDay()] : formatDateLabel(date),
    value: byDay[key]?.value || 0,
    orders: byDay[key]?.orders || 0,
  }));
};

const getRevenueTrend = (period) => getTrendBuckets(period, '$govalyEarning');
const getVendorEarningTrend = (period) => getTrendBuckets(period, '$sellerEarning');

// @desc  The three period-scoped trend charts, fetched together.
const getTrendCharts = async (period) => {
  const [gmvTrend, revenueTrend, vendorEarningTrend] = await Promise.all([
    getGmvTrend(period),
    getRevenueTrend(period),
    getVendorEarningTrend(period),
  ]);

  return { gmvTrend, revenueTrend, vendorEarningTrend };
};

/* ------------------------------------------------------------------ */
/*  Yearly charts — Net GMV / Net Govaly revenue. These are NOT        */
/*  period-scoped; they always show one point per calendar year.       */
/* ------------------------------------------------------------------ */

const fillYears = (rowsByYear) => {
  const years = Object.keys(rowsByYear).map(Number);
  if (years.length === 0) return [];
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const result = [];
  for (let y = minYear; y <= maxYear; y++) {
    result.push({ label: String(y), value: rowsByYear[y] || 0 });
  }
  return result;
};

const getGmvYearly = async () => {
  const rows = await Order.aggregate([
    { $match: { financialStatus: { $ne: 'canceled' } } },
    { $project: { year: { $year: '$createdAt' }, orderGmv: gmvExpression } },
    { $group: { _id: '$year', value: { $sum: '$orderGmv' } } },
  ]);

  const byYear = {};
  rows.forEach((r) => {
    byYear[r._id] = r.value;
  });

  return fillYears(byYear);
};

const getRevenueYearly = async () => {
  const rows = await Order.aggregate([
    { $match: { financialStatus: { $ne: 'canceled' } } },
    { $group: { _id: { $year: '$createdAt' }, value: { $sum: '$govalyEarning' } } },
  ]);

  const byYear = {};
  rows.forEach((r) => {
    byYear[r._id] = r.value;
  });

  return fillYears(byYear);
};

const getYearlyCharts = async () => {
  const [gmvYearly, revenueYearly] = await Promise.all([getGmvYearly(), getRevenueYearly()]);
  return { gmvYearly, revenueYearly };
};

module.exports = {
  getOrderStats,
  getTrendCharts,
  getYearlyCharts,
};