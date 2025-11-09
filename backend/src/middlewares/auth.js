const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Check if user is authenticated
exports.checkAuth = async (req, res, next) => {
  try {
    console.log('=== checkAuth CALLED ===');
    console.log('URL:', req.originalUrl);

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header provided in checkAuth');
      return res.status(401).json({
        success: false,
        result: null,
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for a User (former TeamMember)
    if (decoded.isUser) {
      const User = mongoose.model('User');
      const user = await User.findOne({
        _id: decoded.id,
        removed: false,
        isInvitationAccepted: true,
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Invalid user authentication token',
        });
      }

      // ONLY set req.user for User tokens
      req.user = user;
      req.isUser = true;
      req.userPermissions = user.permissions;
      
      console.log('User authenticated with permissions:', user.permissions ? 'Yes' : 'No');
      next();
      return;
    }

    // Regular companyOwner authentication
    const CompanyOwner = mongoose.model('CompanyOwner');
    const companyOwner = await CompanyOwner.findOne({ _id: decoded.id, removed: false });

    if (!companyOwner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Invalid authentication token',
      });
    }

    // ONLY set req.companyOwner for CompanyOwner tokens
    req.companyOwner = companyOwner;
    req.admin = companyOwner; // For backward compatibility
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Authentication token is invalid or expired',
      error: error.message,
    });
  }
};

// Check if user is companyOwner
exports.isCompanyOwner = (req, res, next) => {
  if (
    req.companyOwner &&
    (req.companyOwner.role === 'admin' || req.companyOwner.role === 'owner')
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Access denied: CompanyOwner privileges required',
    });
  }
};
