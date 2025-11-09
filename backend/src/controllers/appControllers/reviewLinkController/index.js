const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('ReviewLink');

// Custom methods for review link management
methods.generateLink = async (req, res) => {
  try {
    const owner = req.admin?._id || req.user?.companyOwner;
    
    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }
    
    const { businessId, platform, expiresAt } = req.body;
    
    // Create new review link
    const ReviewLink = mongoose.model('ReviewLink');
    const link = new ReviewLink({
      business: businessId,
      owner,
      createdBy: req.admin?._id || req.user?._id,
      platform,
      expiresAt: expiresAt || null,
    });
    
    await link.save();
    
    return res.status(201).json({
      success: true,
      result: link,
      message: 'Review link generated successfully',
    });
  } catch (error) {
    console.error('Generate review link error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to generate review link',
      error: error.message,
    });
  }
};

module.exports = methods;
