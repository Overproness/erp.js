// @ts-nocheck
const chatController = require('./chat');
const suggestionsController = require('./suggestions');
const modulesController = require('./modules');
const modelsController = require('./models');
const customerInsightsController = require('./customerInsights');

module.exports = {
  chat: chatController,
  suggestions: suggestionsController,
  modules: modulesController,
  models: modelsController,
  customerInsights: customerInsightsController,
};
