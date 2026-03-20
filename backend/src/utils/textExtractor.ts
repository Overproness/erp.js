// @ts-nocheck
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Extract text content from various document types
 * Supports: PDF, DOCX, TXT, CSV, JSON, MD, HTML, Images (OCR), Spreadsheets
 */
class TextExtractor {
  constructor() {
    // Lazy load heavy dependencies
    this.ocrService = null;
    this.spreadsheetService = null;
  }

  /**
   * Get OCR service instance (lazy loading)
   */
  getOCRService() {
    if (!this.ocrService) {
      this.ocrService = require('@/services/ocrService');
    }
    return this.ocrService;
  }

  /**
   * Get Spreadsheet service instance (lazy loading)
   */
  getSpreadsheetService() {
    if (!this.spreadsheetService) {
      this.spreadsheetService = require('@/services/spreadsheetService');
    }
    return this.spreadsheetService;
  }

  /**
   * Extract text from a file based on its type
   * @param {string} filePath - Absolute path to the file
   * @param {string} fileType - File extension (pdf, docx, txt, etc.)
   * @returns {Promise<{success: boolean, text: string, error?: string, metadata?: Object}>}
   */
  async extractText(filePath, fileType) {
    try {
      const normalizedType = fileType.toLowerCase().replace('.', '');

      // Check if it's an image that needs OCR
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'];
      if (imageTypes.includes(normalizedType)) {
        const ocrService = this.getOCRService();
        return await ocrService.extractFromImage(filePath);
      }

      // Check if it's a spreadsheet
      const spreadsheetTypes = ['csv', 'xlsx', 'xls', 'xlsm'];
      if (spreadsheetTypes.includes(normalizedType)) {
        return await this.extractFromSpreadsheet(filePath, normalizedType);
      }

      switch (normalizedType) {
        case 'txt':
        case 'text':
          return await this.extractFromText(filePath);

        case 'pdf':
          return await this.extractFromPDF(filePath);

        case 'doc':
        case 'docx':
          return await this.extractFromDOCX(filePath);

        case 'json':
          return await this.extractFromJSON(filePath);

        case 'md':
        case 'markdown':
          return await this.extractFromMarkdown(filePath);

        case 'html':
        case 'htm':
          return await this.extractFromHTML(filePath);

        case 'xml':
          return await this.extractFromXML(filePath);

        case 'rtf':
          return await this.extractFromRTF(filePath);

        default:
          return {
            success: false,
            text: '',
            error: `Unsupported file type: ${normalizedType}`,
          };
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from plain text files
   */
  async extractFromText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        text: content.trim(),
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from PDF files using pdf-parse
   * Falls back to OCR for scanned PDFs
   */
  async extractFromPDF(filePath) {
    try {
      // Try to require pdf-parse
      let pdfParse;
      try {
        pdfParse = require('pdf-parse');
      } catch (e) {
        return {
          success: false,
          text: '',
          error: 'pdf-parse module not installed. Run: npm install pdf-parse',
        };
      }

      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);

      const extractedText = data.text.trim();

      // If extracted text is too short, it might be a scanned PDF
      if (extractedText.length < 50) {
        console.log('PDF appears to be scanned, attempting OCR...');
        const ocrService = this.getOCRService();
        const ocrResult = await ocrService.extractFromPDF(filePath);

        if (ocrResult.success && ocrResult.text.length > extractedText.length) {
          return ocrResult;
        }
      }

      return {
        success: true,
        text: extractedText,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from DOCX files using mammoth
   */
  async extractFromDOCX(filePath) {
    try {
      // Try to require mammoth
      let mammoth;
      try {
        mammoth = require('mammoth');
      } catch (e) {
        return {
          success: false,
          text: '',
          error: 'mammoth module not installed. Run: npm install mammoth',
        };
      }

      const result = await mammoth.extractRawText({ path: filePath });

      return {
        success: true,
        text: result.value.trim(),
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from spreadsheet files (CSV, XLSX)
   */
  async extractFromSpreadsheet(filePath, fileType) {
    try {
      const spreadsheetService = this.getSpreadsheetService();
      const result = await spreadsheetService.processSpreadsheet(filePath, fileType);

      if (!result.success) {
        return {
          success: false,
          text: '',
          error: result.errors[0]?.message || 'Failed to parse spreadsheet',
        };
      }

      // Format spreadsheet data as text
      const text = spreadsheetService.formatDataForAI(result.data, result.metadata);

      return {
        success: true,
        text: text,
        metadata: {
          ...result.metadata,
          errors: result.errors,
          format: result.format,
          sheets: result.sheets ? Object.keys(result.sheets) : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from CSV files (deprecated - use extractFromSpreadsheet)
   */
  async extractFromCSV(filePath) {
    return await this.extractFromSpreadsheet(filePath, 'csv');
  }

  /**
   * Extract text from JSON files
   */
  async extractFromJSON(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(content);

      // Convert JSON to readable text
      const text = JSON.stringify(jsonData, null, 2);

      return {
        success: true,
        text: text.trim(),
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from Markdown files
   */
  async extractFromMarkdown(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Remove markdown formatting for cleaner text
      const text = content
        .replace(/^#{1,6}\s+/gm, '') // Remove headers
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.+?)\*/g, '$1') // Remove italic
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
        .replace(/`{1,3}(.+?)`{1,3}/g, '$1') // Remove code blocks
        .trim();

      return {
        success: true,
        text,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from HTML files
   */
  async extractFromHTML(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Basic HTML tag removal
      const text = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      return {
        success: true,
        text,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from XML files
   */
  async extractFromXML(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Remove XML tags
      const text = content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        success: true,
        text,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text from RTF files
   */
  async extractFromRTF(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Basic RTF tag removal
      const text = content
        .replace(/\{\\[^}]+\}/g, '') // Remove RTF control words
        .replace(/[{}]/g, '') // Remove braces
        .replace(/\\\w+\s?/g, '') // Remove RTF commands
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      return {
        success: true,
        text,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error.message,
      };
    }
  }

  /**
   * Truncate text to a maximum length
   */
  truncateText(text, maxLength = 50000) {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '... [truncated]';
  }
}

module.exports = new TextExtractor();
