// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = mongoose.model('AppDocument');
const DocumentVersion = mongoose.model('DocumentVersion');

/**
 * Controller to handle document editing
 * Currently supports: PDF, TXT, CSV, JSON
 */
const editDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, editSummary } = req.body;

    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);
    const editedBy = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Document content is required',
      });
    }

    // First get the current document
    const currentDocument = await Document.findOne({
      _id: id,
      owner: owner,
      removed: false,
    }).exec();

    if (!currentDocument) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Check if file type is supported for editing
    const supportedTypes = ['pdf', 'txt', 'csv', 'json', 'md', 'html'];
    if (!supportedTypes.includes(currentDocument.fileType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'This file type is not supported for direct editing',
      });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Generate new file path
    const fileExtension = `.${currentDocument.fileType}`;
    const newFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const newFilePath = path.join(uploadDir, newFileName);

    // Write the edited content to the new file
    await fs.writeFile(newFilePath, content);

    // Get file stats for size
    const stats = await fs.stat(newFilePath);

    // Get the next version number
    const lastVersion = await DocumentVersion.findOne({ document: id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .exec();

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Create a version record from the current document state
    const versionData = {
      document: id,
      versionNumber: nextVersionNumber,
      title: currentDocument.title,
      content: content, // Add the provided content
      documentType: currentDocument.documentType,
      description: currentDocument.description,
      tags: currentDocument.tags,
      fileName: currentDocument.fileName,
      fileType: currentDocument.fileType,
      filePath: currentDocument.filePath,
      fileSize: currentDocument.fileSize,
      expiryDate: currentDocument.expiryDate,
      createdBy: editedBy,
      author: editedBy, // Add the required author field
      changeDescription: editSummary || 'Document content edited',
    };

    // Create the new version
    await new DocumentVersion(versionData).save();

    // Update document with new file info
    const updateData = {
      filePath: newFileName,
      fileSize: stats.size,
      updated: Date.now(),
      updatedBy: editedBy,
    };

    const result = await Document.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
      runValidators: true,
    }).exec();

    return res.status(200).json({
      success: true,
      result,
      message: 'Document edited successfully with version history',
    });
  } catch (error) {
    console.error('Edit document error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = editDocument;
