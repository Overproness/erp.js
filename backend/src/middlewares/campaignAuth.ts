// @ts-nocheck
/**
 * Campaign Auth Middleware
 * 
 * Authentication and authorization for campaign management
 */
const { Campaign, SocialCampaign } = require('../models');
const mongoose = require('mongoose');

/**
 * Verify if user owns the campaign
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next
 */
const verifyCampaignOwnership = async (req, res, next) => {
  try {
    const campaignId = req.params.id || req.body.campaignId;
    const ownerId = req.admin?._id;
    
    if (!campaignId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID and owner ID are required'
      });
    }

    // Validate campaign ID
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID format'
      });
    }

    // Check campaign ownership
    const campaign = await Campaign.findOne({
      _id: campaignId,
      owner: ownerId,
      removed: false
    });

    if (!campaign) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to manage this campaign'
      });
    }

    // Store campaign in request for later use
    req.campaign = campaign;
    next();
  } catch (error) {
    console.error('Campaign ownership verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying campaign ownership'
    });
  }
};

/**
 * Verify if user owns the social campaign
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next
 */
const verifySocialCampaignOwnership = async (req, res, next) => {
  try {
    const campaignId = req.params.id || req.body.campaignId;
    const ownerId = req.admin?._id;
    
    if (!campaignId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID and owner ID are required'
      });
    }

    // Validate campaign ID
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID format'
      });
    }

    // Check campaign ownership
    const campaign = await SocialCampaign.findOne({
      _id: campaignId,
      owner: ownerId,
      removed: false
    });

    if (!campaign) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to manage this social campaign'
      });
    }

    // Store campaign in request for later use
    req.socialCampaign = campaign;
    next();
  } catch (error) {
    console.error('Social campaign ownership verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying social campaign ownership'
    });
  }
};

/**
 * Verify user has required role for campaign operations
 * @param {Array|string} roles Allowed roles
 */
const verifyCampaignRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = req.admin || req.user;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user role (assuming role is stored in user object)
      const userRole = user.role;

      // Check if user has any of the allowed roles
      if (!allowedRoles.includes(userRole) && !allowedRoles.includes('*')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Insufficient permissions'
        });
      }

      // Check additional company owner permissions
      if (user.isCompanyOwner) {
        // Company owners always have access
        return next();
      }
      
      // For team campaigns, check if user is part of campaign team
      const campaignId = req.params.id || req.body.campaignId;
      if (campaignId) {
        const campaign = req.campaign || await Campaign.findById(campaignId);
        
        if (campaign && campaign.collaboration?.team) {
          const userTeamRole = campaign.collaboration.team.find(
            member => member.user.toString() === user._id.toString() && member.userModel === 'User'
          );
          
          if (!userTeamRole) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: User is not part of campaign team'
            });
          }
          
          // Check if user has required team role
          const requiredRoles = ['manager', 'creator'];
          if (!requiredRoles.includes(userTeamRole.role)) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: Insufficient team role'
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('Campaign role verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying campaign role'
      });
    }
  };
};

/**
 * Check if campaign can be modified (not active or completed)
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next
 */
const verifyModifiableCampaign = async (req, res, next) => {
  try {
    const campaignId = req.params.id || req.body.campaignId;
    if (!campaignId) {
      return next();
    }

    // Get campaign (either from previous middleware or fetch new)
    const campaign = req.campaign || await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign can be modified
    const nonModifiableStates = ['active', 'completed', 'archived'];
    if (nonModifiableStates.includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot modify campaign in ${campaign.status} status`
      });
    }

    // Store campaign in request for later use if not already there
    if (!req.campaign) {
      req.campaign = campaign;
    }

    next();
  } catch (error) {
    console.error('Campaign modifiable check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking if campaign can be modified'
    });
  }
};

/**
 * Check for approval requirements before campaign state changes
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next
 */
const checkCampaignApproval = async (req, res, next) => {
  try {
    // Only check for approval if status is being changed to active
    if (req.body.status !== 'active') {
      return next();
    }

    const campaignId = req.params.id;
    if (!campaignId) {
      return next();
    }

    // Get campaign (either from previous middleware or fetch new)
    const campaign = req.campaign || await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if approval is required
    if (campaign.approval?.required) {
      // Check if all required approvers have approved
      const requiredApprovers = campaign.approval.approvers || [];
      const pendingApprovers = requiredApprovers.filter(approver => !approver.approved);
      
      if (pendingApprovers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Campaign requires approval before activation',
          pendingApprovers: pendingApprovers.map(a => ({
            user: a.user,
            role: a.role
          }))
        });
      }
    }

    next();
  } catch (error) {
    console.error('Campaign approval check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking campaign approval status'
    });
  }
};

/**
 * Check campaign budget constraints
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next
 */
const checkCampaignBudget = async (req, res, next) => {
  try {
    // Only check budget for activation or if budget is being changed
    if (req.body.status !== 'active' && !req.body.budget) {
      return next();
    }

    const campaignId = req.params.id;
    if (!campaignId) {
      return next();
    }

    // Get campaign (either from previous middleware or fetch new)
    const campaign = req.campaign || await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get company budget limits
    const companyOwner = await CompanyOwner.findById(req.admin._id);
    const budgetLimit = companyOwner?.marketingSettings?.budgetLimit || 0;
    
    if (budgetLimit > 0) {
      // Get total budget of active campaigns
      const activeCampaigns = await Campaign.find({
        owner: req.admin._id,
        status: 'active',
        _id: { $ne: campaignId }, // Exclude current campaign
        removed: false
      });
      
      const currentTotalBudget = activeCampaigns.reduce((sum, c) => {
        return sum + ((c.budget?.total || 0) - (c.budget?.spent || 0));
      }, 0);
      
      // Calculate new campaign's budget
      const newBudget = req.body.budget?.total || campaign.budget?.total || 0;
      const spentBudget = campaign.budget?.spent || 0;
      const remainingBudget = newBudget - spentBudget;
      
      // Check if adding this campaign would exceed the limit
      if (currentTotalBudget + remainingBudget > budgetLimit) {
        return res.status(400).json({
          success: false,
          message: 'Campaign budget exceeds company budget limit',
          currentUsage: currentTotalBudget,
          limit: budgetLimit,
          available: budgetLimit - currentTotalBudget
        });
      }
    }

    next();
  } catch (error) {
    console.error('Campaign budget check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking campaign budget constraints'
    });
  }
};

module.exports = {
  verifyCampaignOwnership,
  verifySocialCampaignOwnership,
  verifyCampaignRole,
  verifyModifiableCampaign,
  checkCampaignApproval,
  checkCampaignBudget
};
