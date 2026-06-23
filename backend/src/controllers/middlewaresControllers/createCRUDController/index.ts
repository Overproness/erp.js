// @ts-nocheck

import mongoose from 'mongoose';
import create from './create';
import read from './read';
import update from './update';
import remove from './remove';
import search from './search';
import filter from './filter';
import summary from './summary';
import listAll from './listAll';
import paginatedList from './paginatedList';
import bulkCreate from './bulkCreate';
import bulkUpdate from './bulkUpdate';
import bulkDelete from './bulkDelete';
import '@/models';
// Register all models before resolving a CRUD controller.  Filesystem-based
// discovery is not available in bundled serverless deployments.


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

export = createCRUDController;
