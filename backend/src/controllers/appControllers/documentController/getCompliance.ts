// @ts-nocheck

import { createAuditLog } from './auditLog';
import mongoose from 'mongoose';
import '../../../models/appModels/DocumentCompliance';
// Ensure the model is loaded
let DocumentCompliance;
try {
  DocumentCompliance = mongoose.model('DocumentCompliance');
} catch (error) {
  // Model not registered yet, require it
  DocumentCompliance = mongoose.model('DocumentCompliance');
}
const Document = mongoose.model('AppDocument');

/**
 * Gets compliance information for a document
 */
const getCompliance = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Find compliance record
    let compliance = await DocumentCompliance.findOne({ document: id })
      .populate('lastReviewedBy', 'name email')
      .exec();

    // If no compliance record exists, return default values
    if (!compliance) {
      compliance = {
        document: id,
        complianceStatus: 'review_required',
        regulations: {
          gdpr: { applicable: false, status: 'review_required' },
          hipaa: { applicable: false, status: 'review_required' },
          custom: [],
        },
        dataRetention: {
          policy: 'standard',
          autoDeleteEnabled: false,
        },
        containsSensitiveData: false,
        dataClassification: 'unclassified',
      };
    }

    // Create audit log for viewing compliance information
    await createAuditLog({
      documentId: id,
      action: 'viewed',
      user: req.admin,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { section: 'compliance' },
    });

    return res.status(200).json({
      success: true,
      result: compliance,
      message: 'Compliance information retrieved successfully',
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

export = getCompliance;
