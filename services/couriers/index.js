const mockCourier = require('./mockCourier');
const pathao = require('./pathaoCourier');

const MODES = ['mock', 'sandbox'];

// Test-only project: "mock" contacts nobody, "sandbox" talks to Pathao's
// test environment. There is deliberately no live mode, so this app can
// never book a real parcel. Default is "mock".
const pathaoMode = () => {
  const mode = (process.env.PATHAO_MODE || 'mock').toLowerCase();

  if (!MODES.includes(mode)) {
    throw { status: 500, message: `PATHAO_MODE must be one of: ${MODES.join(', ')}.` };
  }

  return mode;
};

const getCourier = (name) => {
  if (name !== 'pathao') {
    throw { status: 400, message: `Unsupported courier "${name}".` };
  }

  const mode = pathaoMode();
  return mode === 'mock' ? mockCourier : pathao.createPathaoCourier(mode);
};

// What the admin UI needs to know — never any secret.
const getCourierInfo = () => {
  const mode = pathaoMode();

  return {
    pathao: {
      mode,
      configured: mode === 'mock' ? true : pathao.isConfigured(),
      events: mode === 'mock' ? mockCourier.simulationEvents : [],
    },
  };
};

// In mock mode there is no real courier to send webhooks, so none is
// accepted — otherwise anyone could POST fake events to a demo server.
const verifyWebhook = (req) => (pathaoMode() === 'mock' ? false : pathao.verifyWebhook(req));

module.exports = { getCourier, getCourierInfo, verifyWebhook, pathaoMode };
