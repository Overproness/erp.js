const conversationHelper = require('../../../helpers/conversationHelper');
const { getCurrentUserId } = require('../../../utils/authUtils');

const getConversation = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const conversation = await conversationHelper.getConversationHistory(conversationId);

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
      result: conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch conversation',
    });
  }
};

module.exports = getConversation;
