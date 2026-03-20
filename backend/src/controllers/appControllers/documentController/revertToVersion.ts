// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Document = mongoose.model('AppDocument');
const DocumentVersion = mongoose.model('DocumentVersion');

/**
 * Reverts a document to a specific version
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const revertToVersion = async (req, res) => {
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

    const { id, versionNumber } = req.params;

    // Check for special case 'original' and redirect to revertToOriginal
    if (versionNumber === 'original') {
      return res.status(400).json({
        success: false,
        result: null,
        message:
          "Please use the specific 'revert/original' endpoint for reverting to the original version",
      });
    }

    // Parse versionNumber to ensure it's a number
    const version = parseInt(versionNumber, 10);
    if (isNaN(version) || version < 1) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid version number. Version number must be a positive integer.',
      });
    }

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

    // Find the version to revert to
    let versionData;

    // For regular versions
    versionData = await DocumentVersion.findOne({
      document: id,
      versionNumber: version,
    }).exec();

    if (!versionData) {
      return res.status(404).json({
        success: false,
        result: null,
        message: `Version ${version} not found for this document`,
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
      changeDescription: `State before reverting to version ${version}`,
    };

    // Save current state as a version
    await new DocumentVersion(currentVersionData).save();

    // Update the document with the version data
    const updateData = {
      title: versionData.title,
      documentType: versionData.documentType,
      description: versionData.description,
      tags: versionData.tags,
      fileName: versionData.fileName,
      fileType: versionData.fileType,
      filePath: versionData.filePath,
      fileSize: versionData.fileSize,
      expiryDate: versionData.expiryDate,
      updated: Date.now(),
      updatedBy: updatedBy,
    };

    // Update document with version data
    const result = await Document.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
      runValidators: true,
    }).exec();

    return res.status(200).json({
      success: true,
      result,
      message: `Document reverted to version ${version}`,
    });
  } catch (error) {
    console.error('Error in revertToVersion:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = revertToVersion;
