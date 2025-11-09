const AiAssistant = require('../../../models/appModels/AiAssistant');
const { catchErrors } = require('../../../handlers/errorHandlers');

const read = async (req, res) => {
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

    const result = await AiAssistant.findOne({
      _id: id,
      owner: owner,
      removed: false,
    }).populate('knowledgeBase', 'name description domain');

    if (!result) {
      res.set('Cache-Control', 'no-store');
      return res.status(404).json({
        success: false,
        result: null,
        message: 'AI Assistant not found',
      });
    }

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      success: true,
      result,
      message: 'AI Assistant retrieved successfully',
    });
  } catch (error) {
    console.error('AI Assistant read error:', error);
    res.set('Cache-Control', 'no-store');

    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve AI Assistant',
      error: error.message,
    });
  }
};

module.exports = catchErrors(read);
