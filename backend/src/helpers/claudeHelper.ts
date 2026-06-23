// @ts-nocheck

import axios from 'axios';
import Setting from '../models/coreModels/Setting';
class ClaudeHelper {
  constructor(userApiKey = null) {
    this.apiKey = userApiKey || process.env.CLAUDE_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1';
    this.defaultModel = 'claude-3-5-sonnet-20241022';

    if (!this.apiKey) {
      console.warn('Claude API key not found. Claude features will be disabled.');
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

      return setting?.data?.claude_api_key || null;
    } catch (error) {
      console.error('Error fetching user Claude API key:', error);
      return null;
    }
  }

  // Factory method to create Claude helper with user's API key
  static async createForUser(userId) {
    const userApiKey = await ClaudeHelper.getUserApiKey(userId);
    return new ClaudeHelper(userApiKey);
  }

  async chatCompletion({ messages, model = this.defaultModel, parameters = {} }) {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      // Convert OpenAI format messages to Claude format
      const { system, claudeMessages } = this.convertMessages(messages);

      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          model,
          max_tokens: parameters.max_tokens || parameters.maxTokens || 4096,
          temperature: parameters.temperature || 0.7,
          top_p: parameters.top_p || parameters.topP || 1,
          system: system,
          messages: claudeMessages,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Convert Claude response to OpenAI format
      const openAIFormat = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: response.data.content[0].text,
            },
            finish_reason: response.data.stop_reason,
          },
        ],
        usage: {
          prompt_tokens: response.data.usage.input_tokens,
          completion_tokens: response.data.usage.output_tokens,
          total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
        },
      };

      return {
        success: true,
        data: openAIFormat,
        usage: openAIFormat.usage,
        cost: this.calculateCost(openAIFormat.usage, model),
      };
    } catch (error) {
      console.error('Claude API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  convertMessages(messages) {
    let system = '';
    const claudeMessages = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system += msg.content + '\n';
      } else {
        claudeMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return { system: system.trim(), claudeMessages };
  }

  calculateCost(usage, model) {
    // Pricing as of 2024 (update as needed)
    const pricing = {
      'claude-3-5-sonnet-20241022': {
        input: 3.0 / 1000000, // per token
        output: 15.0 / 1000000,
      },
      'claude-3-5-haiku-20241022': {
        input: 1.0 / 1000000,
        output: 5.0 / 1000000,
      },
      'claude-3-opus-20240229': {
        input: 15.0 / 1000000,
        output: 75.0 / 1000000,
      },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
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
        `${this.baseURL}/messages`,
        {
          model: this.defaultModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
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

export = ClaudeHelper;
