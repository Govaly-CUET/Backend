const mongoose = require('mongoose');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

const customerFields = '_id name email phone address gender DOB image';

const getAllCustomers = async ({ search = '', id = '', district = '' } = {}) => {
  const filters = {};

  if (id.trim()) {
    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
      return [];
    }

    filters._id = id.trim();
  }

  if (search.trim()) {
    filters.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      ...(mongoose.Types.ObjectId.isValid(search.trim())
        ? [{ _id: search.trim() }]
        : []),
    ];
  }

  if (district.trim()) {
    // New profiles store a structured address; the string condition keeps
    // older customer profiles searchable as well.
    const districtConditions = [
      { 'address.district': { $regex: district.trim(), $options: 'i' } },
      { address: { $regex: district.trim(), $options: 'i' } },
    ];

    if (filters.$or) {
      filters.$and = [{ $or: filters.$or }, { $or: districtConditions }];
      delete filters.$or;
    } else {
      filters.$or = districtConditions;
    }
  }

  const customers = await User.find(filters)
    .select(customerFields)
    .sort({ createdAt: -1 })
    .lean();

  const customerIds = customers.map((customer) => customer._id);
  const orderSummaries = customerIds.length
    ? await Order.aggregate([
      { $match: { customer: { $in: customerIds } } },
      {
        $group: {
          _id: '$customer',
          groupIds: { $addToSet: '$groupId' },
          totalSpend: { $sum: '$amount' },
        },
      },
      {
        $project: {
          totalOrder: { $size: '$groupIds' },
          totalSpend: 1,
        },
      },
    ])
    : [];

  const summariesByCustomerId = new Map(
    orderSummaries.map((summary) => [String(summary._id), summary])
  );

  return customers.map((customer) => ({
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    // Admin customer listing intentionally exposes only the requested
    // location fields, not the customer's complete street address.
    address: customer.address && typeof customer.address === 'object'
      ? {
        upazila: customer.address.upazila || customer.address.thana || customer.address.area || null,
        district: customer.address.district || null,
      }
      : null,
    gender: customer.gender,
    DOB: customer.DOB,
    image: customer.image,
    // One checkout can create several seller orders. Count distinct groupIds
    // so "Total Orders" represents purchases, while spend sums every seller
    // portion in those purchases.
    totalOrder: summariesByCustomerId.get(String(customer._id))?.totalOrder || 0,
    totalSpend: summariesByCustomerId.get(String(customer._id))?.totalSpend || 0,
  }));
};

const deleteCustomer = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid customer ID.' };
  }

  const customer = await User.findByIdAndDelete(id);

  if (!customer) {
    throw { status: 404, message: 'Customer not found.' };
  }

  return { id: customer._id };
};

module.exports = {
  getAllCustomers,
  deleteCustomer,
};
