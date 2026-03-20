// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const filter = async (req, res) => {
  try {
    // Permission check for filter
    if (req.user && !req.user.permissions?.canViewTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to filter tasks',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const items = parseInt(req.query.items) || parseInt(req.query.limit) || 10;
    const skip = (page - 1) * items;

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    // Build base filter query
    let filterQuery = {
      removed: false,
      companyID: companyID,
    };

    // Apply filters from query params
    const { filter: filterParam, equal, contains, startswith, ...otherParams } = req.query;

    if (filterParam && equal) {
      filterQuery[filterParam] = equal;
    }

    if (filterParam && contains) {
      filterQuery[filterParam] = { $regex: contains, $options: 'i' };
    }

    if (filterParam && startswith) {
      filterQuery[filterParam] = { $regex: `^${startswith}`, $options: 'i' };
    }

    // Handle direct field filters (e.g., status=completed)
    Object.keys(otherParams).forEach((key) => {
      if (key !== 'page' && key !== 'items' && key !== 'limit' && otherParams[key]) {
        filterQuery[key] = otherParams[key];
      }
    });

    // If user is a team member, include tasks for their team
    if (req.user && req.user.team) {
      const baseFilters = { ...filterQuery };
      delete baseFilters.removed;
      delete baseFilters.companyID;

      filterQuery = {
        removed: false,
        companyID: companyID,
        $or: [
          { assignedTo: req.user._id, ...baseFilters },
          { assignedTeam: req.user.team, ...baseFilters },
          { collaborators: req.user._id, ...baseFilters },
          { createdBy: req.user._id, ...baseFilters },
          { owner: req.user._id, ...baseFilters },
          {
            assignedTo: { $exists: false },
            assignedTeam: { $exists: false },
            ...baseFilters,
          },
        ],
      };
    }

    // Execute query
    const resultsPromise = Model.find(filterQuery)
      .skip(skip)
      .limit(items)
      .sort({ created: -1 })
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name')
      .exec();

    const countPromise = Model.countDocuments(filterQuery);

    const [docs, total] = await Promise.all([resultsPromise, countPromise]);
    const pages = Math.ceil(total / items);

    return res.status(200).json({
      success: true,
      result: {
        items: docs,
        pagination: {
          page,
          pages,
          count: total,
          limit: items,
          total,
        },
      },
      pagination: {
        page,
        pages,
        count: total,
        limit: items,
        total,
      },
      message: docs.length > 0 ? 'Successfully found filtered tasks' : 'No tasks found',
    });
  } catch (error) {
    console.error('Task Filter Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = filter;
