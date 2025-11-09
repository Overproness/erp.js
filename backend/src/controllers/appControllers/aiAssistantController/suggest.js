const aiService = require('../../../services/aiService');
const contextAwareService = require('../../../services/contextAwareService');
const { catchErrors } = require('../../../handlers/errorHandlers');

const suggest = async (req, res) => {
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
    const { module, data = {}, type = 'optimization' } = req.body;
    const userId = owner;

    if (!module) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Module is required for suggestions',
      });
    }

    const result = await aiService.generateSuggestions(module, data, assistantId, userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to generate suggestions',
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        suggestions: result.suggestions,
        module,
        type,
        usage: result.usage,
        cost: result.cost,
      },
      message: 'Suggestions generated successfully',
    });
  } catch (error) {
    console.error('Suggestions controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = catchErrors(suggest);
