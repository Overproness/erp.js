const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('CustomerBehavior');

// Custom methods
methods.recordBehavior = async (req, res) => {
  try {
    const owner = req.admin?._id || req.user?.companyOwner;
    
    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }
    
    const { customerId, type, data } = req.body;
    
    // Create new customer behavior record
    const CustomerBehavior = mongoose.model('CustomerBehavior');
    const behavior = new CustomerBehavior({
      customer: customerId,
      owner,
      createdBy: req.admin?._id || req.user?._id,
      type,
      data,
    });
    
    await behavior.save();
    
    return res.status(201).json({
      success: true,
      result: behavior,
      message: 'Customer behavior recorded successfully',
    });
  } catch (error) {
    console.error('Record customer behavior error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to record customer behavior',
      error: error.message,
    });
  }
};

module.exports = methods;
