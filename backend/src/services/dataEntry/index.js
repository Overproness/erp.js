/**
 * Data Entry Automation Services
 * Central export point for all data entry services
 */

const enhancedOCRService = require('./enhancedOCRService');
const enhancedSpreadsheetService = require('./enhancedSpreadsheetService');
const urlImportService = require('./urlImportService');
const dataValidationService = require('./dataValidationService');
const {
  moduleSchemas,
  getModuleSchema,
  getAllSchemas,
  findFieldMapping,
  validateData,
} = require('./moduleSchemas');

module.exports = {
  // Services
  enhancedOCRService,
  enhancedSpreadsheetService,
  urlImportService,
  dataValidationService,

  // Schema utilities
  moduleSchemas,
  getModuleSchema,
  getAllSchemas,
  findFieldMapping,
  validateData,
};
