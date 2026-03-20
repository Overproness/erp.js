// @ts-nocheck
const mongoose = require('mongoose');

/**
 * Team permission middleware and helpers
 */

const checkTeamPermission = async (userId, targetUserId, operation) => {
  try {
    const User = mongoose.model('User');
    const Team = mongoose.model('Team');

    // Get current user and target user
    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId).select('team'),
      User.findById(targetUserId).select('team'),
    ]);

    if (!currentUser || !targetUser) {
      return { allowed: false, reason: 'User not found' };
    }

    // If users are in the same team, check team permissions
    if (
      currentUser.team &&
      targetUser.team &&
      currentUser.team.toString() === targetUser.team.toString()
    ) {
      const team = await Team.findById(currentUser.team);
      if (!team) {
        return { allowed: false, reason: 'Team not found' };
      }

      // Check if team has the required permission
      const hasPermission = team.permissions && team.permissions[operation];
      return {
        allowed: hasPermission,
        reason: hasPermission ? 'Team permission granted' : `Team lacks permission: ${operation}`,
        teamId: team._id,
      };
    }

    // Cross-team collaboration check
    if (
      currentUser.team &&
      targetUser.team &&
      currentUser.team.toString() !== targetUser.team.toString()
    ) {
      const [currentTeam, targetTeam] = await Promise.all([
        Team.findById(currentUser.team),
        Team.findById(targetUser.team),
      ]);

      if (!currentTeam || !targetTeam) {
        return { allowed: false, reason: 'Team not found for cross-team operation' };
      }

      // Check if both teams allow cross-team collaboration
      const currentTeamAllows =
        currentTeam.settings && currentTeam.settings.allowCrossTeamCollaboration;
      const targetTeamAllows =
        targetTeam.settings && targetTeam.settings.allowCrossTeamCollaboration;

      if (!currentTeamAllows || !targetTeamAllows) {
        return {
          allowed: false,
          reason: 'Cross-team collaboration is disabled',
          currentTeamAllows,
          targetTeamAllows,
        };
      }

      // Check if operation is allowed for cross-team
      const hasPermission = currentTeam.permissions && currentTeam.permissions[operation];
      return {
        allowed: hasPermission,
        reason: hasPermission
          ? 'Cross-team permission granted'
          : `Team lacks cross-team permission: ${operation}`,
        crossTeam: true,
        currentTeamId: currentTeam._id,
        targetTeamId: targetTeam._id,
      };
    }

    // No team involvement - standard permission check
    return { allowed: true, reason: 'No team restrictions' };
  } catch (error) {
    return { allowed: false, reason: `Permission check error: ${error.message}` };
  }
};

const createTeamPermissionMiddleware = (operation) => {
  return async (req, res, next) => {
    try {
      const userId = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      // For list operations, check if user's team has access to view other teams' data
      if (operation === 'list' || operation === 'read') {
        const User = mongoose.model('User');
        const Team = mongoose.model('Team');

        const user = await User.findById(userId).select('team');
        if (user && user.team) {
          const team = await Team.findById(user.team);
          if (team && team.permissions && !team.permissions.canViewOtherTeams) {
            // Restrict to own team's data
            req.teamFilter = { team: user.team };
          }
        }
      }

      // For operations involving specific target users
      const targetUserId = req.params.userId || req.body.userId || req.body.assignedTo;
      if (targetUserId) {
        const permissionCheck = await checkTeamPermission(userId, targetUserId, operation);

        if (!permissionCheck.allowed) {
          return res.status(403).json({
            success: false,
            result: null,
            message: permissionCheck.reason,
            details: {
              operation,
              currentUser: userId,
              targetUser: targetUserId,
              ...permissionCheck,
            },
          });
        }

        // Add permission info to request for use in controllers
        req.teamPermission = permissionCheck;
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: `Team permission check failed: ${error.message}`,
      });
    }
  };
};

// Helper to check if teams allow cross-collaboration
const checkCrossTeamCollaboration = async (team1Id, team2Id) => {
  try {
    const Team = mongoose.model('Team');
    const [team1, team2] = await Promise.all([Team.findById(team1Id), Team.findById(team2Id)]);

    if (!team1 || !team2) {
      return { allowed: false, reason: 'Team not found' };
    }

    const team1Allows = team1.settings && team1.settings.allowCrossTeamCollaboration;
    const team2Allows = team2.settings && team2.settings.allowCrossTeamCollaboration;

    return {
      allowed: team1Allows && team2Allows,
      reason:
        team1Allows && team2Allows
          ? 'Cross-team collaboration enabled'
          : 'Cross-team collaboration disabled',
      team1Allows,
      team2Allows,
    };
  } catch (error) {
    return { allowed: false, reason: `Cross-team check error: ${error.message}` };
  }
};

module.exports = {
  checkTeamPermission,
  createTeamPermissionMiddleware,
  checkCrossTeamCollaboration,
};
