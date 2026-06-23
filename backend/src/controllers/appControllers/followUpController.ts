// @ts-nocheck

import { catchErrors } from '../../handlers/errorHandlers';
import { getCurrentUserId } from '../../utils/authUtils';
import followUpService from '../../services/followUpService';
import CustomerFollowUp from '../../models/appModels/CustomerFollowUp';
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
    const {
      status,
      type,
      limit: requestedLimit,
      skip: requestedSkip,
      page: requestedPage,
      customerId,
      sortBy,
      sortValue,
    } = req.query;

    const parsedLimit = Number.parseInt(requestedLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
    const parsedPage = Number.parseInt(requestedPage, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const parsedSkip = Number.parseInt(requestedSkip, 10);
    const skip = Number.isFinite(parsedSkip) && parsedSkip >= 0 ? parsedSkip : (page - 1) * limit;

    const query = { owner: userId, removed: false };

    if (status) query.status = status;
    if (type) query.type = type;
    if (customerId) query.customer = customerId;

    const sortableFields = new Set(['scheduledDate', 'created', 'updated', 'status', 'priority', 'type']);
    const sortField = sortableFields.has(sortBy) ? sortBy : 'created';
    const sortDirection = ['asc', 'ascend', '1'].includes(String(sortValue).toLowerCase()) ? 1 : -1;

    const followUps = await CustomerFollowUp.find(query)
      .sort({ [sortField]: sortDirection })
      .limit(limit)
      .skip(skip)
      .populate('customer', 'name email company')
      .lean();

    const total = await CustomerFollowUp.countDocuments(query);

    return res.status(200).json({
      success: true,
      result: followUps,
      pagination: {
        // ListResponse requires these fields and the GraphQL API accepts page/limit.
        page: Math.floor(skip / limit) + 1,
        count: followUps.length,
        pages: Math.ceil(total / limit),
        total,
        // Keep the REST pagination fields for existing callers.
        limit,
        skip,
        hasMore: total > skip + limit,
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

export = {
  createFollowUp: catchErrors(createFollowUp),
  listFollowUps: catchErrors(listFollowUps),
  getAnalytics: catchErrors(getAnalytics),
  trackResponse: catchErrors(trackResponse),
  cancelFollowUp: catchErrors(cancelFollowUp),
};
