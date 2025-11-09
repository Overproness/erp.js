const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const mongoose = require('mongoose');
const shortid = require('shortid');

// Reset password function
const resetPassword = async (req, res) => {
  try {
    const { token, password, userId } = req.body;

    // Input validation using Joi
    const objectSchema = Joi.object({
      token: Joi.string().required(),
      password: Joi.string().min(6).required(),
      userId: Joi.string().when('token', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      })
    });

    const { error, value } = objectSchema.validate({ token, password, userId });
    if (error) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid reset password data',
        errorMessage: error.message,
      });
    }

    // Load models
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
    const User = mongoose.model('User');

    let user = null;
    let userPassword = null;
    let isUserModel = false;

    // First, try to find by reset token in CompanyOwnerPassword
    if (token) {
      userPassword = await CompanyOwnerPassword.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
        removed: false
      });

      if (userPassword) {
        user = await CompanyOwner.findOne({ 
          _id: userPassword.user, 
          removed: false 
        });
      }

      // If not found in CompanyOwner, try User model
      if (!userPassword || !user) {
        // Note: Assuming User model also has password reset functionality
        // You may need to implement similar reset token logic for User model
        const userWithResetToken = await User.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() },
          removed: false
        });

        if (userWithResetToken) {
          user = userWithResetToken;
          isUserModel = true;
        }
      }
    }

    // Alternative: Find by userId (if provided)
    if (!user && userId) {
      user = await CompanyOwner.findOne({ _id: userId, removed: false });
      if (user) {
        userPassword = await CompanyOwnerPassword.findOne({ 
          user: userId, 
          removed: false 
        });
      } else {
        user = await User.findOne({ _id: userId, removed: false });
        if (user) {
          isUserModel = true;
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invalid or expired password reset token.',
      });
    }

    // Check if user account is enabled/active
    if (user.hasOwnProperty('enabled') && !user.enabled) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Your account is disabled, contact your account administrator',
      });
    }

    if (user.hasOwnProperty('isActive') && !user.isActive) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Your account is inactive, contact your account administrator',
      });
    }

    // For CompanyOwner model
    if (!isUserModel) {
      if (!userPassword) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Password record not found.',
        });
      }

      // Validate reset token if provided
      if (token) {
        const isValidToken = token === userPassword.resetPasswordToken;
        if (!isValidToken || !userPassword.resetPasswordToken) {
          return res.status(403).json({
            success: false,
            result: null,
            message: 'Invalid or expired reset token',
          });
        }
      }

      // Generate new salt and hash password
      const salt = shortid.generate();
      const hashedPassword = bcrypt.hashSync(salt + password);
      const emailToken = shortid.generate();

      // Generate new JWT token
      const jwtToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update password record
      await CompanyOwnerPassword.findOneAndUpdate(
        { user: user._id },
        {
          $push: { loggedSessions: jwtToken },
          password: hashedPassword,
          salt: salt,
          emailToken: emailToken,
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined,
          emailVerified: true,
        },
        { new: true }
      );

      // Update user's last login
      user.lastLogin = Date.now();
      await user.save();

      return res.status(200).json({
        success: true,
        result: {
          _id: user._id,
          name: user.name,
          surname: user.surname,
          role: user.role,
          email: user.email,
          photo: user.photo,
          token: jwtToken,
          isActive: user.isActive,
          onboardingComplete: user.onboardingComplete
        },
        message: 'Password has been reset successfully. You are now logged in.',
      });
    } 
    // For User model
    else {
      // Validate reset token for User model
      if (token) {
        const isValidToken = token === user.resetPasswordToken;
        if (!isValidToken || !user.resetPasswordToken) {
          return res.status(403).json({
            success: false,
            result: null,
            message: 'Invalid or expired reset token',
          });
        }
      }

      // Hash password directly for User model
      const hashedPassword = bcrypt.hashSync(password, 12);

      // Generate new JWT token for User
      const jwtToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          isUser: true,
          team: user.team
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update user password and clear reset token
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined,
          lastLogin: Date.now()
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        result: {
          _id: user._id,
          name: user.name,
          role: user.role,
          email: user.email,
          token: jwtToken,
          isUser: true,
          team: user.team,
          permissions: user.permissions
        },
        message: 'Password has been reset successfully. You are now logged in.',
      });
    }

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error during password reset.',
      error: error.message,
    });
  }
};

module.exports = resetPassword;