const createCRUDController = require('../../middlewaresControllers/createCRUDController');
const crudController = createCRUDController('Setting');

// Import custom implementations
const list = require('./list');
const listAll = require('./listAll');
const listBySettingKey = require('./listBySettingKey');
const readBySettingKey = require('./readBySettingKey');
const updateBySettingKey = require('./updateBySettingKey');
const updateManySetting = require('./updateManySetting');
const batchUpdate = require('./batchUpdate');
const filter = require('./filter');
const search = require('./search');
const testOpenAIKey = require('./testOpenAIKey');
const testGeminiKey = require('./testGeminiKey');
const testClaudeKey = require('./testClaudeKey');

// Combine all controller methods
const settingMethods = {
  // Core CRUD operations
  read: crudController.read,
  create: crudController.create,
  update: crudController.update,
  delete: crudController.delete,

  // Custom implementations
  list: list, // Use our custom list implementation instead of the CRUD controller's
  listAll: listAll,
  filter: filter || crudController.filter,
  search: search || crudController.search,

  // Special setting operations
  listBySettingKey,
  readBySettingKey,
  updateBySettingKey,
  updateManySetting,
  batchUpdate,
  testOpenAIKey,
  testGeminiKey,
  testClaudeKey,
};

module.exports = settingMethods;
