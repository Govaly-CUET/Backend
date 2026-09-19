const express = require('express');

const router = express.Router();

const {
  getDashboardStats,
  getDashboardTrendCharts,
  getDashboardYearlyCharts,
} = require('../controllers/adminDashboardController');

router.get('/stats', getDashboardStats);
router.get('/trend-charts', getDashboardTrendCharts);
router.get('/yearly-charts', getDashboardYearlyCharts);

module.exports = router;