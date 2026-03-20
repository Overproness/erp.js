// @ts-nocheck
const conversationHelper = require('../../../helpers/conversationHelper');
const { getCurrentUserId } = require('../../../utils/authUtils');

const getConversationMessages = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { conversationId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const conversation = await conversationHelper.getConversationHistory(
      conversationId,
      parseInt(limit)
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if the conversation belongs to the user
    if (conversation.conversation.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        messages: conversation.messages,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: conversation.totalMessages,
        },
      },
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch conversation messages',
    });
  }
};

module.exports = getConversationMessages;
