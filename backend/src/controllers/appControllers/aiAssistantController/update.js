const AiAssistant = require('../../../models/appModels/AiAssistant');
const { catchErrors } = require('../../../handlers/errorHandlers');

const update = async (req, res) => {
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
    const { body } = req;

    // Remove fields that shouldn't be updated
    delete body.owner;
    delete body.createdBy;
    delete body.created;

    const result = await AiAssistant.findOneAndUpdate(
      {
        _id: id,
        owner: owner,
        removed: false,
      },
      body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('knowledgeBase', 'name description domain');

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'AI Assistant not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'AI Assistant updated successfully',
    });
  } catch (error) {
    console.error('AI Assistant update error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to update AI Assistant',
      error: error.message,
    });
  }
};

module.exports = catchErrors(update);
