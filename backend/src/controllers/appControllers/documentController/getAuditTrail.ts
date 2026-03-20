// @ts-nocheck
const mongoose = require('mongoose');
const Document = mongoose.model('AppDocument');
const { getDocumentAuditLogs, createAuditLog } = require('./auditLog');

/**
 * Gets audit trail for a document with pagination
 */
const getAuditTrail = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if document exists and user has access
    const document = await Document.findOne({
      _id: id,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Get audit logs with pagination
    const auditLogs = await getDocumentAuditLogs({
      documentId: id,
      page,
      limit,
    });

    // Log this audit trail access
    await createAuditLog({
      documentId: id,
      action: 'viewed',
      user: req.admin,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { section: 'audit_trail' },
    });

    return res.status(200).json({
      success: true,
      result: auditLogs.result,
      pagination: auditLogs.pagination,
      message: 'Audit trail retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = getAuditTrail;
