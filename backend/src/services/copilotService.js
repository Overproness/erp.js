const AiAssistant = require('../models/appModels/AiAssistant');
const AiConversation = require('../models/appModels/AiConversation');
const OpenAIHelper = require('../helpers/openaiHelper');
const contextAwareService = require('./contextAwareService');

/**
 * Copilot Service - Modular AI chatbot system
 * Provides base LLM functionality with extensible module-specific capabilities
 */
class CopilotService {
  constructor() {
    // Registry for module-specific copilot handlers
    this.moduleRegistry = new Map();

    // Cache for active conversations
    this.conversationCache = new Map();

    // Base system prompts
    this.basePrompts = {
      general: `You are an intelligent AI assistant integrated into an ERP system. You help users with:
- Answering questions about the system
- Providing guidance and suggestions
- Explaining features and functionality
- General business and productivity advice

Be concise, helpful, and professional. If you don't know something, be honest about it.`,

      moduleAware: `You are an intelligent AI copilot integrated into an ERP system.
You are currently assisting in the {MODULE_NAME} module.

Context: {CONTEXT_DATA}

Your role is to:
1. Answer questions about this specific module and its data
2. Provide suggestions and recommendations based on current context
3. Help users complete tasks efficiently
4. Offer insights from the data you have access to

Be context-aware, proactive, and helpful. Always consider the current module and data when responding.`,
    };
  }

  /**
   * Register a module-specific handler
   * @param {string} moduleName - Name of the module (e.g., 'customer', 'invoice', 'quote')
   * @param {object} handler - Handler with methods: preProcess, postProcess, getSuggestions
   */
  registerModule(moduleName, handler) {
    if (!handler || typeof handler !== 'object') {
      throw new Error('Handler must be an object with methods');
    }

    this.moduleRegistry.set(moduleName.toLowerCase(), {
      name: moduleName,
      preProcess: handler.preProcess || null,
      postProcess: handler.postProcess || null,
      getSuggestions: handler.getSuggestions || null,
      getContext: handler.getContext || null,
      systemPrompt: handler.systemPrompt || null,
      ...handler,
    });

    console.log(`✅ Registered copilot module: ${moduleName}`);
  }

  /**
   * Get registered module handler
   */
  getModuleHandler(moduleName) {
    if (!moduleName) return null;
    return this.moduleRegistry.get(moduleName.toLowerCase()) || null;
  }

  /**
   * Get all registered modules
   */
  getRegisteredModules() {
    return Array.from(this.moduleRegistry.keys());
  }

  /**
   * Process chat message with base LLM functionality
   * @param {string} assistantId - AI Assistant ID
   * @param {string} message - User message
   * @param {string} userId - User ID
   * @param {object} context - Context object { module, entityId, data }
   */
  async processChat(assistantId, message, userId, context = {}) {
    try {
      // Get or create assistant
      const assistant = await this.getAssistant(assistantId, userId);

      // Create OpenAI helper
      const openaiHelper = await OpenAIHelper.createForUser(userId);
      if (!openaiHelper.apiKey) {
        throw new Error(
          'OpenAI API key not configured. Please add your API key in Settings > AI Settings.'
        );
      }

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(assistantId, userId, context);

      // Build enhanced context
      const enhancedContext = await this.buildEnhancedContext(context, userId);

      // Check for module-specific handler
      const moduleHandler = this.getModuleHandler(context.module);

      // Pre-process message if module handler exists
      let processedMessage = message;
      let additionalContext = {};

      if (moduleHandler && moduleHandler.preProcess) {
        const preProcessResult = await moduleHandler.preProcess({
          message,
          context: enhancedContext,
          userId,
          conversation,
        });

        processedMessage = preProcessResult.message || message;
        additionalContext = preProcessResult.additionalContext || {};
      }

      // Prepare messages for OpenAI
      const messages = await this.prepareMessages(
        assistant,
        conversation,
        processedMessage,
        enhancedContext,
        additionalContext,
        moduleHandler
      );

      // Use model from context or fallback to assistant's model
      const selectedModel = context.model || assistant.model.modelName;

      // Call OpenAI with selected model
      const aiResponse = await openaiHelper.chatCompletion({
        messages,
        model: selectedModel,
        parameters: {
          temperature: assistant.model.parameters.temperature,
          max_tokens: assistant.model.parameters.maxTokens,
          top_p: assistant.model.parameters.topP,
          frequency_penalty: assistant.model.parameters.frequencyPenalty,
          presence_penalty: assistant.model.parameters.presencePenalty,
        },
      });

      if (!aiResponse.success) {
        throw new Error(aiResponse.error);
      }

      let responseMessage = aiResponse.data.choices[0].message.content;

      // Post-process response if module handler exists
      if (moduleHandler && moduleHandler.postProcess) {
        const postProcessResult = await moduleHandler.postProcess({
          message: processedMessage,
          response: responseMessage,
          context: enhancedContext,
          userId,
          conversation,
          aiResponse: aiResponse.data,
        });

        responseMessage = postProcessResult.response || responseMessage;
      }

      // Update conversation
      await this.updateConversation(
        conversation,
        message,
        responseMessage,
        aiResponse.usage,
        context
      );

      // Generate suggestions if module handler supports it
      let suggestions = [];
      if (moduleHandler && moduleHandler.getSuggestions) {
        suggestions = await moduleHandler.getSuggestions({
          context: enhancedContext,
          conversation,
          lastResponse: responseMessage,
        });
      }

      return {
        success: true,
        message: responseMessage,
        conversationId: conversation._id,
        suggestions,
        usage: aiResponse.usage,
        cost: aiResponse.cost,
        module: context.module || 'general',
      };
    } catch (error) {
      console.error('Copilot service error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get module-specific suggestions
   */
  async getModuleSuggestions(moduleName, context, userId) {
    try {
      const moduleHandler = this.getModuleHandler(moduleName);

      if (!moduleHandler || !moduleHandler.getSuggestions) {
        return {
          success: true,
          suggestions: [],
        };
      }

      const enhancedContext = await this.buildEnhancedContext(
        { module: moduleName, ...context },
        userId
      );

      const suggestions = await moduleHandler.getSuggestions({
        context: enhancedContext,
        userId,
      });

      return {
        success: true,
        suggestions: Array.isArray(suggestions) ? suggestions : [],
      };
    } catch (error) {
      console.error('Get suggestions error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: [],
      };
    }
  }

  /**
   * Get or create AI assistant
   */
  async getAssistant(assistantId, userId) {
    let assistant;

    if (assistantId && assistantId !== 'default') {
      assistant = await AiAssistant.findOne({
        _id: assistantId,
        owner: userId,
        enabled: true,
        removed: false,
      });
    }

    if (!assistant) {
      // Use or create default assistant
      assistant = await AiAssistant.findOne({
        owner: userId,
        type: 'general',
        enabled: true,
        removed: false,
      });

      if (!assistant) {
        // Create default assistant
        assistant = await AiAssistant.create({
          name: 'Default Copilot',
          description: 'General purpose AI assistant',
          type: 'general',
          owner: userId,
          enabled: true,
          systemPrompt: this.basePrompts.general,
          model: {
            provider: 'openai',
            modelName: 'gpt-3.5-turbo',
            parameters: {
              temperature: 0.7,
              maxTokens: 1000,
              topP: 1,
              frequencyPenalty: 0,
              presencePenalty: 0,
            },
          },
        });
      }
    }

    return assistant;
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(assistantId, userId, context = {}) {
    const cacheKey = `${assistantId}-${userId}-${context.module || 'general'}`;

    // Check cache
    if (this.conversationCache.has(cacheKey)) {
      const cachedConv = this.conversationCache.get(cacheKey);
      // Refresh from DB if older than 5 minutes
      if (Date.now() - cachedConv.cachedAt < 300000) {
        return cachedConv.conversation;
      }
    }

    // Find active conversation
    let conversation = await AiConversation.findOne({
      assistant: assistantId,
      user: userId,
      active: true,
      module: context.module || 'general',
    }).sort({ updated: -1 });

    // Create new if doesn't exist
    if (!conversation) {
      conversation = await AiConversation.create({
        assistant: assistantId,
        user: userId,
        module: context.module || 'general',
        context: context,
        messages: [],
        active: true,
      });
    }

    // Cache it
    this.conversationCache.set(cacheKey, {
      conversation,
      cachedAt: Date.now(),
    });

    return conversation;
  }

  /**
   * Build enhanced context from module and data
   */
  async buildEnhancedContext(context, userId) {
    if (!context.module) {
      return context;
    }

    try {
      // Get module handler context
      const moduleHandler = this.getModuleHandler(context.module);
      if (moduleHandler && moduleHandler.getContext) {
        const moduleContext = await moduleHandler.getContext({
          ...context,
          userId,
        });
        return { ...context, ...moduleContext };
      }

      // Fall back to contextAwareService
      const serviceContext = await contextAwareService.buildContext(
        context.module,
        context.data || {},
        userId
      );

      return { ...context, ...serviceContext };
    } catch (error) {
      console.error('Build context error:', error);
      return context;
    }
  }

  /**
   * Prepare messages array for OpenAI
   */
  async prepareMessages(
    assistant,
    conversation,
    message,
    context,
    additionalContext,
    moduleHandler
  ) {
    const messages = [];

    // System prompt
    let systemPrompt = assistant.systemPrompt;

    // Use module-specific system prompt if available
    if (moduleHandler && moduleHandler.systemPrompt) {
      systemPrompt =
        typeof moduleHandler.systemPrompt === 'function'
          ? moduleHandler.systemPrompt(context)
          : moduleHandler.systemPrompt;
    } else if (context.module) {
      // Use base module-aware prompt
      systemPrompt = this.basePrompts.moduleAware
        .replace('{MODULE_NAME}', context.module)
        .replace('{CONTEXT_DATA}', JSON.stringify(context, null, 2));
    }

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add conversation history (last 10 messages)
    if (conversation.messages && conversation.messages.length > 0) {
      const recentMessages = conversation.messages.slice(-10);
      recentMessages.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    return messages;
  }

  /**
   * Update conversation with new messages
   */
  async updateConversation(conversation, userMessage, aiMessage, usage, context) {
    conversation.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    conversation.messages.push({
      role: 'assistant',
      content: aiMessage,
      timestamp: new Date(),
    });

    conversation.messageCount = conversation.messages.length;
    conversation.updated = new Date();

    if (context) {
      conversation.context = { ...conversation.context, ...context };
    }

    await conversation.save();

    return conversation;
  }

  /**
   * Clear conversation cache
   */
  clearCache(assistantId, userId, module) {
    const cacheKey = `${assistantId}-${userId}-${module || 'general'}`;
    this.conversationCache.delete(cacheKey);
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(assistantId, userId, module, limit = 50) {
    const query = {
      assistant: assistantId,
      user: userId,
      active: true,
    };

    if (module) {
      query.module = module;
    }

    const conversations = await AiConversation.find(query).sort({ updated: -1 }).limit(limit);

    return conversations;
  }
}

// Create singleton instance
const copilotService = new CopilotService();

module.exports = copilotService;
