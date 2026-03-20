// @ts-nocheck
const createCRUDController = require('../../middlewaresControllers/createCRUDController');
const User = require('@/models/appModels/User');
const mongoose = require('mongoose');

// Add permissions method
const permissions = async (req, res) => {
  try {
    console.log('=== USER PERMISSIONS DEBUG START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Debug authentication data
    console.log('Authentication state:');
    console.log('- req.user exists:', !!req.user);
    console.log('- req.companyOwner exists:', !!req.companyOwner);
    console.log('- req.admin exists:', !!req.admin);
    console.log('- req.isUser:', req.isUser);
    
    // If it's a CompanyOwner, they have all permissions (no need to fetch from DB)
    if (req.companyOwner) {
      console.log('User is CompanyOwner - returning full access');
      const ownerResponse = {
        success: true,
        result: {
          permissions: {}, // Empty object means all permissions
          isOwner: true,
          role: 'owner',
          email: req.companyOwner.email,
          name: req.companyOwner.name,
          userId: req.companyOwner._id
        },
        message: 'Company owner has all permissions'
      };
      
      console.log('CompanyOwner response:', JSON.stringify(ownerResponse, null, 2));
      console.log('=== USER PERMISSIONS DEBUG END (CompanyOwner) ===');
      return res.json(ownerResponse);
    }

    // For regular users, extract and validate user ID
    if (!req.user) {
      console.log('ERROR: No req.user found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no user found'
      });
    }

    console.log('req.user details:', {
      _id: req.user._id,
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name
    });

    const rawUserId = req.user._id || req.user.id;
    console.log('User ID extraction:', rawUserId, typeof rawUserId);
    
    if (!rawUserId) {
      console.log('ERROR: No user ID found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no user ID found'
      });
    }

    // Convert and validate ObjectId
    let currentUserId;
    try {
      const idString = rawUserId.toString();
      console.log('ID validation:', idString, idString.length);
      
      if (!mongoose.Types.ObjectId.isValid(idString)) {
        throw new Error(`Invalid ObjectId format: ${idString}`);
      }
      
      currentUserId = new mongoose.Types.ObjectId(idString);
      console.log('Converted to ObjectId:', currentUserId);
      
    } catch (idError) {
      console.log('ObjectId conversion error:', idError.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        debug: {
          rawId: rawUserId,
          error: idError.message
        }
      });
    }

    // Query database for user permissions
    console.log('Searching for user ID:', currentUserId);
    
    const user = await User.findById(currentUserId).select('permissions role email name team companyOwner isActive');
    
    console.log('Database query results - User found:', !!user);
    
    if (user) {
      console.log('User permissions:', {
        hasPermissions: !!user.permissions,
        permissionsCount: user.permissions ? Object.keys(user.permissions).length : 0,
        role: user.role
      });
    } else {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    // Build final response
    const response = {
      success: true,
      result: {
        permissions: user.permissions || {},
        isOwner: false,
        role: user.role,
        email: user.email,
        name: user.name,
        userId: user._id,
        isActive: user.isActive
      },
      message: 'User permissions retrieved successfully'
    };
    
    console.log('Final response - Permissions count:', Object.keys(response.result.permissions).length);
    console.log('=== USER PERMISSIONS DEBUG END (Success) ===');
    
    res.json(response);

  } catch (error) {
    console.error('=== USER PERMISSIONS ERROR ===');
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching user permissions',
      error: error.message
    });
  }
};

module.exports = permissions;