const Business = require('@/models/appModels/Business');
const ReviewLink = require('@/models/appModels/ReviewLink');
const { createError } = require('@/handlers/errorHandlers');

/**
 * Load and attach business branding to request
 */
const loadBusinessBranding = async (req, res, next) => {
  try {
    // Get business ID from multiple possible sources
    const businessId = 
      req.params.businessId || 
      req.body.businessId || 
      (req.business && req.business._id) ||
      (req.reviewLink && req.reviewLink.business);
    
    if (!businessId) {
      return next(createError(400, 'Business ID is required'));
    }
    
    // Check if business is already loaded
    if (req.business && req.business._id.toString() === businessId.toString()) {
      // Business already loaded, just get branding if not already attached
      if (!req.branding) {
        req.branding = req.business.branding || {};
      }
      return next();
    }
    
    // Load the business
    const business = await Business.findById(businessId).select('name branding owner');
    
    if (!business) {
      return next(createError(404, 'Business not found'));
    }
    
    // Attach business and branding to request
    req.business = business;
    req.branding = business.branding || {};
    
    next();
  } catch (error) {
    next(createError(500, 'Error loading business branding', error));
  }
};

/**
 * Load review link customization if available
 */
const loadLinkCustomization = async (req, res, next) => {
  try {
    // Check if we have a review link ID
    const linkId = req.params.linkId || req.query.linkId || req.body.reviewLinkId;
    
    if (!linkId) {
      // No link ID, just use default business branding
      return next();
    }
    
    // Check if link is already loaded
    if (req.reviewLink && req.reviewLink._id.toString() === linkId.toString()) {
      // Link already loaded, apply custom branding
      if (req.reviewLink.customBranding) {
        req.branding = {
          ...req.branding,
          ...req.reviewLink.customBranding
        };
      }
      return next();
    }
    
    // Load the review link
    const link = await ReviewLink.findById(linkId).select('business customBranding');
    
    if (!link) {
      return next(createError(404, 'Review link not found'));
    }
    
    // Attach link to request
    req.reviewLink = link;
    
    // Load business if not already loaded
    if (!req.business || !req.branding) {
      await loadBusinessBranding(req, res, () => {});
    }
    
    // Apply custom branding if available
    if (link.customBranding) {
      req.branding = {
        ...req.branding,
        ...link.customBranding
      };
    }
    
    next();
  } catch (error) {
    next(createError(500, 'Error loading link customization', error));
  }
};

/**
 * Apply branding to response locals for template rendering
 */
const applyBrandingToTemplate = (req, res, next) => {
  try {
    // Add branding to res.locals for template rendering
    res.locals.branding = req.branding || {};
    res.locals.business = req.business || {};
    
    // Set default values if missing
    res.locals.branding = {
      logoUrl: '/img/default-logo.png',
      primaryColor: '#3498db',
      secondaryColor: '#2c3e50',
      fontFamily: 'Arial, sans-serif',
      ...res.locals.branding
    };
    
    next();
  } catch (error) {
    next(createError(500, 'Error applying branding to template', error));
  }
};

/**
 * Inject branding into JSON responses
 */
const injectBrandingToJson = (req, res, next) => {
  // Store the original json function
  const originalJson = res.json;
  
  // Override the json method
  res.json = function(obj) {
    // Only add branding to success responses
    if (obj && obj.success === true && req.branding) {
      obj.branding = req.branding;
    }
    
    // Call the original json method
    return originalJson.call(this, obj);
  };
  
  next();
};

module.exports = {
  loadBusinessBranding,
  loadLinkCustomization,
  applyBrandingToTemplate,
  injectBrandingToJson
};
