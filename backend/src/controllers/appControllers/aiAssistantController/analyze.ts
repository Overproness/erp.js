// @ts-nocheck
const aiService = require('../../../services/aiService');
const { catchErrors } = require('../../../handlers/errorHandlers');

const analyze = async (req, res) => {
  try {
    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { assistantId } = req.params;
    const { content, type = 'general', context = {} } = req.body;
    const userId = owner;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Content is required for analysis',
      });
    }

    let result;

    switch (type) {
      case 'document':
        result = await aiService.analyzeDocument(
          content,
          context.documentType || 'general',
          assistantId,
          userId
        );
        break;

      default:
        // General text analysis
        const messages = [
          {
            role: 'system',
            content:
              'You are an AI assistant that provides detailed analysis of business content. Provide insights, patterns, key information, and actionable recommendations.',
          },
          {
            role: 'user',
            content: `Please analyze the following content:\n\n${content}`,
          },
        ];

        result = await aiService.processChat(assistantId, content, userId, {
          module: 'analysis',
          type,
          ...context,
        });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to analyze content',
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        analysis: result.analysis || result.message,
        type,
        usage: result.usage,
        cost: result.cost,
      },
      message: 'Content analyzed successfully',
    });
  } catch (error) {
    console.error('Analysis controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = catchErrors(analyze);
