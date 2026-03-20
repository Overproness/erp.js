// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const search = async (req, res) => {
  try {
    // Permission check for search
    if (req.user && !req.user.permissions?.canViewTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to search tasks',
      });
    }

    const { q, fields } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Search query is required',
      });
    }

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    // Parse fields to search in
    const fieldsArray = fields ? fields.split(',') : ['title', 'description'];
    const searchConditions = fieldsArray.map((field) => ({
      [field]: { $regex: new RegExp(q, 'i') },
    }));

    // Build base query
    let baseQuery = {
      removed: false,
      companyID: companyID,
      $or: searchConditions,
    };

    // If user is a team member, include tasks for their team
    if (req.user && req.user.team) {
      baseQuery = {
        removed: false,
        companyID: companyID,
        $and: [
          { $or: searchConditions },
          {
            $or: [
              { assignedTo: req.user._id },
              { assignedTeam: req.user.team },
              { collaborators: req.user._id },
              { createdBy: req.user._id },
              { owner: req.user._id },
              { assignedTo: { $exists: false }, assignedTeam: { $exists: false } },
            ],
          },
        ],
      };
    }

    const result = await Model.find(baseQuery)
      .sort({ created: -1 })
      .limit(10)
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name')
      .exec();

    return res.status(200).json({
      success: true,
      result,
      message: result.length > 0 ? 'Successfully found tasks' : 'No tasks found',
    });
  } catch (error) {
    console.error('Task Search Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = search;
