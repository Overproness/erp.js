// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Model = mongoose.model('AppDocument');

const remove = async (req, res) => {
  try {
    // Get owner and user from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);
    const removedBy = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { id } = req.params;
    const { permanent } = req.query;

    // Find document first to get file path
    const document = await Model.findOne({
      _id: id,
      owner: owner,
      ...(permanent === 'true' ? {} : { removed: false }), // Allow finding already soft-deleted docs for permanent deletion
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    let result;
    let message;

    if (permanent === 'true') {
      // Permanent deletion - remove from database
      await Model.findOneAndDelete({ _id: id }).exec();

      // Delete the physical file
      const filePath = path.join(__dirname, '../../../uploads/documents', document.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      result = null; // Document no longer exists
      message = 'Document permanently deleted successfully';
    } else {
      // Soft delete the document
      result = await Model.findOneAndUpdate(
        { _id: id },
        {
          removed: true,
          removedBy: removedBy,
          removedAt: new Date(),
        },
        { new: true }
      ).exec();

      message = 'Document deleted successfully';
    }

    return res.status(200).json({
      success: true,
      result,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = remove;
