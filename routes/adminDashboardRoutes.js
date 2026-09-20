const express = require('express');

const router = express.Router();

const { getDashboardStats, getDashboardTrendCharts } = require('../controllers/adminDashboardController');

router.get('/stats', getDashboardStats);
router.get('/trend-charts', getDashboardTrendCharts);

module.exports = router;