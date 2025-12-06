const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs').promises;
const { Readable } = require('stream');
const aiService = require('../aiService');
const { getModuleSchema, findFieldMapping, validateData } = require('./moduleSchemas');

/**
 * Enhanced Spreadsheet Automation Service
 * Intelligently imports and maps data from CSV/Excel files to module schemas
 */
class EnhancedSpreadsheetService {
  /**
   * Import spreadsheet data for a specific module with intelligent column mapping
   * @param {string} filePath - Path to CSV/Excel file
   * @param {string} moduleName - Target module name
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import results with mapped data
   */
  async importForModule(filePath, moduleName, options = {}) {
    try {
      const {
        autoMap = true, // Automatically map columns to fields
        validateRows = true, // Validate each row
        useAI = true, // Use AI for ambiguous mappings
        sheetName = null, // Specific sheet name for Excel files
      } = options;

      // Determine file type and parse
      const fileExt = filePath.toLowerCase().split('.').pop();
      let rawData;
      let columns;

      if (fileExt === 'csv') {
        const parseResult = await this.parseCSV(filePath);
        rawData = parseResult.data;
        columns = parseResult.columns;
      } else if (['xlsx', 'xls'].includes(fileExt)) {
        const parseResult = await this.parseExcel(filePath, sheetName);
        rawData = parseResult.data;
        columns = parseResult.columns;
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }

      if (!rawData || rawData.length === 0) {
        return {
          success: false,
          error: 'No data found in file',
          data: [],
        };
      }

      // Get module schema
      const schema = getModuleSchema(moduleName);

      // Map columns to schema fields
      let columnMapping;
      if (autoMap) {
        columnMapping = await this.autoMapColumns(columns, schema, useAI);
      } else {
        columnMapping = this.createDefaultMapping(columns);
      }

      // Transform and validate data
      const results = {
        success: true,
        totalRows: rawData.length,
        validRows: 0,
        invalidRows: 0,
        data: [],
        errors: [],
        warnings: [],
        columnMapping: columnMapping,
      };

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // +2 because row 1 is headers and we start from 0

        try {
          // Map row data to schema fields
          const mappedData = this.mapRowData(row, columnMapping, schema);

          // Validate if requested
          if (validateRows) {
            const validation = validateData(moduleName, mappedData);

            if (!validation.valid) {
              results.invalidRows++;
              results.errors.push({
                row: rowNumber,
                data: row,
                errors: validation.errors,
              });
              continue;
            }

            if (validation.warnings.length > 0) {
              results.warnings.push({
                row: rowNumber,
                data: row,
                warnings: validation.warnings,
              });
            }
          }

          results.validRows++;
          results.data.push({
            row: rowNumber,
            data: mappedData,
            original: row,
          });
        } catch (error) {
          results.invalidRows++;
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: [{ message: error.message, type: 'mapping_error' }],
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Spreadsheet import failed:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const results = [];
    let columns = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from([content]);

      stream
        .pipe(csv())
        .on('headers', (headers) => {
          columns = headers;
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          resolve({
            success: true,
            data: results,
            columns: columns,
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parse Excel file
   */
  async parseExcel(filePath, sheetName = null) {
    const workbook = XLSX.readFile(filePath);
    const targetSheet = sheetName || workbook.SheetNames[0];

    if (!workbook.Sheets[targetSheet]) {
      throw new Error(`Sheet '${targetSheet}' not found`);
    }

    const worksheet = workbook.Sheets[targetSheet];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    // Extract column names from first row
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return {
      success: true,
      data: data,
      columns: columns,
      availableSheets: workbook.SheetNames,
    };
  }

  /**
   * Automatically map spreadsheet columns to schema fields
   */
  async autoMapColumns(columns, schema, useAI = true) {
    const mapping = {};
    const unmappedColumns = [];

    // First pass: Direct and alias matching
    for (const column of columns) {
      const fieldMatch = findFieldMapping(schema.name.toLowerCase(), column);

      if (fieldMatch) {
        mapping[column] = {
          field: fieldMatch.fieldName,
          confidence: 'high',
          method: 'direct',
        };
      } else {
        unmappedColumns.push(column);
      }
    }

    // Second pass: Use AI for unmapped columns if enabled
    if (useAI && unmappedColumns.length > 0) {
      const aiMappings = await this.mapColumnsWithAI(unmappedColumns, schema);
      Object.assign(mapping, aiMappings);
    }

    return mapping;
  }

  /**
   * Use AI to map ambiguous columns to schema fields
   */
  async mapColumnsWithAI(columns, schema) {
    try {
      const schemaFields = Object.entries(schema.fields).map(([name, config]) => ({
        name,
        type: config.type,
        aliases: config.aliases || [],
      }));

      const prompt = `You are a data mapping expert. Map the following spreadsheet column names to the appropriate schema fields.

Module: ${schema.name}

Available Schema Fields:
${JSON.stringify(schemaFields, null, 2)}

Spreadsheet Columns to Map:
${columns.map((col, i) => `${i + 1}. "${col}"`).join('\n')}

Instructions:
1. For each column, determine which schema field it most likely represents
2. If a column doesn't match any field, map it to null
3. Consider synonyms, abbreviations, and common variations
4. Return ONLY valid JSON without markdown formatting

Return a JSON object with this structure:
{
  "column_name": {
    "field": "schema_field_name" or null,
    "confidence": "high" | "medium" | "low",
    "reason": "brief explanation"
  }
}`;

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        maxTokens: 1500,
      });

      // Parse AI response
      let aiMappings;
      try {
        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        aiMappings = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI mapping response:', parseError);
        return {};
      }

      // Transform to our mapping format
      const mapping = {};
      for (const [column, mappingInfo] of Object.entries(aiMappings)) {
        if (mappingInfo.field) {
          mapping[column] = {
            field: mappingInfo.field,
            confidence: mappingInfo.confidence || 'medium',
            method: 'ai',
            reason: mappingInfo.reason,
          };
        }
      }

      return mapping;
    } catch (error) {
      console.error('AI column mapping failed:', error);
      return {};
    }
  }

  /**
   * Create default 1:1 column mapping
   */
  createDefaultMapping(columns) {
    const mapping = {};
    for (const column of columns) {
      mapping[column] = {
        field: column,
        confidence: 'low',
        method: 'default',
      };
    }
    return mapping;
  }

  /**
   * Map row data according to column mapping
   */
  mapRowData(row, columnMapping, schema) {
    const mappedData = {};

    for (const [column, value] of Object.entries(row)) {
      const mapping = columnMapping[column];

      if (mapping && mapping.field) {
        const fieldConfig = schema.fields[mapping.field];

        if (fieldConfig) {
          // Transform value based on field type
          mappedData[mapping.field] = this.transformValue(value, fieldConfig);
        }
      }
    }

    return mappedData;
  }

  /**
   * Transform value based on field type
   */
  transformValue(value, fieldConfig) {
    if (value === null || value === undefined || value === '') {
      return fieldConfig.default !== undefined ? fieldConfig.default : null;
    }

    switch (fieldConfig.type) {
      case 'number':
        return Number(value);

      case 'boolean':
        if (typeof value === 'boolean') return value;
        {
          const strValue = String(value).toLowerCase();
          return ['true', 'yes', '1', 'y'].includes(strValue);
        }

      case 'date':
      case 'datetime':
        return new Date(value);

      case 'array':
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v);
        }
        return [value];

      case 'string':
      case 'email':
      case 'phone':
      case 'url':
      default:
        return String(value).trim();
    }
  }

  /**
   * Export data to spreadsheet
   */
  async exportToSpreadsheet(data, filePath) {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        filePath: filePath,
      };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get preview of spreadsheet data (first N rows)
   */
  async getPreview(filePath, rows = 5) {
    const fileExt = filePath.toLowerCase().split('.').pop();

    if (fileExt === 'csv') {
      const result = await this.parseCSV(filePath);
      return {
        success: true,
        columns: result.columns,
        preview: result.data.slice(0, rows),
        totalRows: result.data.length,
      };
    } else if (['xlsx', 'xls'].includes(fileExt)) {
      const result = await this.parseExcel(filePath);
      return {
        success: true,
        columns: result.columns,
        preview: result.data.slice(0, rows),
        totalRows: result.data.length,
        sheets: result.availableSheets,
      };
    }

    throw new Error(`Unsupported file type: ${fileExt}`);
  }
}

// Export singleton instance
module.exports = new EnhancedSpreadsheetService();
