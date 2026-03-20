// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { createAuditLog } = require('./auditLog');

/**
 * Controller to handle document downloads
 */
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const Document = mongoose.model('AppDocument');

    // Find the document by ID
    const document = await Document.findOne({
      _id: id,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Build the file path
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    const filePath = path.join(uploadDir, document.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'File not found on server',
      });
    }

    // Create audit log entry for download
    await createAuditLog({
      documentId: id,
      action: 'downloaded',
      user: req.admin,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        fileName: document.fileName,
        fileSize: document.fileSize,
      },
    });

    // Get the correct file extension and MIME type
    const fileExtension =
      path.extname(document.fileName || document.filePath).substring(1) || document.fileType;
    let mimeType = mime.lookup(fileExtension) || `application/${fileExtension}`;

    // If mime type couldn't be determined, use a generic one based on the extension
    if (!mimeType || mimeType === 'application/octet-stream') {
      switch (fileExtension.toLowerCase()) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'doc':
        case 'docx':
          mimeType = 'application/msword';
          break;
        case 'xls':
        case 'xlsx':
          mimeType = 'application/vnd.ms-excel';
          break;
        case 'txt':
          mimeType = 'text/plain';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        default:
          mimeType = 'application/octet-stream';
      }
    }

    // Ensure the original filename has the correct extension
    let fileName = document.fileName || `document-${id}`;
    if (!fileName.includes('.') && fileExtension) {
      fileName = `${fileName}.${fileExtension}`;
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', mimeType);

    // Add extra headers to help frontend detect file type
    res.setHeader('X-Original-Filename', fileName);
    res.setHeader('X-File-Extension', fileExtension);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

module.exports = downloadDocument;
