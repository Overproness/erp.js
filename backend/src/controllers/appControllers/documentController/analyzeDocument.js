const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { extractTextFromPdf } = require('@/utils/pdfUtils');
const { extractTextFromDocx } = require('@/utils/docxUtils');
const { analyzeDocument: nlpAnalyzeDocument } = require('@/utils/nlpUtils');

// Function to extract text from files based on their type
const extractTextFromFile = async (filePath, fileType) => {
  try {
    // First check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist at path: ${filePath}`);
      return null;
    }

    if (fileType === 'pdf') {
      return await extractTextFromPdf(filePath);
    } else if (fileType === 'docx' || fileType === 'doc') {
      return await extractTextFromDocx(filePath);
    } else if (
      fileType === 'txt' ||
      fileType === 'csv' ||
      fileType === 'md' ||
      fileType === 'json' ||
      fileType === 'html'
    ) {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      return null; // Can't extract text from this file type
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileType} file:`, error);
    return null;
  }
};

const analyzeDocumentController = async (req, res) => {
  try {
    // Get document ID from request
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid document ID',
      });
    }

    // Get the document from database
    const Document = mongoose.model('Document'); // Changed from 'AppDocument' to 'Document'
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Get file path - more robust path resolution
    let filePath;
    if (document.fileUrl && document.fileUrl.startsWith('http')) {
      // This is a remote file, we can't analyze it directly
      return res.status(400).json({
        success: false,
        message: 'Remote files cannot be analyzed directly',
      });
    } else {
      // Try different possible file path structures
      const possiblePaths = [
        document.filePath,
        document.fileName,
        `${document._id}/${document.fileName}`,
        `${document._id}_${document.fileName}`,
      ].filter(Boolean);

      let fileExists = false;

      for (const pathFragment of possiblePaths) {
        const testPath = path.join(__dirname, '../../../../', 'uploads', 'documents', pathFragment);
        console.log(`Testing path: ${testPath}`);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          fileExists = true;
          break;
        }
      }

      if (!fileExists) {
        return res.status(404).json({
          success: false,
          message: 'Document file not found on server',
          debug: {
            possiblePaths,
            documentInfo: {
              id: document._id,
              fileName: document.fileName,
              filePath: document.filePath,
            },
          },
        });
      }
    }

    // Determine file type
    const fileType = (document.fileType || document.fileName?.split('.').pop() || '').toLowerCase();

    // Extract text from file
    const text = await extractTextFromFile(filePath, fileType);

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from this file type or file is empty',
      });
    }

    // Get the analysis method used (for informational purposes)
    const useOpenAI = process.env.USE_OPENAI_FOR_DOCUMENT_ANALYSIS === 'true';
    const analysisMethod = useOpenAI ? 'OpenAI' : 'In-house NLP';

    // Analyze the document text using our NLP utility
    // This will automatically choose between OpenAI and in-house based on environment settings
    const analysis = await nlpAnalyzeDocument(text);

    // Return the analysis results
    return res.status(200).json({
      success: true,
      result: {
        ...analysis,
        analysisMethod: analysisMethod, // Include which method was used
      },
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    return res.status(500).json({
      success: false,
      message: 'Error analyzing document',
      error: error.message,
    });
  }
};

module.exports = analyzeDocumentController;
