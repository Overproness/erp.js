const mongoose = require('mongoose');
const Joi = require('joi');
const shortid = require('shortid');
const crypto = require('crypto');
const { loadSettings } = require('../../../middlewares/settings');
const sendMail = require('../../../helpers/sendMail');

// Forget password function
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email input
    const objectSchema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: true } })
        .required()
        .messages({
          'string.email': 'Please enter a valid email address',
          'any.required': 'Email is required',
        }),
    });

    const { error } = objectSchema.validate({ email });
    if (error) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid email format',
        errorMessage: error.details[0].message,
      });
    }

    // Load models
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
    const User = mongoose.model('User');

    let user = null;
    let userPassword = null;
    let isUserModel = false;

    // First, try to find in CompanyOwner collection
    console.log('Searching for company owner with email:', email);
    user = await CompanyOwner.findOne({ email: email.toLowerCase(), removed: false });

    if (user) {
      console.log('Found company owner:', user._id);
      userPassword = await CompanyOwnerPassword.findOne({ user: user._id, removed: false });

      if (!userPassword) {
        console.log('No password record found for company owner, creating one');
        userPassword = new CompanyOwnerPassword({
          user: user._id,
          loggedSessions: [],
          emailVerified: true,
        });
        await userPassword.save();
      }
    } else {
      // If not found in CompanyOwner, search in User collection
      console.log('No company owner found, searching in User collection');
      user = await User.findOne({
        email: email.toLowerCase(),
        removed: false,
        isInvitationAccepted: true,
      });

      if (user) {
        console.log('Found user:', user._id);
        isUserModel = true;
      }
    }

    // For security, always return success message even if user not found
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(200).json({
        success: true,
        result: null,
        message:
          'If an account with this email exists, password reset instructions have been sent to your email',
      });
    }

    // Check if user account is active
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

    // Generate reset token - use crypto for better security
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    console.log('Generated reset token for user:', user._id);

    // Update password record based on user type
    if (!isUserModel) {
      // CompanyOwner model
      await CompanyOwnerPassword.findOneAndUpdate(
        { user: user._id },
        {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetPasswordExpires,
        },
        { new: true, upsert: true }
      );
    } else {
      // User model - store reset token directly on user
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetPasswordExpires,
        },
        { new: true }
      );
    }

    // Get settings and create reset URL
    let settings = {};
    try {
      settings = await loadSettings();
    } catch (settingsError) {
      console.warn('Could not load settings, using environment variables:', settingsError.message);
    }

    const baseUrl =
      settings.app_url ||
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';
    const resetUrl = `${baseUrl}/resetpassword/${user._id}/${resetToken}`;

    console.log('Reset URL generated:', resetUrl);

    // Prepare email content
    const emailSubject = 'Password Reset Request';
    const emailText = `
Hello ${user.name || 'User'},

You have requested to reset your password. Please click the link below to reset your password:

${resetUrl}

This link will expire in 30 minutes for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
Your Support Team
    `.trim();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.name || 'User'},</p>
        <p>You have requested to reset your password. Please click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p><strong>This link will expire in 30 minutes</strong> for security reasons.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If you did not request this password reset, please ignore this email. 
          Your password will remain unchanged.
        </p>
      </div>
    `;

    // Send email
    try {
      await sendMail({
        to: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      console.log('Password reset email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);

      // Clear the reset token if email fails
      if (!isUserModel) {
        await CompanyOwnerPassword.findOneAndUpdate(
          { user: user._id },
          {
            $unset: {
              resetPasswordToken: 1,
              resetPasswordExpires: 1,
            },
          }
        );
      } else {
        await User.findOneAndUpdate(
          { _id: user._id },
          {
            $unset: {
              resetPasswordToken: 1,
              resetPasswordExpires: 1,
            },
          }
        );
      }

      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to send reset email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Password reset instructions have been sent to your email',
    });
  } catch (error) {
    console.error('ForgetPassword Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error processing forget password request',
      error: error.message,
    });
  }
};

module.exports = forgetPassword;
