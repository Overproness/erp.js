const express = require('express');
const router = express.Router();

const {
  // Data Retention Policy routes
  createRetentionPolicy,
  getRetentionPolicies,
  updateRetentionPolicy,
  deleteRetentionPolicy,

  // Consent Management routes
  recordConsent,
  getUserConsents,
  updateConsent,

  // Data Anonymization routes
  anonymizeUserData,

  // Data Export/Portability routes
  exportUserData,

  // Data Loss Prevention (DLP) routes
  scanDocument,

  // Compliance Reporting routes
  generateComplianceReport,
} = require('@/controllers/appControllers/documentController/compliance/complianceController');

// Middleware
const { checkAuth, isCompanyOwner } = require('@/middlewares/auth');

// Apply authentication middleware to all routes
router.use(checkAuth);

// Data Retention Policy routes
router.post('/retention-policy', isCompanyOwner, createRetentionPolicy);
router.get('/retention-policy', getRetentionPolicies);
router.patch('/retention-policy/:id', isCompanyOwner, updateRetentionPolicy);
router.delete('/retention-policy/:id', isCompanyOwner, deleteRetentionPolicy);

// Consent Management routes
router.post('/consent', recordConsent);
router.get('/consent/user/:userId', getUserConsents);
router.patch('/consent/:id', updateConsent);

// Data Anonymization routes
router.post('/anonymize', isCompanyOwner, anonymizeUserData);

// Data Export/Portability routes
router.get('/export/:userId/:format?', exportUserData);

// Data Loss Prevention (DLP) routes
router.post('/scan-document/:documentId', scanDocument);

// Compliance Reporting routes
router.post('/report', isCompanyOwner, generateComplianceReport);

module.exports = router;
