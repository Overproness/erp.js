const Team = require('@/models/appModels/Team');

const filter = async (req, res) => {
  try {
    const { enabled, hasTeamLead, memberCount } = req.query;
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;

    let filterConditions = {
      companyID: requesterCompanyID,
      removed: false,
    };

    if (enabled !== undefined) {
      filterConditions.enabled = enabled === 'true';
    }

    if (hasTeamLead !== undefined) {
      if (hasTeamLead === 'true') {
        filterConditions.teamLead = { $exists: true, $ne: null };
      } else {
        filterConditions.teamLead = { $exists: false };
      }
    }

    let teams = await Team.find(filterConditions)
      .populate('owner', 'name email')
      .populate('teamLead', 'name email')
      .populate('members', 'name email role')
      .sort({ created: -1 });

    // Filter by member count if specified
    if (memberCount) {
      const count = parseInt(memberCount);
      teams = teams.filter(team => team.members.length === count);
    }

    return res.status(200).json({
      success: true,
      result: teams,
      message: 'Filtered teams retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while filtering teams',
      error: error.message,
    });
  }
};

module.exports = filter;
