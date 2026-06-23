// @ts-nocheck
const mongoose = require('mongoose');
const AuditTrail = mongoose.model('AuditTrail');
const { createAuditLog } = require('../auditLog');

/**
 * Retrieves audit trail entries for a specific document
 */
exports.getDocumentAuditTrail = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, actions, startDate, endDate } = req.query;

    // Build query filter
    const filter = { documentId: mongoose.Types.ObjectId(id) };

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Add actions filter if provided
    if (actions && Array.isArray(actions)) {
      filter.action = { $in: actions };
    } else if (actions) {
      filter.action = actions;
    }

    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const auditLogs = await AuditTrail.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .lean();

    // Get total count for pagination
    const total = await AuditTrail.countDocuments(filter);

    return res.status(200).json({
      success: true,
      result: auditLogs,
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
 * Logs an audit event for a document
 */
exports.logDocumentEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, details = {} } = req.body;

    // Create the audit log
    const auditLog = await createAuditLog({
      documentId: id,
      action,
      user: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details,
    });

    if (!auditLog) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create audit log',
      });
    }

    return res.status(200).json({
      success: true,
      result: auditLog,
      message: 'Audit log created successfully',
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
 * Get audit trail summary for a document
 */
exports.getDocumentAuditSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Group audit logs by action and count occurrences
    const actionSummary = await AuditTrail.aggregate([
      { $match: { documentId: mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$action', count: { $sum: 1 }, lastActivity: { $max: '$timestamp' } } },
      { $sort: { count: -1 } },
    ]);

    // Get total number of audit logs
    const totalLogs = await AuditTrail.countDocuments({ documentId: id });

    // Get unique users who interacted with the document
    const uniqueUsers = await AuditTrail.aggregate([
      { $match: { documentId: mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$user' } },
      { $count: 'total' },
    ]);

    const uniqueUserCount = uniqueUsers.length > 0 ? uniqueUsers[0].total : 0;

    return res.status(200).json({
      success: true,
      result: {
        totalActivities: totalLogs,
        uniqueUsers: uniqueUserCount,
        actionSummary: actionSummary.map((item) => ({
          action: item._id,
          count: item.count,
          lastActivity: item.lastActivity,
        })),
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

module.exports.createAuditLog = createAuditLog;
// Alias for GraphQL resolver
exports.getAuditTrail = exports.getDocumentAuditTrail;
