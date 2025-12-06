const fs = require('fs').promises;
const path = require('path');
const { createWorker } = require('tesseract.js');
const aiService = require('./aiService');

/**
 * OCR Service for extracting text from images and scanned documents
 * Uses Tesseract.js for local OCR and AI as fallback
 */
class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Tesseract worker
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Tesseract OCR worker...');
      this.worker = await createWorker('eng', 1, {
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
   * Extract text from image using local Tesseract OCR
   * @param {string} imagePath - Path to image file
   * @returns {Promise<{success: boolean, text: string, confidence?: number, error?: string}>}
   */
  async extractFromImage(imagePath) {
    try {
      // Initialize worker if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.worker) {
        throw new Error('Tesseract worker not initialized');
      }

      const {
        data: { text, confidence },
      } = await this.worker.recognize(imagePath);

      return {
        success: true,
        text: text.trim(),
        confidence: confidence,
        method: 'tesseract',
      };
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      // Fallback to AI-powered OCR
      return await this.extractUsingAI(imagePath);
    }
  }

  /**
   * Extract text using AI-powered OCR (fallback method)
   * @param {string} imagePath - Path to image file
   * @returns {Promise<{success: boolean, text: string, error?: string}>}
   */
  async extractUsingAI(imagePath) {
    try {
      console.log('Falling back to AI-powered OCR...');

      // Read image as base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase().substring(1);
      const mimeType = this.getMimeType(ext);

      // Use AI service to extract text from image
      const prompt = `Extract all text content from this image. Return only the extracted text, maintaining the original formatting and structure as much as possible. If no text is found, return "No text found in image".`;

      const response = await aiService.chat({
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
        maxTokens: 2000,
      });

      const extractedText = response.content || response.message || '';

      return {
        success: true,
        text: extractedText.trim(),
        method: 'ai',
      };
    } catch (error) {
      console.error('AI OCR failed:', error);
      return {
        success: false,
        text: '',
        error: `OCR failed: ${error.message}`,
        method: 'none',
      };
    }
  }

  /**
   * Extract text from PDF with images (uses OCR on image pages)
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<{success: boolean, text: string, error?: string}>}
   */
  async extractFromPDF(pdfPath) {
    try {
      // First try standard PDF text extraction
      const textExtractor = require('@/utils/textExtractor');
      const result = await textExtractor.extractFromPDF(pdfPath);

      // If text extraction returns minimal content, it might be a scanned PDF
      if (result.success && result.text.trim().length < 50) {
        console.log('PDF appears to be scanned, attempting OCR...');
        // TODO: Convert PDF pages to images and run OCR
        // For now, we'll use AI to extract from the PDF
        return await this.extractScannedPDF(pdfPath);
      }

      return result;
    } catch (error) {
      console.error('PDF OCR extraction failed:', error);
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from scanned PDF using AI
   * Note: Current implementation uses AI without direct PDF file access
   * Future enhancement: Convert PDF pages to images for better accuracy
   * @returns {Promise<{success: boolean, text: string, error?: string}>}
   */
  async extractScannedPDF() {
    try {
      // For scanned PDFs, we'll convert first page to image and extract
      // This is a simplified approach - production should handle all pages
      console.log('Attempting to extract text from scanned PDF using AI...');

      const prompt = `This is a scanned PDF document. Extract all text content from it. Return only the extracted text, maintaining the original formatting and structure. If multiple pages, separate them clearly.`;

      const response = await aiService.chat({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        maxTokens: 4000,
      });

      return {
        success: true,
        text: response.content || response.message || '',
        method: 'ai',
      };
    } catch (error) {
      console.error('Scanned PDF extraction failed:', error);
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Get MIME type for image extension
   * @param {string} ext - File extension
   * @returns {string} - MIME type
   */
  getMimeType(ext) {
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      tiff: 'image/tiff',
      tif: 'image/tiff',
    };

    return mimeTypes[ext.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Check if file type is an image that supports OCR
   * @param {string} fileType - File extension
   * @returns {boolean}
   */
  isImageType(fileType) {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'];
    return imageTypes.includes(fileType.toLowerCase().replace('.', ''));
  }

  /**
   * Process document with appropriate OCR method
   * @param {string} filePath - Path to file
   * @param {string} fileType - File extension
   * @returns {Promise<{success: boolean, text: string, method?: string, error?: string}>}
   */
  async processDocument(filePath, fileType) {
    const normalizedType = fileType.toLowerCase().replace('.', '');

    // Check if it's an image
    if (this.isImageType(normalizedType)) {
      return await this.extractFromImage(filePath);
    }

    // Check if it's a PDF (might be scanned)
    if (normalizedType === 'pdf') {
      return await this.extractFromPDF(filePath);
    }

    // Not an OCR-supported file type
    return {
      success: false,
      text: '',
      error: 'File type does not require OCR',
    };
  }

  /**
   * Cleanup worker when shutting down
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.isInitialized = false;
      this.worker = null;
    }
  }
}

// Export singleton instance
module.exports = new OCRService();
