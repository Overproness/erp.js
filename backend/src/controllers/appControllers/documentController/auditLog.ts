// @ts-nocheck
const mongoose = require('mongoose');

// Ensure the model is loaded
let AuditTrail;
try {
  AuditTrail = mongoose.model('AuditTrail');
} catch (error) {
  // Model not registered yet, require it
  require('../../../models/appModels/auditTrailModel');
  AuditTrail = mongoose.model('AuditTrail');
}

/**
 * Creates an audit log entry for a document action
 * @param {Object} params - Audit log parameters
 * @param {string} params.documentId - Document ID
 * @param {string} params.action - Action performed (created, updated, etc.)
 * @param {Object} params.user - User who performed the action
 * @param {string} params.ipAddress - IP address of the user
 * @param {string} params.userAgent - User agent of the browser
 * @param {Object} params.details - Additional details about the action
 * @returns {Promise<Object>} Created audit log
 */
const createAuditLog = async ({ documentId, action, user, ipAddress, userAgent, details = {} }) => {
  try {
    const auditLog = new AuditTrail({
      documentId,
      action,
      user: user?._id || user,
      ipAddress,
      userAgent,
      details,
    });

    return await auditLog.save();
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Log error but don't throw to prevent disrupting the main operation
    return null;
  }
};

/**
 * Retrieves audit logs for a document with pagination
 * @param {Object} params - Query parameters
 * @param {string} params.documentId - Document ID
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of records per page
 * @returns {Promise<Object>} Paginated audit logs
 */
const getDocumentAuditLogs = async ({ documentId, page = 1, limit = 20 }) => {
  try {
    const skip = (page - 1) * limit;

    // Query audit logs with pagination
    const auditLogs = await AuditTrail.find({ documentId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .lean();

    // Get total count for pagination
    const total = await AuditTrail.countDocuments({ documentId });

    return {
      success: true,
      result: auditLogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

module.exports = {
  createAuditLog,
  getDocumentAuditLogs,
};
