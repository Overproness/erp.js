const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');

const paymentModeController = require('@/controllers/appControllers/paymentModeController');

// Add cache control middleware
const noCacheMiddleware = (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

// CRUD routes for payment modes
router
  .route('/')
  .get(noCacheMiddleware, catchErrors(paymentModeController.read))
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(paymentModeController.create));

// List route (used by frontend)
router.route('/list').get(noCacheMiddleware, catchErrors(paymentModeController.list));

// Create route
router
  .route('/create')
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(paymentModeController.create));

// Individual payment mode routes
router
  .route('/:id')
  .get(noCacheMiddleware, catchErrors(paymentModeController.read))
  .patch(rateLimitMiddleware.createRateLimit('update'), catchErrors(paymentModeController.update))
  .delete(rateLimitMiddleware.createRateLimit('delete'), catchErrors(paymentModeController.delete));

// Alternative route formats
router.route('/read/:id').get(noCacheMiddleware, catchErrors(paymentModeController.read));

router
  .route('/update/:id')
  .patch(rateLimitMiddleware.createRateLimit('update'), catchErrors(paymentModeController.update));

router
  .route('/delete/:id')
  .delete(rateLimitMiddleware.createRateLimit('delete'), catchErrors(paymentModeController.delete));

module.exports = router;
