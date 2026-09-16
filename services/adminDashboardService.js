const Order = require('../models/orderModel');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_KEYS = ['pending', 'in_progress', 'delivered', 'canceled'];

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

// @desc  Order counts + amounts per financialStatus, for the top stat
//        cards. period filters on createdAt only (today / week / month
//        i.e. last 30 days).
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
/*  Trend charts — GMV, Govaly revenue, vendor earning                 */
/* ------------------------------------------------------------------ */

// GMV per order = sum(quantity * price) across its line items.
// "Cancelled" orders are excluded from every GMV/revenue figure below,
// per spec.
const gmvExpression = {
  $sum: {
    $map: {
      input: '$items',
      as: 'it',
      in: { $multiply: ['$$it.quantity', '$$it.price'] },
    },
  },
};

const fillMonths = (rowsByMonth, fields) =>
  MONTH_LABELS.map((label, index) => {
    const row = rowsByMonth[index + 1] || {};
    const point = { label };
    fields.forEach((f) => {
      point[f] = row[f] || 0;
    });
    return point;
  });

const fillYears = (rowsByYear, fields) => {
  const years = Object.keys(rowsByYear).map(Number);
  if (years.length === 0) return [];
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const result = [];
  for (let y = minYear; y <= maxYear; y++) {
    const row = rowsByYear[y] || {};
    const point = { label: String(y) };
    fields.forEach((f) => {
      point[f] = row[f] || 0;
    });
    result.push(point);
  }
  return result;
};

const currentYearRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear() + 1, 0, 1),
  };
};

// @desc  GMV (units sold * price) by month, current year only.
const getGmvMonthly = async () => {
  const { start, end } = currentYearRange();

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end }, financialStatus: { $ne: 'canceled' } } },
    { $project: { month: { $month: '$createdAt' }, orderGmv: gmvExpression } },
    { $group: { _id: '$month', value: { $sum: '$orderGmv' }, orders: { $sum: 1 } } },
  ]);

  const byMonth = {};
  rows.forEach((r) => {
    byMonth[r._id] = { value: r.value, orders: r.orders };
  });

  return fillMonths(byMonth, ['value', 'orders']);
};

// @desc  Net GMV — GMV summed per calendar year, across every year that
//        has data.
const getGmvYearly = async () => {
  const rows = await Order.aggregate([
    { $match: { financialStatus: { $ne: 'canceled' } } },
    { $project: { year: { $year: '$createdAt' }, orderGmv: gmvExpression } },
    { $group: { _id: '$year', value: { $sum: '$orderGmv' } } },
  ]);

  const byYear = {};
  rows.forEach((r) => {
    byYear[r._id] = { value: r.value };
  });

  return fillYears(byYear, ['value']);
};

// @desc  Govaly revenue (commission earned) by month, current year only.
const getRevenueMonthly = async () => {
  const { start, end } = currentYearRange();

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end }, financialStatus: { $ne: 'canceled' } } },
    { $group: { _id: { $month: '$createdAt' }, value: { $sum: '$govalyEarning' } } },
  ]);

  const byMonth = {};
  rows.forEach((r) => {
    byMonth[r._id] = { value: r.value };
  });

  return fillMonths(byMonth, ['value']);
};

// @desc  Net Govaly revenue — commission summed per calendar year.
const getRevenueYearly = async () => {
  const rows = await Order.aggregate([
    { $match: { financialStatus: { $ne: 'canceled' } } },
    { $group: { _id: { $year: '$createdAt' }, value: { $sum: '$govalyEarning' } } },
  ]);

  const byYear = {};
  rows.forEach((r) => {
    byYear[r._id] = { value: r.value };
  });

  return fillYears(byYear, ['value']);
};

// @desc  Vendor (seller) earning by month, current year only.
const getVendorEarningMonthly = async () => {
  const { start, end } = currentYearRange();

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end }, financialStatus: { $ne: 'canceled' } } },
    { $group: { _id: { $month: '$createdAt' }, value: { $sum: '$sellerEarning' } } },
  ]);

  const byMonth = {};
  rows.forEach((r) => {
    byMonth[r._id] = { value: r.value };
  });

  return fillMonths(byMonth, ['value']);
};

// @desc  All five chart datasets in one call — none of these depend on
//        the stat-card period, so the frontend only needs to fetch this
//        once (not on every period change).
const getDashboardCharts = async () => {
  const [gmvMonthly, gmvYearly, revenueMonthly, revenueYearly, vendorEarningMonthly] = await Promise.all([
    getGmvMonthly(),
    getGmvYearly(),
    getRevenueMonthly(),
    getRevenueYearly(),
    getVendorEarningMonthly(),
  ]);

  return { gmvMonthly, gmvYearly, revenueMonthly, revenueYearly, vendorEarningMonthly };
};

module.exports = {
  getOrderStats,
  getDashboardCharts,
};
