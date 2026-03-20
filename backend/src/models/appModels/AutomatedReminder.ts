// @ts-nocheck
import mongoose from 'mongoose';

const automatedReminderSchema = new mongoose.Schema(
  {
    removed: {
      type: Boolean,
      default: false,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['appointment', 'task', 'deadline', 'followup', 'custom'],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['appointment', 'task', 'businessProcess', 'custom'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetType',
    },
    recipients: [
      {
        type: {
          type: String,
          enum: ['user', 'email', 'phone'],
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        phone: {
          type: String,
          trim: true,
        },
        name: {
          type: String,
          trim: true,
        },
      },
    ],
    schedule: {
      type: {
        type: String,
        enum: ['relative', 'absolute', 'recurring'],
        required: true,
      },
      // For relative reminders (e.g., 1 hour before appointment)
      relativeTiming: {
        value: Number,
        unit: {
          type: String,
          enum: ['minutes', 'hours', 'days', 'weeks'],
        },
        before: {
          type: Boolean,
          default: true,
        },
      },
      // For absolute reminders (specific date/time)
      absoluteTime: Date,
      // For recurring reminders
      recurring: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'monthly', 'custom'],
        },
        cron: String, // Cron expression for custom frequency
        startDate: Date,
        endDate: Date,
      },
    },
    channels: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        template: {
          type: String,
        },
        subject: {
          type: String,
        },
        customContent: {
          type: String,
        },
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false,
        },
        message: {
          type: String,
          maxlength: 160,
        },
      },
      push: {
        enabled: {
          type: Boolean,
          default: false,
        },
        title: {
          type: String,
        },
        body: {
          type: String,
        },
      },
      webhook: {
        enabled: {
          type: Boolean,
          default: false,
        },
        url: {
          type: String,
        },
        method: {
          type: String,
          enum: ['POST', 'PUT'],
          default: 'POST',
        },
        headers: {
          type: mongoose.Schema.Types.Mixed,
        },
        payload: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    },
    conditions: {
      enabled: {
        type: Boolean,
        default: false,
      },
      rules: [
        {
          field: String,
          operator: {
            type: String,
            enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in'],
          },
          value: mongoose.Schema.Types.Mixed,
        },
      ],
      logic: {
        type: String,
        enum: ['and', 'or'],
        default: 'and',
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'failed', 'cancelled', 'expired'],
      default: 'scheduled',
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: Date,
    deliveryStatus: [
      {
        channel: {
          type: String,
          enum: ['email', 'sms', 'push', 'webhook'],
        },
        status: {
          type: String,
          enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
        },
        recipientId: String,
        sentAt: Date,
        deliveredAt: Date,
        error: String,
        response: mongoose.Schema.Types.Mixed,
      },
    ],
    retryPolicy: {
      enabled: {
        type: Boolean,
        default: true,
      },
      maxRetries: {
        type: Number,
        default: 3,
      },
      retryDelay: {
        type: Number,
        default: 300, // seconds
      },
      currentRetries: {
        type: Number,
        default: 0,
      },
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    customData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    analytics: {
      openedAt: Date,
      clickedAt: Date,
      interactionCount: {
        type: Number,
        default: 0,
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
automatedReminderSchema.index({ status: 1, scheduledFor: 1 });
automatedReminderSchema.index({ targetType: 1, targetId: 1 });
automatedReminderSchema.index({ 'recipients.email': 1 });
automatedReminderSchema.index({ 'recipients.userId': 1 });
automatedReminderSchema.index({ createdBy: 1 });
automatedReminderSchema.index({ enabled: 1, status: 1 });

// Virtual for checking if reminder is due
automatedReminderSchema.virtual('isDue').get(function () {
  if (!this.scheduledFor) return false;
  return this.scheduledFor <= new Date() && this.status === 'scheduled';
});

// Virtual for checking if reminder is expired
automatedReminderSchema.virtual('isExpired').get(function () {
  if (!this.scheduledFor) return false;
  const expiryTime = new Date(this.scheduledFor);
  expiryTime.setHours(expiryTime.getHours() + 24); // Expire after 24 hours
  return expiryTime < new Date() && this.status === 'scheduled';
});

// Pre-save middleware
automatedReminderSchema.pre('save', function (next) {
  this.updated = new Date();

  // Mark as expired if past due and not sent
  if (this.isExpired && this.status === 'scheduled') {
    this.status = 'expired';
  }

  next();
});

// Method to calculate scheduled time for relative reminders
automatedReminderSchema.methods.calculateScheduledTime = async function (referenceDate) {
  if (this.schedule.type === 'absolute') {
    this.scheduledFor = this.schedule.absoluteTime;
    return this.scheduledFor;
  }

  if (this.schedule.type === 'relative') {
    const { value, unit, before } = this.schedule.relativeTiming;
    let milliseconds = 0;

    switch (unit) {
      case 'minutes':
        milliseconds = value * 60 * 1000;
        break;
      case 'hours':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'days':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'weeks':
        milliseconds = value * 7 * 24 * 60 * 60 * 1000;
        break;
    }

    const refTime = referenceDate ? new Date(referenceDate) : new Date();
    this.scheduledFor = new Date(
      before ? refTime.getTime() - milliseconds : refTime.getTime() + milliseconds
    );

    return this.scheduledFor;
  }

  // For recurring reminders, calculate next occurrence
  if (this.schedule.type === 'recurring') {
    // This would use a cron parser in production
    this.scheduledFor = this.schedule.recurring.startDate || new Date();
    return this.scheduledFor;
  }
};

// Method to check if conditions are met
automatedReminderSchema.methods.checkConditions = async function (data) {
  if (!this.conditions.enabled || !this.conditions.rules.length) {
    return true;
  }

  const logic = this.conditions.logic || 'and';
  const results = this.conditions.rules.map((rule) => {
    const fieldValue = data[rule.field];

    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value;
      case 'not_equals':
        return fieldValue !== rule.value;
      case 'contains':
        return String(fieldValue).includes(rule.value);
      case 'greater_than':
        return fieldValue > rule.value;
      case 'less_than':
        return fieldValue < rule.value;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      default:
        return false;
    }
  });

  return logic === 'and' ? results.every((r) => r) : results.some((r) => r);
};

// Method to mark reminder as sent
automatedReminderSchema.methods.markAsSent = function (channel, recipientId, response) {
  this.status = 'sent';
  this.sentAt = new Date();

  this.deliveryStatus.push({
    channel: channel,
    status: 'sent',
    recipientId: recipientId,
    sentAt: new Date(),
    response: response,
  });
};

// Method to mark reminder as failed
automatedReminderSchema.methods.markAsFailed = function (channel, recipientId, error) {
  this.deliveryStatus.push({
    channel: channel,
    status: 'failed',
    recipientId: recipientId,
    sentAt: new Date(),
    error: error,
  });

  // Check if should retry
  if (this.retryPolicy.enabled && this.retryPolicy.currentRetries < this.retryPolicy.maxRetries) {
    this.retryPolicy.currentRetries += 1;
    this.status = 'scheduled';
    // Reschedule after retry delay
    this.scheduledFor = new Date(Date.now() + this.retryPolicy.retryDelay * 1000);
  } else {
    this.status = 'failed';
  }
};

// Static method to find due reminders
automatedReminderSchema.statics.findDueReminders = function () {
  const now = new Date();

  return this.find({
    removed: false,
    enabled: true,
    status: 'scheduled',
    scheduledFor: { $lte: now },
  }).sort({ priority: -1, scheduledFor: 1 });
};

// Static method to create reminder for appointment
automatedReminderSchema.statics.createForAppointment = async function (
  appointmentId,
  appointment,
  userId
) {
  const reminders = [];

  // Default reminders: 24 hours, 1 hour, and 15 minutes before
  const timings = [
    { value: 24, unit: 'hours' },
    { value: 1, unit: 'hours' },
    { value: 15, unit: 'minutes' },
  ];

  for (const timing of timings) {
    const reminder = new this({
      name: `Appointment Reminder - ${timing.value} ${timing.unit} before`,
      type: 'appointment',
      targetType: 'appointment',
      targetId: appointmentId,
      recipients: appointment.attendees.map((att) => ({
        type: att.email ? 'email' : 'user',
        userId: att.userId,
        email: att.email,
        name: att.name,
      })),
      schedule: {
        type: 'relative',
        relativeTiming: {
          value: timing.value,
          unit: timing.unit,
          before: true,
        },
      },
      channels: {
        email: {
          enabled: true,
          subject: `Reminder: ${appointment.title}`,
        },
      },
      createdBy: userId,
    });

    await reminder.calculateScheduledTime(appointment.startTime);
    reminders.push(reminder);
  }

  return reminders;
};

const exportedModel = mongoose.model('AutomatedReminder', automatedReminderSchema);
export default exportedModel;
module.exports = exportedModel;
