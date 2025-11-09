const axios = require('axios');
const Setting = require('../models/coreModels/Setting');

class SentimentAnalysisService {
  constructor() {
    this.apiKey = null;
    this.model = 'text-davinci-003'; // Default model
    this.initialized = false;
  }

  async initialize(ownerId) {
    try {
      // Try to get owner-specific API key first
      let apiKeySetting = await Setting.findOne({
        settingKey: 'openai_api_key',
        owner: ownerId
      });

      // Fall back to global setting if no owner-specific key
      if (!apiKeySetting) {
        apiKeySetting = await Setting.findOne({
          settingKey: 'openai_api_key',
          owner: null
        });
      }

      if (!apiKeySetting || !apiKeySetting.settingValue) {
        throw new Error('OpenAI API key not configured');
      }

      this.apiKey = apiKeySetting.settingValue;

      // Get model preference
      const modelSetting = await Setting.findOne({
        settingKey: 'sentiment_analysis_model',
        $or: [{ owner: ownerId }, { owner: null }]
      }).sort({ owner: -1 }); // Owner-specific first

      if (modelSetting && modelSetting.settingValue) {
        this.model = modelSetting.settingValue;
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing sentiment analysis service:', error);
      throw error;
    }
  }

  async analyzeSentiment(text, ownerId = null) {
    if (!this.initialized && ownerId) {
      await this.initialize(ownerId);
    }

    if (!this.apiKey) {
      throw new Error('Sentiment analysis service not properly initialized');
    }

    try {
      // Basic sentiment analysis without OpenAI
      if (!text) {
        return { score: 0, category: 'neutral', keywords: [] };
      }

      // Simple rule-based analysis for demonstration
      const lowerText = text.toLowerCase();
      const positiveWords = ['great', 'excellent', 'good', 'wonderful', 'amazing', 'love', 'best', 'fantastic', 'helpful', 'impressed'];
      const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointed', 'unhappy', 'frustrating'];

      let positiveCount = 0;
      let negativeCount = 0;
      let keywords = [];

      // Count sentiment words
      positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          positiveCount += matches.length;
          if (!keywords.includes(word)) keywords.push(word);
        }
      });

      negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          negativeCount += matches.length;
          if (!keywords.includes(word)) keywords.push(word);
        }
      });

      // Calculate score from -1 to 1
      const totalMatches = positiveCount + negativeCount;
      let score = 0;
      
      if (totalMatches > 0) {
        score = (positiveCount - negativeCount) / totalMatches;
      }

      // Determine category
      let category = 'neutral';
      if (score > 0.2) category = 'positive';
      if (score < -0.2) category = 'negative';

      return {
        score,
        category,
        keywords: keywords.slice(0, 5)  // Top 5 keywords
      };

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Fallback to neutral sentiment
      return { score: 0, category: 'neutral', keywords: [] };
    }
  }

  async batchAnalyzeSentiments(texts, ownerId = null) {
    try {
      return Promise.all(texts.map(text => this.analyzeSentiment(text, ownerId)));
    } catch (error) {
      console.error('Error in batch sentiment analysis:', error);
      throw error;
    }
  }
}

const sentimentAnalysisService = new SentimentAnalysisService();
module.exports = { sentimentAnalysisService };
