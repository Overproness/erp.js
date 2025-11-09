const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('CustomerSegment');

// Custom methods
methods.getCustomersInSegment = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.admin?._id || req.user?.companyOwner;
    
    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }
    
    const segment = await mongoose.model('CustomerSegment').findOne({
      _id: id,
      owner,
      removed: false
    });
    
    if (!segment) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Customer segment not found',
      });
    }
    
    // Get customers in segment (implement actual query logic based on your data model)
    const customers = await mongoose.model('Client').find({
      owner,
      removed: false,
      // Add conditions based on segment criteria
    });
    
    return res.status(200).json({
      success: true,
      result: customers,
      message: 'Customers in segment retrieved successfully',
    });
  } catch (error) {
    console.error('Get customers in segment error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve customers in segment',
      error: error.message,
    });
  }
};

module.exports = methods;
