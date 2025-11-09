const mongoose = require('mongoose');
const Document = mongoose.model('AppDocument');
const DocumentVersion = mongoose.model('DocumentVersion');

/**
 * Reverts a document to its original version (version 0)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const revertToOriginal = async (req, res) => {
  try {
    // Get owner and user from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);
    const updatedBy = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { id } = req.params;

    // Find the current document
    const document = await Document.findOne({
      _id: id,
      owner: owner,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    // Look for versions to determine if changes exist
    const versions = await DocumentVersion.find({ document: id }).countDocuments();

    // If no versions exist, the document is already at original state
    if (versions === 0) {
      return res.status(200).json({
        success: true,
        result: document,
        message: 'Document is already at original version',
      });
    }

    // Get the first version to find out the original document ID
    // We're not directly using version 0 as we're treating the original document itself as version 0
    const firstVersion = await DocumentVersion.findOne({ document: id })
      .sort({ versionNumber: 1 })
      .limit(1)
      .exec();

    if (!firstVersion) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Could not determine original document state',
      });
    }

    // Create a new version from current state before reverting
    const lastVersion = await DocumentVersion.findOne({ document: id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .exec();

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Create a version record from the current document state
    const currentVersionData = {
      document: id,
      versionNumber: nextVersionNumber,
      title: document.title,
      content: 'Current document state before revert', // Required field
      documentType: document.documentType,
      description: document.description,
      tags: document.tags,
      fileName: document.fileName,
      fileType: document.fileType,
      filePath: document.filePath,
      fileSize: document.fileSize,
      expiryDate: document.expiryDate,
      createdBy: updatedBy,
      author: updatedBy, // Required field
      changeDescription: 'State before reverting to original document',
    };

    // Save current state as a version
    await new DocumentVersion(currentVersionData).save();

    // For original version, we need to look at the document creation data
    // We assume the original document metadata is still available in the Document model
    const updateData = {
      // Keep only basic document properties from when it was created
      title: document.title, // Typically we don't change the title when reverting
      documentType: document.documentType,
      description: document.description,
      tags: document.tags,
      fileName: document.fileName,
      fileType: document.fileType,
      filePath: document.originalFilePath || document.filePath, // Try to use original path if stored
      fileSize: document.originalFileSize || document.fileSize,
      expiryDate: document.expiryDate,
      updated: Date.now(),
      updatedBy: updatedBy,
    };

    // Update document with original data
    const result = await Document.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
      runValidators: true,
    }).exec();

    return res.status(200).json({
      success: true,
      result,
      message: 'Document reverted to original version',
    });
  } catch (error) {
    console.error('Error in revertToOriginal:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = revertToOriginal;
