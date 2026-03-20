// @ts-nocheck
const axios = require('axios');
const Setting = require('../models/coreModels/Setting');

class OpenAIHelper {
  constructor(userApiKey = null) {
    this.apiKey = userApiKey || process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.defaultModel = 'gpt-3.5-turbo';

    if (!this.apiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.');
    }
  }

  hasApiKey() {
    return !!this.apiKey;
  }

  // Method to get user's API key from settings
  static async getUserApiKey(userId) {
    try {
      const setting = await Setting.findOne({
        category: 'ai_settings',
        owner: userId,
        removed: false,
      });

      return setting?.data?.openai_api_key || null;
    } catch (error) {
      console.error('Error fetching user API key:', error);
      return null;
    }
  }

  // Factory method to create OpenAI helper with user's API key
  static async createForUser(userId) {
    const userApiKey = await OpenAIHelper.getUserApiKey(userId);
    return new OpenAIHelper(userApiKey);
  }

  async chatCompletion({ messages, model = this.defaultModel, parameters = {} }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Extract and convert parameters to OpenAI format
      const {
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0,
        ...otherParams
      } = parameters;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
          ...otherParams,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        data: response.data,
        usage: response.data.usage,
        cost: this.calculateCost(response.data.usage, model),
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async generateEmbedding(text, model = 'text-embedding-ada-002') {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model,
          input: text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        embedding: response.data.data[0].embedding,
        usage: response.data.usage,
      };
    } catch (error) {
      console.error('OpenAI Embedding Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  calculateCost(usage, model) {
    // Pricing as of 2024 (update as needed)
    const pricing = {
      'gpt-4o': {
        input: 2.5 / 1000000, // per token
        output: 10.0 / 1000000,
      },
      'gpt-4o-mini': {
        input: 0.15 / 1000000,
        output: 0.6 / 1000000,
      },
      'gpt-4-turbo': {
        input: 10.0 / 1000000,
        output: 30.0 / 1000000,
      },
      'gpt-3.5-turbo': {
        input: 0.5 / 1000000,
        output: 1.5 / 1000000,
      },
      'gpt-4': {
        input: 30.0 / 1000000,
        output: 60.0 / 1000000,
      },
      'text-embedding-ada-002': {
        input: 0.1 / 1000000,
        output: 0,
      },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    const inputCost = (usage.prompt_tokens || 0) * modelPricing.input;
    const outputCost = (usage.completion_tokens || 0) * modelPricing.output;

    return inputCost + outputCost;
  }

  async moderateContent(text) {
    if (!this.apiKey) {
      return { safe: true, categories: {} };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/moderations`,
        { input: text },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.results[0];
      return {
        safe: !result.flagged,
        categories: result.categories,
        categoryScores: result.category_scores,
      };
    } catch (error) {
      console.error('OpenAI Moderation Error:', error.response?.data || error.message);
      return { safe: true, categories: {} }; // Default to safe if moderation fails
    }
  }

  async analyzeText(text, context = {}) {
    const messages = [
      {
        role: 'system',
        content:
          'You are an AI assistant that analyzes business documents and data. Provide structured analysis with insights, patterns, and recommendations.',
      },
      {
        role: 'user',
        content: `Analyze the following text in the context of ${
          context.module || 'business operations'
        }:\n\n${text}`,
      },
    ];

    return this.chatCompletion({ messages });
  }

  async generateSuggestions(userInput, context = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant for an ERP system. Generate helpful suggestions based on user input. Context: ${JSON.stringify(
          context
        )}`,
      },
      {
        role: 'user',
        content: userInput,
      },
    ];

    return this.chatCompletion({ messages });
  }

  // Method to check if API key is configured
  hasApiKey() {
    return !!this.apiKey;
  }

  // Method to validate API key by making a test call
  async validateApiKey() {
    if (!this.apiKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return { valid: true, message: 'API key is valid' };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error?.message || 'Invalid API key',
      };
    }
  }
}

module.exports = OpenAIHelper;
