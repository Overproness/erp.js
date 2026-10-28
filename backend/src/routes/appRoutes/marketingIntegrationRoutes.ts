// @ts-nocheck
const express = require('express');
const router = express.Router();
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const {
  getIntegrations,
  saveIntegration,
  testConnection,
  deleteIntegration,
} = require('@/controllers/appControllers/marketingIntegrationController');
const { catchErrors } = require('@/handlers/errorHandlers');

// All marketing integration routes require admin authentication
router.use(adminAuth.isValidAuthToken);

// GET /api/marketing/integrations — list all integrations and their statuses
router.get('/', catchErrors(getIntegrations));

// POST /api/marketing/integrations/:platform — save/update credentials for a platform
router.post('/:platform', catchErrors(saveIntegration));

// POST /api/marketing/integrations/:platform/test-connection — test connectivity
router.post('/:platform/test-connection', catchErrors(testConnection));

// DELETE /api/marketing/integrations/:platform — disconnect and delete credentials
router.delete('/:platform', catchErrors(deleteIntegration));

module.exports = router;
