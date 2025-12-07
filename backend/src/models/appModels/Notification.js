const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Recipient information
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientModel',
      index: true,
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['CompanyOwner', 'User', 'Team'],
      default: 'CompanyOwner',
    },

    // Notification content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Notification metadata
    type: {
      type: String,
      enum: [
        'info',
        'success',
        'warning',
        'error',
        'task_assigned',
        'task_updated',
        'document_shared',
        'document_updated',
        'team_activity',
        'team_update',
        'new_review',
        'review_response',
        'review_approval',
        'negative_review',
        'ai_response',
        'workflow_completed',
        'workflow_failed',
        'quote_created',
        'quote_approved',
        'payment_received',
        'social_mention',
        'campaign_alert',
        'system_alert',
      ],
      default: 'info',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },

    // Additional data
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Action information
    actionUrl: {
      type: String,
      trim: true,
    },
    actionText: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    // Status tracking
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },

    // Delivery tracking
    channels: [
      {
        type: String,
        enum: ['app', 'email', 'sms', 'push'],
      },
    ],
    deliveryStatus: {
      app: {
        delivered: { type: Boolean, default: false },
        deliveredAt: Date,
        error: String,
      },
      email: {
        delivered: { type: Boolean, default: false },
        deliveredAt: Date,
        messageId: String,
        error: String,
      },
      sms: {
        delivered: { type: Boolean, default: false },
        deliveredAt: Date,
        messageId: String,
        error: String,
      },
      push: {
        delivered: { type: Boolean, default: false },
        deliveredAt: Date,
        messageId: String,
        error: String,
      },
    },

    // Source information
    source: {
      module: {
        type: String,
        enum: [
          'reviews',
          'tasks',
          'documents',
          'team',
          'ai',
          'workflow',
          'quotes',
          'social',
          'system',
          'other',
        ],
      },
      entityId: mongoose.Schema.Types.ObjectId,
      entityType: String,
    },

    // Company context
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
      index: true,
    },

    // Expiration
    expiresAt: {
      type: Date,
      index: true,
    },

    // Soft delete
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Indexes for performance
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ owner: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
notificationSchema.methods.markAsRead = async function () {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

notificationSchema.methods.softDelete = async function () {
  this.deleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

// Statics
notificationSchema.statics.getUnreadCount = async function (recipientId) {
  return await this.countDocuments({
    recipientId,
    read: false,
    deleted: false,
  });
};

notificationSchema.statics.markAllAsRead = async function (recipientId) {
  return await this.updateMany(
    { recipientId, read: false, deleted: false },
    {
      $set: {
        read: true,
        readAt: new Date(),
      },
    }
  );
};

notificationSchema.statics.deleteOldNotifications = async function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true,
  });
};

notificationSchema.statics.getUserNotifications = async function (recipientId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    unreadOnly = false,
    type = null,
    priority = null,
    startDate = null,
    endDate = null,
  } = options;

  const query = {
    recipientId,
    deleted: false,
  };

  if (unreadOnly) {
    query.read = false;
  }

  if (type) {
    query.type = type;
  }

  if (priority) {
    query.priority = priority;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return await this.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
};

// Virtual for formatted creation time
notificationSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
