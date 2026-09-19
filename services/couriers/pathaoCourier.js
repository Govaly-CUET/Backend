const crypto = require('crypto');
const { buildParcel } = require('./parcel');

/*
 * Pathao Courier (merchant API) adapter for Pathao's SANDBOX only. It
 * calls Pathao's real API, but against their test environment, so no
 * parcel is ever dispatched. There is deliberately no live mode.
 */
const SANDBOX_BASE_URL = 'https://courier-api-sandbox.pathao.com';

const REQUIRED_ENV = [
  'PATHAO_CLIENT_ID',
  'PATHAO_CLIENT_SECRET',
  'PATHAO_USERNAME',
  'PATHAO_PASSWORD',
  'PATHAO_STORE_ID',
];

const REQUEST_TIMEOUT_MS = 15000;

// access-token cache, per base URL
const tokens = new Map();

const resolveConfig = (mode) => {
  const baseUrl = (process.env.PATHAO_BASE_URL || SANDBOX_BASE_URL).replace(/\/+$/, '');

  // Only a sandbox address may ever be called. If PATHAO_BASE_URL points
  // anywhere else, stop rather than risk a real parcel.
  if (!/sandbox/i.test(baseUrl)) {
    throw {
      status: 500,
      message: 'PATHAO_BASE_URL is not a sandbox URL. This app only talks to Pathao\'s sandbox, so it refuses to call it.',
    };
  }

  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw { status: 503, message: `Pathao is not configured. Missing in .env: ${missing.join(', ')}.` };
  }

  return { baseUrl };
};

const isConfigured = () => REQUIRED_ENV.every((name) => Boolean(process.env[name]));

const describeError = (data, fallback) => {
  if (data?.errors && typeof data.errors === 'object') {
    const [field, messages] = Object.entries(data.errors)[0] || [];
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (field && first) return `${field}: ${first}`;
  }

  return data?.message || fallback;
};

const send = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timed out' : error.message;
    throw { status: 502, message: `Could not reach Pathao (${reason}).` };
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // 422 = Pathao rejected what we sent (our data); anything else is theirs.
    throw {
      status: response.status === 422 ? 400 : 502,
      message: `Pathao: ${describeError(data, response.statusText || `HTTP ${response.status}`)}`,
      httpStatus: response.status,
    };
  }

  return data;
};

const requestToken = async (baseUrl, body) => {
  const data = await send(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      ...body,
    }),
  });

  if (!data?.access_token) {
    throw { status: 502, message: 'Pathao did not return an access token.' };
  }

  const cached = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    // renew a minute early
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 - 60000,
  };

  tokens.set(baseUrl, cached);
  return cached;
};

const getToken = async (baseUrl) => {
  const cached = tokens.get(baseUrl);

  if (cached && cached.expiresAt > Date.now()) return cached.accessToken;

  if (cached?.refreshToken) {
    try {
      const refreshed = await requestToken(baseUrl, {
        grant_type: 'refresh_token',
        refresh_token: cached.refreshToken,
      });
      return refreshed.accessToken;
    } catch {
      tokens.delete(baseUrl);
    }
  }

  const issued = await requestToken(baseUrl, {
    grant_type: 'password',
    username: process.env.PATHAO_USERNAME,
    password: process.env.PATHAO_PASSWORD,
  });

  return issued.accessToken;
};

const authed = async (baseUrl, path, options = {}, retried = false) => {
  const token = await getToken(baseUrl);

  try {
    return await send(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    // The token may have been revoked early — get a fresh one, once.
    if (error.httpStatus === 401 && !retried) {
      tokens.delete(baseUrl);
      return authed(baseUrl, path, options, true);
    }

    throw error;
  }
};

const createPathaoCourier = (mode) => ({
  name: 'pathao',
  mode,

  async createParcel(order) {
    const { baseUrl } = resolveConfig(mode);
    const parcel = buildParcel(order);

    const res = await authed(baseUrl, '/aladdin/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        store_id: Number(process.env.PATHAO_STORE_ID),
        merchant_order_id: order.orderCode,
        recipient_name: parcel.recipientName,
        recipient_phone: parcel.recipientPhone,
        recipient_address: parcel.recipientAddress,
        delivery_type: 48,
        item_type: 2,
        item_quantity: parcel.quantity,
        item_weight: parcel.weightKg,
        item_description: parcel.description,
        amount_to_collect: parcel.amountToCollect,
      }),
    });

    const data = res?.data || {};

    if (!data.consignment_id) {
      throw { status: 502, message: 'Pathao did not return a consignment ID.' };
    }

    return {
      consignmentId: String(data.consignment_id),
      deliveryFee: Number(data.delivery_fee) || 0,
      mode,
    };
  },

  async getStatus(consignmentId) {
    const { baseUrl } = resolveConfig(mode);
    const res = await authed(
      baseUrl,
      `/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`
    );
    const data = res?.data || {};

    return { rawStatus: data.order_status_slug || data.order_status || null };
  },
});

// Pathao sends the secret configured for the webhook in this header.
// It needs no API credentials, so it works even before those are set.
const verifyWebhook = (req) => {
  const secret = process.env.PATHAO_WEBHOOK_SECRET;
  const received = req.get('x-pathao-signature');

  if (!secret || !received) return false;

  const a = Buffer.from(secret);
  const b = Buffer.from(received);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { createPathaoCourier, verifyWebhook, isConfigured };
