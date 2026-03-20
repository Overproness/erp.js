// @ts-nocheck
const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Import controllers
const surveyResponseController = require('@/controllers/appControllers/surveyResponseController');

// Import middlewares
const { apiRateLimit } = require('@/middlewares/rateLimitMiddleware');

// Apply rate limiting (no authentication required for public surveys)
router.use(apiRateLimit);

// Get public survey by short code
router.get('/:shortCode', catchErrors(surveyResponseController.getPublicSurvey));

// Submit a survey response
router.post('/:shortCode/submit', catchErrors(surveyResponseController.submitResponse));

// Save partial response (auto-save)
router.post('/:shortCode/save', catchErrors(surveyResponseController.savePartialResponse));

module.exports = router;
