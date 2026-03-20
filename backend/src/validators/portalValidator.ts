// @ts-nocheck
const Joi = require('joi');

// Schema for validating review portal settings
const portalSettingsSchema = Joi.object({
  businessId: Joi.string().required()
    .messages({
      'string.empty': 'Business ID is required',
      'any.required': 'Business ID is required'
    }),
  
  portalTitle: Joi.string().allow('').max(100)
    .messages({
      'string.max': 'Portal title cannot exceed 100 characters'
    }),
  
  portalDescription: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Portal description cannot exceed 500 characters'
    }),
  
  logo: Joi.object({
    url: Joi.string().uri().allow(''),
    altText: Joi.string().allow('').max(100),
    height: Joi.number().integer().min(1).allow(null),
    width: Joi.number().integer().min(1).allow(null)
  }).allow(null),
  
  colors: Joi.object({
    primary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(''),
    secondary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(''),
    text: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(''),
    background: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('')
  }).allow(null),
  
  fonts: Joi.object({
    heading: Joi.string().allow(''),
    body: Joi.string().allow('')
  }).allow(null),
  
  formCustomization: Joi.object({
    requiredFields: Joi.array().items(
      Joi.string().valid('name', 'email', 'phone', 'title', 'comment', 'rating')
    ),
    optionalFields: Joi.array().items(
      Joi.string().valid('name', 'email', 'phone', 'title', 'comment')
    ),
    hiddenFields: Joi.array().items(
      Joi.string().valid('name', 'email', 'phone', 'title', 'comment')
    )
  }).allow(null),
  
  customCss: Joi.string().allow('').max(5000)
    .messages({
      'string.max': 'Custom CSS cannot exceed 5000 characters'
    }),
  
  customJavaScript: Joi.string().allow('').max(5000)
    .messages({
      'string.max': 'Custom JavaScript cannot exceed 5000 characters'
    }),
  
  customHeaderHtml: Joi.string().allow('').max(2000)
    .messages({
      'string.max': 'Custom header HTML cannot exceed 2000 characters'
    }),
  
  customFooterHtml: Joi.string().allow('').max(2000)
    .messages({
      'string.max': 'Custom footer HTML cannot exceed 2000 characters'
    }),
  
  thankYouPage: Joi.object({
    title: Joi.string().allow('').max(100),
    message: Joi.string().allow('').max(1000),
    redirectUrl: Joi.string().uri().allow(''),
    redirectDelay: Joi.number().integer().min(0).allow(null)
  }).allow(null),
  
  metaTags: Joi.object({
    title: Joi.string().allow('').max(100),
    description: Joi.string().allow('').max(250),
    keywords: Joi.string().allow('').max(250),
    ogImage: Joi.string().uri().allow('')
  }).allow(null),
  
  privacySettings: Joi.object({
    collectIpAddress: Joi.boolean(),
    collectUserAgent: Joi.boolean(),
    privacyPolicyUrl: Joi.string().uri().allow(''),
    termsUrl: Joi.string().uri().allow(''),
    cookieConsent: Joi.boolean()
  }).allow(null),
  
  feedbackOptions: Joi.object({
    showExistingReviews: Joi.boolean(),
    reviewsToShow: Joi.number().integer().min(0).max(50).allow(null),
    allowReplies: Joi.boolean(),
    moderateBeforePublishing: Joi.boolean()
  }).allow(null),
  
  socialProof: Joi.object({
    showReviewCount: Joi.boolean(),
    showAverageRating: Joi.boolean(),
    showRecentReviews: Joi.boolean(),
    maxRecentReviews: Joi.number().integer().min(0).max(10).allow(null),
    highlightTopReviews: Joi.boolean()
  }).allow(null),
  
  platformButtons: Joi.object({
    google: Joi.boolean(),
    facebook: Joi.boolean(),
    yelp: Joi.boolean(),
    tripadvisor: Joi.boolean(),
    directForm: Joi.boolean()
  }).allow(null),
  
  integrations: Joi.object({
    googleAnalyticsId: Joi.string().allow(''),
    facebookPixelId: Joi.string().allow(''),
    zapierWebhookUrl: Joi.string().uri().allow(''),
    slackWebhookUrl: Joi.string().uri().allow('')
  }).allow(null)
});

// Schema for validating review portal preview settings (simplified version)
const portalPreviewSchema = Joi.object({
  businessId: Joi.string().required()
    .messages({
      'string.empty': 'Business ID is required',
      'any.required': 'Business ID is required'
    }),
  
  portalSettings: portalSettingsSchema,
  
  previewData: Joi.object({
    reviewLink: Joi.string(),
    clientName: Joi.string().allow(''),
    clientEmail: Joi.string().email().allow(''),
    clientPhone: Joi.string().allow('')
  }).allow(null),
  
  displayMode: Joi.string().valid('desktop', 'mobile', 'tablet').default('desktop')
});

// Helper function to validate data against schema
const validatePortalSettings = (data, schema = portalSettingsSchema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: errorMessage };
  }
  return { value };
};

module.exports = {
  validatePortalSettings: (data) => validatePortalSettings(data, portalSettingsSchema),
  validatePortalPreview: (data) => validatePortalSettings(data, portalPreviewSchema),
  portalSettingsSchema,
  portalPreviewSchema
};
