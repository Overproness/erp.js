const UnifiedAIHelper = require('../../../helpers/unifiedAIHelper');

/**
 * Get available AI models
 * Returns list of available models based on configured API keys
 */
const getModelsController = async (req, res) => {
  try {
    const { userId } = req.admin;

    // Create AI helper for user
    const aiHelper = await UnifiedAIHelper.createForUser(userId);

    // Get available providers
    const availableProviders = aiHelper.getAvailableProviders();

    // Get all recommended models
    const allModels = UnifiedAIHelper.getRecommendedModels();

    // Filter models by available providers
    const availableModels = [];
    for (const provider of availableProviders) {
      if (allModels[provider]) {
        availableModels.push(
          ...allModels[provider].map((model) => ({
            ...model,
            provider,
          }))
        );
      }
    }

    return res.status(200).json({
      success: true,
      result: {
        availableProviders,
        models: availableModels,
        allModels, // Include all models for reference
      },
      message: 'Models retrieved successfully',
    });
  } catch (error) {
    console.error('Get models error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Failed to retrieve models',
    });
  }
};

module.exports = getModelsController;
