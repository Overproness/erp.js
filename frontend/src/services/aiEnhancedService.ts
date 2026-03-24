import apolloClient from '@/graphql/client';
import { AI_PREDICT, AI_SUGGEST, AI_QUEUE_MESSAGE, AI_QUEUE_STATUS, AI_QUEUE_STATISTICS, AI_RECORD_FEEDBACK, AI_LEARNING_STATS } from '@/graphql/operations/ai';

/**
 * Enhanced AI Services for Queue, Follow-ups, Automation, and Learning
 */

/**
 * Queue a message for offline/async processing
 */
export const queueChatMessage = async (message, context = {}, priority = 'normal') => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: AI_QUEUE_MESSAGE,
      variables: { input: { message, context, priority } },
    });
    return data.aiEnhancedQueueMessage;
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
    const { data } = await apolloClient.query({
      query: AI_QUEUE_STATUS,
      variables: { id: queueId },
    });
    return data.aiEnhancedQueueStatus;
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
    const { data } = await apolloClient.query({
      query: AI_QUEUE_STATISTICS,
    });
    return data.aiEnhancedQueueStatistics;
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
    const { data } = await apolloClient.mutate({
      mutation: AI_RECORD_FEEDBACK,
      variables: { input: { learningId, ...feedbackData } },
    });
    return data.aiEnhancedRecordFeedback;
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
    const { data: result } = await apolloClient.mutate({
      mutation: AI_SUGGEST,
      variables: { input: { type: 'enhanced_context', module, data } },
    });
    return result.aiSuggest;
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
    const { data } = await apolloClient.query({
      query: AI_LEARNING_STATS,
    });
    return data.aiEnhancedLearningStats;
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
    const { data } = await apolloClient.mutate({
      mutation: AI_SUGGEST,
      variables: { input: { type: 'automation', limit } },
    });
    return data.aiSuggest;
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
    const { data } = await apolloClient.mutate({
      mutation: AI_SUGGEST,
      variables: { input: { type: 'implement_suggestion', suggestionId, ...options } },
    });
    return data.aiSuggest;
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
    const { data } = await apolloClient.mutate({
      mutation: AI_PREDICT,
      variables: { input: { type: 'customer_behavior', clientId } },
    });
    return data.aiPredict;
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
    const { data } = await apolloClient.query({
      query: AI_LEARNING_STATS,
    });
    return data.aiEnhancedLearningStats;
  } catch (error) {
    console.error('Get learning statistics error:', error);
    return { success: false, error: error.message };
  }
};
