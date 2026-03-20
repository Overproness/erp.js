// @ts-nocheck
const aiService = require('../../../services/aiService');
const contextAwareService = require('../../../services/contextAwareService');
const { catchErrors } = require('../../../handlers/errorHandlers');
const { getCurrentUserId } = require('../../../utils/authUtils');

const chat = async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { message, context = {} } = req.body;
    const userId = getCurrentUserId(req);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Message is required',
      });
    }

    // Build context if module and entityId are provided
    let enhancedContext = context;
    if (context.module) {
      const moduleContext = await contextAwareService.buildContext(
        context.module,
        context.data,
        userId
      );
      enhancedContext = { ...context, ...moduleContext };
    } else {
      // Always get company context even if no specific module
      const companyContext = await contextAwareService.buildContext(
        'general',
        context.data || {},
        userId
      );
      enhancedContext = { ...context, company: companyContext.company };
    }

    const result = await aiService.processChat(assistantId, message, userId, enhancedContext);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to process chat message',
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        message: result.message,
        conversation: result.conversation,
        usage: result.usage,
        cost: result.cost,
      },
      message: 'Chat message processed successfully',
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = catchErrors(chat);
