const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Import controllers
const reviewLinkController = require('@/controllers/appControllers/reviewLinkController');

// Import validators
const { validateLinkCreation, validateLinkUpdate } = require('@/validators/linkValidator');

// Import middlewares
const { checkAuth, isCompanyOwner } = require('@/middlewares/auth');
const { verifyBusinessOwnership } = require('@/middlewares/reviewAuthMiddleware');
const { reviewLinkLimiter } = require('@/middlewares/rateLimitMiddleware');

// Apply authentication
router.use(checkAuth);

// Create a new review link
router.post('/', 
  isCompanyOwner,
  reviewLinkLimiter,
  (req, res, next) => {
    const { error, value } = validateLinkCreation(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    req.body = value;
    next();
  },
  catchErrors(reviewLinkController.create)
);

// Get all review links for business
router.get('/business/:businessId',
  verifyBusinessOwnership, 
  catchErrors(reviewLinkController.getByBusiness)
);

// Get link by ID
router.get('/:id', catchErrors(reviewLinkController.read));

// Update link
router.patch('/:id',
  isCompanyOwner,
  (req, res, next) => {
    const { error, value } = validateLinkUpdate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    req.body = value;
    next();
  },
  catchErrors(reviewLinkController.update)
);

// Delete link
router.delete('/:id', isCompanyOwner, catchErrors(reviewLinkController.delete));

// Get link analytics
router.get('/:id/analytics', catchErrors(reviewLinkController.getAnalytics));

// Generate QR code for link
router.get('/:id/qr', catchErrors(reviewLinkController.generateQRCode));

// Reset tracking for link
router.post('/:id/reset-analytics', 
  isCompanyOwner, 
  catchErrors(reviewLinkController.resetAnalytics)
);

// Generate shortened URL
router.post('/shorten',
  isCompanyOwner,
  reviewLinkLimiter,
  catchErrors(reviewLinkController.shortenUrl)
);

// Batch create review links
router.post('/batch',
  isCompanyOwner,
  reviewLinkLimiter,
  catchErrors(reviewLinkController.batchCreate)
);

module.exports = router;
