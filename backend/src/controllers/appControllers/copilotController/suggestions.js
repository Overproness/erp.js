const copilotService = require('../../../services/copilotService');
const { catchErrors } = require('../../../handlers/errorHandlers');
const { getCurrentUserId } = require('../../../utils/authUtils');

/**
 * Get module-specific suggestions
 */
const suggestions = async (req, res) => {
  try {
    const { module, context = {} } = req.body;
    const userId = getCurrentUserId(req);

    if (!module) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Module name is required',
      });
    }

    const result = await copilotService.getModuleSuggestions(module, context, userId);

    return res.status(200).json({
      success: true,
      result: {
        suggestions: result.suggestions || [],
        module,
      },
      message: 'Suggestions retrieved successfully',
    });
  } catch (error) {
    console.error('Copilot suggestions controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = catchErrors(suggestions);
