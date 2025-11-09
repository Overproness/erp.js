const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const { checkAuth } = require('@/middlewares/auth');
const {
  createAuditLog,
  getDocumentAuditLogs,
} = require('@/controllers/appControllers/documentController/auditLog');

// Apply authentication middleware
router.use(checkAuth);

// Document audit routes
router.route('/:documentId').get(
  catchErrors(async (req, res) => {
    try {
      const { documentId } = req.params;
      const { page, limit } = req.query;

      const result = await getDocumentAuditLogs({
        documentId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching document audit logs:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  })
);

module.exports = router;
