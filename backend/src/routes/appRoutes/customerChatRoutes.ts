// @ts-nocheck
const express = require('express');
const router = express.Router();
const customerChatController = require('@/controllers/appControllers/customerChatController');
const { catchErrors } = require('@/handlers/errorHandlers');
const adminAuth = require('@/controllers/coreControllers/adminAuth');

/**
 * Public routes (no authentication required)
 */

/**
 * @route   GET /api/customer-chat/room
 * @desc    Get chat room by access token (public for customer access)
 * @access  Public (with token)
 */
router.get('/room', catchErrors(customerChatController.getChatRoomByToken));

/**
 * Protected routes (authentication required)
 */

/**
 * @route   POST /api/customer-chat/:id/generate
 * @desc    Generate chat room URL for customer communication
 * @access  Private (Employee only)
 */
router.post(
  '/:id/generate',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.generateChatUrl)
);

/**
 * @route   GET /api/customer-chat/room/:roomId
 * @desc    Get chat room by room ID
 * @access  Private
 */
router.get(
  '/room/:roomId',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.getChatRoomById)
);

/**
 * @route   GET /api/customer-chat/my-rooms
 * @desc    Get all chat rooms for authenticated employee
 * @access  Private (Employee only)
 */
router.get(
  '/my-rooms',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.getEmployeeChatRooms)
);

/**
 * @route   GET /api/customer-chat/:id/rooms
 * @desc    Get all chat rooms for a specific customer
 * @access  Private
 */
router.get(
  '/:id/rooms',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.getCustomerChatRooms)
);

/**
 * @route   POST /api/customer-chat/room/:roomId/close
 * @desc    Close a chat room
 * @access  Private (Employee only)
 */
router.post(
  '/room/:roomId/close',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.closeChatRoom)
);

/**
 * @route   POST /api/customer-chat/room/:roomId/archive
 * @desc    Archive a chat room
 * @access  Private (Employee only)
 */
router.post(
  '/room/:roomId/archive',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.archiveChatRoom)
);

/**
 * @route   DELETE /api/customer-chat/room/:roomId
 * @desc    Delete a chat room
 * @access  Private (Employee only)
 */
router.delete(
  '/room/:roomId',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.deleteChatRoom)
);

/**
 * @route   GET /api/customer-chat/stats
 * @desc    Get chat statistics for authenticated employee
 * @access  Private (Employee only)
 */
router.get(
  '/stats',
  adminAuth.isValidAuthToken,
  catchErrors(customerChatController.getEmployeeStats)
);

module.exports = router;
