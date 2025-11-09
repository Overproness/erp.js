const mongoose = require('mongoose');
const DataRetentionPolicy = require('@/models/appModels/dataRetentionPolicyModel');
const ConsentRecord = require('@/models/appModels/consentRecordModel');
const Document = mongoose.model('AppDocument');
const User = mongoose.model('User');
const AuditTrail = require('@/models/appModels/auditTrailModel');
const {
  createAuditTrail,
} = require('@/controllers/appControllers/documentController/audit/auditTrailController');
const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Data Retention Policy Management
exports.createRetentionPolicy = async (req, res) => {
  try {
    const { dataType, retentionPeriod, automaticDeletion, description, applicableRegions } =
      req.body;

    const newPolicy = new DataRetentionPolicy({
      dataType,
      retentionPeriod,
      automaticDeletion: automaticDeletion || false,
      description,
      applicableRegions: applicableRegions || [],
      createdBy: req.user._id,
    });

    await newPolicy.save();

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'retention_policy_created',
      details: { policyId: newPolicy._id, dataType, retentionPeriod },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      result: newPolicy,
      message: 'Data retention policy created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getRetentionPolicies = async (req, res) => {
  try {
    const { page = 1, limit = 10, dataType } = req.query;

    const query = dataType ? { dataType } : {};

    const policies = await DataRetentionPolicy.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created: -1 })
      .populate('createdBy', 'name email');

    const count = await DataRetentionPolicy.countDocuments(query);

    return res.status(200).json({
      success: true,
      result: policies,
      pagination: {
        total: count,
        page: page * 1,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateRetentionPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const policy = await DataRetentionPolicy.findByIdAndUpdate(
      id,
      { ...updates, updated: Date.now() },
      { new: true, runValidators: true }
    );

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Data retention policy not found',
      });
    }

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'retention_policy_updated',
      details: { policyId: policy._id, updates },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      result: policy,
      message: 'Data retention policy updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteRetentionPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await DataRetentionPolicy.findByIdAndDelete(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Data retention policy not found',
      });
    }

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'retention_policy_deleted',
      details: { policyId: policy._id, dataType: policy.dataType },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      result: policy,
      message: 'Data retention policy deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Consent Management
exports.recordConsent = async (req, res) => {
  try {
    const { userId, purpose, consentGiven, dataCategories, expiration } = req.body;

    const consentRecord = new ConsentRecord({
      user: userId,
      purpose,
      consentGiven,
      dataCategories: dataCategories || [],
      expiration: expiration || null,
      recordedBy: req.user._id,
      ipAddress: req.ip,
    });

    await consentRecord.save();

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'consent_recorded',
      details: { consentId: consentRecord._id, userId, purpose, consentGiven },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      result: consentRecord,
      message: 'User consent recorded successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUserConsents = async (req, res) => {
  try {
    const { userId } = req.params;

    const consents = await ConsentRecord.find({ user: userId })
      .sort({ created: -1 })
      .populate('recordedBy', 'name email');

    return res.status(200).json({
      success: true,
      result: consents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateConsent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const consent = await ConsentRecord.findByIdAndUpdate(
      id,
      { ...updates, updated: Date.now() },
      { new: true, runValidators: true }
    );

    if (!consent) {
      return res.status(404).json({
        success: false,
        message: 'Consent record not found',
      });
    }

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'consent_updated',
      details: { consentId: consent._id, updates },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      result: consent,
      message: 'Consent record updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Data Anonymization
exports.anonymizeUserData = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate anonymized replacement data
    const anonymizedEmail = `anon_${crypto.randomBytes(8).toString('hex')}@anonymized.com`;
    const anonymizedName = `Anonymized User ${crypto.randomBytes(4).toString('hex')}`;

    // Update user data
    user.name = anonymizedName;
    user.email = anonymizedEmail;
    user.personalInfo = {
      phoneNumber: 'anonymized',
      address: 'anonymized',
    };
    user.isAnonymized = true;
    user.anonymizationDate = Date.now();
    user.anonymizationReason = reason;

    await user.save();

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'user_data_anonymized',
      details: { userId, reason },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'User data anonymized successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Data Export/Portability
exports.exportUserData = async (req, res) => {
  try {
    const { userId, format = 'json' } = req.params;

    // Fetch user data
    const user = await User.findById(userId).select('-password -resetPasswordToken -__v');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch user documents
    const documents = await Document.find({ createdBy: userId }).select('-file -__v');

    // Fetch consent records
    const consents = await ConsentRecord.find({ user: userId }).select('-__v');

    // Prepare data object
    const userData = {
      user: user.toJSON(),
      documents: documents.map((doc) => doc.toJSON()),
      consentRecords: consents.map((consent) => consent.toJSON()),
    };

    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, '../../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    let filePath;
    let fileContent;

    // Format data based on requested format
    if (format === 'csv') {
      // Convert to CSV - handle user data separately
      const userCsv = parse([userData.user]);
      const documentsCsv = documents.length ? parse(userData.documents) : '';
      const consentsCsv = consents.length ? parse(userData.consentRecords) : '';

      fileContent = `USER DATA\n${userCsv}\n\nDOCUMENTS\n${documentsCsv}\n\nCONSENT RECORDS\n${consentsCsv}`;
      filePath = path.join(exportDir, `user_${userId}_data_export.csv`);
      fs.writeFileSync(filePath, fileContent);
    } else {
      // Default to JSON
      fileContent = JSON.stringify(userData, null, 2);
      filePath = path.join(exportDir, `user_${userId}_data_export.json`);
      fs.writeFileSync(filePath, fileContent);
    }

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'user_data_exported',
      details: { userId, format },
      ipAddress: req.ip,
    });

    // Set headers for download
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=user_${userId}_data_export.${format}`
    );

    // Send file
    return res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up - remove file after sending
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Data Loss Prevention
exports.scanDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Simulate DLP scan
    const sensitivePatterns = [
      { type: 'Credit Card', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
      { type: 'SSN', regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g },
      { type: 'Email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
      { type: 'Phone Number', regex: /\b(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b/g },
    ];

    const content = document.content || '';
    const findings = [];

    sensitivePatterns.forEach((pattern) => {
      const matches = content.match(pattern.regex);
      if (matches) {
        findings.push({
          type: pattern.type,
          count: matches.length,
          severity: pattern.type === 'Credit Card' || pattern.type === 'SSN' ? 'High' : 'Medium',
        });
      }
    });

    // Update document with DLP scan results
    document.dlpScanResults = {
      lastScan: Date.now(),
      findings,
      hasIssues: findings.length > 0,
    };

    await document.save();

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'dlp_scan_performed',
      details: { documentId, findingsCount: findings.length },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      result: {
        documentId,
        scanTime: document.dlpScanResults.lastScan,
        findings,
        hasIssues: document.dlpScanResults.hasIssues,
      },
      message: findings.length
        ? 'Sensitive data detected in document'
        : 'No sensitive data found in document',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Compliance Reports
exports.generateComplianceReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range provided',
      });
    }

    let reportData;
    let reportTitle;

    // Generate different report types
    switch (reportType) {
      case 'gdpr':
        // GDPR compliance report
        reportData = await generateGdprReport(start, end);
        reportTitle = 'GDPR Compliance Report';
        break;
      case 'hipaa':
        // HIPAA compliance report
        reportData = await generateHipaaReport(start, end);
        reportTitle = 'HIPAA Compliance Report';
        break;
      case 'retention':
        // Data retention compliance report
        reportData = await generateRetentionReport(start, end);
        reportTitle = 'Data Retention Compliance Report';
        break;
      case 'consent':
        // Consent management report
        reportData = await generateConsentReport(start, end);
        reportTitle = 'Consent Management Report';
        break;
      case 'dlp':
        // Data loss prevention report
        reportData = await generateDlpReport(start, end);
        reportTitle = 'Data Loss Prevention Report';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type specified',
        });
    }

    // Create audit trail record
    await createAuditTrail({
      user: req.user._id,
      action: 'compliance_report_generated',
      details: { reportType, startDate, endDate },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      result: {
        title: reportTitle,
        generatedAt: new Date(),
        dateRange: { start, end },
        data: reportData,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper functions for report generation
async function generateGdprReport(startDate, endDate) {
  // Get consent activities
  const consents = await ConsentRecord.find({
    created: { $gte: startDate, $lte: endDate },
  }).countDocuments();

  // Get data subject requests (anonymization, export)
  const auditTrail = await AuditTrail.find({
    created: { $gte: startDate, $lte: endDate },
    action: { $in: ['user_data_anonymized', 'user_data_exported'] },
  });

  const anonymizationRequests = auditTrail.filter(
    (trail) => trail.action === 'user_data_anonymized'
  ).length;
  const exportRequests = auditTrail.filter((trail) => trail.action === 'user_data_exported').length;

  return {
    summary: {
      consentRecords: consents,
      dataSubjectRequests: anonymizationRequests + exportRequests,
      anonymizationRequests,
      exportRequests,
    },
    detailedActivities: auditTrail,
  };
}

async function generateHipaaReport(startDate, endDate) {
  // Get document access logs
  const documentAccess = await AuditTrail.find({
    created: { $gte: startDate, $lte: endDate },
    action: { $in: ['viewed', 'downloaded', 'updated'] },
  }).populate('user', 'name email role');

  // DLP scan results for sensitive data
  const dlpScans = await AuditTrail.find({
    created: { $gte: startDate, $lte: endDate },
    action: 'dlp_scan_performed',
  });

  const documentAccessCount = documentAccess.length;
  const documentsWithIssues = dlpScans.filter(
    (scan) => scan.details && scan.details.findingsCount > 0
  ).length;

  return {
    summary: {
      documentAccessCount,
      documentsWithSensitiveData: documentsWithIssues,
      accessByUserRole: documentAccess.reduce((acc, record) => {
        const role = record.user?.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {}),
    },
    accessLogs: documentAccess,
  };
}

async function generateRetentionReport(startDate, endDate) {
  // Get retention policies
  const policies = await DataRetentionPolicy.find().lean();

  // Get documents approaching retention limits
  const now = new Date();
  const documents = await Document.find().lean();

  const documentsByType = documents.reduce((acc, doc) => {
    const type = doc.documentType || 'unclassified';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  // Map retention policies to documents
  const retentionAnalysis = policies.map((policy) => {
    const docsOfType = documentsByType[policy.dataType] || [];
    const docsApproachingRetention = docsOfType.filter((doc) => {
      const docAge = Math.floor((now - new Date(doc.created)) / (1000 * 60 * 60 * 24)); // age in days
      return docAge > policy.retentionPeriod * 0.8; // within 80% of retention period
    });

    return {
      policyType: policy.dataType,
      retentionDays: policy.retentionPeriod,
      totalDocuments: docsOfType.length,
      documentsApproachingRetention: docsApproachingRetention.length,
      documentsExceedingRetention: docsOfType.filter((doc) => {
        const docAge = Math.floor((now - new Date(doc.created)) / (1000 * 60 * 60 * 24));
        return docAge > policy.retentionPeriod;
      }).length,
    };
  });

  return {
    policies,
    retentionAnalysis,
    totalDocuments: documents.length,
    retentionSummary: retentionAnalysis.reduce(
      (acc, analysis) => {
        acc.totalApproaching += analysis.documentsApproachingRetention;
        acc.totalExceeding += analysis.documentsExceedingRetention;
        return acc;
      },
      { totalApproaching: 0, totalExceeding: 0 }
    ),
  };
}

async function generateConsentReport(startDate, endDate) {
  // Get consent records
  const consents = await ConsentRecord.find({
    created: { $gte: startDate, $lte: endDate },
  })
    .populate('user', 'name email')
    .lean();

  // Analysis of consent by purpose
  const consentByPurpose = consents.reduce((acc, consent) => {
    const purpose = consent.purpose;
    if (!acc[purpose]) {
      acc[purpose] = { total: 0, granted: 0, denied: 0 };
    }
    acc[purpose].total += 1;
    if (consent.consentGiven) {
      acc[purpose].granted += 1;
    } else {
      acc[purpose].denied += 1;
    }
    return acc;
  }, {});

  // Summary statistics
  const totalConsents = consents.length;
  const consentGranted = consents.filter((c) => c.consentGiven).length;
  const consentDenied = totalConsents - consentGranted;

  return {
    summary: {
      totalConsents,
      consentGranted,
      consentDenied,
      consentRate:
        totalConsents > 0 ? ((consentGranted / totalConsents) * 100).toFixed(2) + '%' : '0%',
    },
    consentByPurpose,
    recentConsents: consents.slice(0, 10), // Show 10 most recent consents
  };
}

async function generateDlpReport(startDate, endDate) {
  // Get DLP scan results
  const scans = await AuditTrail.find({
    created: { $gte: startDate, $lte: endDate },
    action: 'dlp_scan_performed',
  })
    .populate('user', 'name email')
    .lean();

  // Get documents with issues
  const documentsWithIssues = await Document.find({
    'dlpScanResults.hasIssues': true,
    'dlpScanResults.lastScan': { $gte: startDate, $lte: endDate },
  })
    .select('_id title documentType dlpScanResults')
    .lean();

  // Count issues by type
  const issuesByType = documentsWithIssues.reduce((acc, doc) => {
    if (doc.dlpScanResults && doc.dlpScanResults.findings) {
      doc.dlpScanResults.findings.forEach((finding) => {
        if (!acc[finding.type]) acc[finding.type] = 0;
        acc[finding.type] += finding.count;
      });
    }
    return acc;
  }, {});

  return {
    summary: {
      totalScans: scans.length,
      documentsWithIssues: documentsWithIssues.length,
      issuesByType,
    },
    highRiskDocuments: documentsWithIssues
      .filter((doc) => {
        return doc.dlpScanResults.findings.some((finding) => finding.severity === 'High');
      })
      .map((doc) => ({
        id: doc._id,
        title: doc.title,
        type: doc.documentType,
        findings: doc.dlpScanResults.findings,
      })),
  };
}
