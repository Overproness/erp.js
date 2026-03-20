// @ts-nocheck
const express = require('express');
const router = express.Router();
const documentController = require('@/controllers/appControllers/documentController');

// Public document sharing routes (no authentication required)
router.get('/shared/:shortCode', documentController.accessSharedDocument);
router.post('/shared/:shortCode', documentController.accessSharedDocument); // For password-protected shares
router.get('/shared/:shortCode/download', documentController.downloadSharedDocument);

module.exports = router;
