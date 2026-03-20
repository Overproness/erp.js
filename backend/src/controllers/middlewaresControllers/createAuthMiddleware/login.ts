// @ts-nocheck
const Joi = require('joi');
const mongoose = require('mongoose');
const authUser = require('./authUser'); // Assuming you have this helper

const login = async (req, res) => {
  try {
    console.log('Login attempt with email:', req.body.email);
    const { email, password } = req.body;

    // Validation schema
    const objectSchema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: true } })
        .required(),
      password: Joi.string().required(),
    });

    const { error, value } = objectSchema.validate({ email, password });
    if (error) {
      console.log('Validation error:', error.message);
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid/Missing credentials.',
        errorMessage: error.message,
      });
    }

    // Load models
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
    const User = mongoose.model('User');

    // Try CompanyOwner first
    console.log('Finding company owner with email:', email);
    const companyOwner = await CompanyOwner.findOne({ 
      email, 
      removed: false 
    });
    
    if (companyOwner) {
      console.log('Found company owner:', companyOwner.email);
      
      // Check if account is enabled
      if (!companyOwner.enabled && companyOwner.enabled !== undefined) {
        console.log('Company owner account is disabled');
        return res.status(409).json({
          success: false,
          result: null,
          message: 'Your account is disabled, contact your account administrator',
        });
      }

      const databasePassword = await CompanyOwnerPassword.findOne({ 
        user: companyOwner._id, 
        removed: false 
      });

      if (!databasePassword) {
        console.log('No password record found for company owner');
        return res.status(400).json({
          success: false,
          result: null,
          message: 'User password not set correctly.',
        });
      }

      // Use authUser helper for CompanyOwner authentication
      return authUser(req, res, {
        user: companyOwner,
        databasePassword,
        password,
        UserPasswordModel: CompanyOwnerPassword,
        userType: 'CompanyOwner'
      });
    }

    // Try User if CompanyOwner not found
    console.log('No company owner found, checking User collection');
    const user = await User.findOne({ 
      email, 
      removed: false,
      isInvitationAccepted: true // Only login if invitation accepted
    });
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No account with this email has been registered.',
      });
    }

    console.log('Found user:', user.email);

    // Check if user account is enabled
    if (!user.enabled && user.enabled !== undefined) {
      console.log('User account is disabled');
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Your account is disabled, contact your account administrator',
      });
    }

    // For Users, password might be stored directly on the user model
    // or in a separate UserPassword model - handle both cases
    let databasePassword = null;
    let UserPassword = null;
    try {
      UserPassword = mongoose.model('UserPassword');
      databasePassword = await UserPassword.findOne({ 
        user: user._id, 
        removed: false 
      });
    } catch (err) {
      // UserPassword model might not exist
      UserPassword = null;
      // console.log('UserPassword model not found, using direct password');
    }

    // If no separate password record, use direct password from user
    if (!databasePassword && user.password) {
      databasePassword = { 
        password: user.password,
        salt: user.salt || '' // Make sure salt is available
      };
    }

    if (!databasePassword || !databasePassword.password) {
      console.log('No password found for user');
      return res.status(400).json({
        success: false,
        result: null,
        message: 'User password not set correctly.',
      });
    }

    // Only pass onboardingComplete for CompanyOwner, not User
    return authUser(req, res, {
      user,
      databasePassword,
      password,
      UserPasswordModel: UserPassword,
      userType: 'User'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

module.exports = login;