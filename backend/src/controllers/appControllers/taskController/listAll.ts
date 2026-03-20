// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const listAll = async (req, res) => {
  try {
    // Permission check for listAll
    if (req.user && !req.user.permissions?.canViewTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view tasks',
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

    const sort = req.query.sort || 'desc';
    const enabled = req.query.enabled || undefined;

    // Build base query
    let query = {
      removed: false,
      companyID: companyID,
    };

    if (enabled !== undefined) {
      query.enabled = enabled;
    }

    // If user is a team member, include tasks for their team
    if (req.user && req.user.team) {
      const enabledFilter = enabled !== undefined ? { enabled } : {};
      query = {
        removed: false,
        companyID: companyID,
        $or: [
          { assignedTo: req.user._id, ...enabledFilter },
          { assignedTeam: req.user.team, ...enabledFilter },
          { collaborators: req.user._id, ...enabledFilter },
          { createdBy: req.user._id, ...enabledFilter },
          { owner: req.user._id, ...enabledFilter },
          {
            assignedTo: { $exists: false },
            assignedTeam: { $exists: false },
            ...enabledFilter,
          },
        ],
      };
    }

    const result = await Model.find(query)
      .sort({ created: sort })
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name')
      .exec();

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        result: {
          items: result,
          pagination: {
            page: 1,
            pages: 1,
            count: result.length,
            limit: result.length,
            total: result.length,
          },
        },
        message: 'Successfully found all tasks',
      });
    }

    return res.status(203).json({
      success: false,
      result: {
        items: [],
        pagination: {
          page: 1,
          pages: 0,
          count: 0,
          limit: 0,
          total: 0,
        },
      },
      message: 'Collection is Empty',
    });
  } catch (error) {
    console.error('Task ListAll Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = listAll;
