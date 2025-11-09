const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const { checkAuth } = require('@/middlewares/auth');
const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');

const taxesController = require('@/controllers/appControllers/taxesController');

// Apply authentication middleware to all routes
router.use(checkAuth);

// CRUD routes for taxes
router
  .route('/')
  .get(catchErrors(taxesController.list))
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(taxesController.create));

router.route('/list').get(catchErrors(taxesController.list));

router
  .route('/create')
  .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(taxesController.create));

router
  .route('/:id')
  .get(catchErrors(taxesController.read))
  .patch(rateLimitMiddleware.createRateLimit('update'), catchErrors(taxesController.update))
  .delete(rateLimitMiddleware.createRateLimit('delete'), catchErrors(taxesController.delete));

router.route('/read/:id').get(catchErrors(taxesController.read));

router
  .route('/update/:id')
  .patch(rateLimitMiddleware.createRateLimit('update'), catchErrors(taxesController.update));

router
  .route('/delete/:id')
  .delete(rateLimitMiddleware.createRateLimit('delete'), catchErrors(taxesController.delete));

module.exports = router;
