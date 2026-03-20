// @ts-nocheck
const copilotService = require('../../../services/copilotService');
const { catchErrors } = require('../../../handlers/errorHandlers');
const { getCurrentUserId } = require('../../../utils/authUtils');

/**
 * Copilot chat endpoint
 * Handles base LLM chat with optional module-specific enhancements
 */
const chat = async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    const { assistantId = 'default' } = req.params;
    const userId = getCurrentUserId(req);

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Message is required',
      });
    }

    // Validate message length
    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Message is too long (max 4000 characters)',
      });
    }

    // Process chat
    const result = await copilotService.processChat(assistantId, message, userId, context);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: result.error || 'Failed to process chat message',
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        message: result.message,
        conversationId: result.conversationId,
        suggestions: result.suggestions || [],
        usage: result.usage,
        cost: result.cost,
        module: result.module,
      },
      message: 'Chat processed successfully',
    });
  } catch (error) {
    console.error('Copilot chat controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = catchErrors(chat);
