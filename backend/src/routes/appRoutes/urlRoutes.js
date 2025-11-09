const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');

const router = express.Router();

// Import controllers
const urlController = require('@/controllers/appControllers/urlController');
const urlAnalyticsController = require('@/controllers/appControllers/urlAnalyticsController');


// URL Management Routes
router.route('/')
  .get(rateLimitMiddleware.createRateLimit('search'), catchErrors(urlController.list))
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(urlController.create));

router.route('/search')
  .get(rateLimitMiddleware.createRateLimit('search'), catchErrors(urlController.search));

router.route('/summary')
  .get(catchErrors(urlController.summary));

router.route('/bulk')
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(urlController.bulkOperations));

router.route('/list')
  .get(rateLimitMiddleware.createRateLimit('search'), catchErrors(urlController.list));

router.route('/:id')
  .get(rateLimitMiddleware.apiRateLimit, catchErrors(urlController.read))
  .delete(rateLimitMiddleware.apiRateLimit, catchErrors(urlController.delete));

router.route('/update/:id')
  .patch(rateLimitMiddleware.apiRateLimit, catchErrors(urlController.update));

router.route('/:id/clone')
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(urlController.clone));

// Analytics Routes
router.route('/:id/analytics')
  .get(catchErrors(urlAnalyticsController.getAnalytics));

router.route('/:id/analytics/history')
  .get(catchErrors(urlAnalyticsController.getClickHistory));

router.route('/:id/analytics/geographic')
  .get(catchErrors(urlAnalyticsController.getGeographicData));

router.route('/:id/analytics/devices')
  .get(catchErrors(urlAnalyticsController.getDeviceStats));

router.route('/:id/analytics/traffic-sources')
  .get(catchErrors(urlAnalyticsController.getTrafficSources));

router.route('/:id/analytics/export')
  .get(catchErrors(urlAnalyticsController.exportAnalytics));

router.route('/:id/analytics/realtime')
  .get(catchErrors(urlAnalyticsController.getRealTimeAnalytics));

router.route('/:id/analytics/conversions')
  .get(catchErrors(urlAnalyticsController.getConversionAnalytics));

module.exports = router;
