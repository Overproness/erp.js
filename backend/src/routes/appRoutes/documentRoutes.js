const express = require('express');
const router = express.Router();
const documentController = require('@/controllers/appControllers/documentController');
const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');

// Note: Authentication is handled at the app level, no need for additional auth here

// Document routes - ORDER MATTERS: specific routes before parameterized routes
router.get('/list', documentController.list);
router.post('/', rateLimitMiddleware.createRateLimit('upload'), documentController.create); // Root POST route
router.post('/create', rateLimitMiddleware.createRateLimit('upload'), documentController.create);

// Search and filter routes (must come before /:id routes)
router.get('/search', rateLimitMiddleware.createRateLimit('search'), documentController.search);
router.post(
  '/advanced-search',
  rateLimitMiddleware.createRateLimit('search'),
  documentController.advancedSearch
);
router.get('/filter', documentController.filter);

// Analysis route (must come before /:id routes)
router.get('/analyze/:id', documentController.analyze);

// Data Entry Automation routes
router.post(
  '/ai/suggest-tags',
  rateLimitMiddleware.createRateLimit('ai'),
  documentController.suggestTags
);
router.post('/:id/ai/apply-tags', documentController.applySuggestedTags);
router.get(
  '/:id/ai/summarize',
  rateLimitMiddleware.createRateLimit('ai'),
  documentController.summarizeDocument
);
router.post(
  '/ai/summarize-batch',
  rateLimitMiddleware.createRateLimit('ai'),
  documentController.summarizeDocuments
);
router.post(
  '/bulk-import-urls',
  rateLimitMiddleware.createRateLimit('upload'),
  documentController.bulkImportFromURLs
);

// Document sharing with URL module integration
router.post('/:id/share-url', documentController.generateDocumentShareURL);
router.get('/:id/share-urls', documentController.listDocumentShareURLs);
router.get('/shared/:shortId', documentController.accessSharedDocument);
router.post('/shared/:shortId', documentController.accessSharedDocument); // For password-protected shares
router.get('/shared/:shortId/download', documentController.downloadSharedDocument);

// Specific ID-based routes (must come before generic /:id route)
router.get('/read/:id', documentController.read);
router.patch('/update/:id', documentController.update);
router.delete('/delete/:id', documentController.delete);
router.get('/download/:id', documentController.download);

// Document version control routes
router.get('/:id/versions', documentController.listVersions);
router.get('/:id/version/:versionNumber', documentController.getVersion);
router.post('/:id/version', documentController.createVersion);

// General revert route that accepts version in body
router.post('/:id/revert', documentController.revert);

// Make sure the revert/original route comes BEFORE the parameterized revert/:versionNumber route
router.post('/:id/revert/original', documentController.revertToOriginal);
router.post('/:id/revert/:versionNumber', documentController.revertToVersion);

router.get('/:id/version/:versionNumber/download', documentController.downloadVersion);

// Document content and editing routes
router.get('/:id/content', documentController.getContent);
router.post('/:id/edit', documentController.edit);
router.post('/:id/esign', documentController.eSign);
router.post('/:id/annotate', documentController.annotate);

// Audit and compliance routes
router.get('/:id/compliance', documentController.getCompliance);
router.post('/:id/compliance', documentController.createCompliance);
router.get('/:id/audit-trail', documentController.getAuditTrail);

// Document sharing routes
router.post('/:id/share', documentController.share);
router.post('/:id/link', documentController.generateShareLink);

// Text extraction reprocessing route (admin only)
router.post('/reprocess-text', documentController.reprocessDocuments);

// Generic CRUD routes (MUST BE LAST to avoid conflicts with specific routes)
router.get('/:id', documentController.read);
router.delete('/:id', documentController.delete);

module.exports = router;
