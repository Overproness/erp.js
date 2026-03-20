// @ts-nocheck
const quoteDeliveryService = require('@/services/quoteDeliveryService');

/**
 * Send quote to customer via email/SMS
 * POST /api/quote/:id/send
 */
const sendQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      channels = ['email'],
      attachPdf = true,
      customMessage = null,
      quoteUrl = null,
    } = req.body;

    const result = await quoteDeliveryService.sendQuote(id, {
      channels,
      attachPdf,
      customMessage,
      quoteUrl,
      sentBy: req.user?.id || req.user?._id,
    });

    return res.status(200).json({
      success: true,
      result,
      message: result.allChannelsSuccessful
        ? 'Quote sent successfully via all channels'
        : 'Quote sent with some delivery issues',
    });
  } catch (error) {
    console.error('Error sending quote:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to send quote',
    });
  }
};

/**
 * Resend quote to customer
 * POST /api/quote/:id/resend
 */
const resendQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { channels = ['email'], attachPdf = true, quoteUrl = null } = req.body;

    const result = await quoteDeliveryService.resendQuote(id, {
      channels,
      attachPdf,
      quoteUrl,
      sentBy: req.user?.id || req.user?._id,
    });

    return res.status(200).json({
      success: true,
      result,
      message: 'Quote resent successfully',
    });
  } catch (error) {
    console.error('Error resending quote:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to resend quote',
    });
  }
};

/**
 * Send quote reminder to customer
 * POST /api/quote/:id/reminder
 */
const sendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { channels = ['email'], quoteUrl = null } = req.body;

    const result = await quoteDeliveryService.sendReminder(id, {
      channels,
      quoteUrl,
      sentBy: req.user?.id || req.user?._id,
    });

    return res.status(200).json({
      success: true,
      result,
      message: 'Quote reminder sent successfully',
    });
  } catch (error) {
    console.error('Error sending quote reminder:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to send quote reminder',
    });
  }
};

/**
 * Get quote delivery history
 * GET /api/quote/:id/delivery-history
 */
const getDeliveryHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await quoteDeliveryService.getDeliveryHistory(id);

    return res.status(200).json({
      success: true,
      result,
      message: 'Delivery history retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting delivery history:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get delivery history',
    });
  }
};

/**
 * Check quote delivery status
 * GET /api/quote/:id/delivery-status
 */
const checkDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await quoteDeliveryService.checkDeliveryStatus(id);

    return res.status(200).json({
      success: true,
      result,
      message: 'Delivery status retrieved successfully',
    });
  } catch (error) {
    console.error('Error checking delivery status:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to check delivery status',
    });
  }
};

/**
 * Send bulk quotes
 * POST /api/quote/send-bulk
 */
const sendBulkQuotes = async (req, res) => {
  try {
    const { quoteIds = [], channels = ['email'], attachPdf = true } = req.body;

    if (!Array.isArray(quoteIds) || quoteIds.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Quote IDs array is required',
      });
    }

    const result = await quoteDeliveryService.sendBulkQuotes(quoteIds, {
      channels,
      attachPdf,
      sentBy: req.user?.id || req.user?._id,
    });

    return res.status(200).json({
      success: true,
      result,
      message: `Processed ${result.totalProcessed} quotes: ${result.successfulDeliveries} successful, ${result.failedDeliveries} failed`,
    });
  } catch (error) {
    console.error('Error sending bulk quotes:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to send bulk quotes',
    });
  }
};

// Legacy mail function for backwards compatibility
const mail = async (req, res) => {
  return res.status(200).json({
    success: true,
    result: null,
    message: 'Please use /api/quote/:id/send endpoint for sending quotes',
  });
};

module.exports = {
  mail,
  sendQuote,
  resendQuote,
  sendReminder,
  getDeliveryHistory,
  checkDeliveryStatus,
  sendBulkQuotes,
};
