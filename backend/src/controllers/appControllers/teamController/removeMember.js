const Team = require('../../../models/appModels/Team');
const User = require('../../../models/appModels/User');

const removeMember = async (req, res) => {
  try {
    // Use params from the URL
    const teamId = req.params.teamId;
    const memberId = req.params.memberId;

    // Determine owner from admin, companyOwner, or user
    const ownerId =
      (req.admin && req.admin._id) ||
      (req.companyOwner && req.companyOwner._id) ||
      (req.user && req.user._id);

    // Check if team exists and belongs to the owner
    const team = await Team.findOne({
      _id: teamId,
      removed: false,
      owner: ownerId,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Find the team member
    const member = await User.findOne({
      _id: memberId,
      team: teamId,
      removed: false,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    // CompanyID enforcement
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    if (member.companyID !== requesterCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: company mismatch',
      });
    }

    // Permission check: Only company owner or admin can remove members
    const isCompanyOwner = !!req.companyOwner;
    if (!isCompanyOwner) {
      const requesterId = req.user?._id?.toString();
      const requesterMember = team.members.find(m =>
        (m.user?.toString?.() || m._id?.toString?.()) === requesterId
      );
      const requesterRole = requesterMember?.role;

      if (requesterRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can remove team members',
        });
      }
    }

    // Remove member from team's members array (handle both array of ObjectIds or objects)
    team.members = team.members.filter((m) => {
      // m can be ObjectId or { _id: ... } or { user: ... }
      if (typeof m === 'object' && m !== null) {
        return (m._id?.toString() !== memberId) && (m.user?.toString() !== memberId);
      }
      return m.toString() !== memberId;
    });
    await team.save();

    // Update user's team reference
    const userUpdateResult = await User.findByIdAndUpdate(memberId, { team: null });

    return res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while removing team member',
      error: error.message,
    });
  }
};

module.exports = removeMember;
