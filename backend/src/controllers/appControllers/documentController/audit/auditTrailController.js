const mongoose = require('mongoose');
const AuditTrail = mongoose.model('AuditTrail');

/**
 * Creates an audit trail entry in the system
 */
exports.createAuditTrail = async ({
  user,
  action,
  details = {},
  ipAddress = '',
  documentId = null,
  userAgent = '',
}) => {
  try {
    const auditTrail = new AuditTrail({
      documentId,
      action,
      user: user?._id || user,
      ipAddress,
      userAgent,
      details,
    });

    return await auditTrail.save();
  } catch (error) {
    console.error('Error creating audit trail:', error);
    // Don't throw, just return null to avoid disrupting the main operation
    return null;
  }
};

/**
 * Gets audit trail entries with filtering and pagination
 */
exports.getAuditTrail = async (req, res) => {
  try {
    const { 
      documentId, 
      startDate, 
      endDate, 
      actions, 
      users,
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Build query filters
    const filter = {};
    
    if (documentId) {
      filter.documentId = documentId;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }
    
    if (actions && Array.isArray(actions) && actions.length > 0) {
      filter.action = { $in: actions };
    }
    
    if (users && Array.isArray(users) && users.length > 0) {
      filter.user = { $in: users };
    }
    
    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Query with pagination
    const auditTrails = await AuditTrail.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .lean();
    
    // Get total count for pagination
    const total = await AuditTrail.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      result: auditTrails,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

/**
 * Gets audit trail summary for a specific document or all documents
 */
exports.getAuditTrailSummary = async (req, res) => {
  try {
    const { documentId, startDate, endDate } = req.query;
    
    // Build match stage for aggregation
    const matchStage = {};
    
    if (documentId) {
      matchStage.documentId = mongoose.Types.ObjectId(documentId);
    }
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) {
        matchStage.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Perform aggregation
    const summary = await AuditTrail.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get total users who accessed the document(s)
    const uniqueUsers = await AuditTrail.aggregate([
      { $match: matchStage },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);
    
    const totalUniqueUsers = uniqueUsers.length > 0 ? uniqueUsers[0].total : 0;
    
    // Format the summary data
    const actionSummary = summary.map(item => ({
      action: item._id,
      count: item.count,
      lastActivity: item.lastActivity
    }));
    
    return res.status(200).json({
      success: true,
      result: {
        actions: actionSummary,
        uniqueUsers: totalUniqueUsers,
        totalActivities: actionSummary.reduce((sum, item) => sum + item.count, 0)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};
