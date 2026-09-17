const {
  getDeliveryAddresses,
  addDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
} = require("../services/customerAddressService");

const getAddresses = async (req, res) => {
  try {
    const addresses = await getDeliveryAddresses(
      req.customer._id
    );

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    const status = error.status || 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const addAddress = async (req, res) => {
  try {
    const address = await addDeliveryAddress(
      req.customer._id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Delivery address added successfully.",
      data: address,
    });
  } catch (error) {
    const status = error.status || 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const address = await updateDeliveryAddress(
      req.customer._id,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Delivery address updated successfully.",
      data: address,
    });
  } catch (error) {
    const status = error.status || 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    await deleteDeliveryAddress(
      req.customer._id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Delivery address deleted successfully.",
    });
  } catch (error) {
    const status = error.status || 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
};