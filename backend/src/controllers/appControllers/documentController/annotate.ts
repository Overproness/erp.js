// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const Model = mongoose.model('AppDocument');
const DocumentVersion = mongoose.model('DocumentVersion');

/**
 * Controller to handle PDF annotations
 */
const annotateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { annotations = [], editSummary = 'Added annotations' } = req.body;

    if (!annotations || !Array.isArray(annotations)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Valid annotations array is required',
      });
    }

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    const userId = req.user?._id || req.companyOwner?._id;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    // Find the document
    const document = await Model.findOne({
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

    // Verify it's a PDF
    if (document.fileType.toLowerCase() !== 'pdf') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Annotations are only supported for PDF documents',
      });
    }

    // Save annotations to the document
    document.annotations = annotations;
    document.updated = new Date();
    document.updatedBy = userId;

    // Get the current version number
    const lastVersion = await DocumentVersion.findOne({ document: id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .exec();

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Create a version record
    const versionData = {
      document: id,
      versionNumber: nextVersionNumber,
      title: document.title,
      content: JSON.stringify(annotations), // Store annotations as content
      documentType: document.documentType,
      description: document.description,
      tags: document.tags,
      fileName: document.fileName,
      fileType: document.fileType,
      filePath: document.filePath,
      fileSize: document.fileSize,
      expiryDate: document.expiryDate,
      annotations: annotations,
      createdBy: userId,
      author: userId, // Required field
      changeDescription: editSummary || 'Added annotations to document',
    };

    await new DocumentVersion(versionData).save();
    await document.save();

    return res.status(200).json({
      success: true,
      result: document,
      message: 'Annotations saved successfully',
    });
  } catch (error) {
    console.error('Error annotating document:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'An error occurred while annotating the document',
      error: error,
    });
  }
};

module.exports = annotateDocument;
