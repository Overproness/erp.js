// @ts-nocheck

import Team from '@/models/appModels/Team';
import User from '@/models/appModels/User';
const summary = async (req, res) => {
  try {
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;

    const totalTeams = await Team.countDocuments({
      companyID: requesterCompanyID,
      removed: false,
    });

    const activeTeams = await Team.countDocuments({
      companyID: requesterCompanyID,
      removed: false,
      enabled: true,
    });

    const totalMembers = await User.countDocuments({
      companyID: requesterCompanyID,
      removed: false,
    });

    const activeMembers = await User.countDocuments({
      companyID: requesterCompanyID,
      removed: false,
      isInvitationAccepted: true,
    });

    const pendingInvitations = await User.countDocuments({
      companyID: requesterCompanyID,
      removed: false,
      isInvitationAccepted: false,
    });

    // Get teams with member counts
    const teamsWithMemberCounts = await Team.aggregate([
      {
        $match: {
          companyID: requesterCompanyID,
          removed: false,
        },
      },
      {
        $lookup: {
          from: 'users', // Updated from 'teammembers'
          localField: 'members',
          foreignField: '_id',
          as: 'memberDetails',
        },
      },
      {
        $project: {
          name: 1,
          memberCount: { $size: '$memberDetails' },
        },
      },
      {
        $sort: { memberCount: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const summary = {
      totalTeams,
      activeTeams,
      totalMembers,
      activeMembers,
      pendingInvitations,
      topTeamsByMemberCount: teamsWithMemberCounts,
    };

    return res.status(200).json({
      success: true,
      result: summary,
      message: 'Team summary retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while generating team summary',
      error: error.message,
    });
  }
};

export = summary;
