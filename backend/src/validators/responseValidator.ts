// @ts-nocheck
const Joi = require('joi');

// Schema for validating review response template creation
const templateCreationSchema = Joi.object({
  businessId: Joi.string().required()
    .messages({
      'string.empty': 'Business ID is required',
      'any.required': 'Business ID is required'
    }),
  
  name: Joi.string().required().max(100)
    .messages({
      'string.empty': 'Template name is required',
      'string.max': 'Template name cannot exceed 100 characters',
      'any.required': 'Template name is required'
    }),
  
  description: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  platform: Joi.string().valid('google', 'facebook', 'yelp', 'tripadvisor', 'direct', 'website', 'email', 'sms', 'all')
    .default('all')
    .messages({
      'any.only': 'Platform must be one of: google, facebook, yelp, tripadvisor, direct, website, email, sms, all'
    }),
  
  sentimentType: Joi.string().valid('positive', 'negative', 'neutral', 'all')
    .required()
    .messages({
      'string.empty': 'Sentiment type is required',
      'any.required': 'Sentiment type is required',
      'any.only': 'Sentiment type must be one of: positive, negative, neutral, all'
    }),
  
  ratingRange: Joi.object({
    min: Joi.number().integer().min(1).max(5).required(),
    max: Joi.number().integer().min(Joi.ref('min')).max(5).required()
  }).messages({
    'number.min': 'Minimum rating must be at least 1',
    'number.max': 'Maximum rating cannot exceed 5',
    'any.required': 'Rating range is required'
  }),
  
  templateText: Joi.string().required().max(2000)
    .messages({
      'string.empty': 'Template text is required',
      'string.max': 'Template text cannot exceed 2000 characters',
      'any.required': 'Template text is required'
    }),
  
  variables: Joi.array().items(Joi.string()),
  
  isDefault: Joi.boolean().default(false),
  
  tags: Joi.array().items(Joi.string()),
  
  active: Joi.boolean().default(true)
});

// Schema for validating review response template updates
const templateUpdateSchema = Joi.object({
  name: Joi.string().max(100)
    .messages({
      'string.max': 'Template name cannot exceed 100 characters'
    }),
  
  description: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  platform: Joi.string().valid('google', 'facebook', 'yelp', 'tripadvisor', 'direct', 'website', 'email', 'sms', 'all')
    .messages({
      'any.only': 'Platform must be one of: google, facebook, yelp, tripadvisor, direct, website, email, sms, all'
    }),
  
  sentimentType: Joi.string().valid('positive', 'negative', 'neutral', 'all')
    .messages({
      'any.only': 'Sentiment type must be one of: positive, negative, neutral, all'
    }),
  
  ratingRange: Joi.object({
    min: Joi.number().integer().min(1).max(5),
    max: Joi.number().integer().min(Joi.ref('min')).max(5)
  }).messages({
    'number.min': 'Minimum rating must be at least 1',
    'number.max': 'Maximum rating cannot exceed 5'
  }),
  
  templateText: Joi.string().max(2000)
    .messages({
      'string.max': 'Template text cannot exceed 2000 characters'
    }),
  
  variables: Joi.array().items(Joi.string()),
  
  isDefault: Joi.boolean(),
  
  tags: Joi.array().items(Joi.string()),
  
  active: Joi.boolean()
});

// Schema for validating direct response to review
const directResponseSchema = Joi.object({
  reviewId: Joi.string().required()
    .messages({
      'string.empty': 'Review ID is required',
      'any.required': 'Review ID is required'
    }),
  
  responseText: Joi.string().required().max(2000)
    .messages({
      'string.empty': 'Response text is required',
      'string.max': 'Response text cannot exceed 2000 characters',
      'any.required': 'Response text is required'
    }),
  
  templateId: Joi.string().allow(null),
  
  postToPlatform: Joi.boolean().default(true)
});

// Helper functions to validate data against schemas
const validateTemplate = (data, schema = templateCreationSchema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: errorMessage };
  }
  return { value };
};

const validateResponse = (data, schema = directResponseSchema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: errorMessage };
  }
  return { value };
};

module.exports = {
  validateTemplateCreation: (data) => validateTemplate(data, templateCreationSchema),
  validateTemplateUpdate: (data) => validateTemplate(data, templateUpdateSchema),
  validateDirectResponse: (data) => validateResponse(data, directResponseSchema),
  templateCreationSchema,
  templateUpdateSchema,
  directResponseSchema
};
