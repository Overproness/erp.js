// @ts-nocheck

import Joi from 'joi';
import aiUtils from '../../utils/aiUtils';
import AiAssistant from '../../models/appModels/AiAssistant';
import AiAnalytics from '../../models/appModels/AiAnalytics';
// Validation schemas
const createAssistantSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500),
  type: Joi.string().valid('general', 'document', 'workflow', 'analytics', 'customer', 'financial').required(),
  capabilities: Joi.array().items(Joi.string()).min(1).required(),
  model: Joi.object({
    provider: Joi.string().valid('openai').required(),
    modelName: Joi.string().valid('gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo').required(),
    parameters: Joi.object({
      temperature: Joi.number().min(0).max(2),
      maxTokens: Joi.number().min(1).max(4000),
      topP: Joi.number().min(0).max(1),
      frequencyPenalty: Joi.number().min(0).max(2),
      presencePenalty: Joi.number().min(0).max(2),
    }),
  }).required(),
  systemPrompt: Joi.string().required().min(10).max(2000),
  enabled: Joi.boolean(),
  contextModules: Joi.array().items(Joi.string()),
  knowledgeBase: Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId
});

const updateAssistantSchema = createAssistantSchema.fork(['name', 'type', 'capabilities', 'model', 'systemPrompt'], (schema) => schema.optional());

const chatMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(2000),
  context: Joi.object({
    module: Joi.string(),
    entityId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    entityType: Joi.string(),
    data: Joi.object(),
    sessionId: Joi.string(),
  }),
});

const analyzeContentSchema = Joi.object({
  content: Joi.string().required().min(1).max(10000),
  type: Joi.string().valid('general', 'document', 'financial', 'legal').default('general'),
  context: Joi.object({
    module: Joi.string(),
    documentType: Joi.string(),
    entityId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    data: Joi.object(),
  }),
});

const suggestionsSchema = Joi.object({
  module: Joi.string().required(),
  data: Joi.object().required(),
  type: Joi.string().valid('optimization', 'automation', 'improvement').default('optimization'),
  context: Joi.object(),
});

const predictionsSchema = Joi.object({
  module: Joi.string().required(),
  timeframe: Joi.string().valid('7_days', '30_days', '60_days', '90_days', '1_year').default('30_days'),
  metrics: Joi.array().items(Joi.string()),
  data: Joi.object(),
  context: Joi.object(),
});

// Validation middleware functions
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Validation error',
        errors: errorMessages,
      });
    }

    req.body = value;
    next();
  };
};

// Specific validation middleware
const createAssistant = validateRequest(createAssistantSchema);
const updateAssistant = validateRequest(updateAssistantSchema);
const chatMessage = validateRequest(chatMessageSchema);
const analyzeContent = validateRequest(analyzeContentSchema);
const suggestions = validateRequest(suggestionsSchema);
const predictions = validateRequest(predictionsSchema);

// Custom validation for assistant existence and ownership
const validateAssistantAccess = async (req, res, next) => {
  try {
    const { assistantId } = req.params;
    
    if (!assistantId || !assistantId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid assistant ID format',
      });
    }

    const assistant = await AiAssistant.findOne({
      _id: assistantId,
      owner: req.companyOwner?._id || req.user?.companyOwner,
      removed: false,
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'AI Assistant not found or access denied',
      });
    }

    if (!assistant.enabled) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'AI Assistant is disabled',
      });
    }

    req.assistant = assistant;
    next();
  } catch (error) {
    console.error('Assistant validation error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error during validation',
    });
  }
};

// Content safety validation
const validateContentSafety = (req, res, next) => {
  const { message, content } = req.body;
  const textToCheck = message || content;

  if (!textToCheck) {
    return next();
  }

  // Basic content safety checks
  const unsafePatterns = [
    /hack|exploit|vulnerability/i,
    /password|credential|secret/i,
    /malware|virus|attack/i,
    /illegal|criminal|fraud/i,
  ];

  const containsUnsafeContent = unsafePatterns.some(pattern => pattern.test(textToCheck));

  if (containsUnsafeContent) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Content flagged for safety review',
    });
  }

  next();
};

// Rate limiting check based on user plan
const checkUsageLimits = async (req, res, next) => {
  try {
    const userId = req.companyOwner?._id || req.user?._id;
    const userPlan = req.companyOwner?.plan || 'free';

    // Check monthly usage limits
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await AiAnalytics.aggregate([
      {
        $match: {
          owner: userId,
          type: 'usage',
          created: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$metrics.tokensUsed' },
          totalCost: { $sum: '$metrics.cost' },
          requestCount: { $sum: 1 }
        }
      }
    ]);

    const usage = monthlyUsage[0] || { totalTokens: 0, totalCost: 0, requestCount: 0 };

    // Plan limits
    const limits = {
      free: { tokens: 50000, cost: 5, requests: 500 },
      pro: { tokens: 200000, cost: 25, requests: 2000 },
      premium: { tokens: 1000000, cost: 100, requests: 10000 },
    };

    const userLimits = limits[userPlan] || limits.free;

    if (usage.totalTokens >= userLimits.tokens) {
      return res.status(429).json({
        success: false,
        result: null,
        message: 'Monthly token limit exceeded. Please upgrade your plan.',
        usage,
        limits: userLimits,
      });
    }

    if (usage.totalCost >= userLimits.cost) {
      return res.status(429).json({
        success: false,
        result: null,
        message: 'Monthly cost limit exceeded. Please upgrade your plan.',
        usage,
        limits: userLimits,
      });
    }

    if (usage.requestCount >= userLimits.requests) {
      return res.status(429).json({
        success: false,
        result: null,
        message: 'Monthly request limit exceeded. Please upgrade your plan.',
        usage,
        limits: userLimits,
      });
    }

    req.usageInfo = { usage, limits: userLimits };
    next();
  } catch (error) {
    console.error('Usage limit check error:', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
};

export = {
  validateAiRequest: {
    createAssistant,
    updateAssistant,
    chatMessage,
    analyzeContent,
    suggestions,
    predictions,
  },
  validateAssistantAccess,
  validateContentSafety,
  checkUsageLimits,
};
