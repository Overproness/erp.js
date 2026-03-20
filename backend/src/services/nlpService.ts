// @ts-nocheck
const nlpUtils = require('../utils/nlpUtils');

const nlpService = {
  // Analyze text content
  async analyzeText(text) {
    try {
      const keywords = nlpUtils.extractKeywords(text, 10);
      const sentiment = nlpUtils.analyzeSentiment(text);
      const entities = nlpUtils.extractEntities(text);
      const summary = nlpUtils.summarizeText(text, 3);
      const cleanedText = nlpUtils.cleanText(text);

      return {
        keywords,
        sentiment,
        entities,
        summary,
        cleanedText,
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        confidence: 0.85, // Base confidence for NLP analysis
      };
    } catch (error) {
      console.error('NLP Service analyzeText error:', error);
      return {
        keywords: [],
        sentiment: { score: 0, label: 'neutral' },
        entities: {},
        summary: text.substring(0, 200) + '...',
        cleanedText: text,
        wordCount: 0,
        characterCount: text.length,
        confidence: 0.5,
      };
    }
  },

  // Extract business-specific entities
  async extractBusinessEntities(text) {
    try {
      const entities = nlpUtils.extractEntities(text);
      
      // Enhanced business entity extraction
      const businessEntities = {
        ...entities,
        invoiceNumbers: text.match(/(?:invoice|inv)[#\s]*(\d+)/gi) || [],
        quoteNumbers: text.match(/(?:quote|quotation)[#\s]*(\d+)/gi) || [],
        clientNames: this.extractClientNames(text),
        amounts: text.match(/\$[\d,]+\.?\d*/g) || [],
        dates: entities.dates,
        contacts: entities.emails.concat(entities.phones),
      };

      return businessEntities;
    } catch (error) {
      console.error('Extract business entities error:', error);
      return {};
    }
  },

  // Classify document intent
  async classifyIntent(text) {
    try {
      const lowercaseText = text.toLowerCase();
      
      const intents = {
        inquiry: ['question', 'ask', 'how', 'what', 'why', 'when', 'where'],
        complaint: ['problem', 'issue', 'error', 'wrong', 'mistake', 'complaint'],
        request: ['please', 'need', 'want', 'require', 'request'],
        information: ['status', 'update', 'report', 'summary', 'details'],
        action: ['create', 'update', 'delete', 'modify', 'change', 'send'],
      };

      let highestScore = 0;
      let detectedIntent = 'general';

      for (const [intent, keywords] of Object.entries(intents)) {
        const score = keywords.reduce((count, keyword) => {
          return count + (lowercaseText.includes(keyword) ? 1 : 0);
        }, 0);

        if (score > highestScore) {
          highestScore = score;
          detectedIntent = intent;
        }
      }

      return {
        intent: detectedIntent,
        confidence: Math.min(highestScore / 3, 1), // Normalize confidence
        keywords: intents[detectedIntent],
      };
    } catch (error) {
      console.error('Classify intent error:', error);
      return { intent: 'general', confidence: 0.5, keywords: [] };
    }
  },

  // Extract potential client names (simple heuristic)
  extractClientNames(text) {
    try {
      // Look for capitalized words that might be names
      const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
      const matches = text.match(namePattern) || [];
      
      // Filter out common words that aren't names
      const commonWords = ['The', 'This', 'That', 'Please', 'Thank', 'Dear', 'Best', 'Regards'];
      return matches.filter(match => !commonWords.includes(match));
    } catch (error) {
      console.error('Extract client names error:', error);
      return [];
    }
  },

  // Calculate text similarity
  async calculateSimilarity(text1, text2) {
    try {
      return nlpUtils.calculateSimilarity(text1, text2);
    } catch (error) {
      console.error('Calculate similarity error:', error);
      return 0;
    }
  },
};

module.exports = nlpService;
