// @ts-nocheck
const AiAssistant = require('../../../models/appModels/AiAssistant');
const { catchErrors } = require('../../../handlers/errorHandlers');

const create = async (req, res) => {
  try {
    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { body } = req;

    // Set owner from authenticated user
    body.owner = owner;
    body.createdBy = owner;

    // Set default capabilities if not provided
    if (!body.capabilities || body.capabilities.length === 0) {
      body.capabilities = ['nlp_processing', 'pattern_recognition'];
    }

    // Set default model parameters
    if (!body.model) {
      body.model = {
        provider: 'openai',
        modelName: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      };
    }

    // Set default system prompt if not provided
    if (!body.systemPrompt) {
      body.systemPrompt = `You are a helpful AI assistant for an ERP system. 
                          You help users manage their business operations including customers, invoices, quotes, payments, documents, and workflows.
                          Always provide clear, actionable advice and maintain a professional yet friendly tone.`;
    }

    const aiAssistant = new AiAssistant(body);
    const result = await aiAssistant.save();

    return res.status(200).json({
      success: true,
      result,
      message: 'AI Assistant created successfully',
    });
  } catch (error) {
    console.error('AI Assistant creation error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to create AI Assistant',
      error: error.message,
    });
  }
};

module.exports = catchErrors(create);
