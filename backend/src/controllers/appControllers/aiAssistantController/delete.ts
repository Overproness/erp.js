// @ts-nocheck
const AiAssistant = require('../../../models/appModels/AiAssistant');
const AiConversation = require('../../../models/appModels/AiConversation');
const { catchErrors } = require('../../../handlers/errorHandlers');

const deleteAssistant = async (req, res) => {
  try {
    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { id } = req.params;

    // Soft delete the AI Assistant
    const result = await AiAssistant.findOneAndUpdate(
      {
        _id: id,
        owner: owner,
        removed: false,
      },
      {
        removed: true,
        updated: new Date(),
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'AI Assistant not found',
      });
    }

    // Also soft delete associated conversations
    await AiConversation.updateMany(
      {
        aiAssistant: id,
        owner: owner,
        removed: false,
      },
      {
        removed: true,
        updated: new Date(),
      }
    );

    return res.status(200).json({
      success: true,
      result,
      message: 'AI Assistant deleted successfully',
    });
  } catch (error) {
    console.error('AI Assistant delete error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to delete AI Assistant',
      error: error.message,
    });
  }
};

module.exports = catchErrors(deleteAssistant);
