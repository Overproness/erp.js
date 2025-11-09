const express = require('express');
const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const {
  processOCR,
  extractData,
  createTemplate,
  getTemplates,
  processWorkflow,
  getProcessingStats,
} = require('@/controllers/appControllers/aiDataProcessorController');
// const { aiWorkflowController } = require('@/controllers/appControllers');

// OCR Processing
router.route('/ocr/process').post(catchErrors(processOCR));

// Data Extraction
router.route('/data/extract').post(catchErrors(extractData));

// Template Management
router.route('/templates').get(catchErrors(getTemplates)).post(catchErrors(createTemplate));

// Template specific operations
router
  .route('/templates/:id')
  .get(catchErrors(getTemplates)) // Get single template
  .patch(catchErrors(createTemplate)) // Update template
  .delete(catchErrors(createTemplate)); // Delete template

// Workflow Processing
router.route('/workflows/process').post(catchErrors(processWorkflow));

// Statistics
router.route('/processing/stats').get(catchErrors(getProcessingStats));
router.route('/processing/stats/list').get(catchErrors(getProcessingStats));

module.exports = router;
