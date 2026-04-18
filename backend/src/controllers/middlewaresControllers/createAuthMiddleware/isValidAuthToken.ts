// @ts-nocheck
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const isValidAuthToken = async (req, res, next) => {
    try {
      console.log('=== createAuthMiddleware.isValidAuthToken wrapper called ===');
      console.log('=== AUTH MIDDLEWARE DEBUG ===');
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('AUTH FAIL: No Bearer token found');
        return res.status(401).json({
          success: false,
          result: null,
          message: 'No authentication token provided',
        });
      }

      const token = authHeader.split(' ')[1];
      console.log('AUTH: Token found, length:', token.length);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      console.log('AUTH: Token decoded successfully:', {
        id: decoded.id,
        _id: decoded._id,
        isUser: decoded.isUser,
      });

      // Get the user ID from either id or _id field
      const userId = decoded.id || decoded._id;

      if (decoded.isUser) {
        console.log('AUTH: Checking for User token');
        const User = mongoose.model('User');
        const user = await User.findOne({
          _id: userId,
          removed: false,
          isInvitationAccepted: true,
        });

        if (!user) {
          console.log('AUTH FAIL: User not found with id:', userId);
          return res.status(401).json({
            success: false,
            result: null,
            message: 'Invalid user authentication token',
          });
        }

        // ONLY set req.user for User tokens - do NOT set req.companyOwner
        req.user = user;
        req.isUser = true;
        req.userPermissions = user.permissions;

        // Load subscription for user's company owner
        try {
          const CompanyOwner = mongoose.model('CompanyOwner');
          const Subscription = mongoose.model('Subscription');
          const owner = await CompanyOwner.findOne({ companyID: user.companyID, removed: false }).lean();
          if (owner) {
            const subscription = await Subscription.findOne({ companyOwner: owner._id }).lean();
            req.subscription = subscription ?? null;
            req.plan = (subscription && subscription.status !== 'canceled') ? subscription.plan : 'starter';
          } else {
            req.plan = 'starter';
            req.subscription = null;
          }
        } catch (subErr) {
          req.plan = 'starter';
          req.subscription = null;
        }
        
        console.log('AUTH SUCCESS: User authenticated');
        return next();
      }

      // Regular companyOwner authentication
      console.log('AUTH: Checking for CompanyOwner token');
      const CompanyOwner = mongoose.model('CompanyOwner');
      const companyOwner = await CompanyOwner.findOne({ _id: userId, removed: false });

      if (!companyOwner) {
        console.log('AUTH FAIL: CompanyOwner not found with id:', userId);
        console.log('AUTH FAIL: Searched with query:', { _id: userId, removed: false });
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Invalid authentication token',
        });
      }

      console.log('AUTH SUCCESS: CompanyOwner authenticated:', companyOwner.email);
      // ONLY set req.companyOwner for CompanyOwner tokens - do NOT set req.user
      req.companyOwner = companyOwner;

      // Load subscription for CompanyOwner
      try {
        const Subscription = mongoose.model('Subscription');
        const subscription = await Subscription.findOne({ companyOwner: companyOwner._id }).lean();
        req.subscription = subscription ?? null;
        req.plan = (subscription && subscription.status !== 'canceled') ? subscription.plan : 'starter';
      } catch (subErr) {
        req.plan = 'starter';
        req.subscription = null;
      }

      return next();
    } catch (error) {
      console.log('AUTH ERROR: Exception occurred:', error.message);
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication token is invalid or expired',
        error: error.message,
      });
    }
  }

module.exports = isValidAuthToken;