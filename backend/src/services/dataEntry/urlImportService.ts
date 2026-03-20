// @ts-nocheck
const axios = require('axios');
const cheerio = require('cheerio');
const aiService = require('../aiService');
const { getModuleSchema, validateData } = require('./moduleSchemas');

/**
 * URL Data Import Service
 * Extracts and imports data from web URLs with AI-powered content extraction
 */
class URLImportService {
  /**
   * Import data from URL for a specific module
   * @param {string} url - Target URL to scrape
   * @param {string} moduleName - Target module name
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Extracted and structured data
   */
  async importFromURL(url, moduleName, options = {}) {
    try {
      const {
        useAI = true, // Use AI for content extraction
        validateResult = true, // Validate extracted data
        timeout = 10000, // Request timeout
        selectors = null, // Custom CSS selectors
      } = options;

      // Validate URL
      if (!this.isValidURL(url)) {
        return {
          success: false,
          error: 'Invalid URL format',
          data: null,
        };
      }

      // Fetch page content
      const pageContent = await this.fetchPageContent(url, timeout);

      if (!pageContent.success) {
        return {
          success: false,
          error: pageContent.error,
          data: null,
        };
      }

      // Extract structured data
      let extractedData;

      if (useAI) {
        extractedData = await this.extractWithAI(
          pageContent.html,
          pageContent.text,
          moduleName,
          url
        );
      } else if (selectors) {
        extractedData = this.extractWithSelectors(pageContent.html, selectors);
      } else {
        extractedData = this.extractBasicInfo(pageContent.html, pageContent.text);
      }

      // Validate if requested
      if (validateResult && extractedData) {
        const validation = validateData(moduleName, extractedData);

        if (!validation.valid) {
          return {
            success: false,
            error: 'Validation failed',
            data: extractedData,
            validationErrors: validation.errors,
            validationWarnings: validation.warnings,
          };
        }

        return {
          success: true,
          data: extractedData,
          url: url,
          validationWarnings: validation.warnings,
        };
      }

      return {
        success: true,
        data: extractedData,
        url: url,
      };
    } catch (error) {
      console.error('URL import failed:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Batch import from multiple URLs
   */
  async batchImport(urls, moduleName, options = {}) {
    const results = [];

    for (const url of urls) {
      const result = await this.importFromURL(url, moduleName, options);
      results.push({
        url: url,
        ...result,
      });

      // Add delay between requests to avoid rate limiting
      await this.delay(1000);
    }

    return {
      success: true,
      totalProcessed: urls.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results: results,
    };
  }

  /**
   * Fetch page content from URL
   */
  async fetchPageContent(url, timeout = 10000) {
    try {
      const response = await axios.get(url, {
        timeout: timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      // Remove script, style, and other non-content elements
      $('script, style, noscript, iframe').remove();

      const text = $('body').text().replace(/\s+/g, ' ').trim();
      const html = response.data;

      return {
        success: true,
        html: html,
        text: text,
        statusCode: response.status,
      };
    } catch (error) {
      console.error('Failed to fetch URL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract data using AI
   */
  async extractWithAI(html, text, moduleName, url) {
    try {
      const schema = getModuleSchema(moduleName);
      const $ = cheerio.load(html);

      // Extract structured data hints (JSON-LD, microdata, etc.)
      const structuredData = this.extractStructuredData($);

      const prompt = `You are a web scraping expert. Extract structured information from the following webpage content and format it according to the specified schema.

URL: ${url}
Module: ${schema.name}
Task: ${schema.aiPrompt}

Fields to extract:
${Object.entries(schema.fields)
  .map(
    ([fieldName, config]) => `- ${fieldName} (${config.type}${config.required ? ', required' : ''})`
  )
  .join('\n')}

${structuredData ? `Structured Data Found:\n${JSON.stringify(structuredData, null, 2)}\n` : ''}

Page Content (truncated):
${text.substring(0, 3000)}

Instructions:
1. Extract all relevant information from the page content
2. Use structured data (JSON-LD, microdata) if available
3. Match extracted data to the specified fields
4. For reference fields (like client), extract the name/identifier
5. Parse dates in ISO format (YYYY-MM-DD)
6. Return ONLY valid JSON without markdown formatting
7. Use null for fields that cannot be found
8. Be intelligent about extracting contact info, names, addresses, etc.

Return the extracted data as a JSON object.`;

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        maxTokens: 2000,
      });

      // Parse AI response
      let extractedData;
      try {
        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        extractedData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Failed to parse extracted data');
      }

      return extractedData;
    } catch (error) {
      console.error('AI extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract data using custom CSS selectors
   */
  extractWithSelectors(html, selectors) {
    const $ = cheerio.load(html);
    const extractedData = {};

    for (const [field, selector] of Object.entries(selectors)) {
      try {
        const element = $(selector);
        if (element.length > 0) {
          extractedData[field] = element.text().trim();
        }
      } catch (error) {
        console.error(`Failed to extract field ${field}:`, error);
      }
    }

    return extractedData;
  }

  /**
   * Extract basic information without AI
   */
  extractBasicInfo(html, text) {
    const $ = cheerio.load(html);

    const info = {
      title: $('title').text().trim() || $('h1').first().text().trim(),
      description:
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        text.substring(0, 200),
    };

    // Try to extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      info.email = emailMatch[0];
    }

    // Try to extract phone
    const phoneMatch = text.match(/\+?[\d\s()-]{10,}/);
    if (phoneMatch) {
      info.phone = phoneMatch[0];
    }

    return info;
  }

  /**
   * Extract structured data (JSON-LD, microdata, etc.)
   */
  extractStructuredData($) {
    try {
      // JSON-LD
      const jsonLd = $('script[type="application/ld+json"]').first().html();
      if (jsonLd) {
        return JSON.parse(jsonLd);
      }

      // Open Graph
      const ogData = {};
      $('meta[property^="og:"]').each((i, elem) => {
        const property = $(elem).attr('property').replace('og:', '');
        const content = $(elem).attr('content');
        ogData[property] = content;
      });

      if (Object.keys(ogData).length > 0) {
        return ogData;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate URL format
   */
  isValidURL(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract data from API endpoint
   */
  async importFromAPI(url, moduleName, options = {}) {
    try {
      const {
        method = 'GET',
        headers = {},
        body = null,
        jsonPath = null, // Path to data in JSON response (e.g., 'data.users')
      } = options;

      const config = {
        method: method,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 10000,
      };

      if (body && method !== 'GET') {
        config.data = body;
      }

      const response = await axios(config);
      let data = response.data;

      // Navigate to specific path in JSON if provided
      if (jsonPath) {
        const paths = jsonPath.split('.');
        for (const path of paths) {
          data = data[path];
        }
      }

      // If data is an array, process each item
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data,
          count: data.length,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API import failed:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }
}

// Export singleton instance
module.exports = new URLImportService();
