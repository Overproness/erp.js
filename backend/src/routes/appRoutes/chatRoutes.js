const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const {
  sendMessage,
  getChatHistory,
  getChatList,
  getCompanyUsers
} = require('@/controllers/appControllers/chatController');

// Send a message
router.post('/send', catchErrors(sendMessage));

// Get chat history with specific user
router.get('/history/:userId', catchErrors(getChatHistory));

// Get all chat conversations
router.get('/list', catchErrors(getChatList));

// Get all users in company for chat
router.get('/users', catchErrors(getCompanyUsers));

module.exports = router;
