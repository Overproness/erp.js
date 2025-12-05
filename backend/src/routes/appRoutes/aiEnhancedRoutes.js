const express = require('express');
const router = express.Router();
const chatQueueController = require('../../controllers/appControllers/chatQueueController');
const followUpController = require('../../controllers/appControllers/followUpController');
const aiEnhancedController = require('../../controllers/appControllers/aiEnhancedController');

/**
 * Chat Queue Routes - 24/7 Availability
 */
router.post('/chat-queue', chatQueueController.queueMessage);
router.get('/chat-queue/:queueId/status', chatQueueController.getQueueStatus);
router.get('/chat-queue/statistics', chatQueueController.getQueueStatistics);

/**
 * Follow-Up Routes - Automated Customer Follow-ups
 */
router.post('/follow-up', followUpController.createFollowUp);
router.get('/follow-up', followUpController.listFollowUps);
router.get('/follow-up/analytics', followUpController.getAnalytics);
router.post('/follow-up/:followUpId/response', followUpController.trackResponse);
router.delete('/follow-up/:followUpId', followUpController.cancelFollowUp);

/**
 * Automation Suggestions Routes
 */
router.get('/automation/suggestions', aiEnhancedController.getSuggestions);
router.post(
  '/automation/suggestions/:suggestionId/implement',
  aiEnhancedController.implementSuggestion
);
router.get('/automation/analytics', aiEnhancedController.getSuggestionAnalytics);

/**
 * Enhanced Context & Recommendations
 */
router.post('/context/enhanced', aiEnhancedController.getEnhancedContext);
router.get('/insights/learned', aiEnhancedController.getLearnedInsights);
router.get('/predict/customer/:clientId', aiEnhancedController.predictCustomerBehavior);

/**
 * Self-Learning Routes
 */
router.post('/learning/:learningId/feedback', aiEnhancedController.recordFeedback);
router.get('/learning/statistics', aiEnhancedController.getLearningStats);
router.get('/learning/interactions', aiEnhancedController.getLearningInteractions);

module.exports = router;
