const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Model = mongoose.model('AppDocument');

// Import DocumentVersion model to ensure it's registered
require('../../../models/appModels/DocumentVersion');
const DocumentVersion = mongoose.model('DocumentVersion');

const update = async (req, res) => {
  try {
    // Permission check for update
    if (req.user && !req.user.permissions?.canUpdateDocuments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to update documents',
      });
    }

    // Get owner, updatedBy, and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const updatedBy = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { id } = req.params;

    // First get the current document and check ownership
    const currentDocument = await Model.findOne({
      _id: id,
      removed: false,
    }).exec();

    if (!currentDocument) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    // Check document company ownership
    if (currentDocument.companyID !== companyID) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    // Check for version conflict (concurrent editing)
    if (
      req.body.version &&
      currentDocument.version &&
      req.body.version !== currentDocument.version
    ) {
      return res.status(409).json({
        success: false,
        result: null,
        message:
          'Document version conflict detected. The document has been modified by another user.',
        currentVersion: currentDocument.version,
      });
    }

    // Check permissions for document modification (simplified for owner-based access)
    const canEdit =
      currentDocument.owner.toString() === owner.toString() ||
      currentDocument.createdBy.toString() === updatedBy.toString() ||
      currentDocument.collaborators?.some(
        (collab) =>
          collab.user.toString() === updatedBy.toString() &&
          (collab.permissions.includes('edit') || collab.permissions.includes('write'))
      ) ||
      (req.admin && (req.admin.role === 'admin' || req.admin.role === 'manager'));

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to edit this document',
      });
    }

    // Prepare update data
    const updateData = {
      title: req.body.title,
      documentType: req.body.documentType,
      description: req.body.description,
      tags: req.body.tags,
      expiryDate: req.body.expiryDate,
      updated: Date.now(),
      updatedBy: updatedBy,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // If a new file is uploaded
    let newFilePath = null;
    if (req.files && req.files.file) {
      const uploadedFile = req.files.file;

      // Generate unique filename
      const fileExtension = path.extname(uploadedFile.name);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(__dirname, '../../../uploads/documents');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);

      // Save file to disk
      await uploadedFile.mv(filePath);

      // Update document data with new file info
      updateData.fileName = uploadedFile.name;
      updateData.fileType = fileExtension.substring(1);
      updateData.filePath = fileName;
      updateData.fileSize = uploadedFile.size;

      newFilePath = fileName;
    }

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
      documentType: currentDocument.documentType,
      description: currentDocument.description,
      tags: currentDocument.tags,
      fileName: currentDocument.fileName,
      fileType: currentDocument.fileType,
      filePath: currentDocument.filePath,
      fileSize: currentDocument.fileSize,
      expiryDate: currentDocument.expiryDate,
      createdBy: updatedBy,
      author: updatedBy, // Required field
      content: req.body.content || req.body.versionNote || 'Document updated', // Required field
      changeDescription: req.body.changeDescription || req.body.versionNote || 'Document updated',
    };

    // Create the new version
    await new DocumentVersion(versionData).save();

    // Add to document's version history array
    if (!currentDocument.versionHistory) {
      currentDocument.versionHistory = [];
    }

    currentDocument.versionHistory.push({
      version: nextVersionNumber,
      modifiedBy: updatedBy,
      modifiedAt: new Date(),
      changes: {
        content: req.body.content || 'Updated document content',
        description: req.body.versionNote || req.body.changeDescription || 'Document updated',
      },
    });

    // Update the document with new version history and increment version
    updateData.versionHistory = currentDocument.versionHistory;
    updateData.version = (currentDocument.version || 1) + 1;

    // Update the original document
    const result = await Model.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
      runValidators: true,
    }).exec();

    return res.status(200).json({
      success: true,
      result,
      message: 'Document updated successfully with version history',
    });
  } catch (error) {
    console.error('DocumentController update error:', error);
    console.error('DocumentController update error stack:', error.stack);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = update;
