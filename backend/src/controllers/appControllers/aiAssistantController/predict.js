const aiService = require('../../../services/aiService');
const contextAwareService = require('../../../services/contextAwareService');
const { catchErrors } = require('../../../handlers/errorHandlers');

const predict = async (req, res) => {
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
    const { module, timeframe = '30_days', metrics = [] } = req.body;
    const userId = owner;

    if (!module) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Module is required for predictions',
      });
    }

    // Build historical context for predictions
    const context = await contextAwareService.buildContext(module, {}, userId);

    const predictionPrompt = this.buildPredictionPrompt(module, timeframe, metrics, context);

    const result = await aiService.processChat(assistantId, predictionPrompt, userId, {
      module: 'prediction',
      targetModule: module,
      timeframe,
      metrics,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to generate predictions',
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        predictions: result.message,
        module,
        timeframe,
        metrics,
        usage: result.usage,
        cost: result.cost,
      },
      message: 'Predictions generated successfully',
    });
  } catch (error) {
    console.error('Predictions controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Helper method to build prediction prompts
function buildPredictionPrompt(module, timeframe, metrics, context) {
  let prompt = `Based on the historical data for the ${module} module, provide predictions for the next ${timeframe}.`;

  if (metrics.length > 0) {
    prompt += ` Focus on these specific metrics: ${metrics.join(', ')}.`;
  }

  prompt += `\n\nHistorical context:\n${JSON.stringify(context, null, 2)}`;

  prompt += `\n\nPlease provide:
1. Predicted trends
2. Key factors influencing the predictions
3. Confidence levels
4. Potential risks or opportunities
5. Actionable recommendations`;

  return prompt;
}

module.exports = catchErrors(predict);
