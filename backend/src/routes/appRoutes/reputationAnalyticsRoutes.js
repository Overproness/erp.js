const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const reviewAnalyticsController = require('../../controllers/appControllers/reviewAnalyticsController.stub');

/**
 * Reputation Analytics Routes
 * These routes handle reputation and review analytics endpoints
 */

// Dashboard and overview analytics
router.get('/overview', catchErrors(reviewAnalyticsController.getDashboard));

// Sentiment analysis routes
router.get('/sentiment', catchErrors(reviewAnalyticsController.getSentimentTrends));

// Performance trends
router.get('/trends', catchErrors(reviewAnalyticsController.getSentimentTrends));

// Platform comparison analytics
router.get('/platform-comparison', catchErrors(reviewAnalyticsController.getPlatformComparison));

// Business comparison analytics
router.get('/business-comparison', catchErrors(reviewAnalyticsController.getBusinessComparison));

// Performance metrics
router.get('/metrics', catchErrors(reviewAnalyticsController.getPerformanceMetrics));

// Export functionality
router.post('/export', catchErrors(reviewAnalyticsController.exportReviews));

module.exports = router;
