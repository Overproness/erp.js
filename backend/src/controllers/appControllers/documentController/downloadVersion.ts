// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const Document = mongoose.model('AppDocument');
const DocumentVersion = mongoose.model('DocumentVersion');

const downloadVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    // First verify document exists and user has access
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

    // Special handling for version 0 (original document)
    if (versionNumber === '0') {
      // Build the file path to the original document
      const uploadDir = path.join(__dirname, '../../../uploads/documents');
      const filePath = path.join(uploadDir, document.filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Original file not found on server',
        });
      }

      // Get the correct file extension and MIME type
      const fileExtension =
        path.extname(document.fileName || document.filePath).substring(1) || document.fileType;
      let mimeType = mime.lookup(fileExtension) || `application/${fileExtension}`;

      // Ensure proper mime type
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
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"`
      );
      res.setHeader('Content-Type', mimeType);
      res.setHeader('X-Original-Filename', fileName);
      res.setHeader('X-File-Extension', fileExtension);
      res.setHeader('X-Version-Number', '0');

      // Stream file to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }

    // For other versions, find the requested version
    const version = await DocumentVersion.findOne({
      document: id,
      versionNumber: parseInt(versionNumber),
    }).exec();

    if (!version) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Version not found',
      });
    }

    // Build the file path
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    const filePath = path.join(uploadDir, version.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'File not found on server',
      });
    }

    // Get the correct file extension and MIME type
    const fileExtension =
      path.extname(version.fileName || version.filePath).substring(1) || version.fileType;
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
    let fileName = version.fileName || `document-${id}-v${versionNumber}`;
    if (!fileName.includes('.') && fileExtension) {
      fileName = `${fileName}.${fileExtension}`;
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Original-Filename', fileName);
    res.setHeader('X-File-Extension', fileExtension);
    res.setHeader('X-Version-Number', versionNumber);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download version error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

module.exports = downloadVersion;
