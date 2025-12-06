const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Import controllers
const surveyController = require('@/controllers/appControllers/surveyController');
const surveyResponseController = require('@/controllers/appControllers/surveyResponseController');

// Import middlewares
const { checkAuth, isCompanyOwner } = require('@/middlewares/auth');
const { apiRateLimit } = require('@/middlewares/rateLimitMiddleware');

// Apply rate limiting and authentication
router.use(apiRateLimit);
router.use(checkAuth);

// ============ Survey Management Routes ============

// List all surveys
router.get('/', catchErrors(surveyController.list));
router.get('/list', catchErrors(surveyController.list));

// Create a new survey
router.post('/', isCompanyOwner, catchErrors(surveyController.create));

// Get survey by ID
router.get('/:id', catchErrors(surveyController.read));

// Update survey by ID
router.patch('/:id', isCompanyOwner, catchErrors(surveyController.update));

// Delete survey by ID (soft delete)
router.delete('/:id', isCompanyOwner, catchErrors(surveyController.remove));

// ============ Survey Actions ============

// Publish/activate a survey
router.post('/:id/publish', isCompanyOwner, catchErrors(surveyController.publish));

// Pause a survey
router.post('/:id/pause', isCompanyOwner, catchErrors(surveyController.pause));

// Close a survey
router.post('/:id/close', isCompanyOwner, catchErrors(surveyController.close));

// Duplicate a survey
router.post('/:id/duplicate', isCompanyOwner, catchErrors(surveyController.duplicate));

// ============ Analytics Routes ============

// Get survey analytics
router.get('/:id/analytics', catchErrors(surveyController.getAnalytics));

// Get AI suggestions for survey
router.get('/:id/ai-suggestions', catchErrors(surveyController.getAISuggestions));

// Get NPS score and breakdown
router.get('/:id/nps', catchErrors(surveyController.getNPS));

// Export survey results
router.get('/:id/export', catchErrors(surveyController.exportResults));

// ============ Response Management Routes ============

// Get all responses for a survey
router.get('/:id/responses', catchErrors(surveyController.getResponses));

// Get a single response
router.get('/response/:id', catchErrors(surveyResponseController.getResponse));

// Update response follow-up status
router.patch(
  '/response/:id/follow-up',
  isCompanyOwner,
  catchErrors(surveyResponseController.updateFollowUp)
);

// Delete a response
router.delete(
  '/response/:id',
  isCompanyOwner,
  catchErrors(surveyResponseController.deleteResponse)
);

module.exports = router;
