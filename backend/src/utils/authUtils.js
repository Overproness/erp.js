/**
 * Authentication utility functions
 */

/**
 * Get the current user ID from the request object
 * Handles both companyOwner and user authentication
 * @param {Object} req - Express request object
 * @returns {string|null} - User ID or null if not found
 */
const getCurrentUserId = (req) => {
  // Now only one will be set based on token type
  return req.companyOwner?._id || req.user?._id || req.admin?._id || null;
};

/**
 * Get the current user object from the request
 * @param {Object} req - Express request object
 * @returns {Object|null} - User object or null if not found
 */
const getCurrentUser = (req) => {
  // Now only one will be set based on token type
  return req.companyOwner || req.user || req.admin || null;
};

/**
 * Check if the current user is a company owner
 * @param {Object} req - Express request object
 * @returns {boolean} - True if user is company owner
 */
const isCompanyOwner = (req) => {
  return !!req.companyOwner;
};

/**
 * Check if the current user is a team member (User)
 * @param {Object} req - Express request object
 * @returns {boolean} - True if user is a team member
 */
const isTeamMember = (req) => {
  return !!req.user || req.isUser;
};

/**
 * Get the company owner ID for settings access
 * For Users, this might require a database lookup
 * @param {Object} req - Express request object
 * @returns {string|null} - Company owner ID or null if not found
 */
const getCompanyOwnerId = async (req) => {
  if (req.companyOwner) {
    return req.companyOwner._id;
  }
  
  // For Users, we need to find their company owner
  if (req.user) {
    if (req.user.companyOwner) {
      return req.user.companyOwner;
    }
    
    // If user has a team, get the team owner
    if (req.user.team) {
      const mongoose = require('mongoose');
      const Team = mongoose.model('Team');
      const team = await Team.findById(req.user.team);
      return team?.owner || null;
    }
  }
  
  return null;
};

module.exports = {
  getCurrentUserId,
  getCurrentUser,
  isCompanyOwner,
  isTeamMember,
  getCompanyOwnerId,
};
