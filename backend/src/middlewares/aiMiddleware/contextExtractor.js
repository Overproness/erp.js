const contextAwareService = require('../../services/contextAwareService');
const aiUtils = require('../../utils/aiUtils');
const { getCurrentUser } = require('../../utils/authUtils');

const contextExtractor = async (req, res, next) => {
  try {
    const { body } = req;
    const admin = getCurrentUser(req);

    // Check if admin exists before accessing its properties
    if (!admin || !admin._id) {
      console.warn('Admin user not found in request');
      req.aiContext = {
        module: req.body?.context?.module || 'general',
        timestamp: new Date(),
        error: 'Admin user not found',
      };
      return next();
    }

    const userId = admin._id;

    // Extract module context if provided
    if (body.context?.module) {
      const moduleContext = await contextAwareService.buildContext(
        body.context.module,
        body.context.data || {},
        userId
      );

      // Enhance request context
      req.aiContext = {
        ...body.context,
        moduleContext,
        timestamp: new Date(),
        userId,
      };
    }

    // Extract entity context for specific operations
    if (body.context?.entityId && body.context?.module) {
      const entityContext = aiUtils.extractModuleContext(body.context.module, {
        _id: body.context.entityId,
        ...body.context.data,
      });

      req.aiContext = {
        ...req.aiContext,
        entityContext,
      };
    }

    // Add user preferences context
    if (req.userPreferences) {
      req.aiContext = {
        ...req.aiContext,
        userPreferences: req.userPreferences,
      };
    }

    next();
  } catch (error) {
    console.error('Context extraction error:', error);

    // Continue without context if extraction fails
    req.aiContext = {
      module: req.body?.context?.module || 'general',
      timestamp: new Date(),
      userId: getCurrentUser(req)?._id || null,
      error: 'Context extraction failed',
    };

    next();
  }
};

module.exports = { contextExtractor };
