// @ts-nocheck

import axios from 'axios';
import Setting from '../models/coreModels/Setting';
class GeminiHelper {
  constructor(userApiKey = null) {
    this.apiKey = userApiKey || process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = 'gemini-1.5-pro';

    if (!this.apiKey) {
      console.warn('Gemini API key not found. Gemini features will be disabled.');
    }
  }

  // Method to get user's API key from settings
  static async getUserApiKey(userId) {
    try {
      const setting = await Setting.findOne({
        category: 'ai_settings',
        owner: userId,
        removed: false,
      });

      return setting?.data?.gemini_api_key || null;
    } catch (error) {
      console.error('Error fetching user Gemini API key:', error);
      return null;
    }
  }

  // Factory method to create Gemini helper with user's API key
  static async createForUser(userId) {
    const userApiKey = await GeminiHelper.getUserApiKey(userId);
    return new GeminiHelper(userApiKey);
  }

  async chatCompletion({ messages, model = this.defaultModel, parameters = {} }) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Convert OpenAI format messages to Gemini format
      const geminiMessages = this.convertMessages(messages);

      const response = await axios.post(
        `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents: geminiMessages,
          generationConfig: {
            temperature: parameters.temperature || 0.7,
            topP: parameters.top_p || parameters.topP || 1,
            maxOutputTokens: parameters.max_tokens || parameters.maxTokens || 2048,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Convert Gemini response to OpenAI format
      const candidate = response.data.candidates[0];
      const content = candidate.content.parts[0].text;

      // Estimate token usage (Gemini doesn't always provide this)
      const promptTokens =
        response.data.usageMetadata?.promptTokenCount || this.estimateTokens(messages);
      const completionTokens =
        response.data.usageMetadata?.candidatesTokenCount || this.estimateTokens([{ content }]);

      const openAIFormat = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: content,
            },
            finish_reason: candidate.finishReason === 'STOP' ? 'stop' : 'length',
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        },
      };

      return {
        success: true,
        data: openAIFormat,
        usage: openAIFormat.usage,
        cost: this.calculateCost(openAIFormat.usage, model),
      };
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  convertMessages(messages) {
    const geminiMessages = [];
    let systemInstruction = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + '\n';
      } else {
        geminiMessages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Prepend system instruction to first user message
    if (systemInstruction && geminiMessages.length > 0) {
      const firstUserMsg = geminiMessages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        firstUserMsg.parts[0].text = systemInstruction + '\n\n' + firstUserMsg.parts[0].text;
      }
    }

    return geminiMessages;
  }

  estimateTokens(messages) {
    // Rough estimation: 1 token ≈ 4 characters
    const text = messages.map((m) => m.content || m.parts?.[0]?.text || '').join(' ');
    return Math.ceil(text.length / 4);
  }

  calculateCost(usage, model) {
    // Pricing as of 2024 (update as needed)
    const pricing = {
      'gemini-1.5-pro': {
        input: 1.25 / 1000000, // per token for prompts up to 128k
        output: 5.0 / 1000000,
      },
      'gemini-1.5-flash': {
        input: 0.075 / 1000000,
        output: 0.3 / 1000000,
      },
      'gemini-1.5-flash-8b': {
        input: 0.0375 / 1000000,
        output: 0.15 / 1000000,
      },
    };

    const modelPricing = pricing[model] || pricing['gemini-1.5-pro'];
    const inputCost = (usage.prompt_tokens || 0) * modelPricing.input;
    const outputCost = (usage.completion_tokens || 0) * modelPricing.output;

    return inputCost + outputCost;
  }

  hasApiKey() {
    return !!this.apiKey;
  }

  async validateApiKey() {
    if (!this.apiKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      await axios.post(
        `${this.baseURL}/models/${this.defaultModel}:generateContent?key=${this.apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 10 },
        },
        {
          headers: {
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

export = GeminiHelper;
