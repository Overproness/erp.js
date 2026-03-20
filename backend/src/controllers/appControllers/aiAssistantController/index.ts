// @ts-nocheck
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const aiAssistantController = createCRUDController('AiAssistant');

// Import specific AI controllers
const chatController = require('./chat');
const analyzeController = require('./analyze');
const suggestController = require('./suggest');
const predictController = require('./predict');
const listController = require('./list');
const readController = require('./read');
const updateController = require('./update');
const removeController = require('./delete');
const createController = require('./create');
const searchController = require('./search');
const getConversationsController = require('./getConversations');
const getConversationController = require('./getConversation');
const updateConversationController = require('./updateConversation');
const deleteConversationController = require('./deleteConversation');
const getConversationMessagesController = require('./getConversationMessages');

// Extend with AI-specific methods
aiAssistantController.chat = chatController;
aiAssistantController.analyze = analyzeController;
aiAssistantController.suggest = suggestController;
aiAssistantController.predict = predictController;
aiAssistantController.list = listController;
aiAssistantController.read = readController;
aiAssistantController.update = updateController;
aiAssistantController.remove = removeController;
aiAssistantController.create = createController;
aiAssistantController.search = searchController;
aiAssistantController.getConversations = getConversationsController;
aiAssistantController.getConversation = getConversationController;
aiAssistantController.updateConversation = updateConversationController;
aiAssistantController.deleteConversation = deleteConversationController;
aiAssistantController.getConversationMessages = getConversationMessagesController;

module.exports = aiAssistantController;
