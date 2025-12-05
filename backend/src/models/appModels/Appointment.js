const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'declined', 'tentative'],
    default: 'pending',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reminders: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
});

const reminderSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'webhook'],
    required: true,
  },
  timing: {
    type: Number, // Minutes before appointment
    required: true,
  },
  sent: {
    type: Boolean,
    default: false,
  },
  sentAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
  },
  error: {
    type: String,
  },
});

const appointmentSchema = new mongoose.Schema(
  {
    removed: {
      type: Boolean,
      default: false,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
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
      enum: [
        'consultation',
        'meeting',
        'demo',
        'support',
        'training',
        'interview',
        'followup',
        'other',
      ],
      default: 'meeting',
    },
    status: {
      type: String,
      enum: [
        'scheduled',
        'confirmed',
        'in-progress',
        'completed',
        'cancelled',
        'no-show',
        'rescheduled',
      ],
      default: 'scheduled',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    location: {
      type: {
        type: String,
        enum: ['physical', 'virtual', 'phone', 'hybrid'],
        default: 'virtual',
      },
      address: {
        type: String,
      },
      meetingUrl: {
        type: String,
      },
      phone: {
        type: String,
      },
      instructions: {
        type: String,
      },
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [attendeeSchema],
    reminders: [reminderSchema],
    bookingUrl: {
      shortCode: {
        type: String,
        trim: true,
      },
      urlId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'URL',
      },
      expiresAt: {
        type: Date,
      },
      allowReschedule: {
        type: Boolean,
        default: true,
      },
      allowCancel: {
        type: Boolean,
        default: true,
      },
    },
    businessProcess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProcess',
    },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnhancedWorkflow',
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    relatedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    relatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    notes: {
      type: String,
      trim: true,
    },
    privateNotes: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    cancelReason: {
      type: String,
      trim: true,
    },
    rescheduleHistory: [
      {
        oldStartTime: Date,
        oldEndTime: Date,
        newStartTime: Date,
        newEndTime: Date,
        reason: String,
        rescheduledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rescheduledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    automationSettings: {
      sendConfirmation: {
        type: Boolean,
        default: true,
      },
      sendReminders: {
        type: Boolean,
        default: true,
      },
      sendFollowup: {
        type: Boolean,
        default: false,
      },
      autoCompleteOnEndTime: {
        type: Boolean,
        default: false,
      },
      triggerWorkflow: {
        type: Boolean,
        default: false,
      },
    },
    analytics: {
      bookingSource: {
        type: String,
        enum: ['manual', 'url', 'api', 'import', 'integration'],
        default: 'manual',
      },
      confirmationSentAt: Date,
      confirmationOpenedAt: Date,
      lastReminderSentAt: Date,
      noShowNotifiedAt: Date,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
appointmentSchema.index({ organizer: 1, startTime: 1 });
appointmentSchema.index({ 'attendees.email': 1 });
appointmentSchema.index({ status: 1, startTime: 1 });
appointmentSchema.index({ 'bookingUrl.shortCode': 1 });
appointmentSchema.index({ startTime: 1, endTime: 1 });
appointmentSchema.index({ relatedClient: 1 });
appointmentSchema.index({ relatedLead: 1 });

// Virtual for formatted duration
appointmentSchema.virtual('durationFormatted').get(function () {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
});

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function () {
  return this.startTime > new Date() && this.status === 'scheduled';
});

// Virtual for checking if appointment is past
appointmentSchema.virtual('isPast').get(function () {
  return this.endTime < new Date();
});

// Pre-save middleware
appointmentSchema.pre('save', function (next) {
  this.updated = new Date();

  // Calculate duration if not provided
  if (!this.duration && this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }

  // Set endTime if not provided but duration is
  if (!this.endTime && this.startTime && this.duration) {
    this.endTime = new Date(this.startTime.getTime() + this.duration * 60 * 1000);
  }

  next();
});

// Method to check if appointment needs reminder
appointmentSchema.methods.needsReminder = function () {
  const now = new Date();
  const minutesUntilAppointment = Math.round((this.startTime - now) / (1000 * 60));

  return this.reminders.some((reminder) => {
    return (
      !reminder.sent &&
      reminder.status === 'pending' &&
      minutesUntilAppointment <= reminder.timing &&
      minutesUntilAppointment > 0
    );
  });
};

// Method to check if appointment is conflicting with another
appointmentSchema.methods.hasConflict = async function (userId) {
  const Appointment = mongoose.model('Appointment');

  const conflicts = await Appointment.find({
    _id: { $ne: this._id },
    removed: false,
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    $or: [{ organizer: userId }, { 'attendees.userId': userId }],
    $or: [
      {
        startTime: { $lt: this.endTime },
        endTime: { $gt: this.startTime },
      },
    ],
  });

  return conflicts.length > 0;
};

// Static method to find upcoming appointments
appointmentSchema.statics.findUpcoming = function (userId, days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    removed: false,
    status: { $in: ['scheduled', 'confirmed'] },
    $or: [{ organizer: userId }, { 'attendees.userId': userId }],
    startTime: {
      $gte: now,
      $lte: futureDate,
    },
  }).sort({ startTime: 1 });
};

// Static method to find appointments needing reminders
appointmentSchema.statics.findNeedingReminders = function () {
  const now = new Date();
  const futureWindow = new Date();
  futureWindow.setHours(futureWindow.getHours() + 24); // Check 24 hours ahead

  return this.find({
    removed: false,
    enabled: true,
    status: { $in: ['scheduled', 'confirmed'] },
    startTime: {
      $gte: now,
      $lte: futureWindow,
    },
    'reminders.sent': false,
    'reminders.status': 'pending',
    'automationSettings.sendReminders': true,
  });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
