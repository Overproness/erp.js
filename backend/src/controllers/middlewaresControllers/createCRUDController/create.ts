// @ts-nocheck
/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;

  // First, decode any HTML entities to catch encoded attacks
  let sanitized = input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x3C;/g, '<')
    .replace(/&#x3E;/g, '>')
    .replace(/&#60;/g, '<')
    .replace(/&#62;/g, '>');

  // Remove all script tags (case insensitive, with any attributes)
  sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');

  // Remove other dangerous tags
  sanitized = sanitized
    .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
    .replace(/<\s*embed[^>]*>/gi, '')
    .replace(/<\s*link[^>]*>/gi, '')
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*meta[^>]*>/gi, '')
    .replace(/<\s*base[^>]*>/gi, '');

  // Remove javascript: protocols and event handlers
  sanitized = sanitized
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Remove any remaining < and > completely to prevent tag injection
  sanitized = sanitized.replace(/[<>]/g, '');

  return sanitized;
};

const create = async (Model, req, res) => {
  try {
    // Permission checking for users (not companyOwners)
    if (req.user) {
      const modelName = Model.modelName;
      const permissionMap = {
        Client: 'canCreateClients',
        Invoice: 'canCreateInvoices',
        Payment: 'canCreatePayments',
        Quote: 'canCreateQuotes',
        Task: 'canCreateTasks',
        AppDocument: 'canCreateDocuments',
        SocialPost: 'canCreateSocialPosts',
        SocialAccount: 'canCreateSocialAccounts',
        SocialCampaign: 'canCreateSocialCampaigns',
        Url: 'canCreateUrls',
        Team: 'canCreateTeams',
        Workflow: 'canCreateWorkflows',
        Notification: 'canCreateNotifications',
        AiAssistant: 'canCreateAiAssistants',
        Tax: 'canCreateTaxes',
        Currency: 'canCreateCurrency',
        Report: 'canCreateReports',
        Analytics: 'canCreateAnalytics',
        Marketing: 'canCreateMarketing',
        Reputation: 'canCreateReputation',
        Offer: 'canCreateOffers',
        Setting: 'canCreateSettings',
      };

      const requiredPermission = permissionMap[modelName];

      if (requiredPermission && !req.user.permissions?.[requiredPermission]) {
        return res.status(403).json({
          success: false,
          result: null,
          message: `You do not have permission to create ${modelName.toLowerCase()}s`,
        });
      }

      // Not defined in User: permission for model types not in the map
      if (!requiredPermission) {
        // Comment: Not defined in User permission system
      }
    }

    // Get owner, createdBy, and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const createdBy = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    // Sanitize input data and validate field lengths
    const sanitizedBody = { ...req.body };

    // Validate input field lengths to prevent DoS attacks
    for (const [key, value] of Object.entries(sanitizedBody)) {
      if (typeof value === 'string') {
        // Check for excessively long inputs (adjust limits as needed)
        const maxLengths = {
          name: 100,
          email: 254, // Standard email max length
          phone: 20,
          address: 500,
          description: 1000,
          default: 255,
        };

        const maxLength = maxLengths[key] || maxLengths.default;
        if (value.length > maxLength) {
          return res.status(413).json({
            success: false,
            result: null,
            message: `Field '${key}' exceeds maximum length of ${maxLength} characters`,
          });
        }
      }
    }

    // Trim strings and handle XSS prevention
    Object.keys(sanitizedBody).forEach((key) => {
      if (typeof sanitizedBody[key] === 'string') {
        // Trim whitespace
        sanitizedBody[key] = sanitizedBody[key].trim();
        // Convert email to lowercase
        if (key === 'email') {
          sanitizedBody[key] = sanitizedBody[key].toLowerCase();
        }
        // Enhanced XSS prevention - remove dangerous HTML tags and entities
        sanitizedBody[key] = sanitizeHtml(sanitizedBody[key]);
      }
    });

    // Set owner, companyID, and other tracking fields
    sanitizedBody.owner = owner;
    sanitizedBody.createdBy = createdBy;
    sanitizedBody.companyID = companyID;
    sanitizedBody.removed = false;

    const result = await new Model({
      ...sanitizedBody,
    }).save();

    // Convert result to plain object and ensure owner is just the ID
    const plainResult = result.toObject();
    if (plainResult.owner && typeof plainResult.owner === 'object') {
      plainResult.owner = plainResult.owner._id || plainResult.owner;
    }

    return res.status(201).json({
      success: true,
      result: plainResult,
      message: 'Successfully created document',
    });
  } catch (error) {
    // Handle different types of errors
    let status = 500;
    const errorResponse = {
      success: false,
      result: null,
      message: error.message,
    };

    // Handle validation errors
    if (error.name === 'ValidationError') {
      status = 400;
      errorResponse.errors = error.errors;
    }
    // Handle duplicate key errors (MongoDB code 11000)
    else if (error.code === 11000 || error.name === 'MongoServerError') {
      status = 400;
      errorResponse.message = error.message.includes('duplicate')
        ? error.message
        : 'Duplicate key error - this value already exists';
    }

    return res.status(status).json(errorResponse);
  }
};

module.exports = create;
