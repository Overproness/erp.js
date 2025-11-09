const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');

const router = express.Router();

// Import A/B test controller
const abTestController = require('@/controllers/appControllers/abTestController');

// A/B Test Management Routes
router.route('/')
  .get(rateLimitMiddleware.createRateLimit('search'), catchErrors(abTestController.list))
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(abTestController.create));

router.route('/summary')
  .get(catchErrors(abTestController.summary));

router.route('/:id')
  .get(rateLimitMiddleware.apiRateLimit, catchErrors(abTestController.read))
  .patch(rateLimitMiddleware.apiRateLimit, catchErrors(abTestController.update))
  .delete(rateLimitMiddleware.apiRateLimit, catchErrors(abTestController.delete));

// Test Control Routes
router.route('/:id/start')
  .post(rateLimitMiddleware.createRateLimit('action'), catchErrors(abTestController.start));

router.route('/:id/stop')
  .post(rateLimitMiddleware.createRateLimit('action'), catchErrors(abTestController.stop));

router.route('/:id/declare-winner')
  .post(rateLimitMiddleware.createRateLimit('action'), catchErrors(abTestController.declareWinner));

// Results and Analytics Routes
router.route('/:id/results')
  .get(catchErrors(abTestController.getResults));

router.route('/:id/performance')
  .get(catchErrors(abTestController.getPerformanceMetrics));

module.exports = router;
