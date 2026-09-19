/*
 * Turns an order into the parcel details a courier needs, and rejects
 * what the courier would reject — so the mock and the real adapter
 * fail on exactly the same bad data.
 */
const normalizePhone = (raw) => {
  let digits = String(raw || '').replace(/\D/g, '');

  if (digits.startsWith('880')) digits = `0${digits.slice(3)}`;
  else if (digits.length === 10 && digits.startsWith('1')) digits = `0${digits}`;

  return digits;
};

const buildParcel = (order) => {
  const ship = order.shippingAddress || {};
  const phone = normalizePhone(ship.phone);

  if (!/^01[3-9]\d{8}$/.test(phone)) {
    throw {
      status: 400,
      message: `Recipient phone "${ship.phone}" is not a valid Bangladeshi mobile number (01XXXXXXXXX). Fix it with the address editor first.`,
    };
  }

  const name = String(ship.name || '').trim();

  if (name.length < 3 || name.length > 100) {
    throw { status: 400, message: 'The recipient name must be 3 to 100 characters for the courier.' };
  }

  const address = [ship.address, ship.area, ship.district, ship.division]
    .filter(Boolean)
    .join(', ');

  if (address.length < 10 || address.length > 220) {
    throw { status: 400, message: 'The delivery address must be 10 to 220 characters for the courier.' };
  }

  const items = order.items || [];

  return {
    recipientName: name,
    recipientPhone: phone,
    recipientAddress: address,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0) || 1,
    description: items.map((item) => `${item.productName} x${item.quantity}`).join(', ').slice(0, 250),
    // Cash on delivery: the customer pays the product price.
    amountToCollect: Math.round(order.amount),
    // Pathao accepts 0.5 kg to 10 kg per parcel.
    weightKg: Math.min(10, Math.max(0.5, Number(process.env.PATHAO_DEFAULT_WEIGHT) || 0.5)),
  };
};

module.exports = { buildParcel, normalizePhone };
