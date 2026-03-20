// @ts-nocheck
const Team = require('@/models/appModels/Team');
const User = require('@/models/appModels/User');

const listMembers = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Get current user and company ID
    const currentUser = req.user || req.companyOwner || req.admin;
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;

    // Check if team exists and belongs to the same company
    const team = await Team.findOne({
      _id: teamId,
      removed: false,
      companyID: requesterCompanyID,
    }).populate({
      path: 'members.user',
      select: 'name email role enabled',
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or access denied',
      });
    }

    // Filter out removed or disabled users
    const activeMembers = team.members.filter((member) => member.user && member.user.enabled);

    return res.status(200).json({
      success: true,
      result: activeMembers,
      message: 'Team members retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching team members',
      error: error.message,
    });
  }
};

module.exports = listMembers;
