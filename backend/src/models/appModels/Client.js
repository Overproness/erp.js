const mongoose = require('mongoose');
const commonFields = require('../utils/commonFields');

const schema = new mongoose.Schema({
  ...commonFields,
  enabled: {
    type: Boolean,
    default: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: { type: String, required: true },
  country: String,
  address: String,
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address',
    },
  },
  companyID: {
    type: String,
    index: true,
    sparse: true,
    // Used for list/summary methods
  },

  // New profile fields
  customerType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'company',
  },
  industry: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    enum: ['Small', 'Medium', 'Large'],
    default: 'Small',
  },
  tags: [String],
  demographics: {
    age: Number,
    gender: String,
    location: String,
    occupation: String,
    income: Number,
  },
  behavior: {
    lastPurchaseDate: Date,
    purchaseFrequency: String,
    preferredProducts: [String],
    preferredPaymentMethod: String,
    visitFrequency: Number,
  },
  customerValue: {
    lifetimeValue: Number,
    totalPurchases: Number,
    averageOrderValue: Number,
    loyaltyPoints: Number,
    customerSince: Date,
    segment: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'bronze'],
      default: 'bronze',
    },
  },
  touchpoints: [
    {
      channel: {
        type: String,
        enum: ['email', 'phone', 'in_person', 'web', 'social'],
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
        required: true,
      },
      type: {
        type: String,
        enum: ['inquiry', 'complaint', 'purchase', 'support', 'meeting', 'follow_up'],
        required: true,
      },
      notes: {
        type: String,
        maxlength: 1000,
      },
      outcome: {
        type: String,
        maxlength: 500,
      },
      createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'CompanyOwner',
      },
    },
  ],
  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },

  // Note: Timestamps and owner fields are inherited from commonFields
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Middleware to automatically set updatedBy on updates
schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
  // In a real app, this would come from the current user context
  // For now, we'll check if updatedBy is being set in the update
  if (this.getUpdate().$set && this.getUpdate().$set.updatedBy) {
    this.set({ updated: new Date() });
  }
});

// Middleware for save operations
schema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updated = new Date();
    // updatedBy should be set by the calling code
  }
  next();
});

// Add indexes for better search performance
schema.index({
  name: 'text',
  email: 'text',
  industry: 'text',
  'demographics.location': 'text',
});

// Add compound indexes for common queries
schema.index({ owner: 1, removed: 1 }); // For owner-specific filtered queries
schema.index({ customerType: 1, owner: 1 }); // For customer type filtering
schema.index({ industry: 1, owner: 1 }); // For industry filtering
schema.index({ 'demographics.location': 1, owner: 1 }); // For location filtering
schema.index({ name: 1, owner: 1 }); // For name filtering
schema.index({ enabled: 1, owner: 1, removed: 1 }); // For enabled client queries
schema.index({ companyID: 1 }); // Index for companyID

schema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Client', schema);
