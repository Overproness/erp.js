// @ts-nocheck
/**
 * Notification Service
 * Handles sending notifications to users and teams via Socket.io and MongoDB
 */

const mongoose = require('mongoose');

const Notification = mongoose.model('Notification');
const CompanyOwner = mongoose.model('CompanyOwner');
const sendMail = require('../helpers/sendMail');

class NotificationService {
  constructor() {
    this.io = null; // Will be set after server initialization

    this.emailTemplates = {
      new_review: {
        subject: 'New Review Received',
        template: 'reviewNotification',
      },
      review_approval: {
        subject: 'Review Response Needs Approval',
        template: 'reviewApproval',
      },
      response_sent: {
        subject: 'Response to Review Sent',
        template: 'responseSent',
      },
      review_request: {
        subject: 'We Value Your Feedback',
        template: 'reviewRequest',
      },
      review_thank_you: {
        subject: 'Thank You for Your Review',
        template: 'reviewThankYou',
      },
      negative_review_alert: {
        subject: 'Urgent: Negative Review Received',
        template: 'negativeReviewAlert',
      },
    };

    this.smsTemplates = {
      review_request:
        'Hi {{customerName}}, {{businessName}} values your feedback! Please leave a review at: {{reviewLink}}',
      new_review_alert:
        'New {{rating}}-star review received from {{customerName}}. Check your dashboard to respond.',
      negative_review_alert:
        'URGENT: New negative review ({{rating}}-star) received. Immediate attention required.',
    };
  }

  /**
   * Set Socket.io instance
   */
  setIO(io) {
    this.io = io;
  }

  /**
   * Get Socket.io instance
   */
  getIO() {
    if (!this.io && global.io) {
      this.io = global.io;
    }
    return this.io;
  }

  /**
   * Send notification to a user or team
   */
  sendNotification = async (recipientIdOrOptions, notificationData) => {
    try {
      let options;

      // Handle both calling patterns:
      // 1. sendNotification(recipientId, notificationObject)
      // 2. sendNotification({ recipientId, ... })
      if (
        typeof recipientIdOrOptions === 'string' ||
        (recipientIdOrOptions instanceof Object &&
          recipientIdOrOptions.constructor.name === 'ObjectId')
      ) {
        // Pattern 1: separate recipient ID and notification data
        options = {
          recipientId: recipientIdOrOptions,
          ...notificationData,
        };
      } else {
        // Pattern 2: single options object
        options = recipientIdOrOptions;
      }

      const {
        recipientId,
        recipientModel = 'CompanyOwner',
        title,
        message,
        type = 'info',
        data = {},
        priority = 'normal',
        actionUrl = '',
        actionText = '',
        channels = ['app'],
        owner,
        source = {},
      } = options;

      // Determine owner if not provided
      let ownerId = owner;
      if (!ownerId) {
        // Try to get from recipient
        const recipient = await CompanyOwner.findById(recipientId);
        ownerId = recipient?._id || recipientId;
      }

      // Create notification in MongoDB
      const notification = await Notification.create({
        recipientId,
        recipientModel,
        title,
        message,
        type,
        data,
        priority,
        actionUrl,
        actionText,
        channels,
        owner: ownerId,
        source,
        deliveryStatus: {
          app: { delivered: false },
        },
      });

      console.log('=== NOTIFICATION SERVICE DEBUG ===');
      console.log('Notification created in DB:', notification._id);
      console.log('Recipient ID:', recipientId);
      console.log('Recipient Model:', recipientModel);
      console.log('Title:', title);
      console.log('Room name:', `user:${recipientId}`);

      // Emit real-time notification via Socket.io
      const io = this.getIO();
      console.log('Socket.io instance:', io ? 'AVAILABLE' : 'NOT AVAILABLE');

      if (io) {
        const roomName = `user:${recipientId}`;
        const socketsInRoom = await io.in(roomName).fetchSockets();
        console.log(`Sockets in room ${roomName}:`, socketsInRoom.length);

        io.to(roomName).emit('notification:new', {
          notification: notification.toJSON(),
          timestamp: new Date(),
        });
        console.log('Notification emitted to room:', roomName);

        // Update delivery status
        notification.deliveryStatus.app.delivered = true;
        notification.deliveryStatus.app.deliveredAt = new Date();
        await notification.save();
      } else {
        console.log('Socket.io not available - notification saved to DB only');
      }
      console.log('=================================');

      // Handle additional channels
      if (channels.includes('email')) {
        await this.sendEmailForNotification(notification);
      }

      if (channels.includes('sms')) {
        await this.sendSMSForNotification(notification);
      }

      console.log(`✅ Notification sent to ${recipientModel} ${recipientId}: ${title}`);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  /**
   * Get notifications for a user
   */
  getUserNotifications = async (userId, options = {}) => {
    return await Notification.getUserNotifications(userId, options);
  };

  /**
   * Mark notification as read
   */
  markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId,
    });

    if (notification) {
      await notification.markAsRead();

      // Emit update via Socket.io
      const io = this.getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification:updated', {
          notificationId,
          read: true,
          readAt: notification.readAt,
        });
      }
    }

    return notification;
  };

  /**
   * Send notification on task assignment
   */
  sendTaskAssignmentNotification = async (task, assignedUser, assignedBy) => {
    return await this.sendNotification({
      recipientId: assignedUser._id || assignedUser,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.title}`,
      type: 'task_assigned',
      data: {
        taskId: task._id,
        assignedBy: assignedBy._id || assignedBy,
        priority: task.priority,
      },
      priority: task.priority === 'urgent' ? 'urgent' : 'normal',
      actionUrl: `/tasks/${task._id}`,
      actionText: 'View Task',
      source: {
        module: 'tasks',
        entityId: task._id,
        entityType: 'Task',
      },
    });
  };

  /**
   * Send notification on team mention
   */
  sendTeamMentionNotification = async (team, mentionedBy, context) => {
    const teamNotifications = [];

    for (const member of team.members) {
      const notification = await this.sendNotification({
        recipientId: member.user._id || member.user,
        title: 'Team Mentioned',
        message: `Your team "${team.name}" was mentioned by ${mentionedBy.name}`,
        type: 'team_activity',
        data: {
          teamId: team._id,
          mentionedBy: mentionedBy._id,
          context,
        },
        source: {
          module: 'team',
          entityId: team._id,
          entityType: 'Team',
        },
      });
      teamNotifications.push(notification);
    }

    return teamNotifications;
  };

  /**
   * Send aggregated notifications for team activities
   */
  sendTeamActivityNotifications = async (team, activities) => {
    const teamNotifications = [];

    for (const member of team.members) {
      const notification = await this.sendNotification({
        recipientId: member.user._id || member.user,
        title: 'Team Activity Summary',
        message: `${activities.length} new activities in team "${team.name}"`,
        type: 'team_update',
        data: {
          teamId: team._id,
          activities,
          activityCount: activities.length,
        },
        source: {
          module: 'team',
          entityId: team._id,
          entityType: 'Team',
        },
      });
      teamNotifications.push(notification);
    }

    return teamNotifications;
  };

  /**
   * Get aggregated notifications for team activities
   */
  getAggregatedNotifications = async (req, res) => {
    try {
      const userId = req.user?._id;
      const { teamId, period = 'day' } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Calculate time range based on period
      const now = new Date();
      let startDate;
      switch (period) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Build query
      const query = {
        recipientId: userId,
        deleted: false,
        createdAt: { $gte: startDate },
      };

      if (teamId) {
        query['data.teamId'] = teamId;
      }

      // Fetch notifications from MongoDB
      const notifications = await Notification.find(query).sort({ createdAt: -1 }).lean();

      // Group notifications by type
      const teamActivities = notifications.filter(
        (n) => n.type === 'team_activity' || n.type === 'team_update'
      );
      const taskUpdates = notifications.filter(
        (n) => n.type === 'task_assigned' || n.type === 'task_updated'
      );
      const documentChanges = notifications.filter(
        (n) => n.type === 'document_updated' || n.type === 'document_shared'
      );

      const aggregated = {
        total: notifications.length,
        unread: notifications.filter((n) => !n.read).length,
        teamActivities,
        taskUpdates,
        documentChanges,
        byType: {},
        recent: notifications.slice(0, 10),
        summary: `${notifications.length} team activities in the last ${period}`,
      };

      // Count by notification type
      notifications.forEach((notification) => {
        if (!aggregated.byType[notification.type]) {
          aggregated.byType[notification.type] = 0;
        }
        aggregated.byType[notification.type]++;
      });

      return res.status(200).json({
        success: true,
        result: aggregated,
        message: 'Aggregated notifications retrieved successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get aggregated notifications',
        error: error.message,
      });
    }
  };

  /**
   * Clear all notifications (for testing)
   */
  clearAll = async () => {
    await Notification.deleteMany({});
  };

  /**
   * Send email for notification
   */
  /**
   * Send email for notification
   */
  async sendEmailForNotification(notification) {
    try {
      // Find the user
      const user = await CompanyOwner.findById(notification.recipientId);
      if (!user || !user.email) {
        console.log('User not found or no email address');
        return { success: false, error: 'User not found or no email' };
      }

      // Determine which email template to use
      const templateInfo = this.emailTemplates[notification.type] || {
        subject: notification.title,
        template: 'genericNotification',
      };

      // Email data
      const emailData = {
        to: user.email,
        subject: templateInfo.subject,
        template: templateInfo.template,
        context: {
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          ...notification.data,
        },
      };

      // Send email
      await sendMail(emailData);

      // Update delivery status
      notification.deliveryStatus.email.delivered = true;
      notification.deliveryStatus.email.deliveredAt = new Date();
      await notification.save();

      return { success: true };
    } catch (error) {
      console.error('Error sending email notification:', error);

      // Update delivery status with error
      notification.deliveryStatus.email.delivered = false;
      notification.deliveryStatus.email.error = error.message;
      await notification.save();

      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS for notification
   */
  async sendSMSForNotification(notification) {
    try {
      // Find the user
      const user = await CompanyOwner.findById(notification.recipientId);
      if (!user || !user.phone) {
        console.log('User not found or no phone number');
        return { success: false, error: 'User not found or no phone' };
      }

      // Get SMS template or use message
      let smsMessage = notification.message;
      if (this.smsTemplates[notification.type]) {
        smsMessage = this.smsTemplates[notification.type];
        // Simple template replacement
        Object.keys(notification.data).forEach((key) => {
          smsMessage = smsMessage.replace(`{{${key}}}`, notification.data[key]);
        });
      }

      // In a real system, this would integrate with SMS API
      console.log(`SMS to ${user.phone}: ${smsMessage}`);

      // Update delivery status
      notification.deliveryStatus.sms.delivered = true;
      notification.deliveryStatus.sms.deliveredAt = new Date();
      await notification.save();

      return { success: true };
    } catch (error) {
      console.error('Error sending SMS notification:', error);

      // Update delivery status with error
      notification.deliveryStatus.sms.delivered = false;
      notification.deliveryStatus.sms.error = error.message;
      await notification.save();

      return { success: false, error: error.message };
    }
  }

  async notifyReviewApproval(responseId, approved, ownerId) {
    try {
      const ReviewResponse = require('../models/appModels/ReviewResponse');
      const response = await ReviewResponse.findById(responseId)
        .populate('review')
        .populate('business');

      if (!response) {
        throw new Error('Response not found');
      }

      const status = approved ? 'approved' : 'rejected';
      const message = approved
        ? `Your response to ${response.review.client.name}'s review has been approved and sent`
        : `Your response to ${response.review.client.name}'s review has been rejected`;

      await this.sendNotification({
        recipientId: response.respondent || ownerId,
        title: `Response ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        type: 'review_approval',
        data: {
          status,
          businessName: response.business.name,
          reviewId: response.review._id,
          responseId: response._id,
        },
        actionUrl: `/reviews/${response.review._id}`,
        actionText: 'View Review',
        source: {
          module: 'reviews',
          entityId: response._id,
          entityType: 'ReviewResponse',
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending approval notification:', error);
      throw error;
    }
  }

  /**
   * Send notification on review response
   */
  async sendReviewResponseNotification(response, recipient) {
    const { approved, review, respondent } = response;
    const { client } = review;
    const { name: clientName } = client;

    const status = approved ? 'approved' : 'rejected';
    const title = `Response ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const message = `Your response to ${clientName}'s review has been ${status}`;

    return await this.sendNotification({
      recipientId: respondent,
      title,
      message,
      type: 'review_response',
      data: {
        status,
        reviewId: review._id,
        responseId: response._id,
        clientName,
      },
      actionUrl: `/reviews/${review._id}`,
      actionText: 'View Review',
      source: {
        module: 'reviews',
        entityId: response._id,
        entityType: 'ReviewResponse',
      },
    });
  }

  /**
   * Send notification on review submission
   */
  async sendReviewSubmissionNotification(review, recipient) {
    const { client } = review;
    const { name: clientName, email } = client;

    return await this.sendNotification({
      recipientId: recipient,
      title: 'New Review Received',
      message: `${clientName} has submitted a new review`,
      type: 'new_review',
      data: {
        reviewId: review._id,
        clientName,
        clientEmail: email,
        rating: review.rating,
      },
      actionUrl: `/reviews/${review._id}`,
      actionText: 'View Review',
      channels: ['app', 'email'],
      source: {
        module: 'reviews',
        entityId: review._id,
        entityType: 'Review',
      },
    });
  }

  /**
   * Send notification on review request
   */
  async sendReviewRequestNotification(reviewRequest, recipient) {
    const { client } = reviewRequest;
    const { name: clientName, email } = client;

    return await this.sendNotification({
      recipientId: recipient,
      title: 'Review Request Sent',
      message: `A review request has been sent to ${clientName}`,
      type: 'info',
      data: {
        reviewRequestId: reviewRequest._id,
        clientName,
        clientEmail: email,
      },
      source: {
        module: 'reviews',
        entityId: reviewRequest._id,
        entityType: 'ReviewRequest',
      },
    });
  }

  /**
   * Send notification on review thank you
   */
  async sendReviewThankYouNotification(review, recipient) {
    const { client } = review;
    const { name: clientName, email } = client;

    return await this.sendNotification({
      recipientId: recipient,
      title: 'Thank You for Your Review',
      message: `Thank you, ${clientName}, for your review!`,
      type: 'success',
      data: {
        reviewId: review._id,
        clientName,
        clientEmail: email,
      },
      source: {
        module: 'reviews',
        entityId: review._id,
        entityType: 'Review',
      },
    });
  }

  /**
   * Send notification on negative review
   */
  async sendNegativeReviewNotification(review, recipient) {
    const { client } = review;
    const { name: clientName, email, phone } = client;
    const { rating } = review;

    return await this.sendNotification({
      recipientId: recipient,
      title: 'Urgent: Negative Review Received',
      message: `URGENT: New negative review (${rating}-star) received from ${clientName}. Immediate attention required.`,
      type: 'negative_review',
      priority: 'urgent',
      data: {
        reviewId: review._id,
        clientName,
        clientEmail: email,
        clientPhone: phone,
        rating,
      },
      actionUrl: `/reviews/${review._id}`,
      actionText: 'Respond Now',
      channels: ['app', 'email', 'sms'],
      source: {
        module: 'reviews',
        entityId: review._id,
        entityType: 'Review',
      },
    });
  }
}

const notificationService = new NotificationService();
module.exports = { notificationService };
