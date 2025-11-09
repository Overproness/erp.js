const Joi = require('joi');

// Schema for validating review link creation
const linkCreationSchema = Joi.object({
  businessId: Joi.string().required()
    .messages({
      'string.empty': 'Business ID is required',
      'any.required': 'Business ID is required'
    }),
  
  name: Joi.string().required().max(100)
    .messages({
      'string.empty': 'Link name is required',
      'string.max': 'Link name cannot exceed 100 characters',
      'any.required': 'Link name is required'
    }),
  
  description: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  platform: Joi.string().valid('google', 'facebook', 'yelp', 'tripadvisor', 'direct', 'website', 'email', 'sms', 'all')
    .default('direct')
    .messages({
      'any.only': 'Platform must be one of: google, facebook, yelp, tripadvisor, direct, website, email, sms, all'
    }),
  
  expiryDate: Joi.date().allow(null).min('now')
    .messages({
      'date.min': 'Expiry date cannot be in the past'
    }),
  
  shortCode: Joi.string().allow('').max(20)
    .messages({
      'string.max': 'Short code cannot exceed 20 characters'
    }),
  
  customBranding: Joi.object({
    title: Joi.string().allow('').max(100),
    description: Joi.string().allow('').max(500),
    logoUrl: Joi.string().uri().allow(''),
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(''),
    backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(''),
    fontFamily: Joi.string().allow('')
  }).allow(null),
  
  utmParameters: Joi.object({
    source: Joi.string().allow(''),
    medium: Joi.string().allow(''),
    campaign: Joi.string().allow(''),
    term: Joi.string().allow(''),
    content: Joi.string().allow('')
  }).allow(null),
  
  active: Joi.boolean().default(true),
  
  redirectUrl: Joi.string().uri().allow(''),
  
  customFields: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      label: Joi.string().required(),
      type: Joi.string().valid('text', 'number', 'select', 'checkbox', 'radio', 'date'),
      required: Joi.boolean().default(false),
      options: Joi.array().items(Joi.string()).when('type', {
        is: Joi.valid('select', 'radio'),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    })
  )
});

// Schema for validating review link updates
const linkUpdateSchema = Joi.object({
  name: Joi.string().max(100)
    .messages({
      'string.max': 'Link name cannot exceed 100 characters'
    }),
  
  description: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  expiryDate: Joi.date().allow(null).min('now')
    .messages({
      'date.min': 'Expiry date cannot be in the past'
    }),
  
  customBranding: Joi.object({
    title: Joi.string().allow('').max(100),
    description: Joi.string().allow('').max(500),
    logoUrl: Joi.string().uri().allow(''),
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(''),
    backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(''),
    fontFamily: Joi.string().allow('')
  }).allow(null),
  
  utmParameters: Joi.object({
    source: Joi.string().allow(''),
    medium: Joi.string().allow(''),
    campaign: Joi.string().allow(''),
    term: Joi.string().allow(''),
    content: Joi.string().allow('')
  }).allow(null),
  
  active: Joi.boolean(),
  
  redirectUrl: Joi.string().uri().allow(''),
  
  customFields: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      label: Joi.string().required(),
      type: Joi.string().valid('text', 'number', 'select', 'checkbox', 'radio', 'date'),
      required: Joi.boolean().default(false),
      options: Joi.array().items(Joi.string()).when('type', {
        is: Joi.valid('select', 'radio'),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    })
  )
});

module.exports = {
  validateLinkCreation: (data) => {
    const { error, value } = linkCreationSchema.validate(data, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return { error: errorMessage };
    }
    return { value };
  },
  validateLinkUpdate: (data) => {
    const { error, value } = linkUpdateSchema.validate(data, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return { error: errorMessage };
    }
    return { value };
  },
  linkCreationSchema,
  linkUpdateSchema
};
