const express = require('express');

const router = express.Router();

const { listSellersOverview } = require('../controllers/adminSellerOverviewController');

router.get('/overview', listSellersOverview);

module.exports = router;
