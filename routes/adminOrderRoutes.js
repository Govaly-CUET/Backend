const express = require('express');

const router = express.Router();

const { listOrders, getOrder, updateStatus } = require('../controllers/adminOrderController');

router.get('/', listOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateStatus);

module.exports = router;
