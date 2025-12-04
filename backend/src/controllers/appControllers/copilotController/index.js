const chatController = require('./chat');
const suggestionsController = require('./suggestions');
const modulesController = require('./modules');

module.exports = {
  chat: chatController,
  suggestions: suggestionsController,
  modules: modulesController,
};
