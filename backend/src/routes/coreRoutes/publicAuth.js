const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();
const publicAuth = require('@/controllers/coreControllers/publicAuth');

// Public auth routes - no authentication required
router.post('/', catchErrors(publicAuth.logout));
router.get('/', catchErrors(publicAuth.logout));

module.exports = router;
