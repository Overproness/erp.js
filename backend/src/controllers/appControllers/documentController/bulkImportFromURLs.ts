// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('AppDocument');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const textExtractor = require('@/utils/textExtractor');

/**
 * Import documents from URLs in bulk
 */
const bulkImportFromURLs = async (req, res) => {
  try {
    const { urls, defaultDocumentType, defaultTags } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Please provide an array of URLs',
      });
    }

    // Limit to 20 URLs at a time
    if (urls.length > 20) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Maximum 20 URLs can be imported at once',
      });
    }

    // Permission check
    if (req.user && !req.user.permissions?.canCreateDocuments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create documents',
      });
    }

    const results = [];
    const errors = [];

    // Get owner and companyID
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

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    await fs.mkdir(uploadDir, { recursive: true });

    // Process each URL
    for (const urlItem of urls) {
      try {
        const url = typeof urlItem === 'string' ? urlItem : urlItem.url;
        const title = typeof urlItem === 'object' ? urlItem.title : null;
        const documentType =
          typeof urlItem === 'object' ? urlItem.documentType : defaultDocumentType;
        const tags = typeof urlItem === 'object' ? urlItem.tags : defaultTags;

        // Validate URL
        if (!url || !url.startsWith('http')) {
          errors.push({
            url: url,
            error: 'Invalid URL format',
          });
          continue;
        }

        // Download file from URL
        console.log(`Downloading from URL: ${url}`);
        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          maxContentLength: 50 * 1024 * 1024, // 50MB max
        });

        // Get filename from URL or Content-Disposition header
        let fileName = '';
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }

        if (!fileName) {
          // Extract from URL
          const urlPath = new URL(url).pathname;
          fileName = path.basename(urlPath) || `download-${Date.now()}`;
        }

        // Ensure filename has extension
        const fileExtension = path.extname(fileName) || '.bin';
        const baseFileName = path.basename(fileName, fileExtension);
        const uniqueFileName = `${Date.now()}-${baseFileName}${fileExtension}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        // Save file to disk
        await fs.writeFile(filePath, response.data);

        // Get file stats
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        // Extract text from document
        let extractedText = '';
        let textExtractionStatus = 'pending';
        let textExtractionError = null;
        let extractionMetadata = {};
        let spreadsheetData = null;

        try {
          const extractionResult = await textExtractor.extractText(filePath, fileExtension);
          if (extractionResult.success) {
            extractedText = textExtractor.truncateText(extractionResult.text, 100000);
            textExtractionStatus = 'completed';

            if (extractionResult.metadata) {
              extractionMetadata = extractionResult.metadata;
            }

            // Handle spreadsheet data
            if (
              extractionResult.metadata?.format === 'csv' ||
              extractionResult.metadata?.format === 'excel'
            ) {
              const spreadsheetService = require('@/services/spreadsheetService');
              const spreadsheetResult = await spreadsheetService.processSpreadsheet(
                filePath,
                fileExtension
              );
              if (spreadsheetResult.success) {
                spreadsheetData = {
                  data: spreadsheetResult.data.slice(0, 1000),
                  metadata: spreadsheetResult.metadata,
                  errors: spreadsheetResult.errors,
                  sheets: spreadsheetResult.sheets
                    ? Object.keys(spreadsheetResult.sheets)
                    : undefined,
                };
              }
            }
          } else {
            textExtractionStatus = 'failed';
            textExtractionError = extractionResult.error;
          }
        } catch (error) {
          textExtractionStatus = 'failed';
          textExtractionError = error.message;
        }

        // Process tags
        const processedTags = tags
          ? typeof tags === 'string'
            ? tags.split(',').map((tag) => tag.trim())
            : Array.isArray(tags)
            ? tags
            : []
          : [];

        // Create document
        const document = new Model({
          title: title || baseFileName,
          documentType: documentType || 'Imported',
          description: `Imported from ${url}`,
          tags: processedTags,
          fileName: fileName,
          fileType: fileExtension.substring(1),
          filePath: uniqueFileName,
          fileSize: fileSize,
          owner: owner,
          createdBy: createdBy,
          companyID: companyID,
          extractedText: extractedText,
          textExtractionStatus: textExtractionStatus,
          textExtractionError: textExtractionError,
          extractionMetadata: {
            ...extractionMetadata,
            importedFrom: url,
            importedAt: new Date(),
          },
          spreadsheetData: spreadsheetData,
        });

        const savedDocument = await document.save();

        results.push({
          success: true,
          url: url,
          documentId: savedDocument._id,
          title: savedDocument.title,
          fileName: fileName,
          fileSize: fileSize,
        });
      } catch (error) {
        console.error(`Failed to import from ${urlItem}:`, error);
        errors.push({
          url: typeof urlItem === 'string' ? urlItem : urlItem.url,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      result: {
        imported: results,
        failed: errors,
        totalRequested: urls.length,
        successCount: results.length,
        failedCount: errors.length,
      },
      message: `Successfully imported ${results.length} of ${urls.length} document(s)`,
    });
  } catch (error) {
    console.error('Bulk URL import error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = bulkImportFromURLs;
