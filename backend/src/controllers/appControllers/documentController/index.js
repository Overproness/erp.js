const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Document');

const create = require('./create');
const list = require('./list');
const read = require('./read');
const update = require('./update');
const remove = require('./remove');
const downloadDocument = require('./downloadDocument');
const search = require('./search');
const filter = require('./filter');
const listVersions = require('./listVersions');
const getVersion = require('./getVersion');
const createVersion = require('./createVersion');
const revert = require('./revert');
const revertToVersion = require('./revertToVersion');
const revertToOriginal = require('./revertToOriginal');
const downloadVersion = require('./downloadVersion');
const editDocument = require('./editDocument');
const eSignDocument = require('./eSignDocument');
const getDocumentContent = require('./getDocumentContent');
const annotateDocument = require('./annotate');
// New compliance and audit trail controllers
const createCompliance = require('./createCompliance');
const getCompliance = require('./getCompliance');
const getAuditTrail = require('./getAuditTrail');
const addCollaborator = require('./addCollaborator');
const share = require('./share');
const generateShareLink = require('./generateShareLink');
// Add the new AI document analysis controller
const analyzeDocument = require('./analyzeDocument');

// Override default methods with custom implementations
methods.create = create;
methods.list = list;
methods.read = read;
methods.update = update;
methods.delete = remove;
methods.download = downloadDocument;

// Add search and filter methods
methods.search = search;
methods.filter = filter;

// Add version control methods
methods.listVersions = listVersions;
methods.getVersion = getVersion;
methods.createVersion = createVersion;
methods.revert = revert;
methods.revertToVersion = revertToVersion;
methods.revertToOriginal = revertToOriginal; // Add the new revert to original method
methods.downloadVersion = downloadVersion;

// Add document editing methods
methods.edit = editDocument;
methods.eSign = eSignDocument;
methods.getContent = getDocumentContent;
methods.annotate = annotateDocument;

// Add compliance and audit trail methods
methods.createCompliance = createCompliance;
methods.getCompliance = getCompliance;
methods.getAuditTrail = getAuditTrail;
methods.addCollaborator = addCollaborator;

// Add AI analysis method
methods.analyze = analyzeDocument;

// Add sharing methods
methods.share = share;
methods.generateShareLink = generateShareLink;

module.exports = methods;
