// @ts-nocheck

import Team from '../../../models/appModels/Team';
import User from '../../../models/appModels/User';
const read = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the proper owner ID - prioritize companyOwner
    const ownerId = req.companyOwner?._id || req.admin?._id || req.user?._id;

    // Find team by ID and ensure it belongs to the authenticated user
    const team = await Team.findOne({
      _id: id,
      removed: false,
      owner: ownerId,
    })
      .populate('owner', 'name email')
      .populate('teamLead', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // CompanyID enforcement
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    if (team.companyID !== requesterCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: company mismatch',
      });
    }

    // Fetch team members
    const members = await User.find({
      team: id,
      removed: false,
    }).select('name email role permissions isInvitationAccepted joinedAt');

    // Add members to team object, ensuring name is present
    const teamObject = team.toObject();
    teamObject.members = (members || []).map(member => ({
      _id: member._id,
      name: member.name,
      email: member.email,
      role: member.role,
      permissions: member.permissions,
      isInvitationAccepted: member.isInvitationAccepted,
      joinedAt: member.joinedAt,
    }));
    // owner and teamLead already have name/email due to populate

    return res.status(200).json({
      success: true,
      result: teamObject,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while reading team',
      error: error.message,
    });
  }
};

export = read;
