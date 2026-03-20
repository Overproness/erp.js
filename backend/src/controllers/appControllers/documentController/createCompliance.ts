// @ts-nocheck
const mongoose = require('mongoose');

// Ensure the model is loaded
let DocumentCompliance;
try {
  DocumentCompliance = mongoose.model('DocumentCompliance');
} catch (error) {
  // Model not registered yet, require it
  try {
    require('../../../models/appModels/DocumentCompliance');
    DocumentCompliance = mongoose.model('DocumentCompliance');
  } catch (requireError) {
    // If model file doesn't exist, create a minimal schema
    const DocumentComplianceSchema = new mongoose.Schema({
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppDocument' },
      complianceType: String,
      status: String,
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      checkedAt: { type: Date, default: Date.now },
    });
    DocumentCompliance = mongoose.model('DocumentCompliance', DocumentComplianceSchema);
  }
}
const Document = mongoose.model('AppDocument');
const { createAuditLog } = require('./auditLog');

/**
 * Creates or updates compliance information for a document
 */
const createCompliance = async (req, res) => {
  try {
    // Get owner and user from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);
    const reviewedBy = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);
    const userContext = req.user || req.companyOwner;

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { id } = req.params;

    // Check if document exists and user has access
    const document = await Document.findOne({
      _id: id,
      owner: owner,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Get compliance data from request body
    const {
      complianceStatus,
      status, // For test compatibility
      standard, // For test compatibility
      regulations,
      dataRetention,
      containsSensitiveData,
      dataClassification,
      checkedBy,
      checkedAt,
      findings,
      expiryDate,
    } = req.body;

    // Use either complianceStatus or status for backwards compatibility
    const finalStatus = complianceStatus || status;
    const finalStandard = standard;

    // Find existing compliance record or create a new one
    let compliance = await DocumentCompliance.findOne({ document: id });

    if (compliance) {
      // Update existing compliance record
      compliance.complianceStatus = finalStatus || compliance.complianceStatus;
      compliance.standard = finalStandard || compliance.standard;
      compliance.status = finalStatus || compliance.status;
      compliance.checkedBy = checkedBy || compliance.checkedBy;
      compliance.checkedAt = checkedAt || compliance.checkedAt;
      compliance.findings = findings || compliance.findings;
      compliance.expiryDate = expiryDate || compliance.expiryDate;

      if (regulations) {
        if (regulations.gdpr) {
          compliance.regulations.gdpr = {
            ...compliance.regulations.gdpr,
            ...regulations.gdpr,
          };
        }

        if (regulations.hipaa) {
          compliance.regulations.hipaa = {
            ...compliance.regulations.hipaa,
            ...regulations.hipaa,
          };
        }

        if (regulations.custom) {
          compliance.regulations.custom = regulations.custom;
        }
      }

      if (dataRetention) {
        compliance.dataRetention = {
          ...compliance.dataRetention,
          ...dataRetention,
        };
      }

      if (typeof containsSensitiveData !== 'undefined') {
        compliance.containsSensitiveData = containsSensitiveData;
      }

      if (dataClassification) {
        compliance.dataClassification = dataClassification;
      }

      compliance.lastReviewedBy = reviewedBy;
      compliance.lastReviewedAt = new Date();
      compliance.updated = new Date();
    } else {
      // Create new compliance record
      compliance = new DocumentCompliance({
        document: id,
        complianceStatus: finalStatus || 'review_required',
        standard: finalStandard,
        status: finalStatus || 'review_required',
        checkedBy: checkedBy,
        checkedAt: checkedAt || new Date(),
        findings: findings,
        expiryDate: expiryDate,
        regulations: regulations || {
          gdpr: { applicable: false },
          hipaa: { applicable: false },
          custom: [],
        },
        dataRetention: dataRetention || {
          policy: 'standard',
          autoDeleteEnabled: false,
        },
        containsSensitiveData: containsSensitiveData || false,
        dataClassification: dataClassification || 'unclassified',
        lastReviewedBy: reviewedBy,
        lastReviewedAt: new Date(),
      });
    }

    // Save compliance record
    const result = await compliance.save();

    // Create audit log
    await createAuditLog({
      documentId: id,
      action: 'compliance_updated',
      user: userContext,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        complianceStatus: finalStatus,
        standard: finalStandard,
        regulations: {
          gdpr: regulations?.gdpr?.applicable,
          hipaa: regulations?.hipaa?.applicable,
        },
        dataClassification,
      },
    });

    return res.status(200).json({
      success: true,
      result,
      message: 'Compliance information updated successfully',
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

module.exports = createCompliance;
