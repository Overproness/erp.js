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

// Get registered modules
router.route('/modules').get(copilotController.modules);

module.exports = router;
