const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('Review');

// Custom methods for review management
methods.getReviewsByBusiness = async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const reviews = await mongoose.model('Review').find({ 
      business: businessId,
      removed: false 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      result: reviews,
      message: 'Reviews retrieved successfully',
    });
  } catch (error) {
    console.error('Get reviews by business error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve reviews',
      error: error.message,
    });
  }
};

module.exports = methods;
