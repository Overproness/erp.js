// @ts-nocheck
const Joi = require('joi');

class URLValidators {
  /**
   * Schema for URL creation
   */
  get createUrlSchema() {
    return Joi.object({
      originalUrl: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .required()
        .max(2048)
        .messages({
          'string.uri': 'Please provide a valid URL starting with http:// or https://',
          'any.required': 'Original URL is required',
          'string.max': 'URL must be less than 2048 characters'
        }),

      customShortCode: Joi.string()
        .alphanum()
        .min(3)
        .max(50)
        .optional()
        .messages({
          'string.alphanum': 'Short code can only contain letters and numbers',
          'string.min': 'Short code must be at least 3 characters',
          'string.max': 'Short code must be less than 50 characters'
        }),

      title: Joi.string()
        .max(200)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Title must be less than 200 characters'
        }),

      description: Joi.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Description must be less than 500 characters'
        }),

      categoryId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId'
        }),

      tags: Joi.array()
        .items(Joi.string().max(50))
        .max(10)
        .optional()
        .messages({
          'array.max': 'Maximum 10 tags allowed',
          'string.max': 'Each tag must be less than 50 characters'
        }),

      expiresAt: Joi.date()
        .greater('now')
        .optional()
        .messages({
          'date.greater': 'Expiration date must be in the future'
        }),

      maxClicks: Joi.number()
        .integer()
        .min(1)
        .max(1000000)
        .optional()
        .messages({
          'number.min': 'Maximum clicks must be at least 1',
          'number.max': 'Maximum clicks cannot exceed 1,000,000'
        }),

      isPublic: Joi.boolean()
        .default(true)
        .optional(),

      requiresAuth: Joi.boolean()
        .default(false)
        .optional(),

      passwordProtected: Joi.boolean()
        .default(false)
        .optional(),

      password: Joi.when('passwordProtected', {
        is: true,
        then: Joi.string()
          .min(4)
          .max(50)
          .required()
          .messages({
            'string.min': 'Password must be at least 4 characters',
            'string.max': 'Password must be less than 50 characters',
            'any.required': 'Password is required when password protection is enabled'
          }),
        otherwise: Joi.optional()
      }),

      allowedUsers: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .max(100)
        .optional()
        .messages({
          'array.max': 'Maximum 100 allowed users',
          'string.pattern.base': 'User ID must be a valid MongoDB ObjectId'
        }),

      ipRestrictions: Joi.array()
        .items(Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'optional' }))
        .max(50)
        .optional()
        .messages({
          'array.max': 'Maximum 50 IP restrictions',
          'string.ip': 'Must be a valid IP address or CIDR notation'
        }),

      countryRestrictions: Joi.array()
        .items(Joi.string().length(2).uppercase())
        .max(50)
        .optional()
        .messages({
          'array.max': 'Maximum 50 country restrictions',
          'string.length': 'Country code must be 2 characters',
          'string.uppercase': 'Country code must be uppercase'
        }),

      customDomain: Joi.string()
        .domain()
        .optional()
        .messages({
          'string.domain': 'Must be a valid domain name'
        }),

      utmSource: Joi.string().max(100).optional(),
      utmMedium: Joi.string().max(100).optional(),
      utmCampaign: Joi.string().max(100).optional(),
      utmTerm: Joi.string().max(100).optional(),
      utmContent: Joi.string().max(100).optional(),

      linkedModule: Joi.string()
        .valid('invoice', 'quote', 'client', 'document', 'email', 'social')
        .optional(),

      linkedEntityId: Joi.when('linkedModule', {
        is: Joi.exist(),
        then: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Linked entity ID must be a valid MongoDB ObjectId',
            'any.required': 'Linked entity ID is required when module is specified'
          }),
        otherwise: Joi.optional()
      }),

      abTestGroup: Joi.string()
        .valid('control', 'variant_a', 'variant_b', 'variant_c')
        .optional(),

      abTestName: Joi.when('abTestGroup', {
        is: Joi.exist(),
        then: Joi.string()
          .max(100)
          .required()
          .messages({
            'string.max': 'A/B test name must be less than 100 characters',
            'any.required': 'A/B test name is required when test group is specified'
          }),
        otherwise: Joi.optional()
      })
    });
  }

  /**
   * Schema for URL updates
   */
  get updateUrlSchema() {
    return Joi.object({
      title: Joi.string()
        .max(200)
        .optional()
        .allow(''),

      description: Joi.string()
        .max(500)
        .optional()
        .allow(''),

      categoryId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .allow(null),

      tags: Joi.array()
        .items(Joi.string().max(50))
        .max(10)
        .optional(),

      expiresAt: Joi.date()
        .greater('now')
        .optional()
        .allow(null),

      maxClicks: Joi.number()
        .integer()
        .min(1)
        .max(1000000)
        .optional()
        .allow(null),

      isActive: Joi.boolean().optional(),
      isPublic: Joi.boolean().optional(),
      requiresAuth: Joi.boolean().optional(),

      passwordProtected: Joi.boolean().optional(),

      password: Joi.when('passwordProtected', {
        is: true,
        then: Joi.string().min(4).max(50),
        otherwise: Joi.optional().allow(null)
      }),

      allowedUsers: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .max(100)
        .optional(),

      ipRestrictions: Joi.array()
        .items(Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'optional' }))
        .max(50)
        .optional(),

      countryRestrictions: Joi.array()
        .items(Joi.string().length(2).uppercase())
        .max(50)
        .optional(),

      utmSource: Joi.string().max(100).optional().allow(''),
      utmMedium: Joi.string().max(100).optional().allow(''),
      utmCampaign: Joi.string().max(100).optional().allow(''),
      utmTerm: Joi.string().max(100).optional().allow(''),
      utmContent: Joi.string().max(100).optional().allow('')
    });
  }

  /**
   * Schema for bulk operations
   */
  get bulkOperationSchema() {
    return Joi.object({
      operation: Joi.string()
        .valid('activate', 'deactivate', 'delete', 'update_category', 'add_tags', 'remove_tags')
        .required()
        .messages({
          'any.only': 'Operation must be one of: activate, deactivate, delete, update_category, add_tags, remove_tags'
        }),

      urlIds: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .max(100)
        .required()
        .messages({
          'array.min': 'At least one URL ID is required',
          'array.max': 'Maximum 100 URLs can be processed at once',
          'string.pattern.base': 'Each URL ID must be a valid MongoDB ObjectId'
        }),

      categoryId: Joi.when('operation', {
        is: 'update_category',
        then: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId'
          }),
        otherwise: Joi.optional()
      }),

      tags: Joi.when('operation', {
        is: Joi.valid('add_tags', 'remove_tags'),
        then: Joi.array()
          .items(Joi.string().max(50))
          .min(1)
          .max(10)
          .required()
          .messages({
            'array.min': 'At least one tag is required',
            'array.max': 'Maximum 10 tags allowed'
          }),
        otherwise: Joi.optional()
      })
    });
  }

  /**
   * Schema for analytics queries
   */
  get analyticsQuerySchema() {
    return Joi.object({
      startDate: Joi.date()
        .optional()
        .default(() => {
          const date = new Date();
          date.setDate(date.getDate() - 30);
          return date;
        }),

      endDate: Joi.date()
        .optional()
        .default(() => new Date())
        .greater(Joi.ref('startDate'))
        .messages({
          'date.greater': 'End date must be after start date'
        }),

      interval: Joi.string()
        .valid('hour', 'day', 'week', 'month')
        .default('day')
        .optional(),

      metrics: Joi.array()
        .items(Joi.string().valid(
          'clicks', 'unique_clicks', 'click_rate', 'top_countries',
          'top_devices', 'top_browsers', 'top_referrers', 'geographic'
        ))
        .default(['clicks', 'unique_clicks'])
        .optional(),

      groupBy: Joi.string()
        .valid('date', 'country', 'device', 'browser', 'referrer', 'hour')
        .optional(),

      limit: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .default(100)
        .optional(),

      includeDetails: Joi.boolean()
        .default(false)
        .optional()
    });
  }

  /**
   * Schema for A/B test creation
   */
  get abTestSchema() {
    return Joi.object({
      testName: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
          'string.min': 'Test name must be at least 3 characters',
          'string.max': 'Test name must be less than 100 characters'
        }),

      description: Joi.string()
        .max(500)
        .optional()
        .allow(''),

      controlUrl: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          'string.pattern.base': 'Control URL ID must be a valid MongoDB ObjectId'
        }),

      variants: Joi.array()
        .items(Joi.object({
          name: Joi.string().max(50).required(),
          urlId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
          trafficPercentage: Joi.number().min(1).max(99).required()
        }))
        .min(1)
        .max(5)
        .required()
        .messages({
          'array.min': 'At least one variant is required',
          'array.max': 'Maximum 5 variants allowed'
        }),

      trafficSplit: Joi.object({
        control: Joi.number().min(1).max(99).required(),
        variants: Joi.number().min(1).max(99).required()
      })
        .required()
        .custom((value, helpers) => {
          if (value.control + value.variants !== 100) {
            return helpers.error('custom.trafficSplit');
          }
          return value;
        })
        .messages({
          'custom.trafficSplit': 'Control and variants traffic must sum to 100%'
        }),

      successMetric: Joi.string()
        .valid('clicks', 'conversions', 'revenue', 'engagement_time')
        .default('clicks')
        .optional(),

      minimumSampleSize: Joi.number()
        .integer()
        .min(100)
        .max(100000)
        .default(1000)
        .optional(),

      confidenceLevel: Joi.number()
        .min(0.8)
        .max(0.99)
        .default(0.95)
        .optional(),

      startDate: Joi.date()
        .greater('now')
        .optional(),

      endDate: Joi.date()
        .greater(Joi.ref('startDate'))
        .optional()
        .messages({
          'date.greater': 'End date must be after start date'
        }),

      autoStop: Joi.boolean()
        .default(false)
        .optional(),

      autoStopCriteria: Joi.when('autoStop', {
        is: true,
        then: Joi.object({
          significanceReached: Joi.boolean().default(true),
          minimumRuntime: Joi.number().integer().min(1).max(365), // days
          maximumRuntime: Joi.number().integer().min(1).max(365)  // days
        }),
        otherwise: Joi.optional()
      })
    });
  }

  /**
   * Schema for URL redirection password
   */
  get passwordSchema() {
    return Joi.object({
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Password is required'
        })
    });
  }

  /**
   * Schema for URL search
   */
  get searchSchema() {
    return Joi.object({
      query: Joi.string()
        .min(1)
        .max(100)
        .optional(),

      categoryId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional(),

      tags: Joi.array()
        .items(Joi.string().max(50))
        .max(10)
        .optional(),

      isActive: Joi.boolean().optional(),
      isPublic: Joi.boolean().optional(),
      hasExpiration: Joi.boolean().optional(),
      hasClickLimit: Joi.boolean().optional(),

      createdBy: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional(),

      createdAfter: Joi.date().optional(),
      createdBefore: Joi.date().optional(),

      sortBy: Joi.string()
        .valid('createdAt', 'updatedAt', 'title', 'totalClicks', 'lastClickedAt')
        .default('createdAt')
        .optional(),

      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .optional(),

      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional(),

      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .optional()
    });
  }

  /**
   * Schema for QR code generation
   */
  get qrCodeSchema() {
    return Joi.object({
      size: Joi.number()
        .integer()
        .min(100)
        .max(1000)
        .default(200)
        .optional(),

      format: Joi.string()
        .valid('png', 'svg', 'pdf')
        .default('png')
        .optional(),

      errorCorrectionLevel: Joi.string()
        .valid('L', 'M', 'Q', 'H')
        .default('M')
        .optional(),

      includeText: Joi.boolean()
        .default(true)
        .optional(),

      customLogo: Joi.boolean()
        .default(false)
        .optional()
    });
  }

  /**
   * Validate data against schema
   * @param {object} data - Data to validate
   * @param {object} schema - Joi schema
   * @returns {object} Validation result
   */
  validate(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        data: null
      };
    }

    return {
      isValid: true,
      errors: null,
      data: value
    };
  }

  /**
   * Validate URL creation data
   * @param {object} data - URL creation data
   * @returns {object} Validation result
   */
  validateCreateUrl(data) {
    return this.validate(data, this.createUrlSchema);
  }

  /**
   * Validate URL update data
   * @param {object} data - URL update data
   * @returns {object} Validation result
   */
  validateUpdateUrl(data) {
    return this.validate(data, this.updateUrlSchema);
  }

  /**
   * Validate bulk operation data
   * @param {object} data - Bulk operation data
   * @returns {object} Validation result
   */
  validateBulkOperation(data) {
    return this.validate(data, this.bulkOperationSchema);
  }

  /**
   * Validate analytics query
   * @param {object} data - Analytics query data
   * @returns {object} Validation result
   */
  validateAnalyticsQuery(data) {
    return this.validate(data, this.analyticsQuerySchema);
  }

  /**
   * Validate A/B test data
   * @param {object} data - A/B test data
   * @returns {object} Validation result
   */
  validateAbTest(data) {
    return this.validate(data, this.abTestSchema);
  }

  /**
   * Validate password data
   * @param {object} data - Password data
   * @returns {object} Validation result
   */
  validatePassword(data) {
    return this.validate(data, this.passwordSchema);
  }

  /**
   * Validate search data
   * @param {object} data - Search data
   * @returns {object} Validation result
   */
  validateSearch(data) {
    return this.validate(data, this.searchSchema);
  }

  /**
   * Validate QR code data
   * @param {object} data - QR code data
   * @returns {object} Validation result
   */
  validateQrCode(data) {
    return this.validate(data, this.qrCodeSchema);
  }
}

module.exports = new URLValidators();
