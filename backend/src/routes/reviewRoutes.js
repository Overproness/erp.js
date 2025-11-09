const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Import controllers
const reviewController = require('@/controllers/appControllers/reviewController');

// Import validators
const { validateReviewSubmission, validateReviewUpdate, validateReviewFilter } = require('@/validators/reviewValidator');

// Import middlewares
const { checkAuth, isCompanyOwner } = require('@/middlewares/auth');
const { verifyBusinessOwnership } = require('@/middlewares/reviewAuthMiddleware');
const { apiLimiter } = require('@/middlewares/rateLimitMiddleware');
const { injectBrandingToJson } = require('@/middlewares/brandingMiddleware');

// Apply general rate limiting and authentication
router.use(apiLimiter);
router.use(checkAuth);

// Get all reviews for authenticated user's business
router.get('/', catchErrors(reviewController.list));

// Create a new review (admin only)
router.post('/', 
  isCompanyOwner, 
  (req, res, next) => {
    const { error, value } = validateReviewSubmission(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    req.body = value;
    next();
  },
  catchErrors(reviewController.create)
);

// Get review by ID
router.get('/:id', catchErrors(reviewController.read));

// Update review by ID
router.patch('/:id', 
  isCompanyOwner,
  (req, res, next) => {
    const { error, value } = validateReviewUpdate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    req.body = value;
    next();
  },
  catchErrors(reviewController.update)
);

// Delete review by ID
router.delete('/:id', isCompanyOwner, catchErrors(reviewController.delete));

// Filter reviews with advanced search
router.post('/search',
  (req, res, next) => {
    const { error, value } = validateReviewFilter(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    req.body = value;
    next();
  },
  catchErrors(reviewController.search)
);

// Get review statistics
router.get('/stats/:businessId', 
  verifyBusinessOwnership,
  catchErrors(reviewController.getStats)
);

// Export reviews
router.post('/export/:businessId',
  isCompanyOwner,
  verifyBusinessOwnership,
  catchErrors(reviewController.exportReviews)
);

// Get sentiment analysis
router.get('/sentiment/:businessId',
  verifyBusinessOwnership,
  catchErrors(reviewController.getSentimentAnalysis)
);

module.exports = router;
