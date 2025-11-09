const express = require('express');
const router = express.Router();

const { checkAuth } = require('../../middlewares/auth');
const { rateLimitAi } = require('../../middlewares/aiMiddleware/rateLimitAi');
const { validateAiRequest } = require('../../middlewares/aiMiddleware/validateAiRequest');
const { contextExtractor } = require('../../middlewares/aiMiddleware/contextExtractor');

const aiAssistantController = require('../../controllers/appControllers/aiAssistantController');

router.use(checkAuth);

router.route('/').post(validateAiRequest.createAssistant, aiAssistantController.create); // POST /api/aiAssistant

router.route('/list').get(aiAssistantController.list); // GET /api/aiAssistant

router.route('/search').get(aiAssistantController.search); // GET /api/aiAssistant/search

router
  .route('/:id')
  .get(aiAssistantController.read) // GET /api/aiAssistant/:id
  .patch(validateAiRequest.updateAssistant, aiAssistantController.update) // PATCH /api/aiAssistant/:id
  .delete(aiAssistantController.remove); // ✅ FIXED from .delete to .remove

router.use('/:assistantId/chat', rateLimitAi());
router.use('/:assistantId/analyze', rateLimitAi);
router.use('/:assistantId/suggest', rateLimitAi);
router.use('/:assistantId/predict', rateLimitAi);

router
  .route('/:assistantId/chat')
  .post(validateAiRequest.chatMessage, contextExtractor, aiAssistantController.chat);

router
  .route('/:assistantId/analyze')
  .post(validateAiRequest.analyzeContent, contextExtractor, aiAssistantController.analyze);

router
  .route('/:assistantId/suggest')
  .post(validateAiRequest.suggestions, contextExtractor, aiAssistantController.suggest);

router
  .route('/:assistantId/predict')
  .post(validateAiRequest.predictions, contextExtractor, aiAssistantController.predict);

// Conversation routes
router.route('/:assistantId/conversations').get(aiAssistantController.getConversations);

router
  .route('/:assistantId/conversations/:conversationId')
  .get(aiAssistantController.getConversation)
  .patch(aiAssistantController.updateConversation)
  .delete(aiAssistantController.deleteConversation);

router
  .route('/:assistantId/conversations/:conversationId/messages')
  .get(aiAssistantController.getConversationMessages);

module.exports = router;
