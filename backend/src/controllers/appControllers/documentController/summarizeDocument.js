const mongoose = require('mongoose');
const Model = mongoose.model('AppDocument');
const OpenAIHelper = require('@/helpers/openaiHelper');

/**
 * Generate AI summary for a document
 * Includes extracted text for comprehensive summarization
 */
const summarizeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // Allow forcing regeneration via query param

    const document = await Model.findOne({
      _id: id,
      removed: false,
    }).select(
      'title description documentType fileName fileType tags extractedText textExtractionStatus spreadsheetData extractionMetadata fileSize aiSummary aiAnalyzedAt'
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    // Check if summary already exists and we're not forcing regeneration
    if (!force && document.aiSummary && document.aiAnalyzedAt) {
      return res.status(200).json({
        success: true,
        result: {
          documentId: document._id,
          title: document.title,
          summary: document.aiSummary,
          analyzedAt: document.aiAnalyzedAt,
          extractionStatus: document.textExtractionStatus,
          hasExtractedText: !!document.extractedText,
          textLength: document.extractedText?.length || 0,
          fromCache: true,
        },
        message: 'Document summary retrieved from cache',
      });
    }

    // Check if text extraction is available
    if (document.textExtractionStatus === 'pending') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Document text extraction is still in progress. Please try again later.',
      });
    }

    if (document.textExtractionStatus === 'failed') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Document text extraction failed. Summary cannot be generated.',
      });
    }

    // Prepare document content for AI
    let documentContent = `Document Details:
- Title: ${document.title}
- Type: ${document.documentType}
- File: ${document.fileName}
- Format: ${document.fileType}
- Description: ${document.description || 'N/A'}
- Tags: ${document.tags?.join(', ') || 'None'}
- Size: ${(document.fileSize / 1024).toFixed(2)} KB

`;

    // Add extracted text if available
    if (document.extractedText && document.extractedText.trim().length > 0) {
      // Limit extracted text to first 10,000 characters to avoid token limits
      const textPreview = document.extractedText.substring(0, 10000);
      documentContent += `\nExtracted Content:\n${textPreview}`;

      if (document.extractedText.length > 10000) {
        documentContent += '\n\n[Content truncated for brevity...]';
      }
    }

    // Add spreadsheet metadata if available
    if (document.spreadsheetData && document.spreadsheetData.metadata) {
      const meta = document.spreadsheetData.metadata;
      documentContent += `\n\nSpreadsheet Information:
- Rows: ${meta.rowCount || 0}
- Columns: ${meta.columnCount || 0}
- Column Names: ${meta.columns?.join(', ') || 'N/A'}`;

      if (document.spreadsheetData.errors && document.spreadsheetData.errors.length > 0) {
        documentContent += `\n- Data Issues: ${document.spreadsheetData.errors.length} warnings/errors detected`;
      }
    }

    // Build AI prompt
    const prompt = `Analyze the following document and provide a comprehensive summary. Focus on:
1. Main purpose and content of the document
2. Key information or data points
3. Important details or highlights
4. Potential use cases or relevance

${documentContent}

Provide a clear, concise summary in 3-5 paragraphs. Be specific and factual based on the content provided.`;

    // Get user ID for OpenAI helper
    const userId = req.user ? req.user._id : req.companyOwner._id;

    // Create OpenAI helper
    const openaiHelper = await OpenAIHelper.createForUser(userId);

    if (!openaiHelper.hasApiKey()) {
      return res.status(400).json({
        success: false,
        result: null,
        message:
          'OpenAI API key not configured. Please add your API key in Settings > AI Settings.',
      });
    }

    // Call OpenAI API
    const aiResponse = await openaiHelper.chatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are a document analysis expert. Provide clear, concise summaries of documents based on their content and metadata.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'gpt-4',
      parameters: {
        temperature: 0.5,
        max_tokens: 1000,
      },
    });

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: aiResponse.error || 'Failed to generate summary',
      });
    }

    const summary = aiResponse.data.choices[0].message.content;

    // Save summary to document
    document.aiSummary = summary;
    document.aiAnalyzedAt = new Date();
    await document.save();

    return res.status(200).json({
      success: true,
      result: {
        documentId: document._id,
        title: document.title,
        summary: summary,
        analyzedAt: document.aiAnalyzedAt,
        extractionStatus: document.textExtractionStatus,
        hasExtractedText: !!document.extractedText,
        textLength: document.extractedText?.length || 0,
      },
      message: 'Document summary generated successfully',
    });
  } catch (error) {
    console.error('Document summarization error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

/**
 * Batch summarize multiple documents
 */
const summarizeDocuments = async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Please provide an array of document IDs',
      });
    }

    // Limit to 10 documents at a time (due to AI token limits)
    if (documentIds.length > 10) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Maximum 10 documents can be summarized at once',
      });
    }

    const results = [];
    const errors = [];

    // Get user ID for OpenAI helper
    const userId = req.user ? req.user._id : req.companyOwner._id;

    // Create OpenAI helper
    const openaiHelper = await OpenAIHelper.createForUser(userId);

    if (!openaiHelper.hasApiKey()) {
      return res.status(400).json({
        success: false,
        result: null,
        message:
          'OpenAI API key not configured. Please add your API key in Settings > AI Settings.',
      });
    }

    // Process each document
    for (const docId of documentIds) {
      try {
        const document = await Model.findOne({
          _id: docId,
          removed: false,
        }).select('title description documentType extractedText textExtractionStatus');

        if (!document) {
          errors.push({
            documentId: docId,
            error: 'Document not found',
          });
          continue;
        }

        if (document.textExtractionStatus !== 'completed' && !document.extractedText) {
          errors.push({
            documentId: docId,
            title: document.title,
            error: 'Text extraction not completed',
          });
          continue;
        }

        // Generate brief summary
        const textPreview =
          document.extractedText?.substring(0, 5000) || document.description || '';

        const prompt = `Provide a brief 2-3 sentence summary of this document:

Title: ${document.title}
Type: ${document.documentType}
Content: ${textPreview}`;

        const aiResponse = await openaiHelper.chatCompletion({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'gpt-4',
          parameters: {
            temperature: 0.5,
            max_tokens: 200,
          },
        });

        if (!aiResponse.success) {
          errors.push({
            documentId: docId,
            title: document.title,
            error: aiResponse.error || 'Failed to generate summary',
          });
          continue;
        }

        const summary = aiResponse.data.choices[0].message.content;

        document.aiSummary = summary;
        document.aiAnalyzedAt = new Date();
        await document.save();

        results.push({
          documentId: document._id,
          title: document.title,
          summary: summary,
        });
      } catch (error) {
        errors.push({
          documentId: docId,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      result: results,
      errors: errors,
      message: `Summarized ${results.length} document(s)`,
    });
  } catch (error) {
    console.error('Batch summarization error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = { summarizeDocument, summarizeDocuments };
