const User = require('@/models/appModels/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const acceptInvitation = async (req, res) => {
  try {
    console.log('Accepting invitation with token:', req.params.token);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Public request:', req.headers['x-public-request'] === 'true');
    console.log('URL:', req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // This is a public endpoint - we should never check for authentication
    // Force set a flag to indicate this is a public request
    req.isPublicRequest = true;
    
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      console.log('Password validation failed: too short or missing');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Find user by invitation token
    console.log('Searching for user with token:', token);
    const user = await User.findOne({
      invitationToken: token,
      invitationExpires: { $gt: Date.now() },
      removed: false,
      isInvitationAccepted: false,
    }).populate('team', 'name description');

    if (!user) {
      console.log('No user found with this token or invitation already accepted');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation token',
      });
    }
    
    console.log('Found user:', user.email);
    
    // Set password and mark invitation as accepted
    // Use bcrypt to hash the password securely
    try {
      console.log('Setting password for user:', user.email);
      
      // The User model's pre-save hook will hash the password
      user.password = password;
      user.isInvitationAccepted = true;
      user.joinedAt = new Date();
      
      // Log the password state (length only for security)
      console.log('Password set with length:', password.length);
    } catch (passwordError) {
      console.error('Error setting password:', passwordError);
      return res.status(500).json({
        success: false,
        message: 'Error setting password',
        error: passwordError.message,
      });
    }
      // Clear invitation info
    user.invitationToken = undefined;
    user.invitationExpires = undefined;
    
    // Make sure we have the company owner ID for settings inheritance
    if (!user.companyOwner && user.invitedBy) {
      console.log('Setting companyOwner ID from invitedBy for settings inheritance');
      user.companyOwner = user.invitedBy;
    }

    // Set companyID from CompanyOwner if available
    if (user.companyOwner) {
      const CompanyOwner = mongoose.model('CompanyOwner');
      const ownerDoc = await CompanyOwner.findById(user.companyOwner);
      if (ownerDoc && ownerDoc.companyID) {
        user.companyID = ownerDoc.companyID;
      }
    }

    console.log('Saving user with password and accepted invitation status');
    await user.save();

    // REMOVE: All CompanyOwner and CompanyOwnerPassword creation/updating logic

    // Populate additional data for response
    await user.populate('invitedBy', 'name email');

    console.log('Invitation accepted successfully for:', user.email);
    return res.status(200).json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        team: user.team,
        joinedAt: user.joinedAt,
      },
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while accepting invitation',
      error: error.message,
    });
  }
};

module.exports = acceptInvitation;