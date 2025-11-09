const express = require('express');
const router = express.Router();
const { checkAuth, isCompanyOwner } = require('@/middlewares/auth');

// Use proper path with @ alias
const auditController = require('@/controllers/appControllers/documentController/audit/auditTrailController');

// Apply authentication middleware
router.use(checkAuth);

// General audit trail routes (admin only)
router.get('/list', isCompanyOwner, auditController.getAuditTrail);
router.get('/summary', isCompanyOwner, auditController.getAuditTrailSummary);

module.exports = router;
