const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Task');

const summary = require('./summary');
const create = require('./create');
const update = require('./update');
const remove = require('./remove');
const list = require('./list');
const addCollaborator = require('./addCollaborator');
const delegate = require('./delegate');
const reassign = require('./reassign');
const aiPrioritize = require('./aiPrioritize');
const batchUpdatePriorities = require('./batchUpdatePriorities');

methods.create = create;
methods.update = update;
methods.delete = remove;
methods.list = list;
methods.summary = summary;
methods.addCollaborator = addCollaborator;
methods.delegate = delegate;
methods.reassign = reassign;
methods.aiPrioritize = aiPrioritize;
methods.batchUpdatePriorities = batchUpdatePriorities;

module.exports = methods;
