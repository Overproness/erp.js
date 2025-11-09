const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Task');

const summary = require('./summary');
const create = require('./create');
const update = require('./update');
const remove = require('./remove');
const addCollaborator = require('./addCollaborator');
const delegate = require('./delegate');
const reassign = require('./reassign');

methods.create = create;
methods.update = update;
methods.delete = remove;
methods.summary = summary;
methods.addCollaborator = addCollaborator;
methods.delegate = delegate;
methods.reassign = reassign;

module.exports = methods;
