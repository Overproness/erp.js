const followUpService = require('../../services/followUpService');
const { catchErrors } = require('../../handlers/errorHandlers');
const { getCurrentUserId } = require('../../utils/authUtils');

/**
 * Create a customer follow-up
 */
const createFollowUp = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { customerId, type, reason, scheduledDate, subject, message, priority } = req.body;

    if (!customerId || !reason) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Customer ID and reason are required',
      });
    }

    const result = await followUpService.createFollowUp(userId, customerId, {
      type,
      reason,
      scheduledDate,
      subject,
      message,
      priority,
      isAutomated: false,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to create follow-up',
        error: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      result: result.followUp,
      message: 'Follow-up created successfully',
    });
  } catch (error) {
    console.error('Create follow-up controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get follow-up analytics
 */
const getAnalytics = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { timeframe = 30 } = req.query;

    const result = await followUpService.getAnalytics(userId, parseInt(timeframe));

    return res.status(200).json({
      success: true,
      result: result.analytics || [],
      message: 'Follow-up analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Get follow-up analytics error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Track customer response to follow-up
 */
const trackResponse = async (req, res) => {
  try {
    const { followUpId } = req.params;
    const { text, sentiment } = req.body;

    const result = await followUpService.trackResponse(followUpId, {
      text,
      sentiment,
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        result: null,
        message: result.error || 'Follow-up not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: result.followUp,
      message: 'Response tracked successfully',
    });
  } catch (error) {
    console.error('Track response error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Cancel a follow-up
 */
const cancelFollowUp = async (req, res) => {
  try {
    const { followUpId } = req.params;

    const result = await followUpService.cancelFollowUp(followUpId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        result: null,
        message: result.error || 'Follow-up not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: result.followUp,
      message: 'Follow-up cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel follow-up error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * List follow-ups for current user
 */
const listFollowUps = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { status, type, limit = 50, skip = 0, customerId } = req.query;

    const CustomerFollowUp = require('../../models/appModels/CustomerFollowUp');

    const query = { owner: userId };

    if (status) query.status = status;
    if (type) query.type = type;
    if (customerId) query.customer = customerId;

    const followUps = await CustomerFollowUp.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('customer', 'name email company')
      .lean();

    const total = await CustomerFollowUp.countDocuments(query);

    return res.status(200).json({
      success: true,
      result: followUps,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit),
      },
      message: 'Follow-ups retrieved successfully',
    });
  } catch (error) {
    console.error('List follow-ups error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  createFollowUp: catchErrors(createFollowUp),
  listFollowUps: catchErrors(listFollowUps),
  getAnalytics: catchErrors(getAnalytics),
  trackResponse: catchErrors(trackResponse),
  cancelFollowUp: catchErrors(cancelFollowUp),
};
