const express = require('express');
const router = express.Router();

const { checkAuth } = require('../../middlewares/auth');
const { rateLimitAi } = require('../../middlewares/aiMiddleware/rateLimitAi');

const copilotController = require('../../controllers/appControllers/copilotController');

router.use(checkAuth);

// Chat endpoint - can work with or without assistantId
router.route('/chat/:assistantId?').post(rateLimitAi(), copilotController.chat);

// Get module-specific suggestions
router.route('/suggestions').post(rateLimitAi(), copilotController.suggestions);

// Get customer insights and recommendations
router
  .route('/customer-insights/:customerId')
  .post(rateLimitAi(), copilotController.customerInsights);

// Get registered modules
router.route('/modules').get(copilotController.modules);

// Get available AI models
router.route('/models').get(copilotController.models);

module.exports = router;
