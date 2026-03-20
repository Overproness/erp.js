// @ts-nocheck
const axios = require('axios');
const nlpUtils = {
  // Extract keywords from text
  extractKeywords: (text, limit = 10) => {
    if (!text || typeof text !== 'string') return [];
    
    // Simple keyword extraction (can be enhanced with proper NLP libraries)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !nlpUtils.stopWords.includes(word));
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  },

  // Sentiment analysis (simple implementation)
  analyzeSentiment: (text) => {
    if (!text || typeof text !== 'string') return { score: 0, label: 'neutral' };
    
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'frustrated', 'angry', 'annoyed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    const normalizedScore = Math.max(-1, Math.min(1, score / words.length * 10));
    
    let label = 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    if (normalizedScore < -0.1) label = 'negative';
    
    return { score: normalizedScore, label };
  },

  // Extract entities (simple implementation)
  extractEntities: (text) => {
    if (!text || typeof text !== 'string') return {};
    
    const entities = {
      emails: text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
      phones: text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [],
      dates: text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g) || [],
      numbers: text.match(/\b\d+\.?\d*\b/g) || [],
      currencies: text.match(/[$€£¥]\s?\d+\.?\d*/g) || [],
    };
    
    return entities;
  },

  // Clean and normalize text
  cleanText: (text) => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
      .trim();
  },

  // Summarize text (simple implementation)
  summarizeText: (text, maxSentences = 3) => {
    if (!text || typeof text !== 'string') return '';
    
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    
    if (sentences.length <= maxSentences) return text;
    
    // Simple approach: take first, middle, and last sentences
    const indices = [
      0,
      Math.floor(sentences.length / 2),
      sentences.length - 1
    ].slice(0, maxSentences);
    
    return indices
      .map(i => sentences[i])
      .join('. ') + '.';
  },

  // Calculate text similarity (simple implementation)
  calculateSimilarity: (text1, text2) => {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  },

  // Format tags for consistency
  formatSuggestedTags: (tags) => {
    if (!Array.isArray(tags)) return [];
    
    return tags
      .map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : String(tag).trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .slice(0, 20); // Limit to 20 tags
  },

  // Common English stop words
  stopWords: [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself',
    'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'
  ],
};

const documentTypes = {
  invoice: ['invoice', 'receipt', 'payment', 'bill', 'amount', 'paid', 'due', 'tax', 'total'],
  contract: ['contract', 'agreement', 'terms', 'parties', 'signed', 'clause', 'legal', 'binding'],
  report: ['report', 'analysis', 'summary', 'findings', 'conclusion', 'data', 'results'],
  financial: [
    'financial',
    'balance',
    'statement',
    'assets',
    'liabilities',
    'equity',
    'profit',
    'loss',
  ],
  legal: ['legal', 'law', 'statute', 'regulation', 'compliance', 'judicial', 'court'],
  technical: [
    'technical',
    'specification',
    'requirement',
    'system',
    'software',
    'hardware',
    'architecture',
  ],
  medical: [
    'medical',
    'patient',
    'diagnosis',
    'treatment',
    'healthcare',
    'doctor',
    'hospital',
    'clinic',
  ],
  resume: ['resume', 'cv', 'curriculum', 'vitae', 'experience', 'education', 'skills'],
  letter: ['letter', 'dear', 'sincerely', 'regards', 'greeting'],
  other: [],
};

const analyzeDocumentInHouse = (text) => {
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();

  // Document type detection based on keywords
  const documentTypes = {
    Invoice: ['invoice', 'payment', 'amount due', 'total due', 'bill', 'receipt', 'tax invoice'],
    Contract: [
      'agreement',
      'contract',
      'terms',
      'parties',
      'signed',
      'hereby agree',
      'obligations',
    ],
    Report: ['report', 'analysis', 'findings', 'conclusion', 'summary', 'results', 'study'],
    Legal: ['legal', 'law', 'court', 'jurisdiction', 'plaintiff', 'defendant', 'attorney'],
    Financial: ['financial', 'balance sheet', 'income statement', 'cash flow', 'profit', 'loss'],
    Certificate: ['certificate', 'certify', 'awarded', 'achievement', 'completion'],
    Receipt: ['receipt', 'received', 'payment', 'paid', 'purchase'],
    Letter: ['dear', 'sincerely', 'regards', 'letter'],
    Email: ['email', 'subject', 'forwarded', 'sent', 'from:', 'to:'],
    Memo: ['memo', 'memorandum', 'internal', 'office'],
  };

  // Determine document type based on keyword frequency
  let documentType = 'Other';
  let highestScore = 0;

  for (const [type, keywords] of Object.entries(documentTypes)) {
    const score = keywords.reduce((count, keyword) => {
      // Count occurrences of each keyword
      const regex = new RegExp(keyword, 'gi');
      const matches = lowerText.match(regex) || [];
      return count + matches.length;
    }, 0);

    if (score > highestScore) {
      highestScore = score;
      documentType = type;
    }
  }

  // Tag generation based on content
  const tags = [];

  // Common business-related tags
  const tagCategories = {
    Urgent: ['urgent', 'immediately', 'asap', 'priority', 'deadline'],
    Confidential: ['confidential', 'private', 'sensitive', 'not for distribution'],
    Draft: ['draft', 'preliminary', 'not final', 'for review'],
    Final: ['final', 'approved', 'official', 'authorized'],
    Important: ['important', 'critical', 'essential', 'significant'],
    Financial: ['payment', 'invoice', 'money', 'dollars', 'amount', 'tax', 'finance'],
    HR: ['employee', 'staff', 'personnel', 'hiring', 'onboarding', 'hr'],
    Sales: ['sales', 'customer', 'prospect', 'lead', 'opportunity'],
    Legal: ['legal', 'compliance', 'regulatory', 'law', 'regulation'],
    Technical: ['technical', 'specification', 'requirement', 'engineering'],
  };

  // Add relevant tags based on keyword presence
  for (const [tag, keywords] of Object.entries(tagCategories)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        tags.push(tag);
        break; // Only add the tag once
      }
    }
  }

  // Ensure we have reasonable number of tags (2-5)
  const uniqueTags = [...new Set(tags)].slice(0, 5);

  // Generate a simple summary - extract first few sentences (up to 500 chars)
  let summary = text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500);

  if (summary.length === 500) {
    // If we truncated, try to end at a sentence boundary
    const lastPeriod = summary.lastIndexOf('.');
    if (lastPeriod > 400) {
      // Only truncate if we have a reasonable sentence
      summary = summary.substring(0, lastPeriod + 1);
    }
  }

  return {
    documentType,
    tags: uniqueTags,
    summary: summary || 'No text content available for summarization.',
  };
};

/**
 * Document analysis using OpenAI's API
 * @param {string} text - The text content to analyze
 * @returns {Promise<object>} Analysis result with documentType, tags, and summary
 */
const analyzeDocumentWithOpenAI = async (text) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Prepare a sample of the document (first 4000 chars to stay within token limits)
    const textSample = text.substring(0, 4000);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a document analysis assistant that categorizes documents and extracts key information.',
          },
          {
            role: 'user',
            content: `Analyze the following document content and provide the following in JSON format:
            1. Document type (one of: Invoice, Contract, Report, Legal, Financial, Certificate, Receipt, Letter, Email, Memo, or Other)
            2. 2-5 relevant tags based on the content
            3. A brief summary (max 3 sentences)
            
            Return ONLY valid JSON in this exact format (no other text):
            {
              "documentType": "the document type",
              "tags": ["tag1", "tag2", "tag3"],
              "summary": "A brief summary of the document content."
            }
            
            Document content:
            ${textSample}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract and parse the JSON response
    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response from OpenAI API');
    }

    // Find and extract JSON from the response (in case there's any extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract valid JSON from OpenAI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (!result.documentType || !Array.isArray(result.tags) || !result.summary) {
      throw new Error('OpenAI response missing required fields');
    }

    return result;
  } catch (error) {
    console.error('Error analyzing document with OpenAI:', error);
    // Fall back to in-house analysis if OpenAI fails
    return analyzeDocumentInHouse(text);
  }
};

/**
 * Analyze document content using the configured method (in-house or OpenAI)
 * @param {string} text - The text content to analyze
 * @returns {Promise<object>} Analysis result with documentType, tags, and summary
 */
const analyzeDocument = async (text) => {
  // Check if OpenAI integration is enabled via environment variable
  const useOpenAI = process.env.USE_OPENAI_FOR_DOCUMENT_ANALYSIS === 'true';

  if (useOpenAI) {
    try {
      return await analyzeDocumentWithOpenAI(text);
    } catch (error) {
      console.error('OpenAI analysis failed, falling back to in-house:', error);
      return analyzeDocumentInHouse(text);
    }
  } else {
    // Use in-house analysis
    return analyzeDocumentInHouse(text);
  }
};

/**
 * Simple NLP utilities for document analysis
 * This is a basic implementation that could be enhanced with more sophisticated NLP techniques
 */

// Document type classification based on keyword matching
const documentTypeClassifier = {
  invoice: ['invoice', 'receipt', 'payment', 'bill', 'amount', 'paid', 'due', 'tax', 'total'],
  contract: ['contract', 'agreement', 'terms', 'parties', 'signed', 'clause', 'legal', 'binding'],
  report: ['report', 'analysis', 'summary', 'findings', 'conclusion', 'data', 'results'],
  financial: [
    'financial',
    'balance',
    'statement',
    'assets',
    'liabilities',
    'equity',
    'profit',
    'loss',
  ],
  legal: ['legal', 'law', 'statute', 'regulation', 'compliance', 'judicial', 'court'],
  technical: [
    'technical',
    'specification',
    'requirement',
    'system',
    'software',
    'hardware',
    'architecture',
  ],
  medical: [
    'medical',
    'patient',
    'diagnosis',
    'treatment',
    'healthcare',
    'doctor',
    'hospital',
    'clinic',
  ],
  resume: ['resume', 'cv', 'curriculum', 'vitae', 'experience', 'education', 'skills'],
  letter: ['letter', 'dear', 'sincerely', 'regards', 'greeting'],
  other: [],
};

// Common keywords that might be relevant as document tags
const commonTagKeywords = [
  'urgent',
  'confidential',
  'draft',
  'final',
  'approved',
  'rejected',
  'pending',
  'review',
  'important',
  'completed',
  'archived',
  'active',
  'internal',
  'external',
  'public',
  'private',
  'sensitive',
  'classified',
  'unclassified',
  'restricted',
];

/**
 * Determine the most likely document type based on text content
 * @param {string} text - The document text content
 * @returns {string} - The document type
 */
const classifyDocumentType = (text) => {
  if (!text || typeof text !== 'string') return 'Other';

  const lowercaseText = text.toLowerCase();

  // Calculate scores for each document type based on keyword matches
  const scores = Object.entries(documentTypes).map(([type, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      // Count occurrences of each keyword
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      const matches = lowercaseText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    return { type, score };
  });

  // Sort by score in descending order
  scores.sort((a, b) => b.score - a.score);

  // Return the type with the highest score, or 'Other' if all scores are 0
  return scores[0].score > 0
    ? scores[0].type.charAt(0).toUpperCase() + scores[0].type.slice(1)
    : 'Other';
};

/**
 * Extract potential tags from document content
 * @param {string} text - The document text content
 * @returns {string[]} - List of potential tags
 */
const extractTags = (text) => {
  if (!text || typeof text !== 'string') return [];

  const lowercaseText = text.toLowerCase();
  const tags = [];

  // Check for common tag keywords
  commonTagKeywords.forEach((tag) => {
    if (lowercaseText.includes(tag.toLowerCase())) {
      tags.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    }
  });

  // Add the document type as a tag
  const docType = classifyDocumentType(text);
  if (docType !== 'Other' && !tags.includes(docType)) {
    tags.push(docType);
  }

  // Limit to 5 tags maximum
  return tags.slice(0, 5);
};

/**
 * Generate a brief summary of document content
 * @param {string} text - The document text content
 * @returns {string} - Brief summary
 */
const generateSummary = (text) => {
  if (!text || typeof text !== 'string') return 'No content available';

  // Simple summarization: first 100-200 characters or first few sentences
  let summary = '';

  // Get the first 3 sentences
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0)
    .slice(0, 3);
  summary = sentences.join('. ');

  // If summary is too long, truncate it
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + '...';
  }

  return summary || 'No readable content found in document';
};

/**
 * Main function to analyze document text
 * @param {string} text - The document text content
 * @returns {Object} - Analysis results
 */
const analyzeDocumentContent = async (text) => {
  // If using OpenAI is enabled, call that service instead
  if (process.env.USE_OPENAI_FOR_DOCUMENT_ANALYSIS === 'true' && process.env.OPENAI_API_KEY) {
    try {
      return await analyzeWithOpenAI(text);
    } catch (error) {
      console.error('OpenAI analysis failed, falling back to local NLP:', error);
      // Fall back to local analysis on error
    }
  }

  // Use our simple NLP implementation
  const documentType = classifyDocumentType(text);
  const tags = extractTags(text);
  const summary = generateSummary(text);

  return {
    documentType,
    tags,
    summary,
  };
};

/**
 * Analyze document with OpenAI (if configured)
 * Note: This is a stub function - implement OpenAI integration if needed
 */
const analyzeWithOpenAI = async (text) => {
  // This would be implemented to call OpenAI API
  // For now, just return a simple response
  return {
    documentType: 'Report',
    tags: ['Analysis', 'Data', 'Summary'],
    summary: 'This is a placeholder for OpenAI analysis.',
  };
};

module.exports = {
  analyzeDocument,
  analyzeDocumentInHouse,
  analyzeDocumentWithOpenAI,
  classifyDocumentType, // Changed from determineDocumentType to match the actual function name
  extractTags,
  generateSummary,
  analyzeDocumentContent,
  ...nlpUtils, // Spread nlpUtils methods into the module exports
};
