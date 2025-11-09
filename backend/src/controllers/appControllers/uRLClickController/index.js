const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('URLClick');

// Custom methods
methods.getClickStats = async (req, res) => {
  try {
    const { urlId } = req.params;
    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }
    // Permission for stats not defined in User
    // Get URL click statistics for user's company only
    const clickStats = await mongoose.model('URLClick').aggregate([
      {
        $match: {
          url: mongoose.Types.ObjectId(urlId),
          companyID: companyID,
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);
    return res.status(200).json({
      success: true,
      result: clickStats,
      message: 'URL click statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get URL click stats error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve URL click statistics',
      error: error.message,
    });
  }
};

module.exports = methods;
