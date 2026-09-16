const { getOrderStats, getDashboardCharts } = require('../services/adminDashboardService');

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

// @desc    GMV / Net GMV / Govaly revenue / Net Govaly revenue / vendor
//          earning trend charts. Not period-filtered — fetch once and
//          cache on the frontend rather than refetching on every period
//          change.
// @route   GET /api/v1/admin/dashboard/charts
// @access  Private (Admin)
const getDashboardChartData = async (req, res) => {
  try {
    const charts = await getDashboardCharts();
    res.status(200).json({ success: true, data: charts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getDashboardChartData };
