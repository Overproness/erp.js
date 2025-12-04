/**
 * Example Copilot Module Handlers
 * Demonstrates how to create module-specific AI functionality
 */

const Client = require('../models/appModels/Client');

/**
 * Customer Module Handler
 * Provides AI assistance for customer management
 */
const customerModuleHandler = {
  name: 'customer',

  systemPrompt: (context) => {
    return `You are an AI assistant helping with customer management in an ERP system.
    
Current Context:
- Total customers: ${context.totalCustomers || 'N/A'}
- Current customer: ${context.customer ? context.customer.name : 'None selected'}

You can help with:
- Analyzing customer data and patterns
- Suggesting customer segmentation strategies
- Recommending engagement strategies
- Answering questions about customer information

Be proactive and provide actionable insights.`;
  },

  /**
   * Pre-process user message before sending to AI
   */
  async preProcess({ message, context, userId }) {
    // eslint-disable-line no-unused-vars
    // Example: Add recent customer statistics to context
    const additionalContext = {};

    try {
      // Get customer count
      const totalCustomers = await Client.countDocuments({
        removed: false,
        enabled: true,
      });

      additionalContext.totalCustomers = totalCustomers;

      // If specific customer ID is provided, fetch customer details
      if (context.entityId) {
        const customer = await Client.findOne({
          _id: context.entityId,
          removed: false,
        }).select('name email phone company type status');

        if (customer) {
          additionalContext.customer = customer;
        }
      }
    } catch (error) {
      console.error('Customer preProcess error:', error);
    }

    return {
      message,
      additionalContext,
    };
  },

  /**
   * Post-process AI response
   */
  async postProcess({ message, response, context, userId }) {
    // eslint-disable-line no-unused-vars
    // You could enhance the response here
    // For example, add action buttons, format data, etc.

    return {
      response,
    };
  },

  /**
   * Get module-specific suggestions
   */
  async getSuggestions({ context, userId }) {
    // eslint-disable-line no-unused-vars
    const suggestions = [];

    try {
      if (context.entityId) {
        // Suggestions for a specific customer
        suggestions.push({
          type: 'action',
          title: 'View Customer History',
          description: 'See all interactions with this customer',
          action: 'viewHistory',
        });

        suggestions.push({
          type: 'question',
          title: 'Engagement Strategy',
          question: 'What engagement strategy would you recommend for this customer?',
        });
      } else {
        // General customer management suggestions
        suggestions.push({
          type: 'question',
          title: 'Customer Segmentation',
          question: 'How should I segment my customers?',
        });

        suggestions.push({
          type: 'question',
          title: 'Top Customers',
          question: 'Who are my most valuable customers?',
        });

        suggestions.push({
          type: 'action',
          title: 'Analyze Trends',
          description: 'Get insights on customer acquisition trends',
          action: 'analyzeTrends',
        });
      }
    } catch (error) {
      console.error('Customer getSuggestions error:', error);
    }

    return suggestions;
  },

  /**
   * Get module-specific context
   */
  async getContext({ entityId, userId }) {
    // eslint-disable-line no-unused-vars
    try {
      const context = {};

      if (entityId) {
        const customer = await Client.findOne({
          _id: entityId,
          removed: false,
        });

        if (customer) {
          context.customer = {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            company: customer.company,
            type: customer.type,
            status: customer.status,
          };
        }
      }

      return context;
    } catch (error) {
      console.error('Customer getContext error:', error);
      return {};
    }
  },
};

/**
 * General Module Handler
 * Default handler for pages without specific module handlers
 */
const generalModuleHandler = {
  name: 'general',

  systemPrompt: `You are a helpful AI assistant integrated into an ERP system.
You can answer questions, provide guidance, and help users navigate the system.
Be friendly, concise, and helpful.`,

  async getSuggestions() {
    return [
      {
        type: 'question',
        title: 'Getting Started',
        question: 'How do I get started with the system?',
      },
      {
        type: 'question',
        title: 'Features',
        question: 'What features are available?',
      },
      {
        type: 'question',
        title: 'Help',
        question: 'I need help with something',
      },
    ];
  },
};

module.exports = {
  customerModuleHandler,
  generalModuleHandler,
};
