const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('Business');

// If there are custom business methods, add them here
methods.getBranding = async (req, res) => {
  try {
    const businessId = req.params.id;
    const business = await mongoose.model('Business').findById(businessId);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Business not found',
      });
    }
    
    // Return branding information
    return res.status(200).json({
      success: true,
      result: {
        name: business.name,
        branding: business.branding || {},
        logo: business.logo,
        colors: business.branding?.colors || {
          primary: '#4CAF50',
          secondary: '#2196F3',
        },
        fonts: business.branding?.fonts || {
          main: 'Roboto, sans-serif',
          headings: 'Poppins, sans-serif',
        }
      },
      message: 'Business branding retrieved successfully',
    });
  } catch (error) {
    console.error('Get business branding error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve business branding',
      error: error.message,
    });
  }
};

module.exports = methods;
