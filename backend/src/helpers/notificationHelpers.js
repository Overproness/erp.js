/**
 * Notification Helper Functions
 * Message formatting and delivery tracking
 */

/**
 * Format notification message based on type
 * @param {String} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} Formatted notification
 */
const formatNotification = (type, data) => {
  const baseNotification = {
    title: '',
    message: '',
    iconType: 'info',
    priority: 'normal',
    actionUrl: '',
    actionText: ''
  };
  
  switch (type) {
    case 'new_review':
      return {
        ...baseNotification,
        title: `New ${data.rating}-Star Review`,
        message: `${data.customerName} left a new ${data.rating}-star review on ${data.platform}`,
        iconType: data.rating >= 4 ? 'success' : (data.rating <= 2 ? 'warning' : 'info'),
        priority: data.rating <= 2 ? 'high' : 'normal',
        actionUrl: `/reviews/${data.reviewId}`,
        actionText: 'View Review'
      };
      
    case 'review_response':
      return {
        ...baseNotification,
        title: 'Response Posted',
        message: `Your response to ${data.customerName}'s review has been posted successfully`,
        iconType: 'success',
        actionUrl: `/reviews/${data.reviewId}`,
        actionText: 'View Response'
      };
      
    case 'review_approval_needed':
      return {
        ...baseNotification,
        title: 'Response Needs Approval',
        message: `A response to ${data.customerName}'s review requires your approval`,
        iconType: 'info',
        priority: 'high',
        actionUrl: `/reviews/${data.reviewId}/approve`,
        actionText: 'Review & Approve'
      };
      
    case 'negative_review':
      return {
        ...baseNotification,
        title: 'Attention: Negative Review',
        message: `${data.customerName} left a ${data.rating}-star review that needs attention`,
        iconType: 'error',
        priority: 'urgent',
        actionUrl: `/reviews/${data.reviewId}`,
        actionText: 'Respond Now'
      };
      
    case 'review_request_sent':
      return {
        ...baseNotification,
        title: 'Review Request Sent',
        message: `Review request sent to ${data.customerName} via ${data.method}`,
        iconType: 'info',
        actionUrl: `/review-requests`,
        actionText: 'View Requests'
      };
      
    default:
      return baseNotification;
  }
};

/**
 * Format email subject lines based on notification type
 * @param {String} type - Notification type
 * @param {Object} data - Email data
 * @returns {String} Formatted subject line
 */
const formatEmailSubject = (type, data) => {
  switch (type) {
    case 'review_request':
      return `${data.businessName} values your feedback`;
      
    case 'new_review_alert':
      return `New ${data.rating}-star review from ${data.customerName}`;
      
    case 'negative_review_alert':
      return `URGENT: New negative review (${data.rating}-star) received`;
      
    case 'response_approval':
      return `Review response needs your approval for ${data.customerName}'s review`;
      
    case 'review_analytics':
      return `${data.businessName} Review Performance Report: ${data.period}`;
      
    default:
      return 'Notification from Review Management System';
  }
};

/**
 * Format SMS messages based on notification type
 * @param {String} type - Notification type
 * @param {Object} data - SMS data
 * @returns {String} Formatted SMS message
 */
const formatSmsMessage = (type, data) => {
  switch (type) {
    case 'review_request':
      return `${data.businessName} values your feedback! Please leave a review at: ${data.reviewLink}`;
      
    case 'new_review_alert':
      return `New ${data.rating}-star review received from ${data.customerName}. Check your dashboard to respond.`;
      
    case 'negative_review_alert':
      return `URGENT: New negative review (${data.rating}-star) received from ${data.customerName}. Immediate attention required.`;
      
    default:
      return `Notification from ${data.businessName || 'Review Management System'}`;
  }
};

/**
 * Get recipients for notifications based on business settings
 * @param {Object} business - Business object with notification settings
 * @param {String} notificationType - Type of notification
 * @returns {Array} Array of recipient objects with contact info
 */
const getNotificationRecipients = (business, notificationType) => {
  if (!business || !business.notificationSettings) {
    return []; // No recipients if no business or settings
  }
  
  const { notificationSettings } = business;
  const recipients = [];
  
  // Primary business owner always gets notifications by default
  if (business.owner) {
    recipients.push({
      id: business.owner,
      type: 'owner',
      email: business.email,
      phone: business.phone,
      methods: ['email', 'app']  // Default methods
    });
  }
  
  // Add additional recipients from notification settings
  if (notificationSettings.additionalRecipients) {
    notificationSettings.additionalRecipients.forEach(recipient => {
      // Check if this recipient should receive this notification type
      if (recipient.notificationTypes.includes(notificationType) || 
          recipient.notificationTypes.includes('all')) {
        recipients.push({
          id: recipient.id,
          type: recipient.type || 'staff',
          email: recipient.email,
          phone: recipient.phone,
          methods: recipient.methods || ['email']
        });
      }
    });
  }
  
  return recipients;
};

/**
 * Track notification delivery status
 * @param {String} notificationId - Notification identifier
 * @param {String} method - Delivery method (email, sms, app)
 * @param {Boolean} success - Whether delivery was successful
 * @param {Object} details - Additional delivery details
 * @returns {Object} Updated delivery status
 */
const trackDeliveryStatus = (notificationId, method, success, details = {}) => {
  // In a real implementation, this would update a database record
  // This is a simplified version for demonstration
  
  const deliveryStatus = {
    notificationId,
    method,
    success,
    timestamp: new Date(),
    details
  };
  
  // Log the delivery status (in production, save to database)
  console.log(`Notification ${notificationId} delivery via ${method}: ${success ? 'Success' : 'Failed'}`);
  
  return deliveryStatus;
};

/**
 * Determine notification channel priority based on importance
 * @param {String} priority - Notification priority level
 * @param {Object} businessSettings - Business notification settings
 * @returns {Array} Ordered array of delivery methods
 */
const getDeliveryMethods = (priority, businessSettings) => {
  if (!businessSettings) {
    // Default fallback if no settings
    return priority === 'urgent' 
      ? ['email', 'sms', 'app'] 
      : ['app', 'email'];
  }
  
  // Use business specific settings or defaults
  switch (priority) {
    case 'urgent':
      return businessSettings.urgentDeliveryMethods || ['email', 'sms', 'app'];
      
    case 'high':
      return businessSettings.highDeliveryMethods || ['email', 'app'];
      
    case 'normal':
    default:
      return businessSettings.normalDeliveryMethods || ['app', 'email'];
  }
};

/**
 * Format notification for real-time updates (websockets)
 * @param {Object} notification - Notification data
 * @returns {Object} Formatted for real-time delivery
 */
const formatRealTimeNotification = (notification) => {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.iconType || 'info',
    timestamp: Date.now(),
    read: false,
    data: {
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      ...notification.data
    }
  };
};

module.exports = {
  formatNotification,
  formatEmailSubject,
  formatSmsMessage,
  getNotificationRecipients,
  trackDeliveryStatus,
  getDeliveryMethods,
  formatRealTimeNotification
};
