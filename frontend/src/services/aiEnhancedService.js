import { request } from '../request';

/**
 * Enhanced AI Services for Queue, Follow-ups, Automation, and Learning
 */

/**
 * Queue a message for offline/async processing
 */
export const queueChatMessage = async (message, context = {}, priority = 'normal') => {
  try {
    const response = await request.post({
      entity: 'ai-enhanced/chat-queue',
      jsonData: {
        message,
        context,
        priority,
      },
    });
    return response;
  } catch (error) {
    console.error('Queue message error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get queue status for a message
 */
export const getQueueStatus = async (queueId) => {
  try {
    const response = await request.get({
      entity: `ai-enhanced/chat-queue/${queueId}/status`,
    });
    return response;
  } catch (error) {
    console.error('Get queue status error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get queue statistics
 */
export const getQueueStatistics = async () => {
  try {
    const response = await request.get({
      entity: 'ai-enhanced/chat-queue/statistics',
    });
    return response;
  } catch (error) {
    console.error('Get queue statistics error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record feedback for an AI interaction
 */
export const recordAIFeedback = async (learningId, feedbackData) => {
  try {
    const response = await request.post({
      entity: `ai-enhanced/learning/${learningId}/feedback`,
      jsonData: feedbackData,
    });
    return response;
  } catch (error) {
    console.error('Record feedback error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enhanced context with recommendations
 */
export const getEnhancedContext = async (module, data) => {
  try {
    const response = await request.post({
      entity: 'ai-enhanced/context/enhanced',
      jsonData: { module, data },
    });
    return response;
  } catch (error) {
    console.error('Get enhanced context error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get learned insights
 */
export const getLearnedInsights = async (module = 'general') => {
  try {
    const response = await request.get({
      entity: 'ai-enhanced/insights/learned',
      options: { module },
    });
    return response;
  } catch (error) {
    console.error('Get learned insights error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get automation suggestions
 */
export const getAutomationSuggestions = async (limit = 10) => {
  try {
    const response = await request.get({
      entity: 'ai-enhanced/automation/suggestions',
      options: { limit },
    });
    return response;
  } catch (error) {
    console.error('Get suggestions error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Implement an automation suggestion
 */
export const implementSuggestion = async (suggestionId, options = {}) => {
  try {
    const response = await request.post({
      entity: `ai-enhanced/automation/suggestions/${suggestionId}/implement`,
      jsonData: options,
    });
    return response;
  } catch (error) {
    console.error('Implement suggestion error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Predict customer behavior
 */
export const predictCustomerBehavior = async (clientId) => {
  try {
    const response = await request.get({
      entity: `ai-enhanced/predict/customer/${clientId}`,
    });
    return response;
  } catch (error) {
    console.error('Predict customer behavior error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get AI learning statistics
 */
export const getLearningStatistics = async () => {
  try {
    const response = await request.get({
      entity: 'ai-enhanced/learning/statistics',
    });
    return response;
  } catch (error) {
    console.error('Get learning statistics error:', error);
    return { success: false, error: error.message };
  }
};
