const conversationHelper = require('../../../helpers/conversationHelper');
const { getCurrentUserId } = require('../../../utils/authUtils');

const updateConversation = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { conversationId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    // Only allow certain fields to be updated
    const allowedFields = ['title', 'status', 'context'];
    const filteredData = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const conversation = await conversationHelper.updateConversation(
      conversationId,
      userId,
      filteredData
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      result: conversation,
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update conversation',
    });
  }
};

module.exports = updateConversation;
