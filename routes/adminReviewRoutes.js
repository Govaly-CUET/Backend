const express = require('express');

const router = express.Router();

const { listReviews, reviewStats } = require('../controllers/adminReviewController');

router.get('/', listReviews);
router.get('/stats', reviewStats);

module.exports = router;
