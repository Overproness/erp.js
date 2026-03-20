// @ts-nocheck
const OpenAIHelper = require('./openaiHelper');
const ClaudeHelper = require('./claudeHelper');
const GeminiHelper = require('./geminiHelper');

/**
 * Unified AI Helper
 * Routes requests to the appropriate AI provider based on model name
 */
class UnifiedAIHelper {
  constructor(userId = null) {
    this.userId = userId;
    this.helpers = {
      openai: null,
      claude: null,
      gemini: null,
    };
  }

  /**
   * Factory method to create unified helper for a user
   */
  static async createForUser(userId) {
    const helper = new UnifiedAIHelper(userId);
    await helper.initializeHelpers();
    return helper;
  }

  /**
   * Initialize all AI provider helpers
   */
  async initializeHelpers() {
    if (this.userId) {
      this.helpers.openai = await OpenAIHelper.createForUser(this.userId);
      this.helpers.claude = await ClaudeHelper.createForUser(this.userId);
      this.helpers.gemini = await GeminiHelper.createForUser(this.userId);
    } else {
      this.helpers.openai = new OpenAIHelper();
      this.helpers.claude = new ClaudeHelper();
      this.helpers.gemini = new GeminiHelper();
    }
  }

  /**
   * Determine which provider to use based on model name
   */
  getProvider(model) {
    const modelLower = model.toLowerCase();

    if (modelLower.includes('gpt') || modelLower.includes('openai')) {
      return 'openai';
    }

    if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
      return 'claude';
    }

    if (modelLower.includes('gemini') || modelLower.includes('google')) {
      return 'gemini';
    }

    // Default to OpenAI
    return 'openai';
  }

  /**
   * Get the appropriate helper for a model
   */
  getHelper(model) {
    const provider = this.getProvider(model);
    return this.helpers[provider];
  }

  /**
   * Chat completion with automatic provider selection
   */
  async chatCompletion({ messages, model, parameters = {} }) {
    const helper = this.getHelper(model);

    if (!helper || !helper.hasApiKey()) {
      const provider = this.getProvider(model);
      throw new Error(
        `${provider.toUpperCase()} API key not configured. Please add your API key in Settings > AI Settings.`
      );
    }

    return await helper.chatCompletion({ messages, model, parameters });
  }

  /**
   * Check if any API key is configured
   */
  hasAnyApiKey() {
    return (
      (this.helpers.openai && this.helpers.openai.hasApiKey()) ||
      (this.helpers.claude && this.helpers.claude.hasApiKey()) ||
      (this.helpers.gemini && this.helpers.gemini.hasApiKey())
    );
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    const providers = [];

    if (this.helpers.openai && this.helpers.openai.hasApiKey()) {
      providers.push('openai');
    }

    if (this.helpers.claude && this.helpers.claude.hasApiKey()) {
      providers.push('claude');
    }

    if (this.helpers.gemini && this.helpers.gemini.hasApiKey()) {
      providers.push('gemini');
    }

    return providers;
  }

  /**
   * Validate all configured API keys
   */
  async validateAllKeys() {
    const results = {};

    for (const [provider, helper] of Object.entries(this.helpers)) {
      if (helper && helper.hasApiKey()) {
        results[provider] = await helper.validateApiKey();
      } else {
        results[provider] = { valid: false, error: 'No API key configured' };
      }
    }

    return results;
  }

  /**
   * Get recommended models for each provider
   */
  static getRecommendedModels() {
    return {
      openai: [
        { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable, multimodal' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast and affordable' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Previous flagship' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and economical' },
      ],
      claude: [
        {
          value: 'claude-3-5-sonnet-20241022',
          label: 'Claude 3.5 Sonnet',
          description: 'Most intelligent',
        },
        {
          value: 'claude-3-5-haiku-20241022',
          label: 'Claude 3.5 Haiku',
          description: 'Fast and affordable',
        },
        {
          value: 'claude-3-opus-20240229',
          label: 'Claude 3 Opus',
          description: 'Previous flagship',
        },
      ],
      gemini: [
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Most capable' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
        {
          value: 'gemini-1.5-flash-8b',
          label: 'Gemini 1.5 Flash-8B',
          description: 'High volume tasks',
        },
      ],
    };
  }
}

module.exports = UnifiedAIHelper;
