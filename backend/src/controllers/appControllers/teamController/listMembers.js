const Team = require('@/models/appModels/Team');
const User = require('@/models/appModels/User');

const listMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    // Get the proper owner ID - prioritize companyOwner
    const ownerId = req.companyOwner?._id || req.admin?._id || req.user?._id;

    // Check if team exists and belongs to the user
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

    // CompanyID enforcement
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    if (team.companyID !== requesterCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: company mismatch',
      });
    }

    // Build query
    const query = {
      team: teamId,
      removed: false,
      companyID: requesterCompanyID,
    };

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get team members with pagination
    const members = await User.find(query)
      .populate('invitedBy', 'name email')
      .select('-password -invitationToken')
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      result: members,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        totalPages,
      },
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
