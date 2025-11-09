const conversationHelper = require('../../../helpers/conversationHelper');
const { getCurrentUserId } = require('../../../utils/authUtils');

const deleteConversation = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { conversationId } = req.params;

    const result = await conversationHelper.deleteConversation(conversationId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      result: { id: conversationId, deleted: true },
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete conversation',
    });
  }
};

module.exports = deleteConversation;
