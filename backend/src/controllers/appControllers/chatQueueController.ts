// @ts-nocheck
const chatQueueService = require('../../services/chatQueueService');
const { catchErrors } = require('../../handlers/errorHandlers');
const { getCurrentUserId } = require('../../utils/authUtils');

/**
 * Queue a message for offline/async processing
 */
const queueMessage = async (req, res) => {
  try {
    const { message, context = {}, priority = 'normal' } = req.body;
    const userId = getCurrentUserId(req);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Message is required',
      });
    }

    const result = await chatQueueService.queueMessage(userId, message, context, priority);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to queue message',
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        queueId: result.queueId,
        estimatedWaitTime: result.estimatedWaitTime,
      },
      message: 'Message queued successfully',
    });
  } catch (error) {
    console.error('Queue message controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get queue status for a message
 */
const getQueueStatus = async (req, res) => {
  try {
    const { queueId } = req.params;

    const result = await chatQueueService.getQueueStatus(queueId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        result: null,
        message: result.error || 'Queue item not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        status: result.status,
        response: result.response,
        error: result.error,
        estimatedWaitTime: result.estimatedWaitTime,
      },
      message: 'Queue status retrieved successfully',
    });
  } catch (error) {
    console.error('Get queue status error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get queue statistics
 */
const getQueueStatistics = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    const result = await chatQueueService.getStatistics(userId);

    return res.status(200).json({
      success: true,
      result: result.stats || {},
      message: 'Queue statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get queue statistics error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  queueMessage: catchErrors(queueMessage),
  getQueueStatus: catchErrors(getQueueStatus),
  getQueueStatistics: catchErrors(getQueueStatistics),
};
