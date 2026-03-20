// @ts-nocheck
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Quote');

const {
  mail,
  sendQuote,
  resendQuote,
  sendReminder,
  getDeliveryHistory,
  checkDeliveryStatus,
  sendBulkQuotes,
} = require('./sendMail');
const create = require('./create');
const summary = require('./summary');
const update = require('./update');
const convertQuoteToInvoice = require('./convertQuoteToInvoice');
const paginatedList = require('./paginatedList');
const read = require('./read');

methods.list = paginatedList;
methods.read = read;

// Legacy mail endpoint
methods.mail = mail;

// Quote delivery endpoints
methods.sendQuote = sendQuote;
methods.resendQuote = resendQuote;
methods.sendReminder = sendReminder;
methods.getDeliveryHistory = getDeliveryHistory;
methods.checkDeliveryStatus = checkDeliveryStatus;
methods.sendBulkQuotes = sendBulkQuotes;

methods.create = create;
methods.update = update;
methods.convert = convertQuoteToInvoice;
methods.summary = summary;

module.exports = methods;
