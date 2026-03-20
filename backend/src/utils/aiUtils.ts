// @ts-nocheck
const crypto = require('crypto');

const aiUtils = {
  // Generate unique conversation ID
  generateConversationId: () => {
    return crypto.randomBytes(16).toString('hex');
  },

  // Calculate token estimates for text
  estimateTokens: (text) => {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  },

  // Format AI response for consistency
  formatAiResponse: (response, metadata = {}) => {
    return {
      content: response,
      timestamp: new Date(),
      metadata: {
        model: metadata.model || 'gpt-3.5-turbo',
        tokens: metadata.tokens || 0,
        cost: metadata.cost || 0,
        processingTime: metadata.processingTime || 0,
        ...metadata,
      },
    };
  },

  // Extract context from different modules
  extractModuleContext: (module, data) => {
    const extractors = {
      client: (data) => ({
        clientName: data.name,
        clientEmail: data.email,
        clientType: data.customerType,
        segment: data.customerValue?.segment,
        lastPurchase: data.behavior?.lastPurchaseDate,
      }),
      
      invoice: (data) => ({
        invoiceNumber: data.number,
        clientName: data.client?.name,
        total: data.total,
        status: data.status,
        paymentStatus: data.paymentStatus,
        dueDate: data.expiredDate,
      }),
      
      quote: (data) => ({
        quoteNumber: data.number,
        clientName: data.client?.name,
        total: data.total,
        status: data.status,
        expiryDate: data.expiredDate,
      }),
      
      document: (data) => ({
        documentTitle: data.title,
        documentType: data.documentType,
        fileType: data.fileType,
        fileSize: data.fileSize,
        tags: data.tags,
      }),
      
      task: (data) => ({
        taskTitle: data.title,
        assignedTo: data.assignedTo?.name,
        priority: data.priority,
        status: data.status,
        deadline: data.deadline,
        progress: data.progress,
      }),
    };

    const extractor = extractors[module];
    return extractor ? extractor(data) : data;
  },

  // Build system prompts for different contexts
  buildSystemPrompt: (assistantType, context = {}) => {
    const companyName = context.company?.name || 'Your Company';
    
    const basePrompts = {
      general: (name) => `You are a helpful AI assistant for ${name}'s ERP system. Provide clear, accurate, and actionable advice for ${name}.`,
      
      document: (name) => `You are a document analysis specialist for ${name}. Help ${name} understand, organize, and extract insights from their business documents. 
                 Focus on compliance, content analysis, and document management best practices for ${name}.`,
      
      workflow: (name) => `You are a workflow optimization expert for ${name}. Help ${name} design, improve, and automate their business processes. 
                 Suggest efficient workflows and identify bottlenecks for ${name}.`,
      
      analytics: (name) => `You are a business intelligence analyst for ${name}. Help ${name} understand their data, identify trends, and make data-driven decisions. 
                  Provide clear insights and actionable recommendations for ${name}.`,
      
      customer: (name) => `You are a customer relationship specialist for ${name}. Help ${name} manage customer interactions, analyze customer behavior, and improve customer satisfaction.`,
      
      financial: (name) => `You are a financial advisor for ${name}. Help ${name} understand their financial data, manage cash flow, and make informed financial decisions.`,
    };

    let prompt = basePrompts[assistantType] ? basePrompts[assistantType](companyName) : basePrompts.general(companyName);
    
    if (context.module) {
      prompt += `\n\nYou are currently helping ${companyName} with the ${context.module} module.`;
    }
    
    if (context.userPreferences) {
      const prefs = context.userPreferences;
      prompt += `\n\n${companyName}'s preferences: Communication style: ${prefs.communicationStyle}, Response length: ${prefs.responseLength}.`;
    }
    
    return prompt;
  },

  // Sanitize input for AI processing
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return '';
    
    // Remove potential injection attempts and excessive whitespace
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 4000); // Limit length
  },

  // Calculate AI usage costs
  calculateCost: (tokens, model = 'gpt-3.5-turbo') => {
    const pricing = {
      'gpt-3.5-turbo': 0.002 / 1000, // $0.002 per 1K tokens
      'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens
      'gpt-4-turbo': 0.01 / 1000, // $0.01 per 1K tokens
    };
    
    const rate = pricing[model] || pricing['gpt-3.5-turbo'];
    return tokens * rate;
  },

  // Validate AI configuration
  validateAiConfig: (config) => {
    const errors = [];
    
    if (!config.model?.provider) {
      errors.push('AI provider is required');
    }
    
    if (!config.model?.modelName) {
      errors.push('Model name is required');
    }
    
    if (config.model?.parameters?.temperature < 0 || config.model?.parameters?.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }
    
    if (config.model?.parameters?.maxTokens < 1 || config.model?.parameters?.maxTokens > 4000) {
      errors.push('Max tokens must be between 1 and 4000');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Rate limiting helpers
  getRateLimitKey: (userId, assistantId) => {
    return `ai_rate_limit:${userId}:${assistantId}`;
  },

  // Parse and validate JSON responses from AI
  parseAiJsonResponse: (response) => {
    try {
      // Try to extract JSON from response if it's embedded in text
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                       response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      return null;
    }
  },

  // Generate contextual prompts for different operations
  generatePrompt: (operation, data, context = {}) => {
    const companyName = context.company?.name || 'Your Company';
    
    const prompts = {
      analyze_invoice: (data) => `
        Analyze this invoice data for ${companyName} and provide insights:
        Invoice #${data.number}
        Client: ${data.client?.name}
        Total: ${data.total} ${data.currency}
        Status: ${data.status}
        Due Date: ${data.expiredDate}
        
        Please provide insights tailored to ${companyName}:
        1. Payment risk assessment for ${companyName}
        2. Cash flow impact on ${companyName}
        3. Follow-up recommendations for ${companyName}
      `,
      
      optimize_workflow: (data) => `
        Review this workflow for ${companyName} and suggest optimizations:
        ${JSON.stringify(data, null, 2)}
        
        Please provide recommendations for ${companyName}:
        1. Efficiency improvements for ${companyName}
        2. Automation opportunities for ${companyName}
        3. Bottleneck identification in ${companyName}'s processes
        4. Best practice recommendations for ${companyName}
      `,
      
      customer_insights: (data) => `
        Analyze this customer data for ${companyName}:
        Customer: ${data.name}
        Type: ${data.customerType}
        Segment: ${data.customerValue?.segment}
        Last Purchase: ${data.behavior?.lastPurchaseDate}
        
        Please provide insights for ${companyName}:
        1. Customer health score for ${companyName}
        2. Retention risk assessment for ${companyName}
        3. Upselling opportunities for ${companyName}
        4. Engagement recommendations for ${companyName}
      `,
    };
    
    const promptGenerator = prompts[operation];
    return promptGenerator ? promptGenerator(data) : data;
  },
};

module.exports = aiUtils;
