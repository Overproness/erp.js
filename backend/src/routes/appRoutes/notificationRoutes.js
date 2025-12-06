/**
 * Notification Routes
 * RESTful API endpoints for notification management
 */

const express = require('express');
const router = express.Router();

const notificationController = require('@/controllers/appControllers/notificationController');
const { catchErrors } = require('@/handlers/errorHandlers');

// Note: Authentication middleware is applied in app.js when mounting this router
// No need to apply it here again

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination and filtering
 * @query   limit, skip, unreadOnly, type, priority, startDate, endDate
 * @access  Private
 */
router.get('/', catchErrors(notificationController.list));

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', catchErrors(notificationController.getUnreadCount));

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 */
router.get('/stats', catchErrors(notificationController.getStats));

/**
 * @route   GET /api/notifications/aggregated
 * @desc    Get aggregated notifications (for team collaboration)
 * @access  Private
 */
router.get('/aggregated', catchErrors(notificationController.getAggregated));

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification by ID
 * @access  Private
 */
router.get('/:id', catchErrors(notificationController.read));

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', catchErrors(notificationController.markAsRead));

/**
 * @route   PATCH /api/notifications/mark-many-read
 * @desc    Mark multiple notifications as read
 * @body    { ids: [] }
 * @access  Private
 */
router.patch('/mark-many-read', catchErrors(notificationController.markManyAsRead));

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/mark-all-read', catchErrors(notificationController.markAllAsRead));

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification (soft delete)
 * @access  Private
 */
router.delete('/:id', catchErrors(notificationController.remove));

module.exports = router;
