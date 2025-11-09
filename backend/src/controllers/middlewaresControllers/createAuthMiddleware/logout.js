const mongoose = require('mongoose');

const logout = async (req, res) => {
  try {
    console.log('Logout attempt for URL:', req.originalUrl);

    // Handle the case when the user is already logged out or not authenticated
    // Check both companyOwner and user from the auth middleware
    if (!req.companyOwner && !req.user) {
      console.log('No authenticated user found, already logged out');
      return res.json({
        success: true,
        result: {},
        message: 'Already logged out',
      });
    }

    // Get the token from Authorization header if present
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract the token

    // Determine user type and get appropriate models
    let userId, UserPasswordModel, userType;

    if (req.companyOwner) {
      // CompanyOwner logout
      userId = req.companyOwner._id;
      UserPasswordModel = mongoose.model('CompanyOwnerPassword');
      userType = 'CompanyOwner';
      console.log('Logging out CompanyOwner:', req.companyOwner.email);
    } else if (req.user) {
      // User logout
      userId = req.user._id;
      userType = 'User';
      console.log('Logging out User:', req.user.email);
      
      // Try to get UserPassword model if it exists
      try {
        UserPasswordModel = mongoose.model('UserPassword');
      } catch (err) {
        // UserPassword model might not exist for regular users
        console.log('UserPassword model not found, User logout without session management');
        return res.json({
          success: true,
          result: {},
          message: 'Successfully logged out',
        });
      }
    }

    // Only proceed with session management if we have a UserPasswordModel
    if (UserPasswordModel && userId) {
      if (token) {
        // If a specific token is provided, remove only that token
        console.log('Removing specific token from logged sessions');
        await UserPasswordModel.findOneAndUpdate(
          { user: userId },
          { $pull: { loggedSessions: token } },
          { new: true }
        ).exec();
      } else {
        // If no token is provided, clear all logged sessions
        console.log('Clearing all logged sessions for user');
        await UserPasswordModel.findOneAndUpdate(
          { user: userId },
          { loggedSessions: [] },
          { new: true }
        ).exec();
      }
    }

    console.log(`Successfully logged out ${userType}:`, userId);
    return res.json({
      success: true,
      result: {},
      message: 'Successfully logged out',
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Still return success to client even if there's a server error
    // This ensures the client-side logout always works
    return res.json({
      success: true, 
      result: {},
      message: 'Logged out on client side',
    });
  }
};

module.exports = logout;