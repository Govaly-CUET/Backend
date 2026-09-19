const { syncOpenShipments } = require('./adminShipmentService');
const { pathaoMode } = require('./couriers');

const DEFAULT_MINUTES = 2;

/*
 * Webhooks cannot reach a laptop, and can be missed anywhere. In sandbox
 * mode this asks the courier about every open shipment on a
 * timer. Does nothing in mock mode.
 *
 * A run that is still going when the next tick arrives is skipped, so
 * slow courier responses can never pile up.
 */
const startShipmentSync = () => {
  const minutes = Number(process.env.SHIPMENT_SYNC_MINUTES) || DEFAULT_MINUTES;
  let running = false;

  const timer = setInterval(async () => {
    if (running) return;
    running = true;

    try {
      if (pathaoMode() === 'mock') return;

      const { checked, updated } = await syncOpenShipments();

      if (checked > 0) {
        console.log(`Shipment sync: checked ${checked}, updated ${updated}.`);
      }
    } catch (error) {
      console.error(`Shipment sync error: ${error.message}`);
    } finally {
      running = false;
    }
  }, minutes * 60 * 1000);

  timer.unref();
};

module.exports = { startShipmentSync };
