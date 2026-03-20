// @ts-nocheck
const AiExtractionTemplate = require('@/models/appModels/AiExtractionTemplate');

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate template ID
    if (!id) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Template ID is required',
      });
    }

    // Soft delete template
    const template = await AiExtractionTemplate.findOneAndUpdate(
      {
        _id: id,
        owner: req.admin._id,
        removed: false,
      },
      {
        removed: true,
        updated: new Date(),
      },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Template not found or not accessible',
      });
    }

    return res.status(200).json({
      success: true,
      result: { id },
      message: 'Template deleted successfully',
    });

  } catch (error) {
    console.error('Delete Template Error:', error);
    
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to delete template',
      error: error.message,
    });
  }
};

module.exports = deleteTemplate;
