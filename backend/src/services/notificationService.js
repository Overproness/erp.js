/**
 * Notification Service
 * Handles sending notifications to users and teams
 */

const notifications = [];

const CompanyOwner = require('../models/coreModels/CompanyOwner');
const sendMail = require('../helpers/sendMail');

class NotificationService {
  constructor() {
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
      review_request: 'Hi {{customerName}}, {{businessName}} values your feedback! Please leave a review at: {{reviewLink}}',
      new_review_alert: 'New {{rating}}-star review received from {{customerName}}. Check your dashboard to respond.',
      negative_review_alert: 'URGENT: New negative review ({{rating}}-star) received. Immediate attention required.',
    };
  }

  /**
   * Send notification to a user or team
   */
  sendNotification = async (recipientIdOrOptions, notificationData) => {
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
      recipientType = 'user', // 'user' or 'team'
      title,
      message,
      type = 'info', // 'info', 'success', 'warning', 'error'
      data = {},
      priority = 'normal', // 'low', 'normal', 'high', 'urgent'
    } = options;

    const notification = {
      id: Date.now().toString(),
      recipientId,
      recipientType,
      title,
      message,
      type,
      data,
      priority,
      read: false,
      createdAt: new Date(),
      sentAt: new Date(),
    };

    notifications.push(notification);

    // In a real implementation, this would send via websockets, push notifications, etc.
    console.log(`Notification sent to ${recipientType} ${recipientId}: ${title}`);

    return notification;
  };

  /**
   * Get notifications for a user
   */
  getUserNotifications = async (userId, options = {}) => {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    let userNotifications = notifications.filter(
      (n) => n.recipientId === userId && n.recipientType === 'user'
    );

    if (unreadOnly) {
      userNotifications = userNotifications.filter((n) => !n.read);
    }

    return userNotifications
      .slice(offset, offset + limit)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  /**
   * Mark notification as read
   */
  markAsRead = async (notificationId, userId) => {
    const notification = notifications.find(
      (n) => n.id === notificationId && n.recipientId === userId
    );

    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
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
      type: 'info',
      data: {
        taskId: task._id,
        assignedBy: assignedBy._id || assignedBy,
        priority: task.priority,
      },
      priority: task.priority === 'urgent' ? 'urgent' : 'normal',
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
        type: 'info',
        data: {
          teamId: team._id,
          mentionedBy: mentionedBy._id,
          context,
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
        type: 'info',
        data: {
          teamId: team._id,
          activities,
          activityCount: activities.length,
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

      // Filter notifications by time range and team
      let filteredNotifications = notifications.filter((n) => {
        const isInTimeRange = new Date(n.createdAt) >= startDate;
        const isForUser = n.recipientId === userId;
        const isTeamRelated = !teamId || (n.data && n.data.teamId === teamId);
        return isInTimeRange && isForUser && isTeamRelated;
      });

      // Group notifications by type for test compatibility
      const teamActivities = filteredNotifications.filter(
        (n) => n.type === 'team_activity' || n.type === 'team_update'
      );
      const taskUpdates = filteredNotifications.filter(
        (n) => n.type === 'task_assigned' || n.type === 'task_updated'
      );
      const documentChanges = filteredNotifications.filter(
        (n) => n.type === 'document_updated' || n.type === 'document_shared'
      );

      const aggregated = {
        total: filteredNotifications.length,
        unread: filteredNotifications.filter((n) => !n.read).length,
        teamActivities,
        taskUpdates,
        documentChanges,
        byType: {},
        recent: filteredNotifications
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10),
        summary: `${filteredNotifications.length} team activities in the last ${period}`,
      };

      // Count by notification type
      filteredNotifications.forEach((notification) => {
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
  clearAll = () => {
    notifications.length = 0;
  };

  async sendNotification(userId, title, message, data = {}) {
    try {
      // Find the user
      const user = await CompanyOwner.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Save in-app notification (would be implemented in a real system)
      await this.saveInAppNotification(userId, title, message, data);

      // Check if email notifications are enabled
      const emailEnabled = true; // Would come from user preferences in real system

      if (emailEnabled && user.email) {
        await this.sendEmailNotification(user.email, title, message, data);
      }

      // Check if SMS notifications are enabled and we have the phone
      const smsEnabled = false; // Would come from user preferences

      if (smsEnabled && user.phone) {
        await this.sendSmsNotification(user.phone, message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async saveInAppNotification(userId, title, message, data) {
    try {
      // In a real system, this would save to a notifications collection
      console.log(`In-app notification for ${userId}: ${title}`);

      // Placeholder for actual implementation
      return { success: true };
    } catch (error) {
      console.error('Error saving in-app notification:', error);
      // Don't throw - this shouldn't break the whole notification process
      return { success: false, error: error.message };
    }
  }

  async sendEmailNotification(email, title, message, data) {
    try {
      // Determine which email template to use based on data.type
      const templateInfo = this.emailTemplates[data.type] || {
        subject: title,
        template: 'genericNotification',
      };

      // Email data
      const emailData = {
        to: email,
        subject: templateInfo.subject,
        template: templateInfo.template,
        context: {
          title,
          message,
          ...data,
          previewText: `${data.businessName || 'Your business'} has received a new ${data.rating || ''} star review`,
          ctaLink: `/dashboard/reviews/${data.reviewId}`,
          ctaText: 'View Review',
        },
      };

      // Send email
      await sendMail(emailData);

      return { success: true };
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw - this shouldn't break the whole notification process
      return { success: false, error: error.message };
    }
  }

  async sendSmsNotification(phone, message) {
    try {
      // In a real system, this would integrate with SMS API
      console.log(`SMS to ${phone}: ${message}`);

      // Placeholder for actual implementation
      return { success: true };
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      // Don't throw - this shouldn't break the whole notification process
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

      await this.sendNotification(
        response.respondent || ownerId,
        `Response ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        {
          type: 'response_status',
          status,
          businessName: response.business.name,
          reviewId: response.review._id,
          responseId: response._id,
        }
      );

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

    // Send notification
    return await this.sendNotification(respondent, title, message, {
      type: 'response_status',
      status,
      reviewId: review._id,
      responseId: response._id,
    });
  }

  /**
   * Send notification on review submission
   */
  async sendReviewSubmissionNotification(review, recipient) {
    const { client } = review;
    const { name: clientName, email } = client;

    const title = 'New Review Received';
    const message = `${clientName} has submitted a new review`;

    // Send notification
    return await this.sendNotification(recipient, title, message, {
      type: 'new_review',
      reviewId: review._id,
      clientName,
      clientEmail: email,
    });
  }

  /**
   * Send notification on review request
   */
  async sendReviewRequestNotification(reviewRequest, recipient) {
    const { client } = reviewRequest;
    const { name: clientName, email } = client;

    const title = 'Review Request Sent';
    const message = `A review request has been sent to ${clientName}`;

    // Send notification
    return await this.sendNotification(recipient, title, message, {
      type: 'review_request',
      reviewRequestId: reviewRequest._id,
      clientName,
      clientEmail: email,
    });
  }

  /**
   * Send notification on review thank you
   */
  async sendReviewThankYouNotification(review, recipient) {
    const { client } = review;
    const { name: clientName, email } = client;

    const title = 'Thank You for Your Review';
    const message = `Thank you, ${clientName}, for your review!`;

    // Send notification
    return await this.sendNotification(recipient, title, message, {
      type: 'review_thank_you',
      reviewId: review._id,
      clientName,
      clientEmail: email,
    });
  }

  /**
   * Send notification on negative review
   */
  async sendNegativeReviewNotification(review, recipient) {
    const { client } = review;
    const { name: clientName, email, phone } = client;
    const { rating } = review;

    const title = 'Urgent: Negative Review Received';
    const message = `URGENT: New negative review (${rating}-star) received from ${clientName}. Immediate attention required.`;

    // Send notification
    return await this.sendNotification(recipient, title, message, {
      type: 'negative_review_alert',
      reviewId: review._id,
      clientName,
      clientEmail: email,
      clientPhone: phone,
      rating,
    });
  }
}

const notificationService = new NotificationService();
module.exports = { notificationService };