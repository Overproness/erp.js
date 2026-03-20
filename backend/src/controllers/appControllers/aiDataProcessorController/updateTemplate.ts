// @ts-nocheck
const AiExtractionTemplate = require('@/models/appModels/AiExtractionTemplate');

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate template ID
    if (!id) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Template ID is required',
      });
    }

    // Find and update template
    const template = await AiExtractionTemplate.findOneAndUpdate(
      {
        _id: id,
        owner: req.admin._id,
        removed: false,
      },
      {
        ...updateData,
        updated: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('owner', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Template not found or not accessible',
      });
    }

    return res.status(200).json({
      success: true,
      result: template,
      message: 'Template updated successfully',
    });

  } catch (error) {
    console.error('Update Template Error:', error);
    
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to update template',
      error: error.message,
    });
  }
};

module.exports = updateTemplate;
