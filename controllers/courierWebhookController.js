const { handleCourierEvent } = require('../services/adminShipmentService');
const { verifyWebhook } = require('../services/couriers');

// Fixed by Pathao's webhook documentation: the registration test must be
// answered with 202 and this exact value in the header below.
const INTEGRATION_HEADER = 'f3992ecc-59da-4cbe-a049-a13da2018d51';

// @desc    Pathao delivery-status webhook
// @route   POST /api/v1/webhooks/pathao
// @access  Public, but must carry the shared secret in X-PATHAO-Signature
const receivePathaoWebhook = async (req, res) => {
  try {
    const body = req.body || {};

    // Pathao's registration handshake carries no data; it only checks the
    // status code and the header.
    if (body.event === 'webhook_integration') {
      res.set('X-Pathao-Merchant-Webhook-Integration-Secret', INTEGRATION_HEADER);

      return res.status(202).json({ success: true });
    }

    if (!verifyWebhook(req)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const result = await handleCourierEvent(body);

    // 202 even for an unknown consignment, so Pathao does not keep retrying.
    return res.status(202).json({ success: true, handled: result.handled });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { receivePathaoWebhook };
