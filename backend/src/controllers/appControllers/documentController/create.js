const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Model = mongoose.model('AppDocument');

const create = async (req, res) => {
  try {
    // Permission check for create
    if (req.user && !req.user.permissions?.canCreateDocuments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create documents',
      });
    }

    // Check if file is uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No file uploaded',
      });
    }

    const uploadedFile = req.files.file;
    const { title, documentType, description, tags } = req.body;

    // Security: Scan file content for malicious patterns
    const fileContent = uploadedFile.data.toString('utf8', 0, Math.min(uploadedFile.size, 10000)); // Check first 10KB
    const maliciousPatterns = [
      /<\?php/i,
      /system\s*\(/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /shell_exec/i,
      /passthru/i,
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(fileContent)) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'File contains potentially malicious content and cannot be uploaded.',
        });
      }
    }

    // Validate required fields
    if (!title || !documentType) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Title and document type are required',
      });
    }

    // Process tags if they exist
    const processedTags = tags
      ? typeof tags === 'string'
        ? tags.split(',').map((tag) => tag.trim())
        : Array.isArray(tags)
        ? tags
        : []
      : [];

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(uploadedFile.name);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file to disk
    await uploadedFile.mv(filePath);

    // Get owner, createdBy, and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const createdBy = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    // Create database record
    const document = new Model({
      title,
      documentType,
      description,
      tags: processedTags,
      fileName: uploadedFile.name,
      fileType: fileExtension.substring(1),
      filePath: fileName,
      fileSize: uploadedFile.size,
      owner: owner,
      createdBy: createdBy,
      companyID: companyID,
      expiryDate: req.body.expiryDate,
    });

    const result = await document.save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Document create error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = create;
