// @ts-nocheck
const AiAssistant = require('../models/appModels/AiAssistant');
const AiConversation = require('../models/appModels/AiConversation');
const AiAnalytics = require('../models/appModels/AiAnalytics');
const OpenAIHelper = require('../helpers/openaiHelper');
const nlpService = require('./nlpService');
const patternRecognitionService = require('./patternRecognitionService');
const contextAwareService = require('./contextAwareService');
const aiUtils = require('../utils/aiUtils');
const promptTemplates = require('../utils/promptTemplates');

class AiService {
  constructor() {
    this.conversationCache = new Map();
    this.analyticsQueue = [];
  }

  // ✅ Helper to convert camelCase params to snake_case for OpenAI API
  convertOpenAiParams(params = {}) {
    const {
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
    } = params;

    return {
      temperature,
      ...(maxTokens !== undefined && { max_tokens: maxTokens }),
      ...(topP !== undefined && { top_p: topP }),
      ...(frequencyPenalty !== undefined && { frequency_penalty: frequencyPenalty }),
      ...(presencePenalty !== undefined && { presence_penalty: presencePenalty }),
    };
  }

  async processChat(assistantId, message, userId, context = {}) {
    try {
      const assistant = await AiAssistant.findOne({
        _id: assistantId,
        owner: userId,
        enabled: true,
        removed: false,
      }).populate('knowledgeBase');

      if (!assistant) {
        throw new Error('AI Assistant not found or disabled');
      }

      // Create OpenAI helper with user's API key
      const openaiHelper = await OpenAIHelper.createForUser(userId);
      
      if (!openaiHelper.hasApiKey()) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings > AI Settings.');
      }

      const conversation = await this.getOrCreateConversation(assistantId, userId, context);

      const enhancedContext = await contextAwareService.buildContext(
        context.module || 'general',
        context.data || {},
        userId
      );

      const messages = await this.prepareMessages(assistant, conversation, message, enhancedContext);

      const aiResponse = await openaiHelper.chatCompletion({
        messages,
        model: assistant.model.modelName,
        parameters: this.convertOpenAiParams(assistant.model.parameters),
      });

      if (!aiResponse.success) {
        throw new Error(aiResponse.error);
      }

      const responseMessage = aiResponse.data.choices[0].message.content;

      await this.updateConversation(conversation, message, responseMessage, aiResponse.usage);

      this.trackAnalytics(assistant, userId, context.module, aiResponse.usage, aiResponse.cost);

      return {
        success: true,
        message: responseMessage,
        conversation: conversation._id,
        usage: aiResponse.usage,
        cost: aiResponse.cost,
      };
    } catch (error) {
      console.error('AI Service error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async analyzeDocument(content, documentType, assistantId, userId) {
    try {
      const nlpAnalysis = await nlpService.processText(content);

      const assistant = await AiAssistant.findOne({
        _id: assistantId,
        owner: userId,
        enabled: true,
        removed: false,
      });

      if (!assistant) {
        return {
          success: true,
          analysis: nlpAnalysis,
          aiEnhanced: false,
        };
      }

      // Create OpenAI helper with user's API key
      const openaiHelper = await OpenAIHelper.createForUser(userId);
      
      if (!openaiHelper.hasApiKey()) {
        // Fall back to NLP analysis only
        return {
          success: true,
          analysis: nlpAnalysis,
          aiEnhanced: false,
        };
      }

      const analysisPrompt = promptTemplates.analysis.document({
        title: 'Document Analysis',
        documentType,
        content: content.substring(0, 4000),
      });

      const aiResponse = await openaiHelper.chatCompletion({
        messages: [
          { role: 'system', content: promptTemplates.systemPrompts.document },
          { role: 'user', content: analysisPrompt },
        ],
        model: assistant.model.modelName,
        parameters: this.convertOpenAiParams(assistant.model.parameters),
      });

      let aiAnalysis = null;
      if (aiResponse.success) {
        aiAnalysis = aiResponse.data.choices[0].message.content;
      }

      return {
        success: true,
        analysis: {
          ...nlpAnalysis,
          aiAnalysis,
          documentType,
        },
        usage: aiResponse.usage,
        cost: aiResponse.cost,
        aiEnhanced: true,
      };
    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateSuggestions(module, data, assistantId, userId) {
    try {
      const assistant = await AiAssistant.findOne({
        _id: assistantId,
        owner: userId,
        enabled: true,
        removed: false,
      });

      if (!assistant) {
        throw new Error('AI Assistant not found');
      }

      // Create OpenAI helper with user's API key
      const openaiHelper = await OpenAIHelper.createForUser(userId);
      
      if (!openaiHelper.hasApiKey()) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings > AI Settings.');
      }

      const patterns = await patternRecognitionService.analyzePatterns(data, module);

      const suggestionPrompt = promptTemplates.suggestions.process(module, {
        data,
        patterns: patterns.patterns,
        insights: patterns.insights,
      });

      const aiResponse = await openaiHelper.chatCompletion({
        messages: [
          { role: 'system', content: promptTemplates.systemPrompts.workflow },
          { role: 'user', content: suggestionPrompt },
        ],
        model: assistant.model.modelName,
        parameters: this.convertOpenAiParams(assistant.model.parameters),
      });

      if (!aiResponse.success) {
        throw new Error(aiResponse.error);
      }

      return {
        success: true,
        suggestions: aiResponse.data.choices[0].message.content,
        patterns,
        usage: aiResponse.usage,
        cost: aiResponse.cost,
      };
    } catch (error) {
      console.error('Suggestions generation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getOrCreateConversation(assistantId, userId, context) {
    try {
      let conversation = await AiConversation.findOne({
        aiAssistant: assistantId,
        user: userId,
        owner: userId,
        status: 'active',
        removed: false,
      });

      if (!conversation) {
        conversation = new AiConversation({
          aiAssistant: assistantId,
          user: userId,
          owner: userId,
          context,
          messages: [],
          status: 'active',
        });
        await conversation.save();
      }

      return conversation;
    } catch (error) {
      console.error('Get/Create conversation error:', error);
      throw error;
    }
  }

  async prepareMessages(assistant, conversation, userMessage, enhancedContext) {
    // Extract company name from context
    const companyName = enhancedContext?.company?.name || 'Your Company';
    
    // Build system prompt with company name
    let systemPrompt = assistant.systemPrompt;
    if (assistant.type && promptTemplates.systemPrompts[assistant.type]) {
      systemPrompt = promptTemplates.systemPrompts[assistant.type](companyName);
    } else if (!systemPrompt.includes(companyName) && companyName !== 'Your Company') {
      // If system prompt doesn't already include company name, add it
      systemPrompt = systemPrompt.replace(/Tech Revisor/g, `${companyName}'s Tech Revisor`);
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    if (enhancedContext && Object.keys(enhancedContext).length > 0) {
      let contextMessage = `Context for ${companyName}:\n`;
      
      if (enhancedContext.company) {
        contextMessage += `Company: ${enhancedContext.company.name}\n`;
        if (enhancedContext.company.email) {
          contextMessage += `Email: ${enhancedContext.company.email}\n`;
        }
      }
      
      if (enhancedContext.module) {
        contextMessage += `Module: ${enhancedContext.module}\n`;
      }
      
      if (enhancedContext.data) {
        contextMessage += `Data: ${JSON.stringify(enhancedContext.data, null, 2)}`;
      }

      messages.push({
        role: 'system',
        content: contextMessage,
      });
    }

    const recentMessages = conversation.messages.slice(-10);
    messages.push(...recentMessages);

    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }

  async updateConversation(conversation, userMessage, assistantMessage, usage) {
    conversation.messages.push(
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
        metadata: {
          tokens: usage?.total_tokens || 0,
          processingTime: Date.now(),
        },
      }
    );

    conversation.totalTokens += usage?.total_tokens || 0;
    conversation.updated = new Date();

    await conversation.save();
    return conversation;
  }

  trackAnalytics(assistant, userId, module, usage, cost) {
    this.analyticsQueue.push({
      type: 'usage',
      module,
      aiAssistant: assistant._id,
      user: userId,
      owner: userId,
      data: {
        tokens: usage?.total_tokens || 0,
        cost: cost || 0,
        timestamp: new Date(),
      },
      metrics: {
        tokensUsed: usage?.total_tokens || 0,
        cost: cost || 0,
        responseTime: Date.now(),
      },
    });

    if (this.analyticsQueue.length >= 10) {
      this.processAnalyticsQueue();
    }
  }

  async processAnalyticsQueue() {
    if (this.analyticsQueue.length === 0) return;

    try {
      const analytics = this.analyticsQueue.splice(0, 10);
      await AiAnalytics.insertMany(analytics);
    } catch (error) {
      console.error('Analytics processing error:', error);
    }
  }
}

module.exports = new AiService();
