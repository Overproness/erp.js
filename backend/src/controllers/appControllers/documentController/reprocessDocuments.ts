// @ts-nocheck
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const textExtractor = require('@/utils/textExtractor');
const Model = mongoose.model('AppDocument');

/**
 * Extract text from documents that don't have extracted text yet
 */
const reprocessDocuments = async (req, res) => {
  try {
    // Find documents without extracted text or with failed extraction
    const documents = await Model.find({
      $or: [
        { extractedText: { $exists: false } },
        { extractedText: '' },
        { textExtractionStatus: 'failed' },
        { textExtractionStatus: 'pending' },
      ],
      removed: false,
    }).limit(100); // Process 100 at a time to avoid overload

    if (documents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No documents need text extraction',
        processed: 0,
      });
    }

    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      notSupported: 0,
    };

    for (const doc of documents) {
      try {
        const filePath = path.join(uploadDir, doc.filePath);

        // Check if file exists
        try {
          await fs.access(filePath);
        } catch (error) {
          console.log(`File not found: ${doc.filePath}`);
          doc.textExtractionStatus = 'failed';
          doc.textExtractionError = 'File not found on server';
          await doc.save();
          results.failed++;
          continue;
        }

        // Extract text
        const extractionResult = await textExtractor.extractText(filePath, doc.fileType);

        if (extractionResult.success) {
          doc.extractedText = textExtractor.truncateText(extractionResult.text, 100000);
          doc.textExtractionStatus = 'completed';
          doc.textExtractionError = null;
          results.successful++;
        } else {
          doc.textExtractionStatus = extractionResult.error?.includes('not installed')
            ? 'not_supported'
            : 'failed';
          doc.textExtractionError = extractionResult.error;

          if (doc.textExtractionStatus === 'not_supported') {
            results.notSupported++;
          } else {
            results.failed++;
          }
        }

        await doc.save();
        results.processed++;
      } catch (error) {
        console.error(`Error processing document ${doc._id}:`, error);
        results.failed++;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Text extraction completed',
      results,
    });
  } catch (error) {
    console.error('Reprocess documents error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = reprocessDocuments;
