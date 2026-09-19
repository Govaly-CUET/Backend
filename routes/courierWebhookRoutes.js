const express = require('express');

const router = express.Router();

const { receivePathaoWebhook } = require('../controllers/courierWebhookController');

router.post('/pathao', receivePathaoWebhook);

module.exports = router;
