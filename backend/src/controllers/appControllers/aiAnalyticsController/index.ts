// @ts-nocheck
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const aiAnalyticsController = createCRUDController('AiAnalytics');

// Import specific analytics methods
const summaryController = require('./summary');

// Extend with analytics-specific methods
aiAnalyticsController.summary = summaryController;

module.exports = aiAnalyticsController;
