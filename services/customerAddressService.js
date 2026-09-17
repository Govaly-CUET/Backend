const User = require("../models/userModel");

const getDeliveryAddresses = async (customerId) => {
  const user = await User.findById(customerId)
    .select("deliveryAddresses");

  if (!user) {
    throw {
      status: 404,
      message: "Customer not found.",
    };
  }

  return user.deliveryAddresses;
};

const addDeliveryAddress = async (
  customerId,
  addressData
) => {
  const user = await User.findById(customerId);

  if (!user) {
    throw {
      status: 404,
      message: "Customer not found.",
    };
  }

  const {
    fullName,
    phoneNumber,
    division,
    district,
    area,
    address,
    additionalInstruction,
    label,
    isDefault,
  } = addressData;

  if (
    !fullName ||
    !phoneNumber ||
    !division ||
    !district ||
    !area ||
    !address
  ) {
    throw {
      status: 400,
      message:
        "Full name, phone number, division, district, area and address are required.",
    };
  }

  const shouldBeDefault =
    user.deliveryAddresses.length === 0 ||
    isDefault === true;

  if (shouldBeDefault) {
    user.deliveryAddresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  user.deliveryAddresses.push({
    fullName,
    phoneNumber,
    division,
    district,
    area,
    address,
    additionalInstruction:
      additionalInstruction || "",
    label: label || "Home",
    isDefault: shouldBeDefault,
  });

  await user.save();

  return user.deliveryAddresses[
    user.deliveryAddresses.length - 1
  ];
};

const updateDeliveryAddress = async (
  customerId,
  addressId,
  addressData
) => {
  const user = await User.findById(customerId);

  if (!user) {
    throw {
      status: 404,
      message: "Customer not found.",
    };
  }

  const address = user.deliveryAddresses.id(
    addressId
  );

  if (!address) {
    throw {
      status: 404,
      message: "Delivery address not found.",
    };
  }

  if (addressData.isDefault === true) {
    user.deliveryAddresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  const allowedFields = [
    "fullName",
    "phoneNumber",
    "division",
    "district",
    "area",
    "address",
    "additionalInstruction",
    "label",
    "isDefault",
  ];

  allowedFields.forEach((field) => {
    if (addressData[field] !== undefined) {
      address[field] = addressData[field];
    }
  });

  await user.save();

  return address;
};

const deleteDeliveryAddress = async (
  customerId,
  addressId
) => {
  const user = await User.findById(customerId);

  if (!user) {
    throw {
      status: 404,
      message: "Customer not found.",
    };
  }

  const address = user.deliveryAddresses.id(
    addressId
  );

  if (!address) {
    throw {
      status: 404,
      message: "Delivery address not found.",
    };
  }

  address.deleteOne();

  await user.save();

  return true;
};

module.exports = {
  getDeliveryAddresses,
  addDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
};