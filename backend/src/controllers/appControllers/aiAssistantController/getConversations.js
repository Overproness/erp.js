const conversationHelper = require('../../../helpers/conversationHelper');
const { getCurrentUserId } = require('../../../utils/authUtils');

const getConversations = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { assistantId } = req.params;
    const { limit = 50, page = 1, status = 'active' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const conversations = await conversationHelper.searchConversations(userId, '', {
      assistantId,
      status,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      result: conversations,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: conversations.length,
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch conversations',
    });
  }
};

module.exports = getConversations;
