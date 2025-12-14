const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const globalAnalyticsController = require('../../controllers/appControllers/globalAnalyticsController');

/**
 * Global Analytics & Reporting Routes
 * Provides comprehensive analytics across all modules
 */

// Dashboard and overview
router.get('/dashboard', catchErrors(globalAnalyticsController.getGlobalDashboard));
router.get('/real-time', catchErrors(globalAnalyticsController.getRealTimeMetrics));

// Module-specific analytics
router.get('/module/:moduleName', catchErrors(globalAnalyticsController.getModuleAnalytics));
router.get('/modules/overview', catchErrors(globalAnalyticsController.getAllModulesOverview));

// Custom reports
router.post('/reports/create', catchErrors(globalAnalyticsController.createCustomReport));
router.get('/reports/list', catchErrors(globalAnalyticsController.listReports));
router.get('/reports/:id', catchErrors(globalAnalyticsController.getReport));
router.post('/reports/:id/generate', catchErrors(globalAnalyticsController.generateReport));
router.delete('/reports/:id', catchErrors(globalAnalyticsController.deleteReport));

// Report scheduling
router.post('/schedules/create', catchErrors(globalAnalyticsController.createSchedule));
router.get('/schedules/list', catchErrors(globalAnalyticsController.listSchedules));
router.get('/schedules/:id', catchErrors(globalAnalyticsController.getSchedule));
router.patch('/schedules/:id', catchErrors(globalAnalyticsController.updateSchedule));
router.delete('/schedules/:id', catchErrors(globalAnalyticsController.deleteSchedule));

// Predictive analytics
router.post('/predict', catchErrors(globalAnalyticsController.getPredictiveAnalytics));
router.get('/trends/:metric', catchErrors(globalAnalyticsController.getTrendAnalysis));

// AI-powered insights
router.post('/ai-insights', catchErrors(globalAnalyticsController.getAIInsights));
router.post('/ai-insights/modules', catchErrors(globalAnalyticsController.getAIModuleInsights));

// Data export
router.post('/export', catchErrors(globalAnalyticsController.exportData));

module.exports = router;
