// @ts-nocheck
const fs = require('fs').promises;
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');

/**
 * Spreadsheet Automation Service
 * Handles CSV and XLSX file parsing with data validation and error detection
 */
class SpreadsheetService {
  /**
   * Parse CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<{success: boolean, data: Array, errors: Array, metadata: Object}>}
   */
  async parseCSV(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const results = [];
      const errors = [];

      return new Promise((resolve) => {
        const stream = Readable.from([content]);
        let rowNumber = 0;

        stream
          .pipe(csv())
          .on('data', (data) => {
            rowNumber++;
            // Validate row
            const validation = this.validateRow(data, rowNumber);
            if (validation.errors.length > 0) {
              errors.push(...validation.errors);
            }
            results.push(data);
          })
          .on('end', () => {
            const metadata = this.generateMetadata(results);
            resolve({
              success: true,
              data: results,
              errors: errors,
              metadata: metadata,
              format: 'csv',
            });
          })
          .on('error', (error) => {
            resolve({
              success: false,
              data: [],
              errors: [{ message: error.message, type: 'parsing_error' }],
              metadata: {},
              format: 'csv',
            });
          });
      });
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{ message: error.message, type: 'file_read_error' }],
        metadata: {},
        format: 'csv',
      };
    }
  }

  /**
   * Parse XLSX/XLS file
   * @param {string} filePath - Path to Excel file
   * @returns {Promise<{success: boolean, data: Array, errors: Array, metadata: Object, sheets: Object}>}
   */
  async parseExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const allSheets = {};
      const errors = [];
      let totalRows = 0;

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Validate each row
        sheetData.forEach((row, index) => {
          const validation = this.validateRow(row, index + 1, sheetName);
          if (validation.errors.length > 0) {
            errors.push(...validation.errors);
          }
        });

        allSheets[sheetName] = sheetData;
        totalRows += sheetData.length;
      }

      // Get first sheet as main data
      const firstSheetName = workbook.SheetNames[0];
      const mainData = allSheets[firstSheetName] || [];

      return {
        success: true,
        data: mainData,
        sheets: allSheets,
        errors: errors,
        metadata: {
          ...this.generateMetadata(mainData),
          totalSheets: workbook.SheetNames.length,
          sheetNames: workbook.SheetNames,
          totalRows: totalRows,
        },
        format: 'excel',
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        sheets: {},
        errors: [{ message: error.message, type: 'parsing_error' }],
        metadata: {},
        format: 'excel',
      };
    }
  }

  /**
   * Validate a single row of data
   * @param {Object} row - Row data
   * @param {number} rowNumber - Row number
   * @param {string} sheetName - Sheet name (for Excel files)
   * @returns {Object} - Validation result
   */
  validateRow(row, rowNumber, sheetName = null) {
    const errors = [];

    // Check for empty rows
    const values = Object.values(row);
    const hasData = values.some((val) => val !== '' && val !== null && val !== undefined);

    if (!hasData) {
      errors.push({
        row: rowNumber,
        sheet: sheetName,
        type: 'empty_row',
        message: `Row ${rowNumber}${sheetName ? ` in sheet "${sheetName}"` : ''} is empty`,
        severity: 'warning',
      });
    }

    // Check for data type inconsistencies
    Object.entries(row).forEach(([column, value]) => {
      // Check for potential data issues
      if (typeof value === 'string') {
        // Check for numeric strings that might be corrupted
        if (/^\d+$/.test(value) && value.startsWith('0') && value.length > 1) {
          errors.push({
            row: rowNumber,
            sheet: sheetName,
            column: column,
            value: value,
            type: 'leading_zero',
            message: `Column "${column}" in row ${rowNumber} has leading zeros that might be lost`,
            severity: 'warning',
          });
        }

        // Check for potential date strings
        if (this.isPotentialDate(value)) {
          errors.push({
            row: rowNumber,
            sheet: sheetName,
            column: column,
            value: value,
            type: 'potential_date',
            message: `Column "${column}" in row ${rowNumber} might be a date: "${value}"`,
            severity: 'info',
          });
        }
      }

      // Check for very long strings that might indicate issues
      if (typeof value === 'string' && value.length > 1000) {
        errors.push({
          row: rowNumber,
          sheet: sheetName,
          column: column,
          type: 'long_text',
          message: `Column "${column}" in row ${rowNumber} contains very long text (${value.length} characters)`,
          severity: 'warning',
        });
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate metadata about the dataset
   * @param {Array} data - Parsed data
   * @returns {Object} - Metadata
   */
  generateMetadata(data) {
    if (!data || data.length === 0) {
      return {
        rowCount: 0,
        columnCount: 0,
        columns: [],
        dataTypes: {},
      };
    }

    const columns = Object.keys(data[0]);
    const dataTypes = {};

    // Analyze data types for each column
    columns.forEach((column) => {
      const types = new Set();
      const samples = [];

      data.slice(0, 100).forEach((row) => {
        // Sample first 100 rows
        const value = row[column];
        if (value !== '' && value !== null && value !== undefined) {
          types.add(typeof value);
          if (samples.length < 5) {
            samples.push(value);
          }
        }
      });

      dataTypes[column] = {
        types: Array.from(types),
        primaryType: this.inferDataType(data, column),
        samples: samples,
      };
    });

    return {
      rowCount: data.length,
      columnCount: columns.length,
      columns: columns,
      dataTypes: dataTypes,
      hasHeader: true, // Assume first row is header
    };
  }

  /**
   * Infer the primary data type of a column
   * @param {Array} data - Dataset
   * @param {string} column - Column name
   * @returns {string} - Inferred type
   */
  inferDataType(data, column) {
    const samples = data.slice(0, 100).map((row) => row[column]);
    const nonEmpty = samples.filter((val) => val !== '' && val !== null && val !== undefined);

    if (nonEmpty.length === 0) return 'empty';

    const numericCount = nonEmpty.filter((val) => !isNaN(Number(val))).length;
    const dateCount = nonEmpty.filter((val) => this.isPotentialDate(String(val))).length;

    if (numericCount / nonEmpty.length > 0.8) return 'numeric';
    if (dateCount / nonEmpty.length > 0.8) return 'date';

    return 'text';
  }

  /**
   * Check if a string might be a date
   * @param {string} str - String to check
   * @returns {boolean}
   */
  isPotentialDate(str) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or MM/DD/YYYY
    ];

    return datePatterns.some((pattern) => pattern.test(str));
  }

  /**
   * Convert spreadsheet data to formatted text for AI analysis
   * @param {Array} data - Spreadsheet data
   * @param {Object} metadata - Metadata
   * @returns {string} - Formatted text
   */
  formatDataForAI(data, metadata) {
    if (!data || data.length === 0) return 'Empty spreadsheet';

    let text = `Spreadsheet Data Summary:\n`;
    text += `- Rows: ${metadata.rowCount}\n`;
    text += `- Columns: ${metadata.columnCount}\n`;
    text += `- Column Names: ${metadata.columns.join(', ')}\n\n`;

    // Include first few rows as sample
    text += `Sample Data (first 5 rows):\n`;
    const sampleRows = data.slice(0, 5);

    sampleRows.forEach((row, index) => {
      text += `Row ${index + 1}:\n`;
      Object.entries(row).forEach(([key, value]) => {
        text += `  ${key}: ${value}\n`;
      });
      text += '\n';
    });

    return text;
  }

  /**
   * Process spreadsheet file (auto-detect format)
   * @param {string} filePath - Path to file
   * @param {string} fileType - File extension
   * @returns {Promise<Object>} - Processing result
   */
  async processSpreadsheet(filePath, fileType) {
    const normalizedType = fileType.toLowerCase().replace('.', '');

    if (normalizedType === 'csv') {
      return await this.parseCSV(filePath);
    } else if (['xlsx', 'xls', 'xlsm'].includes(normalizedType)) {
      return await this.parseExcel(filePath);
    }

    return {
      success: false,
      data: [],
      errors: [{ message: 'Unsupported spreadsheet format', type: 'unsupported_format' }],
      metadata: {},
    };
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @param {string} outputPath - Output file path
   * @returns {Promise<{success: boolean, filePath: string, error?: string}>}
   */
  async exportToCSV(data, outputPath) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      const columns = Object.keys(data[0]);
      let csvContent = columns.join(',') + '\n';

      data.forEach((row) => {
        const values = columns.map((col) => {
          const value = row[col] || '';
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });

      await fs.writeFile(outputPath, csvContent);

      return {
        success: true,
        filePath: outputPath,
      };
    } catch (error) {
      return {
        success: false,
        filePath: outputPath,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new SpreadsheetService();
