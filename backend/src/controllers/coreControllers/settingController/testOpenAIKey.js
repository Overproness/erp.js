const OpenAIHelper = require('../../../helpers/openaiHelper');
const { errorHandler, catchErrors } = require('../../../handlers/errorHandlers');

const testOpenAIKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required',
      });
    }

    // Create OpenAI helper with the provided API key
    const openaiHelper = new OpenAIHelper(apiKey);

    // Test the API key
    const validation = await openaiHelper.validateApiKey();

    return res.status(200).json({
      success: validation.valid,
      message: validation.valid ? 'API key is valid and working' : validation.error,
    });
  } catch (error) {
    console.error('OpenAI key test error:', error);
    return errorHandler(error, req, res);
  }
};

module.exports = testOpenAIKey;
