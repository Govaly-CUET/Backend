const mongoose = require('mongoose');
const User = require('../models/userModel');

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
    filters.address = {
      $regex: district.trim(),
      $options: 'i',
    };
  }

  const customers = await User.find(filters)
    .select(customerFields)
    .sort({ createdAt: -1 })
    .lean();

  return customers.map((customer) => ({
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    gender: customer.gender,
    DOB: customer.DOB,
    image: customer.image,
    totalOrder: null,
    totalSpend: null,
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
