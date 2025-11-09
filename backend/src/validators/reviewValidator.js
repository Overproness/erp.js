const Joi = require('joi');

// Schema for validating new review submissions
const reviewSubmissionSchema = Joi.object({
  rating: Joi.number().required().min(1).max(5)
    .messages({
      'number.base': 'Rating must be a number',
      'number.empty': 'Rating is required',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot be more than 5',
      'any.required': 'Rating is required'
    }),
  
  comment: Joi.string().allow('').max(2000)
    .messages({
      'string.max': 'Comment cannot exceed 2000 characters'
    }),
  
  title: Joi.string().allow('').max(200)
    .messages({
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  clientName: Joi.string().required().max(100)
    .messages({
      'string.empty': 'Client name is required',
      'string.max': 'Client name cannot exceed 100 characters',
      'any.required': 'Client name is required'
    }),
  
  clientEmail: Joi.string().email().allow('').max(100)
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email cannot exceed 100 characters'
    }),
  
  clientPhone: Joi.string().allow('').max(20).pattern(/^[0-9+\-\s()]*$/)
    .messages({
      'string.pattern.base': 'Phone number can only contain numbers, spaces and + - ( ) characters',
      'string.max': 'Phone number cannot exceed 20 characters'
    }),
  
  platform: Joi.string().valid('direct', 'website', 'email', 'sms', 'google', 'facebook', 'yelp', 'tripadvisor')
    .default('direct')
    .messages({
      'any.only': 'Platform must be one of: direct, website, email, sms, google, facebook, yelp, tripadvisor'
    }),
  
  businessId: Joi.string().required()
    .messages({
      'string.empty': 'Business ID is required',
      'any.required': 'Business ID is required'
    }),
  
  reviewLinkId: Joi.string().allow(''),
  
  ipAddress: Joi.string().allow('').max(50),
  
  userAgent: Joi.string().allow('').max(500),
  
  metadata: Joi.object().allow(null)
});

// Schema for validating review updates (admin only)
const reviewUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'featured', 'archived')
    .messages({
      'any.only': 'Status must be one of: pending, approved, rejected, featured, archived'
    }),
  
  verified: Joi.boolean(),
  
  featured: Joi.boolean(),
  
  hidden: Joi.boolean(),
  
  internalNotes: Joi.string().allow('').max(1000)
    .messages({
      'string.max': 'Internal notes cannot exceed 1000 characters'
    }),
  
  moderationNotes: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Moderation notes cannot exceed 500 characters'
    })
});

// Schema for validating review filtering and searching
const reviewFilterSchema = Joi.object({
  businessId: Joi.string().allow(''),
  
  platform: Joi.string(),
  
  minRating: Joi.number().min(1).max(5)
    .messages({
      'number.base': 'Minimum rating must be a number',
      'number.min': 'Minimum rating must be at least 1',
      'number.max': 'Minimum rating cannot be more than 5'
    }),
  
  maxRating: Joi.number().min(1).max(5)
    .messages({
      'number.base': 'Maximum rating must be a number',
      'number.min': 'Maximum rating must be at least 1',
      'number.max': 'Maximum rating cannot be more than 5'
    }),
  
  status: Joi.string().valid('pending', 'approved', 'rejected', 'featured', 'archived', 'all')
    .messages({
      'any.only': 'Status must be one of: pending, approved, rejected, featured, archived, all'
    }),
  
  sentiment: Joi.string().valid('positive', 'negative', 'neutral', 'all'),
  
  startDate: Joi.date(),
  
  endDate: Joi.date().min(Joi.ref('startDate'))
    .messages({
      'date.min': 'End date must be after start date'
    }),
  
  hasResponse: Joi.boolean(),
  
  search: Joi.string().allow(''),
  
  sort: Joi.string().valid('date', 'rating', 'sentiment'),
  
  sortDirection: Joi.string().valid('asc', 'desc'),
  
  page: Joi.number().integer().min(1).default(1),
  
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Helper function to validate data against schema
const validateReview = (data, schema = reviewSubmissionSchema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: errorMessage };
  }
  return { value };
};

module.exports = {
  validateReviewSubmission: (data) => validateReview(data, reviewSubmissionSchema),
  validateReviewUpdate: (data) => validateReview(data, reviewUpdateSchema),
  validateReviewFilter: (data) => validateReview(data, reviewFilterSchema),
  reviewSubmissionSchema,
  reviewUpdateSchema,
  reviewFilterSchema
};
