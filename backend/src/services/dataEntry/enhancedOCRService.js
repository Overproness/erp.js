const Tesseract = require('tesseract.js');
const OpenAIHelper = require('../../helpers/openaiHelper');
const { getModuleSchema } = require('./moduleSchemas');
const path = require('path');
const fs = require('fs').promises;

/**
 * Enhanced OCR Service with AI-powered field extraction
 * Extracts text from images/PDFs and intelligently maps to module fields
 */
class EnhancedOCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Tesseract worker
   */
  async initialize() {
    if (this.isInitialized && this.worker) return;

    try {
      console.log('Initializing Tesseract OCR worker...');
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      this.isInitialized = true;
      console.log('Tesseract OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tesseract:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Extract and process data from image/PDF for specific module
   * @param {string} filePath - Path to image/PDF file
   * @param {string} moduleName - Target module name (client, invoice, quote, etc.)
   * @param {string} userId - User ID for OpenAI API key lookup
   * @returns {Promise<Object>} - Extracted and structured data
   */
  async extractForModule(filePath, moduleName, userId) {
    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Extract raw text using Tesseract
      let extractedText = '';
      let confidence = 0;

      try {
        const result = await this.worker.recognize(filePath);
        extractedText = result.data.text.trim();
        confidence = result.data.confidence;
      } catch (tesseractError) {
        console.log('Tesseract failed, using AI-based OCR...');
        const aiResult = await this.extractUsingAI(filePath, userId);
        extractedText = aiResult.text;
        confidence = aiResult.confidence || 0;
      }

      if (!extractedText) {
        return {
          success: false,
          error: 'No text extracted from image',
          data: null,
        };
      }

      // Use AI to structure the data according to module schema
      const structuredData = await this.structureDataWithAI(extractedText, moduleName, userId);

      return {
        success: true,
        data: structuredData,
        rawText: extractedText,
        confidence: confidence,
        method: 'ocr+ai',
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Extract text using AI vision (fallback for Tesseract failure)
   */
  async extractUsingAI(imagePath, userId) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase().substring(1);
      const mimeType = this.getMimeType(ext);

      const prompt = `Extract all text content from this image. Return only the extracted text, maintaining the original formatting and structure as much as possible.`;

      // Get OpenAI helper for the user
      const openaiHelper = await OpenAIHelper.createForUser(userId);

      if (!openaiHelper.hasApiKey()) {
        throw new Error(
          'OpenAI API key not configured. Please add your API key in Settings > AI Settings.'
        );
      }

      const response = await openaiHelper.chatCompletion({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        parameters: {
          temperature: 0.1,
          maxTokens: 2000,
        },
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      return {
        text: response.data.choices[0].message.content,
        confidence: 85,
      };
    } catch (error) {
      console.error('AI OCR failed:', error);
      throw error;
    }
  }

  /**
   * Use AI to structure extracted text according to module schema
   */
  async structureDataWithAI(extractedText, moduleName, userId) {
    try {
      const schema = getModuleSchema(moduleName);

      const prompt = `You are a data extraction expert. Extract structured information from the following text and format it according to the specified schema.

Module: ${schema.name}
Task: ${schema.aiPrompt}

Fields to extract:
${Object.entries(schema.fields)
  .map(
    ([fieldName, config]) =>
      `- ${fieldName} (${config.type}${config.required ? ', required' : ''}): ${
        config.aliases?.join(', ') || fieldName
      }`
  )
  .join('\n')}

Raw Text:
${extractedText}

Instructions:
1. Extract all relevant information from the text
2. Match extracted data to the specified fields
3. For array fields (like items), extract multiple entries if present
4. For reference fields (like client), extract the name/identifier
5. Parse dates in ISO format (YYYY-MM-DD)
6. Return ONLY valid JSON without any markdown formatting or code blocks
7. Use null for fields that cannot be found
8. For numeric fields, return actual numbers not strings

Return the extracted data as a JSON object.`;

      // Get OpenAI helper for the user
      const openaiHelper = await OpenAIHelper.createForUser(userId);

      if (!openaiHelper.hasApiKey()) {
        throw new Error(
          'OpenAI API key not configured. Please add your API key in Settings > AI Settings.'
        );
      }

      const response = await openaiHelper.chatCompletion({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        parameters: {
          temperature: 0.1,
          maxTokens: 2000,
        },
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      // Parse AI response
      let structuredData;
      try {
        // Extract content from OpenAI response
        const aiContent = response.data.choices[0].message.content;

        // Remove markdown code blocks if present
        let jsonStr = aiContent.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        structuredData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Failed to parse extracted data');
      }

      return structuredData;
    } catch (error) {
      console.error('Failed to structure data with AI:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple images/PDFs
   */
  async batchExtract(filePaths, moduleName) {
    const results = [];

    for (const filePath of filePaths) {
      const result = await this.extractForModule(filePath, moduleName);
      results.push({
        file: path.basename(filePath),
        ...result,
      });
    }

    return {
      success: true,
      totalProcessed: filePaths.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results: results,
    };
  }

  /**
   * Get MIME type for image extension
   */
  getMimeType(ext) {
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Cleanup worker
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
module.exports = new EnhancedOCRService();
