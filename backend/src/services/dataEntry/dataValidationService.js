const aiService = require('../aiService');
const { getModuleSchema, validateData } = require('./moduleSchemas');

/**
 * Data Validation and AI Enhancement Service
 * Validates, categorizes, and enhances imported data using AI
 */
class DataValidationService {
  /**
   * Validate and enhance bulk data
   * @param {Array} dataArray - Array of data objects to validate
   * @param {string} moduleName - Target module name
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} - Validation results with enhanced data
   */
  async validateBulk(dataArray, moduleName, options = {}) {
    try {
      const {
        enhanceWithAI = true, // Use AI to enhance/clean data
        autoFix = true, // Automatically fix common issues
        categorize = true, // Categorize data using AI
        deduplication = true, // Check for duplicates
      } = options;

      const results = {
        success: true,
        totalItems: dataArray.length,
        validItems: 0,
        invalidItems: 0,
        enhancedItems: 0,
        duplicates: 0,
        items: [],
        errors: [],
        warnings: [],
      };

      // Track potential duplicates
      const seenItems = new Map();

      for (let i = 0; i < dataArray.length; i++) {
        const item = dataArray[i];
        const itemResult = {
          index: i,
          original: item,
          enhanced: { ...item },
          valid: false,
          errors: [],
          warnings: [],
          enhancements: [],
        };

        try {
          // Auto-fix common issues
          if (autoFix) {
            itemResult.enhanced = this.autoFixData(itemResult.enhanced, moduleName);
          }

          // Validate data
          const validation = validateData(moduleName, itemResult.enhanced);
          itemResult.valid = validation.valid;
          itemResult.errors = validation.errors;
          itemResult.warnings = validation.warnings;

          if (validation.valid) {
            results.validItems++;
          } else {
            results.invalidItems++;
          }

          // Enhance with AI if enabled and item is valid
          if (enhanceWithAI && validation.valid) {
            const enhanced = await this.enhanceWithAI(itemResult.enhanced, moduleName);
            if (enhanced.success) {
              itemResult.enhanced = enhanced.data;
              itemResult.enhancements = enhanced.enhancements;
              results.enhancedItems++;
            }
          }

          // Categorize data
          if (categorize && validation.valid) {
            const category = await this.categorizeData(itemResult.enhanced, moduleName);
            if (category) {
              itemResult.enhanced.aiCategory = category.category;
              itemResult.enhanced.aiTags = category.tags;
              itemResult.enhancements.push('Added AI categorization');
            }
          }

          // Check for duplicates
          if (deduplication) {
            const duplicateKey = this.generateDuplicateKey(itemResult.enhanced, moduleName);
            if (seenItems.has(duplicateKey)) {
              itemResult.warnings.push({
                field: 'duplicate',
                message: `Potential duplicate of item at index ${seenItems.get(duplicateKey)}`,
                type: 'duplicate',
              });
              results.duplicates++;
            } else {
              seenItems.set(duplicateKey, i);
            }
          }
        } catch (error) {
          itemResult.errors.push({
            message: error.message,
            type: 'processing_error',
          });
          results.invalidItems++;
        }

        results.items.push(itemResult);
      }

      return results;
    } catch (error) {
      console.error('Bulk validation failed:', error);
      return {
        success: false,
        error: error.message,
        items: [],
      };
    }
  }

  /**
   * Automatically fix common data issues
   */
  autoFixData(data, moduleName) {
    const fixed = { ...data };
    const schema = getModuleSchema(moduleName);

    for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
      const value = fixed[fieldName];

      if (value === undefined || value === null || value === '') {
        continue;
      }

      switch (fieldConfig.type) {
        case 'email':
          // Trim and lowercase emails
          fixed[fieldName] = String(value).trim().toLowerCase();
          break;

        case 'phone':
          // Remove common phone formatting characters
          fixed[fieldName] = String(value).replace(/[\s\-().]/g, '');
          break;

        case 'string':
          // Trim strings
          fixed[fieldName] = String(value).trim();
          // Fix common encoding issues
          fixed[fieldName] = fixed[fieldName].replace(/â€™/g, "'").replace(/â€"/g, '—');
          break;

        case 'number':
          // Remove currency symbols and commas
          if (typeof value === 'string') {
            const cleaned = value.replace(/[$,€£¥]/g, '').trim();
            fixed[fieldName] = parseFloat(cleaned);
          }
          break;

        case 'date':
        case 'datetime': {
          // Ensure date is in proper format
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            fixed[fieldName] = date.toISOString();
          }
          break;
        }

        case 'array':
          // Ensure arrays are properly formatted
          if (typeof value === 'string') {
            fixed[fieldName] = value
              .split(',')
              .map((v) => v.trim())
              .filter((v) => v);
          }
          break;
      }
    }

    return fixed;
  }

  /**
   * Enhance data using AI
   */
  async enhanceWithAI(data, moduleName) {
    try {
      const schema = getModuleSchema(moduleName);

      const prompt = `You are a data enhancement expert. Review and enhance the following data entry for the ${
        schema.name
      } module.

Current Data:
${JSON.stringify(data, null, 2)}

Tasks:
1. Fill in any missing optional fields if they can be reasonably inferred
2. Standardize formats (addresses, phone numbers, etc.)
3. Add relevant tags or categories if applicable
4. Expand abbreviations where appropriate
5. Correct obvious typos or formatting issues
6. Do NOT change required fields or modify core data
7. Do NOT hallucinate data - only enhance what's already there

Return the enhanced data as JSON with the same structure. Also include an "enhancements" array listing what you changed.

Format:
{
  "data": { enhanced data object },
  "enhancements": ["list", "of", "changes", "made"]
}`;

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        maxTokens: 1500,
      });

      // Parse AI response
      let result;
      try {
        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        result = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI enhancement response:', parseError);
        return {
          success: false,
          data: data,
          enhancements: [],
        };
      }

      return {
        success: true,
        data: result.data || data,
        enhancements: result.enhancements || [],
      };
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return {
        success: false,
        data: data,
        enhancements: [],
      };
    }
  }

  /**
   * Categorize data using AI
   */
  async categorizeData(data, moduleName) {
    try {
      const schema = getModuleSchema(moduleName);

      // Define category options based on module
      const categoryPrompts = {
        client:
          'Categorize this customer/client (e.g., "Enterprise", "SMB", "Startup", "Individual"). Also suggest relevant tags.',
        quote:
          'Categorize this quote (e.g., "Product", "Service", "Consulting", "Maintenance"). Also suggest relevant tags.',
        invoice:
          'Categorize this invoice (e.g., "Product Sale", "Service Delivery", "Subscription", "One-time"). Also suggest relevant tags.',
        task: 'Categorize this task (e.g., "Sales", "Support", "Development", "Administrative"). Also suggest relevant tags.',
        appointment:
          'Categorize this appointment (e.g., "Sales Meeting", "Support Call", "Demo", "Training"). Also suggest relevant tags.',
      };

      const categoryPrompt =
        categoryPrompts[moduleName.toLowerCase()] ||
        `Categorize this ${schema.name} entry and suggest relevant tags.`;

      const prompt = `${categoryPrompt}

Data:
${JSON.stringify(data, null, 2)}

Return JSON with this structure (no markdown):
{
  "category": "main category",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 500,
      });

      // Parse AI response
      try {
        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI categorization response:', parseError);
        return null;
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
      return null;
    }
  }

  /**
   * Generate duplicate detection key
   */
  generateDuplicateKey(data, moduleName) {
    const schema = getModuleSchema(moduleName);
    const keyParts = [];

    // Use key fields for duplicate detection based on module
    const keyFields = {
      client: ['email', 'name'],
      quote: ['client', 'number'],
      invoice: ['client', 'number'],
      payment: ['invoice', 'ref'],
      task: ['title', 'client'],
      appointment: ['title', 'startDate', 'client'],
      team: ['email'],
    };

    const fields = keyFields[moduleName.toLowerCase()] || ['name', 'email'];

    for (const field of fields) {
      if (data[field]) {
        keyParts.push(String(data[field]).toLowerCase().trim());
      }
    }

    return keyParts.join('|');
  }

  /**
   * Flag potential data quality issues
   */
  async analyzeDataQuality(data, moduleName) {
    try {
      const issues = [];
      const schema = getModuleSchema(moduleName);

      // Check for suspicious patterns
      for (const [fieldName, value] of Object.entries(data)) {
        if (!value) continue;

        const fieldConfig = schema.fields[fieldName];
        if (!fieldConfig) continue;

        // Check for placeholder text
        const placeholders = ['test', 'example', 'sample', 'dummy', 'todo', 'tbd', 'xxx', 'n/a'];
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          if (placeholders.some((p) => lowerValue.includes(p))) {
            issues.push({
              field: fieldName,
              message: `Field contains placeholder text: "${value}"`,
              severity: 'warning',
            });
          }
        }

        // Check for unusual patterns
        if (fieldConfig.type === 'email' && typeof value === 'string') {
          if (!value.includes('.')) {
            issues.push({
              field: fieldName,
              message: 'Email address missing domain extension',
              severity: 'error',
            });
          }
        }

        // Check for very short or very long strings
        if (fieldConfig.type === 'string' && typeof value === 'string') {
          if (value.length < 2 && fieldConfig.required) {
            issues.push({
              field: fieldName,
              message: 'Field value seems too short',
              severity: 'warning',
            });
          }
          if (value.length > 500) {
            issues.push({
              field: fieldName,
              message: 'Field value seems unusually long',
              severity: 'warning',
            });
          }
        }
      }

      return {
        hasIssues: issues.length > 0,
        issues: issues,
        score: Math.max(0, 100 - issues.length * 10),
      };
    } catch (error) {
      console.error('Data quality analysis failed:', error);
      return {
        hasIssues: false,
        issues: [],
        score: 50,
      };
    }
  }

  /**
   * Smart field completion using AI
   */
  async completeFields(partialData, moduleName) {
    try {
      const schema = getModuleSchema(moduleName);

      const prompt = `You are a data completion expert. Given partial data for a ${
        schema.name
      }, try to intelligently complete missing fields based on the provided information.

Partial Data:
${JSON.stringify(partialData, null, 2)}

Schema Fields:
${Object.entries(schema.fields)
  .map(([name, config]) => `- ${name} (${config.type}${config.required ? ', required' : ''})`)
  .join('\n')}

Rules:
1. Only complete fields where you have HIGH confidence
2. Do NOT make up or hallucinate data
3. Use logical inference (e.g., if company name is "Google", industry might be "Technology")
4. Maintain data consistency
5. Return null for fields you cannot confidently complete

Return completed data as JSON (no markdown).`;

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        maxTokens: 1500,
      });

      // Parse AI response
      try {
        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI completion response:', parseError);
        return partialData;
      }
    } catch (error) {
      console.error('AI field completion failed:', error);
      return partialData;
    }
  }
}

// Export singleton instance
module.exports = new DataValidationService();
