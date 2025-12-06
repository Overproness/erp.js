const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Document');

const create = require('./create');
const list = require('./list');
const read = require('./read');
const update = require('./update');
const remove = require('./remove');
const downloadDocument = require('./downloadDocument');
const search = require('./search');
const advancedSearch = require('./advancedSearch');
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
// Add text extraction reprocessing
const reprocessDocuments = require('./reprocessDocuments');
// Add new Data Entry Automation features
const { suggestTags, applySuggestedTags } = require('./suggestTags');
const { summarizeDocument, summarizeDocuments } = require('./summarizeDocument');
const bulkImportFromURLs = require('./bulkImportFromURLs');
const {
  generateDocumentShareURL,
  accessSharedDocument,
  downloadSharedDocument,
  listDocumentShareURLs,
} = require('./documentShareURL');

// Override default methods with custom implementations
methods.create = create;
methods.list = list;
methods.read = read;
methods.update = update;
methods.delete = remove;
methods.download = downloadDocument;

// Add search and filter methods
methods.search = search;
methods.advancedSearch = advancedSearch;
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

// Add text extraction reprocessing
methods.reprocessDocuments = reprocessDocuments;

// Add Data Entry Automation features
methods.suggestTags = suggestTags;
methods.applySuggestedTags = applySuggestedTags;
methods.summarizeDocument = summarizeDocument;
methods.summarizeDocuments = summarizeDocuments;
methods.bulkImportFromURLs = bulkImportFromURLs;
methods.generateDocumentShareURL = generateDocumentShareURL;
methods.accessSharedDocument = accessSharedDocument;
methods.downloadSharedDocument = downloadSharedDocument;
methods.listDocumentShareURLs = listDocumentShareURLs;

module.exports = methods;
