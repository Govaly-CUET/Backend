const express = require('express');

const router = express.Router();

const { getDashboardStats, getDashboardChartData } = require('../controllers/adminDashboardController');

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardChartData);

module.exports = router;
