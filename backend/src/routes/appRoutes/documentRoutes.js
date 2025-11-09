const express = require('express');
const router = express.Router();
const documentController = require('@/controllers/appControllers/documentController');
const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');

// Note: Authentication is handled at the app level, no need for additional auth here

// Document routes
router.get('/list', documentController.list);
router.post('/', rateLimitMiddleware.createRateLimit('upload'), documentController.create); // Root POST route
router.post('/create', rateLimitMiddleware.createRateLimit('upload'), documentController.create);
router.get('/read/:id', documentController.read);
router.patch('/update/:id', documentController.update);
router.delete('/delete/:id', documentController.delete);
router.get('/download/:id', documentController.download);

// Search and filter routes
router.get('/search', rateLimitMiddleware.createRateLimit('search'), documentController.search);
router.get('/filter', documentController.filter);

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

// Fix the document analysis route - change from '/:id/analyze' to '/analyze/:id'
router.get('/analyze/:id', documentController.analyze);

// Document sharing routes
router.post('/:id/share', documentController.share);
router.post('/:id/link', documentController.generateShareLink);

module.exports = router;
