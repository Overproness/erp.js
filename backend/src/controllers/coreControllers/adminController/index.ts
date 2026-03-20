// @ts-nocheck
const mongoose = require('mongoose');
const CompanyOwner = mongoose.model('CompanyOwner');
const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const completeCompanySetup = require('./completeCompanySetup');

const list = async (req, res) => {
  try {
    const owners = await CompanyOwner.find({ removed: false })
      .select('name email role')
      .sort({ created: -1 });

    return res.status(200).json({
      success: true,
      result: owners,
      message: 'Successfully retrieved admin list',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

// Create the admin controller with all methods
const adminMethods = createUserController('CompanyOwner');

// Add the list method to the controller
adminMethods.list = list;

// Add the completeCompanySetup method to the controller
adminMethods.completeCompanySetup = completeCompanySetup;

module.exports = adminMethods;
