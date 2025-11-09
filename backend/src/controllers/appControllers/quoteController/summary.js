const mongoose = require('mongoose');
const moment = require('moment');

const Model = mongoose.model('Quote');

const summary = async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewQuotes) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Permission denied: cannot view quotes summary',
    });
  }

  let defaultType = 'month';
  const { type } = req.query;

  if (type) {
    if (['week', 'month', 'year'].includes(type)) {
      defaultType = type;
    } else {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid type',
      });
    }
  }

  const currentDate = moment();
  let startDate = currentDate.clone().startOf(defaultType);
  let endDate = currentDate.clone().endOf(defaultType);

  const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
  const result = await Model.aggregate([
    {
      $match: {
        removed: false,
        owner: req.user ? req.user._id : req.companyOwner._id, // Add owner filter
        companyID, // Filter by companyID
      },
    },
    {
      $group: {
        _id: '$status',
        count: {
          $sum: 1,
        },
        total_amount: {
          $sum: '$total',
        },
      },
    },
    {
      $group: {
        _id: null,
        total_count: {
          $sum: '$count',
        },
        results: {
          $push: '$$ROOT',
        },
      },
    },
    {
      $unwind: '$results',
    },
    {
      $project: {
        _id: 0,
        status: '$results._id',
        count: '$results.count',
        percentage: {
          $round: [{ $multiply: [{ $divide: ['$results.count', '$total_count'] }, 100] }, 0],
        },
        total_amount: '$results.total_amount',
      },
    },
    {
      $sort: {
        status: 1,
      },
    },
  ]);

  const statuses = ['draft', 'pending', 'sent', 'expired', 'declined', 'accepted'];

  statuses.forEach((status) => {
    const found = result.find((item) => item.status === status);
    if (!found) {
      result.push({
        status,
        count: 0,
        percentage: 0,
        total_amount: 0,
      });
    }
  });

  const total = result.reduce((acc, item) => acc + item.total_amount, 0);

  const finalResult = {
    total,
    type: defaultType,
    performance: result,
  };

  return res.status(200).json({
    success: true,
    result: finalResult,
    message: `Successfully found all Quotations for the last ${defaultType}`,
  });
};
module.exports = summary;
