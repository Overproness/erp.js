const mongoose = require('mongoose');
const automationSuggestionEngine = require('../../services/automationSuggestionEngine');
const enhancedContextService = require('../../services/enhancedContextService');
const selfLearningService = require('../../services/selfLearningService');
const { catchErrors } = require('../../handlers/errorHandlers');
const { getCurrentUserId } = require('../../utils/authUtils');

/**
 * Get automation suggestions
 */
const getSuggestions = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { limit = 10 } = req.query;

    const result = await automationSuggestionEngine.generateSuggestions(userId, {
      limit: parseInt(limit),
    });

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
        totalSuggestions: result.totalSuggestions,
      },
      message: 'Automation suggestions generated successfully',
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Implement an automation suggestion
 */
const implementSuggestion = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { suggestionId } = req.params;
    const { options = {} } = req.body;

    const result = await automationSuggestionEngine.implementSuggestion(
      userId,
      suggestionId,
      options
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to implement suggestion',
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      result: result.suggestion,
      message: result.message,
    });
  } catch (error) {
    console.error('Implement suggestion error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get suggestion analytics
 */
const getSuggestionAnalytics = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    const result = await automationSuggestionEngine.getSuggestionAnalytics(userId);

    return res.status(200).json({
      success: true,
      result: result.analytics || {},
      message: 'Suggestion analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Get suggestion analytics error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get enhanced context with recommendations
 */
const getEnhancedContext = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { module = 'general', data = {} } = req.body;

    const result = await enhancedContextService.getEnhancedContext(module, data, userId);

    return res.status(200).json({
      success: true,
      result,
      message: 'Enhanced context retrieved successfully',
    });
  } catch (error) {
    console.error('Get enhanced context error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get learned insights
 */
const getLearnedInsights = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { module = 'general' } = req.query;

    const result = await selfLearningService.getLearnedInsights(userId, module);

    return res.status(200).json({
      success: true,
      result: result.insights || [],
      message: 'Learned insights retrieved successfully',
    });
  } catch (error) {
    console.error('Get learned insights error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Record AI interaction feedback
 */
const recordFeedback = async (req, res) => {
  try {
    const { learningId } = req.params;
    const { rating, wasHelpful, wasAccurate, wasImplemented, comment, outcome } = req.body;

    const result = await selfLearningService.recordFeedback(learningId, {
      rating,
      wasHelpful,
      wasAccurate,
      wasImplemented,
      comment,
      outcome,
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        result: null,
        message: result.error || 'Learning entry not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: null,
      message: result.message,
    });
  } catch (error) {
    console.error('Record feedback error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get learning statistics
 */
const getLearningStats = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    const result = await selfLearningService.getLearningStats(userId);

    return res.status(200).json({
      success: true,
      result: result.stats || {},
      message: 'Learning statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get learning stats error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Predict customer behavior
 */
const predictCustomerBehavior = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { clientId } = req.params;

    const result = await enhancedContextService.predictCustomerBehavior(clientId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Customer not found or insufficient data',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Customer behavior prediction generated successfully',
    });
  } catch (error) {
    console.error('Predict customer behavior error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get learning interactions history
 */
const getLearningInteractions = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { limit = 20, skip = 0 } = req.query;

    const AILearningData = mongoose.model('AILearningData');

    const interactions = await AILearningData.find({ owner: userId })
      .sort({ created: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await AILearningData.countDocuments({ owner: userId });

    return res.status(200).json({
      success: true,
      result: interactions,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit),
      },
      message: 'Learning interactions retrieved successfully',
    });
  } catch (error) {
    console.error('Get learning interactions error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  getSuggestions: catchErrors(getSuggestions),
  implementSuggestion: catchErrors(implementSuggestion),
  getSuggestionAnalytics: catchErrors(getSuggestionAnalytics),
  getEnhancedContext: catchErrors(getEnhancedContext),
  getLearnedInsights: catchErrors(getLearnedInsights),
  recordFeedback: catchErrors(recordFeedback),
  getLearningStats: catchErrors(getLearningStats),
  getLearningInteractions: catchErrors(getLearningInteractions),
  predictCustomerBehavior: catchErrors(predictCustomerBehavior),
};
