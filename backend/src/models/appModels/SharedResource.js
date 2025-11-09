const mongoose = require('mongoose');

const sharedResourceSchema = new mongoose.Schema({
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
    enum: ['document', 'tool', 'equipment', 'facility', 'software', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance', 'unavailable'],
    default: 'available',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
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
  sharedWith: [
    {
      team: {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
      },
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      permissions: {
        view: {
          type: Boolean,
          default: true,
        },
        edit: {
          type: Boolean,
          default: false,
        },
        delete: {
          type: Boolean,
          default: false,
        },
        share: {
          type: Boolean,
          default: false,
        },
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
      sharedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    },
  ],
  currentUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reservations: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      team: {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
      },
      startTime: {
        type: Date,
        required: true,
      },
      endTime: {
        type: Date,
        required: true,
      },
      purpose: {
        type: String,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'active', 'completed', 'cancelled'],
        default: 'pending',
      },
      reservedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  usage: {
    totalHours: {
      type: Number,
      default: 0,
    },
    currentSession: {
      startTime: Date,
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    },
    history: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        startTime: Date,
        endTime: Date,
        duration: Number, // in minutes
        purpose: String,
      },
    ],
  },
  settings: {
    requireApproval: {
      type: Boolean,
      default: false,
    },
    maxReservationDuration: {
      type: Number, // in hours
      default: 24,
    },
    allowConcurrentUse: {
      type: Boolean,
      default: false,
    },
    notifyOnAvailable: {
      type: Boolean,
      default: true,
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  metadata: {
    location: String,
    capacity: Number,
    specifications: mongoose.Schema.Types.Mixed,
    manufacturer: String,
    model: String,
    serialNumber: String,
    purchaseDate: Date,
    warrantyExpiry: Date,
  },
  companyID: {
    type: String,
    index: true,
    sparse: true,
    // Used for list/summary methods
  },
});

// Update the 'updated' field before saving
sharedResourceSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

sharedResourceSchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('SharedResource', sharedResourceSchema);
