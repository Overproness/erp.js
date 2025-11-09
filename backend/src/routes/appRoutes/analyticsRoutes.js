const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const analyticsController = require('../../controllers/appControllers/AnalyticsController');

/**
 * Campaign analytics routes
 */

// Dashboard and overview
router.get('/dashboard', catchErrors(analyticsController.getDashboard));
router.get('/utm-performance', catchErrors(analyticsController.getUtmPerformance));

// Campaign-specific analytics
router.get('/campaign/:id', catchErrors(analyticsController.getCampaignReport));
router.get('/campaign/:campaignId/insights', catchErrors(analyticsController.getInsights));
router.get('/campaign/:campaignId/real-time', catchErrors(analyticsController.getRealTimePerformance));

// Customer journey analytics
router.get('/customer-journey/:customerId', catchErrors(analyticsController.getCustomerJourney));

// Comparative analytics
router.post('/compare', catchErrors(analyticsController.compareCampaigns));

// Data export
router.post('/export', catchErrors(analyticsController.exportData));

module.exports = router;
