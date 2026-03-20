// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Document = mongoose.model('AppDocument');
const DocumentVersion = mongoose.model('DocumentVersion');

/**
 * Creates a new version of a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createVersion = async (req, res) => {
  try {
    // Get owner and user from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);
    const createdBy = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { id } = req.params;
    const { changes } = req.body;

    // Check if file is uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No file uploaded for new version',
      });
    }

    const uploadedFile = req.files.file;

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
        message: 'Document not found or you do not have permission',
      });
    }

    // Get the next version number
    const lastVersion = await DocumentVersion.findOne({ document: id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .exec();

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename for the new version
    const fileExtension = path.extname(uploadedFile.name);
    const fileName = `${document.fileName.replace(
      path.extname(document.fileName),
      ''
    )}_v${nextVersionNumber}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Move uploaded file to destination
    await uploadedFile.mv(filePath);

    // Get file stats
    const stats = fs.statSync(filePath);

    // Create the new version record
    const versionData = {
      document: id,
      versionNumber: nextVersionNumber,
      title: document.title,
      content: 'File content for version ' + nextVersionNumber, // Add required content field
      documentType: document.documentType,
      description: document.description,
      tags: document.tags,
      fileName: fileName,
      fileType: uploadedFile.mimetype,
      filePath: fileName, // Store relative path
      fileSize: stats.size,
      expiryDate: document.expiryDate,
      createdBy: createdBy,
      author: createdBy, // Add required author field
      changeDescription: changes || 'New version created',
    };

    const newVersion = await new DocumentVersion(versionData).save();

    return res.status(200).json({
      success: true,
      result: newVersion,
      message: 'Document version created successfully',
    });
  } catch (error) {
    console.error('Error creating document version:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = createVersion;
