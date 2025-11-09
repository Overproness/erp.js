const mongoose = require('mongoose');
const moment = require('moment');

const Model = mongoose.model('Task');

const summary = async (req, res) => {
  try {
    // Permission check for summary
    if (req.user && !req.user.permissions?.canViewTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view task summaries',
      });
    }

    let defaultType = 'month';
    const { type } = req.query;

    if (type && ['week', 'month', 'year'].includes(type)) {
      defaultType = type;
    }

    const currentDate = moment();
    let startDate = currentDate.clone().startOf(defaultType);
    let endDate = currentDate.clone().endOf(defaultType);

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    const result = await Model.aggregate([
      {
        $match: {
          removed: false,
          companyID: companyID,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully retrieved task summary',
    });
  } catch (error) {
    console.error('Task Summary Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = summary;
