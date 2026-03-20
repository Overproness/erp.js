// @ts-nocheck
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');
const Joi = require('joi');
const axios = require('axios');

const register = async (req, res) => {
  try {
    console.log('Registration attempt with email:', req.body.email);

    // 1. Validate request body
    const objectSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string()
        .email({ tlds: { allow: true } })
        .required(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.pattern.base':
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }),
      surname: Joi.string().optional(), // For CompanyOwner
      userType: Joi.string().valid('CompanyOwner', 'User').optional(), // Optional type specification
    });

    const { error, value } = objectSchema.validate(req.body);

    if (error) {
      console.log('Validation error:', error.message);
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid input data',
        errorMessage: error.message,
      });
    }

    const { name, email, password, surname, userType = 'CompanyOwner' } = req.body;

    // 2. Load models based on user type (default to CompanyOwner for backward compatibility)
    let User, UserPassword;

    if (userType === 'User') {
      User = mongoose.model('User');
      // UserPassword model might not exist for Users
      try {
        UserPassword = mongoose.model('UserPassword');
      } catch (err) {
        console.log('UserPassword model not found, will store password directly on User');
        UserPassword = null;
      }
    } else {
      // Default to CompanyOwner
      User = mongoose.model('CompanyOwner');
      UserPassword = mongoose.model('CompanyOwnerPassword');
    }

    // 3. Check if user already exists in both collections to prevent conflicts
    const CompanyOwner = mongoose.model('CompanyOwner');
    const existingCompanyOwner = await CompanyOwner.findOne({
      email: email,
      removed: false,
    });

    let existingUser = null;
    try {
      const UserModel = mongoose.model('User');
      existingUser = await UserModel.findOne({
        email: email,
        removed: false,
      });
    } catch (err) {
      // User model might not exist
      console.log('User model not found during duplicate check');
    }

    if (existingCompanyOwner || existingUser) {
      console.log('Email already exists in database');
      return res.status(409).json({
        success: false,
        result: null,
        message: 'An account with this email already exists',
      });
    }

    // 4. Create new user
    const userData = {
      email,
      name,
      enabled: true,
      removed: false,
    };

    // Add fields specific to user type
    if (userType === 'CompanyOwner') {
      userData.role = 'owner'; // CompanyOwner model only allows 'owner'
      userData.isFirstLogin = true;
      userData.hasSetupCompany = false;
      userData.onboardingComplete = false;
      if (surname) userData.surname = surname;
    } else {
      // User-specific fields
      userData.role = 'user'; // or whatever default role for Users
      userData.isInvitationAccepted = true; // For direct registration
      // DO NOT set onboarding fields for User
    }

    const newUser = new User(userData);

    console.log(`Creating ${userType} with data:`, newUser);
    const savedUser = await newUser.save();
    console.log(`${userType} created successfully:`, savedUser._id);

    // 5. Create password entry
    if (UserPassword) {
      // Separate password model exists
      const salt = uniqueId();
      const hashedPassword = bcrypt.hashSync(salt + password);

      const userPassword = new UserPassword({
        password: hashedPassword,
        salt: salt,
        user: savedUser._id,
        emailVerified: true,
        authType: 'email',
        loggedSessions: [],
        removed: false,
      });

      console.log(`Creating ${userType}Password with salt:`, salt);
      await userPassword.save();
      console.log(`${userType}Password created successfully`);
    } else {
      // Store password directly on user model (for Users without separate password model)
      const salt = uniqueId();
      const hashedPassword = bcrypt.hashSync(salt + password);

      savedUser.password = hashedPassword;
      savedUser.salt = salt;
      await savedUser.save();
      console.log('Password stored directly on User model');
    }

    // 6. Prepare response data
    const responseData = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      userType: userType,
    };

    // Add type-specific response fields
    if (userType === 'CompanyOwner') {
      responseData.role = savedUser.role;
      responseData.surname = savedUser.surname;
      responseData.onboardingComplete = savedUser.onboardingComplete;
      responseData.needsOnboarding = !savedUser.onboardingComplete;

      // Send webhook to n8n instance for company signup
      try {
        console.log('Sending webhook to n8n for company signup:', savedUser._id);
        await axios.post('http://localhost:3000/n8n-instance', {
          id: savedUser._id.toString(),
        });
        console.log('n8n webhook sent successfully');
      } catch (webhookError) {
        console.error('Failed to send webhook to n8n:', webhookError.message);
        // Don't fail the registration if webhook fails
      }
    } else {
      responseData.role = savedUser.role;
      responseData.isInvitationAccepted = savedUser.isInvitationAccepted;
    }

    // 7. Send success response
    return res.status(201).json({
      success: true,
      result: responseData,
      message: `${userType} account created successfully. You can now log in.`,
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Check for validation errors
    if (error.name === 'ValidationError') {
      // Extract and format validation errors
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      console.log('Validation errors:', JSON.stringify(validationErrors, null, 2));

      return res.status(400).json({
        success: false,
        result: null,
        message: 'Validation error creating account',
        errors: validationErrors,
        errorMessage: error.message,
      });
    }

    // Check for duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'An account with this email already exists',
        errorMessage: 'Duplicate email address',
      });
    }

    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error during registration',
      errorMessage: error.message,
    });
  }
};

module.exports = register;
