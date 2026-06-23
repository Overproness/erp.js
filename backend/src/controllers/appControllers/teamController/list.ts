// @ts-nocheck

import Team from '../../../models/appModels/Team';
import User from '../../../models/appModels/User';
const list = async (req, res) => {
  try {
    // Get current user from request - prioritize companyOwner for owners
    const currentUser = req.companyOwner || req.admin || req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query - fetch all teams within the company
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    const query = {
      removed: false,
      companyID: requesterCompanyID,
    };

    console.log(`Fetching all teams for company: ${requesterCompanyID}`);

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    console.log('Team query:', JSON.stringify(query, null, 2));

    // Get total count
    const total = await Team.countDocuments(query);

    // Get teams with pagination
    const teams = await Team.find(query)
      .populate('owner', 'name email')
      .populate('teamLead', 'name email')
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${teams.length} teams for company ${requesterCompanyID}`);

    // For each team, fetch member details from User collection
    const teamsWithMemberDetails = await Promise.all(
      teams.map(async (team) => {
        const teamObj = team.toObject();
        const members = await User.find({
          team: teamObj._id,
          removed: false,
        }).select('name email role permissions isInvitationAccepted joinedAt');
        teamObj.members = (members || []).map(member => ({
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          permissions: member.permissions,
          isInvitationAccepted: member.isInvitationAccepted,
          joinedAt: member.joinedAt,
        }));
        return teamObj;
      })
    );

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    // Structure the response to match what the frontend expects
    // The frontend expects the structure to be:
    // { success: true, result: { items: [...], pagination: {...} } }
    return res.status(200).json({
      success: true,
      result: {
        items: teamsWithMemberDetails,
        pagination: {
          current: page,
          pageSize: limit,
          total: total,
          totalPages: totalPages,
          showSizeChanger: true,
        },
      },
      message: 'Teams list retrieved successfully',
    });
  } catch (error) {
    console.error('Error in team list controller:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

export = list;
