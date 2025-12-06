const mongoose = require('mongoose');
const Model = mongoose.model('AppDocument');
const OpenAIHelper = require('@/helpers/openaiHelper');

/**
 * Get AI-powered tag suggestions for documents
 * Analyzes document metadata (not extracted text to save tokens)
 */
const suggestTags = async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Please provide an array of document IDs',
      });
    }

    // Limit to 50 documents at a time
    if (documentIds.length > 50) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Maximum 50 documents can be processed at once',
      });
    }

    // Fetch documents
    const documents = await Model.find({
      _id: { $in: documentIds },
      removed: false,
    }).select(
      '_id title description documentType fileName fileType tags fileSize extractionMetadata'
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No documents found',
      });
    }

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

    // Prepare document data for AI (without extracted text)
    const documentSummaries = documents.map((doc) => ({
      id: doc._id,
      title: doc.title,
      description: doc.description,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileType: doc.fileType,
      currentTags: doc.tags || [],
      fileSize: doc.fileSize,
      metadata: doc.extractionMetadata,
    }));

    // Build AI prompt
    const prompt = `Analyze the following documents and suggest relevant tags for each. Consider the document type, title, description, and file type. Provide 3-7 relevant tags per document.

Documents:
${JSON.stringify(documentSummaries, null, 2)}

Return your response as a JSON array with this format:
[
  {
    "documentId": "document_id_here",
    "suggestedTags": ["tag1", "tag2", "tag3"],
    "reasoning": "Brief explanation of why these tags were suggested"
  }
]

Tags should be:
- Descriptive and specific
- Lowercase
- Single words or short phrases (2-3 words max)
- Related to content, purpose, or category
- Not duplicating existing tags unless highly relevant`;

    // Call OpenAI API
    const aiResponse = await openaiHelper.chatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are a document categorization expert. Analyze documents and suggest relevant, descriptive tags.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'gpt-4',
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: aiResponse.error || 'Failed to generate AI suggestions',
      });
    }

    // Parse AI response
    let suggestions = [];
    try {
      const responseText = aiResponse.data.choices[0].message.content;
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to parse AI suggestions',
        error: parseError.message,
      });
    }

    // Update documents with suggested tags
    const updates = [];
    for (const suggestion of suggestions) {
      if (suggestion.documentId && suggestion.suggestedTags) {
        const doc = documents.find((d) => d._id.toString() === suggestion.documentId);
        if (doc) {
          doc.aiSuggestedTags = suggestion.suggestedTags;
          doc.aiAnalyzedAt = new Date();
          await doc.save();

          updates.push({
            documentId: suggestion.documentId,
            title: doc.title,
            currentTags: doc.tags,
            suggestedTags: suggestion.suggestedTags,
            reasoning: suggestion.reasoning,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      result: updates,
      message: `Generated tag suggestions for ${updates.length} document(s)`,
    });
  } catch (error) {
    console.error('Tag suggestion error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

/**
 * Apply AI-suggested tags to a document
 */
const applySuggestedTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, merge } = req.body; // merge: if true, add to existing tags; if false, replace

    const document = await Model.findOne({
      _id: id,
      removed: false,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    // Permission check
    if (req.user && !req.user.permissions?.canEditDocuments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to edit documents',
      });
    }

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Please provide an array of tags',
      });
    }

    // Update tags
    if (merge) {
      // Merge with existing tags, removing duplicates
      const existingTags = document.tags || [];
      const allTags = [...existingTags, ...tags];
      document.tags = [...new Set(allTags.map((t) => t.toLowerCase()))];
    } else {
      // Replace tags
      document.tags = tags.map((t) => t.toLowerCase());
    }

    document.updated = new Date();
    document.updatedBy = req.user ? req.user._id : null;

    await document.save();

    return res.status(200).json({
      success: true,
      result: document,
      message: 'Tags applied successfully',
    });
  } catch (error) {
    console.error('Apply tags error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = { suggestTags, applySuggestedTags };
