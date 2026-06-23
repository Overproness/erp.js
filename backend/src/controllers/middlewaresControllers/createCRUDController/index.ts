// @ts-nocheck
const mongoose = require('mongoose');

// Register all models before resolving a CRUD controller.  Filesystem-based
// discovery is not available in bundled serverless deployments.
require('@/models');

const create = require('./create');
const read = require('./read');
const update = require('./update');
const remove = require('./remove');
const search = require('./search');
const filter = require('./filter');
const summary = require('./summary');
const listAll = require('./listAll');
const paginatedList = require('./paginatedList');
const bulkCreate = require('./bulkCreate');
const bulkUpdate = require('./bulkUpdate');
const bulkDelete = require('./bulkDelete');

const createCRUDController = (modelName, registeredModelName) => {
  const resolvedModelName = registeredModelName || modelName;

  if (!mongoose.modelNames().includes(resolvedModelName)) {
    throw new Error(`Model ${modelName} does not exist`);
  }

  const Model = mongoose.model(resolvedModelName);
  const crudMethods = {
    create: (req, res) => create(Model, req, res),
    read: (req, res) => read(Model, req, res),
    update: (req, res) => update(Model, req, res),
    delete: (req, res) => remove(Model, req, res),
    list: (req, res) => paginatedList(Model, req, res),
    listAll: (req, res) => listAll(Model, req, res),
    search: (req, res) => search(Model, req, res),
    filter: (req, res) => filter(Model, req, res),
    summary: (req, res) => summary(Model, req, res),
    bulkCreate: (req, res) => bulkCreate(Model, req, res),
    bulkUpdate: (req, res) => bulkUpdate(Model, req, res),
    bulkDelete: (req, res) => bulkDelete(Model, req, res),
  };
  return crudMethods;
};

module.exports = createCRUDController;
