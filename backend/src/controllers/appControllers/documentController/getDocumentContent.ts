// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = mongoose.model('AppDocument');

/**
 * Controller to retrieve document content for editing
 * Currently supports: TXT, CSV, JSON, Markdown, and HTML files directly
 * PDF files are returned as base64 for frontend rendering
 */
const getDocumentContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    // Find the document
    const document = await Document.findOne({
      _id: id,
      companyID: companyID,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Check if file type is supported for editing
    const textTypes = ['txt', 'csv', 'json', 'md', 'html'];
    const binaryTypes = ['pdf'];
    const supportedTypes = [...textTypes, ...binaryTypes];

    if (!supportedTypes.includes(document.fileType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        result: null,
        message: `This file type (${document.fileType}) is not supported for direct editing`,
      });
    }

    // Build the file path
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    const filePath = path.join(uploadDir, document.filePath);
    console.log('🚀 ~ getDocumentContent ~ filePath:', filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'File not found on server',
      });
    }

    let content;
    let contentType;

    // Read file content based on type
    if (textTypes.includes(document.fileType.toLowerCase())) {
      // For text files, read as UTF-8
      content = await fs.readFile(filePath, 'utf8');
      contentType = 'text';
    } else {
      // For binary files like PDF, read as base64
      const buffer = await fs.readFile(filePath);
      content = buffer.toString('base64');
      contentType = 'base64';
    }

    return res.status(200).json({
      success: true,
      result: {
        document,
        content,
        contentType,
      },
      message: 'Document content retrieved successfully',
    });
  } catch (error) {
    console.error('Get document content error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = getDocumentContent;
