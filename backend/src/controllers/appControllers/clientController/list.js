const mongoose = require('mongoose');
const Model = mongoose.model('Client');
const Team = mongoose.model('Team');

const list = async (req, res) => {
  try {
    // Permission check for list
    if (req.user && !req.user.permissions?.canViewClients) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view clients',
      });
    }

    const { assignedTeam } = req.query;
    const currentUser = req.user || req.companyOwner;

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get companyID from request context
    const companyID = currentUser.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        message: 'Company context not found',
      });
    }

    // For data isolation, always filter by companyID
    let query = {
      removed: false,
      companyID: companyID,
    };

    // If assignedTeam is requested, add it to the query
    if (assignedTeam) {
      // Get teams where current user is a member
      const userTeams = await Team.find({ 'members.user': currentUser._id });
      const userTeamIds = userTeams.map((team) => team._id.toString());

      if (!userTeamIds.includes(assignedTeam)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this team.',
        });
      }
      query.assignedTeam = assignedTeam;
    }

    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const resultsPromise = Model.find(query)
      .populate('assignedTeam', 'name')
      .sort({ created: -1, _id: -1 }) // Add _id as secondary sort for consistent pagination
      .skip(skip)
      .limit(limit)
      .exec();

    const countPromise = Model.countDocuments(query);

    const [results, count] = await Promise.all([resultsPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    return res.status(200).json({
      success: true,
      result: results,
      pagination,
      message: count > 0 ? 'Clients retrieved successfully' : 'No clients found',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving clients',
      error: error.message,
    });
  }
};

module.exports = list;
