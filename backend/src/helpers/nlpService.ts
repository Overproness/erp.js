// @ts-nocheck
const nlpUtils = require('../utils/nlpUtils');

class NlpService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async processText(text, options = {}) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input');
      }

      const cacheKey = this.generateCacheKey(text, options);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const result = {
        originalText: text,
        cleanedText: nlpUtils.cleanText(text),
        keywords: nlpUtils.extractKeywords(text, options.keywordLimit || 10),
        sentiment: nlpUtils.analyzeSentiment(text),
        entities: nlpUtils.extractEntities(text),
        summary: nlpUtils.summarizeText(text, options.summaryLength || 3),
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        readingTime: Math.ceil(text.split(/\s+/).length / 200), // Average reading speed
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('NLP processing error:', error);
      throw error;
    }
  }

  async extractBusinessEntities(text) {
    try {
      const entities = nlpUtils.extractEntities(text);
      
      // Enhanced business entity extraction
      const businessEntities = {
        ...entities,
        invoiceNumbers: text.match(/(?:invoice|inv)[\s#]*(\d+)/gi) || [],
        quoteNumbers: text.match(/(?:quote|quotation)[\s#]*(\d+)/gi) || [],
        clientNames: text.match(/(?:client|customer|company)[\s:]*([A-Za-z\s]{2,30})/gi) || [],
        amounts: text.match(/(?:amount|total|sum)[\s:]*\$?\d+\.?\d*/gi) || [],
        dueDate: text.match(/(?:due|deadline)[\s:]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi) || [],
      };

      return businessEntities;
    } catch (error) {
      console.error('Business entity extraction error:', error);
      return {};
    }
  }

  async analyzeSentiment(text) {
    try {
      return nlpUtils.analyzeSentiment(text);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { score: 0, label: 'neutral' };
    }
  }

  async suggestTags(text, existingTags = []) {
    try {
      const keywords = nlpUtils.extractKeywords(text, 15);
      const entities = await this.extractBusinessEntities(text);
      
      // Combine keywords and entities for tag suggestions
      const suggestedTags = [
        ...keywords,
        ...entities.currencies?.map(c => `currency-${c.replace(/[$€£¥\s]/g, '')}`),
        ...entities.invoiceNumbers?.map(n => `invoice-${n.match(/\d+/)?.[0]}`),
        ...entities.quoteNumbers?.map(n => `quote-${n.match(/\d+/)?.[0]}`),
      ].filter(Boolean);

      // Remove duplicates and existing tags
      const uniqueTags = [...new Set(suggestedTags)]
        .filter(tag => !existingTags.includes(tag))
        .slice(0, 10);

      return nlpUtils.formatSuggestedTags(uniqueTags);
    } catch (error) {
      console.error('Tag suggestion error:', error);
      return [];
    }
  }

  async compareTexts(text1, text2) {
    try {
      const similarity = nlpUtils.calculateSimilarity(text1, text2);
      
      return {
        similarity,
        classification: this.classifySimilarity(similarity),
        details: {
          text1Length: text1.length,
          text2Length: text2.length,
          commonWords: this.findCommonWords(text1, text2),
        },
      };
    } catch (error) {
      console.error('Text comparison error:', error);
      return { similarity: 0, classification: 'no_match' };
    }
  }

  classifySimilarity(score) {
    if (score >= 0.8) return 'very_similar';
    if (score >= 0.6) return 'similar';
    if (score >= 0.4) return 'somewhat_similar';
    if (score >= 0.2) return 'different';
    return 'very_different';
  }

  findCommonWords(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    return [...words1].filter(word => words2.has(word));
  }

  generateCacheKey(text, options) {
    const optionsString = JSON.stringify(options);
    return `nlp:${Buffer.from(text + optionsString).toString('base64').slice(0, 32)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    // Clean up old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new NlpService();
