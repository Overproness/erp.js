const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const Document = mongoose.model('AppDocument');
const DocumentVersion = mongoose.model('DocumentVersion');

/**
 * Controller to handle document e-signing
 * Currently supports: PDF files only
 */
const eSignDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, position, page, reason } = req.body;

    if (!signature || !position || page === undefined) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Signature data, position, and page are required',
      });
    }

    // First get the current document
    const currentDocument = await Document.findOne({
      _id: id,
      owner: req.admin._id,
      removed: false,
    }).exec();

    if (!currentDocument) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Check if file is PDF
    if (currentDocument.fileType.toLowerCase() !== 'pdf') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'E-signing is only supported for PDF documents',
      });
    }

    // Build file paths
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    const currentFilePath = path.join(uploadDir, currentDocument.filePath);
    const newFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    const newFilePath = path.join(uploadDir, newFileName);

    // Load the PDF document
    const pdfBytes = await fs.readFile(currentFilePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the page
    const pages = pdfDoc.getPages();
    if (page >= pages.length) {
      return res.status(400).json({
        success: false,
        result: null,
        message: `Invalid page number. Document has ${pages.length} pages.`,
      });
    }

    const pdfPage = pages[page];

    // Convert base64 signature to Uint8Array if it's an image
    // Note: There are different ways to handle signatures:
    // 1. As text
    // 2. As images
    // 3. As digital certificates
    // This is a simplified implementation for demonstration

    // For text-based signature
    const { width, height } = pdfPage.getSize();
    pdfPage.drawText(`Signed by: ${signature}`, {
      x: position.x * width,
      y: position.y * height,
      size: 12,
    });

    if (reason) {
      pdfPage.drawText(`Reason: ${reason}`, {
        x: position.x * width,
        y: position.y * height - 15, // Below the signature
        size: 8,
      });
    }

    pdfPage.drawText(`Date: ${new Date().toLocaleString()}`, {
      x: position.x * width,
      y: position.y * height - 30, // Below the reason
      size: 8,
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile(newFilePath, modifiedPdfBytes);

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
      documentType: currentDocument.documentType,
      description: currentDocument.description,
      tags: currentDocument.tags,
      fileName: currentDocument.fileName,
      fileType: currentDocument.fileType,
      filePath: currentDocument.filePath,
      fileSize: currentDocument.fileSize,
      expiryDate: currentDocument.expiryDate,
      createdBy: req.admin._id,
      changeDescription: reason || 'Document electronically signed',
    };

    // Create the new version
    await new DocumentVersion(versionData).save();

    // Update document with new file info
    const updateData = {
      filePath: newFileName,
      fileSize: stats.size,
      updated: Date.now(),
      updatedBy: req.admin._id,
      tags: [...new Set([...(currentDocument.tags || []), 'signed'])], // Add 'signed' tag if not present
    };

    const result = await Document.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
      runValidators: true,
    }).exec();

    return res.status(200).json({
      success: true,
      result,
      message: 'Document signed successfully with version history',
    });
  } catch (error) {
    console.error('E-sign document error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = eSignDocument;
