// @ts-nocheck
const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('TriggerRule');

// Custom methods as needed
methods.getActiveRules = async (req, res) => {
  try {
    const user = req.user;
    const companyID = user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    // Only show rules for user's company
    const rules = await mongoose.model('TriggerRule').find({
      companyID,
      isActive: true,
      removed: false
    });

    return res.status(200).json({
      success: true,
      result: rules,
      message: 'Active trigger rules retrieved successfully',
    });
  } catch (error) {
    console.error('Get active trigger rules error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve active trigger rules',
      error: error.message,
    });
  }
};

// For create/update/delete, add companyID and permission checks in your custom methods as needed
// Example for create (if you add a create method):
// if (!user.isCompanyOwner && !user.permissions?.canCreateTriggerRules) {
//   return res.status(403).json({ success: false, message: 'Permission denied: canCreateTriggerRules' });
// }
// ...add companyID: companyID to new document...

module.exports = methods;
