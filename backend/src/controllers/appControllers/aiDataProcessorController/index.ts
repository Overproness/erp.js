// @ts-nocheck
const processOCR = require('./processOCR');
const extractData = require('./extractData');
const createTemplate = require('./createTemplate');
const getTemplates = require('./getTemplates');
const updateTemplate = require('./updateTemplate');
const deleteTemplate = require('./deleteTemplate');
const processWorkflow = require('./processWorkflow');
const getProcessingStats = require('./getProcessingStats');

module.exports = {
  processOCR,
  extractData,
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  processWorkflow,
  getProcessingStats,
};
