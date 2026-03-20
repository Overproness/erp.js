// @ts-nocheck
const { GoogleGenerativeAI } = require('@google/generative-ai');

const testGeminiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required',
      });
    }

    // Create Gemini client with the provided API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Test the API key with a simple request
    const result = await model.generateContent('Hello');
    const response = await result.response;
    const text = response.text();

    if (text) {
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
    console.error('Gemini key test error:', error);
    return res.status(200).json({
      success: false,
      message: error.message || 'Failed to validate API key',
    });
  }
};

module.exports = testGeminiKey;
