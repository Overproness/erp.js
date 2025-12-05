const Anthropic = require('@anthropic-ai/sdk');

const testClaudeKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required',
      });
    }

    // Create Anthropic client with the provided API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Test the API key with a simple request
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hello',
        },
      ],
    });

    if (message && message.content && message.content.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'API key is valid and working',
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'API key validation failed',
      });
    }
  } catch (error) {
    console.error('Claude key test error:', error);
    return res.status(200).json({
      success: false,
      message: error.message || 'Failed to validate API key',
    });
  }
};

module.exports = testClaudeKey;
