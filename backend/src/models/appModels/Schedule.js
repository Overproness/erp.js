const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
    enum: ['meeting', 'task', 'event', 'deadline', 'reminder'],
    default: 'meeting',
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  allDay: {
    type: Boolean,
    default: false,
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    interval: {
      type: Number,
      default: 1,
    },
    endDate: Date,
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  organizer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  attendees: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      team: {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
      },
      role: {
        type: String,
        enum: ['required', 'optional', 'informational'],
        default: 'required',
      },
      response: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'tentative'],
        default: 'pending',
      },
      respondedAt: Date,
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  teams: [
    {
      team: {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
        required: true,
      },
      role: {
        type: String,
        enum: ['primary', 'secondary', 'observer'],
        default: 'primary',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  location: {
    type: {
      type: String,
      enum: ['physical', 'virtual', 'hybrid'],
      default: 'physical',
    },
    address: String,
    room: String,
    virtualLink: String,
    conferenceDetails: {
      platform: String,
      meetingId: String,
      password: String,
    },
  },
  resources: [
    {
      resource: {
        type: mongoose.Schema.ObjectId,
        ref: 'SharedResource',
      },
      quantity: {
        type: Number,
        default: 1,
      },
      reserved: {
        type: Boolean,
        default: false,
      },
    },
  ],
  reminders: [
    {
      type: {
        type: String,
        enum: ['email', 'notification', 'sms'],
        default: 'notification',
      },
      timing: {
        type: Number, // minutes before event
        required: true,
      },
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
    },
  ],
  attachments: [
    {
      fileName: String,
      filePath: String,
      fileSize: Number,
      uploadedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  visibility: {
    type: String,
    enum: ['public', 'private', 'team-only', 'attendees-only'],
    default: 'team-only',
  },
  settings: {
    allowGuestInvites: {
      type: Boolean,
      default: false,
    },
    requireRSVP: {
      type: Boolean,
      default: true,
    },
    sendReminders: {
      type: Boolean,
      default: true,
    },
    recordMeeting: {
      type: Boolean,
      default: false,
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  metadata: {
    timezone: String,
    duration: Number, // in minutes
    estimatedCost: Number,
    actualCost: Number,
    notes: String,
  },
  companyID: {
    type: String,
    index: true,
    sparse: true,
    // Used for list/summary methods
  },
});

// Update the 'updated' field before saving
scheduleSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

// Calculate duration before saving
scheduleSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    this.metadata.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

scheduleSchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('Schedule', scheduleSchema);
