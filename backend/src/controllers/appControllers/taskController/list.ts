// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const list = async (req, res) => {
  try {
    // Permission check for list - only deny if permissions are explicitly set and deny access
    if (req.user?.permissions && req.user.permissions.canViewTasks === false) {
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

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'created', sortValue = -1, filter, equal } = req.query;
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    const fields = fieldsArray.length === 0 ? {} : { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }

    // Build base query with company filter
    let baseQuery = {
      removed: false,
      companyID: companyID,
      ...(filter && equal && { [filter]: equal }),
      ...fields,
    };

    // If the user is a team member, include tasks assigned to their team
    if (req.user && req.user.team) {
      // Find tasks assigned to the user OR to their team
      baseQuery = {
        removed: false,
        companyID: companyID,
        $or: [
          // Tasks assigned directly to the user
          { assignedTo: req.user._id },
          // Tasks assigned to the user's team
          { assignedTeam: req.user.team },
          // Tasks where user is a collaborator
          { collaborators: req.user._id },
          // Tasks created by the user
          { createdBy: req.user._id },
          // Tasks owned by the user
          { owner: req.user._id },
          // Tasks with no specific assignment (available to all)
          { assignedTo: { $exists: false }, assignedTeam: { $exists: false } },
        ],
        ...(filter && equal && { [filter]: equal }),
        ...fields,
      };
    }

    // Execute query with population
    const resultsPromise = Model.find(baseQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue, _id: sortValue })
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name')
      .exec();

    const countPromise = Model.countDocuments(baseQuery);

    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    // Log the result to debug
    console.log('=== TASK LIST DEBUG ===');
    console.log('Total tasks found:', result.length);
    if (result.length > 0) {
      console.log('First task ID:', result[0]._id);
      console.log('First task assignedTo (raw):', result[0].assignedTo);
      console.log('First task assignedTo type:', typeof result[0].assignedTo);
      console.log(
        'First task assignedTo instanceof ObjectId?',
        result[0].assignedTo instanceof mongoose.Types.ObjectId
      );
      console.log(
        'Is assignedTo an object?',
        result[0].assignedTo && typeof result[0].assignedTo === 'object'
      );
      if (result[0].assignedTo) {
        console.log('assignedTo has name?', result[0].assignedTo.name);
        console.log('assignedTo has email?', result[0].assignedTo.email);
        console.log('assignedTo _id?', result[0].assignedTo._id);
        console.log('assignedTo toString():', result[0].assignedTo.toString());
      }

      // Try to manually fetch the user
      const User = mongoose.model('User');
      const testUser = await User.findById(result[0].assignedTo);
      console.log(
        'Manually fetched user:',
        testUser
          ? {
              _id: testUser._id,
              name: testUser.name,
              email: testUser.email,
              removed: testUser.removed,
              enabled: testUser.enabled,
            }
          : 'null'
      );
    }
    console.log('======================');

    const pagination = {
      page: parseInt(page),
      pages,
      count,
      limit: parseInt(limit),
      total: count,
    };

    return res.status(200).json({
      success: true,
      result: {
        items: result,
        pagination,
      },
      pagination,
      message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = list;
