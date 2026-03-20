// @ts-nocheck
const ReviewLink = require('@/models/appModels/ReviewLink');
const Business = require('@/models/appModels/Business');
const { createError } = require('@/handlers/errorHandlers');

/**
 * Middleware to authenticate review links and attach link data to request
 */
const verifyReviewLink = async (req, res, next) => {
  try {
    const { linkId } = req.params;
    
    if (!linkId) {
      return next(createError(400, 'Review link ID is required'));
    }
    
    // Find the review link
    const reviewLink = await ReviewLink.findById(linkId);
    
    // Check if link exists
    if (!reviewLink) {
      return next(createError(404, 'Review link not found'));
    }
    
    // Check if link is active
    if (!reviewLink.active) {
      return next(createError(403, 'This review link is no longer active'));
    }
    
    // Check if link has expired
    if (reviewLink.expiryDate && new Date() > new Date(reviewLink.expiryDate)) {
      return next(createError(403, 'This review link has expired'));
    }
    
    // Find associated business
    const business = await Business.findById(reviewLink.business);
    
    if (!business) {
      return next(createError(404, 'Business not found'));
    }
    
    // Track link visit (don't await to avoid delaying response)
    ReviewLink.findByIdAndUpdate(
      linkId,
      { 
        $inc: { visitCount: 1 },
        $push: { 
          visits: { 
            date: new Date(),
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          } 
        }
      }
    ).catch(err => console.error('Error tracking link visit:', err));
    
    // Attach link and business data to request
    req.reviewLink = reviewLink;
    req.business = business;
    
    next();
  } catch (error) {
    next(createError(500, 'Error verifying review link', error));
  }
};

/**
 * Middleware to verify if a review submission is coming from a valid link
 */
const verifyReviewSubmission = async (req, res, next) => {
  try {
    const { reviewLinkId } = req.body;
    
    // If no link ID is provided, check if direct submissions are allowed
    if (!reviewLinkId) {
      // Normally we would check if the business allows direct submissions
      // For this middleware, we'll just pass through but mark it as a direct submission
      req.isDirectSubmission = true;
      return next();
    }
    
    // Find the review link
    const reviewLink = await ReviewLink.findById(reviewLinkId);
    
    // Check if link exists
    if (!reviewLink) {
      return next(createError(404, 'Review link not found'));
    }
    
    // Check if link is active
    if (!reviewLink.active) {
      return next(createError(403, 'This review link is no longer active'));
    }
    
    // Check if link has expired
    if (reviewLink.expiryDate && new Date() > new Date(reviewLink.expiryDate)) {
      return next(createError(403, 'This review link has expired'));
    }
    
    // Find associated business
    const business = await Business.findById(reviewLink.business);
    
    if (!business) {
      return next(createError(404, 'Business not found'));
    }
    
    // Track conversion (don't await to avoid delaying response)
    ReviewLink.findByIdAndUpdate(
      reviewLinkId,
      { $inc: { conversionCount: 1 } }
    ).catch(err => console.error('Error tracking link conversion:', err));
    
    // Attach link and business data to request
    req.reviewLink = reviewLink;
    req.business = business;
    req.body.businessId = business._id; // Ensure businessId is set correctly
    
    next();
  } catch (error) {
    next(createError(500, 'Error verifying review submission', error));
  }
};

/**
 * Middleware to verify admin user owns the business associated with review
 */
const verifyBusinessOwnership = async (req, res, next) => {
  try {
    const { businessId } = req.params.businessId || req.body.businessId || req.query.businessId;
    
    if (!businessId) {
      return next(createError(400, 'Business ID is required'));
    }
    
    // Find the business
    const business = await Business.findById(businessId);
    
    if (!business) {
      return next(createError(404, 'Business not found'));
    }
    
    // Check if the current user owns this business
    if (!business.owner.equals(req.admin._id)) {
      return next(createError(403, 'You do not have permission to access this business'));
    }
    
    // Attach business to request
    req.business = business;
    
    next();
  } catch (error) {
    next(createError(500, 'Error verifying business ownership', error));
  }
};

module.exports = {
  verifyReviewLink,
  verifyReviewSubmission,
  verifyBusinessOwnership
};
