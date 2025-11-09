const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Import controllers
const reviewPortalController = require('@/controllers/appControllers/reviewPortalController');
const reviewController = require('@/controllers/appControllers/reviewController');

// Import validators
const { validateReviewSubmission } = require('@/validators/reviewValidator');

// Import middlewares
const { verifyReviewLink, verifyReviewSubmission } = require('@/middlewares/reviewAuthMiddleware');
const { reviewSubmissionLimiter } = require('@/middlewares/rateLimitMiddleware');
const { 
  loadBusinessBranding, 
  loadLinkCustomization, 
  applyBrandingToTemplate 
} = require('@/middlewares/brandingMiddleware');
const { 
  trackPortalVisit, 
  trackSubmission, 
  trackUtmParameters 
} = require('@/middlewares/analyticsMiddleware');

// Apply analytics tracking
router.use(trackUtmParameters);
router.use(trackPortalVisit);

// Render review portal page
router.get('/review/:linkId',
  catchErrors(verifyReviewLink),
  loadBusinessBranding,
  loadLinkCustomization,
  applyBrandingToTemplate,
  catchErrors(reviewPortalController.renderReviewForm)
);

// Submit a review (public endpoint - no auth required)
router.post('/review/submit',
  reviewSubmissionLimiter,
  trackSubmission,
  catchErrors(verifyReviewSubmission),
  (req, res, next) => {
    const { error, value } = validateReviewSubmission(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    req.body = value;
    next();
  },
  catchErrors(reviewController.submitPublicReview)
);

// Get thank you page after review submission
router.get('/review/thank-you/:linkId',
  catchErrors(verifyReviewLink),
  loadBusinessBranding,
  loadLinkCustomization,
  applyBrandingToTemplate,
  catchErrors(reviewPortalController.renderThankYou)
);

// Render review widget for embedding
router.get('/widget/:businessId',
  loadBusinessBranding,
  applyBrandingToTemplate,
  catchErrors(reviewPortalController.renderWidget)
);

// Get recent reviews for public display
router.get('/reviews/public/:businessId',
  loadBusinessBranding,
  catchErrors(reviewController.getPublicReviews)
);

module.exports = router;
