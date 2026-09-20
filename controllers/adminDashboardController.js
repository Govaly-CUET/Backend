const { getOrderStats, getTrendCharts } = require('../services/adminDashboardService');

const VALID_PERIODS = ['today', 'week', 'month'];

// @desc    Top stat cards — Orders / Pending / In Progress / Delivered /
//          Canceled — filtered by the period dropdown.
// @route   GET /api/v1/admin/dashboard/stats?period=today|week|month
//          (period defaults to "month", i.e. last 30 days)
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const period = VALID_PERIODS.includes(req.query.period) ? req.query.period : 'month';
    const stats = await getOrderStats(period);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    GMV, Net GMV, Govaly Revenue, Net Govaly Revenue and Seller
//          Earning trend charts — all five share the stat cards' period
//          and its granularity (today -> hourly, week -> by weekday,
//          month -> by date). Refetch whenever the period changes.
// @route   GET /api/v1/admin/dashboard/trend-charts?period=today|week|month
// @access  Private (Admin)
const getDashboardTrendCharts = async (req, res) => {
  try {
    const period = VALID_PERIODS.includes(req.query.period) ? req.query.period : 'month';
    const charts = await getTrendCharts(period);
    res.status(200).json({ success: true, data: { period, ...charts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getDashboardTrendCharts };