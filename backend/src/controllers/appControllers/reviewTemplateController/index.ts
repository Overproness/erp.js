// @ts-nocheck
const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('ReviewTemplate');

// Add custom methods as needed
methods.getTemplateByType = async (req, res) => {
  try {
    const { type } = req.params;
    const owner = req.admin?._id || req.user?.companyOwner;
    
    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }
    
    const template = await mongoose.model('ReviewTemplate').findOne({
      type,
      owner,
      removed: false
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        result: null,
        message: `Template with type ${type} not found`,
      });
    }
    
    return res.status(200).json({
      success: true,
      result: template,
      message: 'Template retrieved successfully',
    });
  } catch (error) {
    console.error('Get template by type error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve template',
      error: error.message,
    });
  }
};

module.exports = methods;
