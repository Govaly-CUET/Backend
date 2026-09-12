const {
  getAllCustomers,
  deleteCustomer,
} = require('../services/adminCustomerService');

// @desc    Get all customers
// @route   GET /api/v1/admin/customers
// @access  Private (Admin)
const getCustomers = async (req, res) => {
  try {
    const customers = await getAllCustomers({
      search: req.query.search,
      id: req.query.id,
      district: req.query.district,
    });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/v1/admin/customers/:id
// @access  Private (Admin)
const removeCustomer = async (req, res) => {
  try {
    const customer = await deleteCustomer(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCustomers,
  removeCustomer,
};
