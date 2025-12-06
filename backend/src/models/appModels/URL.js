const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    // Basic URL Information
    originalUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (url) {
          // Allow localhost and 127.0.0.1 URLs
          if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(url)) {
            return true;
          }
          // Standard public URL pattern
          return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url);
        },
        message: 'Please provide a valid URL',
      },
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],

    // Configuration Settings
    customDomain: {
      type: String,
      trim: true,
      validate: {
        validator: function (domain) {
          if (!domain) return true;
          return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(domain);
        },
        message: 'Please provide a valid domain',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Access Controls
    requiresAuth: {
      type: Boolean,
      default: false,
    },
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    allowedRoles: [
      {
        type: String,
        enum: ['admin', 'user', 'manager', 'viewer'],
      },
    ],
    passwordProtected: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      select: false, // Don't include in queries by default
    },

    // Expiration and Limits
    expiresAt: {
      type: Date,
    },
    maxClicks: {
      type: Number,
      min: 0,
    },
    clickLimit: {
      type: Number,
      min: 0,
    },

    // Analytics Counters
    totalClicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueClicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastClickedAt: {
      type: Date,
    },
    firstClickedAt: {
      type: Date,
    },

    // A/B Testing
    abTestGroup: {
      type: String,
      enum: ['control', 'variant_a', 'variant_b', 'variant_c'],
      default: 'control',
    },
    abTestName: {
      type: String,
      trim: true,
    },
    abTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ABTest',
    },

    // Module Integration
    linkedModule: {
      type: String,
      enum: [
        'invoice',
        'quote',
        'customer',
        'document',
        'campaign',
        'product',
        'payment',
        'social_media',
      ],
    },
    linkedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    linkedEntityType: {
      type: String,
    },

    // UTM Parameters
    utmSource: {
      type: String,
      trim: true,
    },
    utmMedium: {
      type: String,
      trim: true,
    },
    utmCampaign: {
      type: String,
      trim: true,
    },
    utmTerm: {
      type: String,
      trim: true,
    },
    utmContent: {
      type: String,
      trim: true,
    },

    // Security and Restrictions
    ipRestrictions: [
      {
        ip: String,
        type: {
          type: String,
          enum: ['whitelist', 'blacklist'],
          default: 'whitelist',
        },
      },
    ],
    countryRestrictions: [
      {
        country: String,
        type: {
          type: String,
          enum: ['allow', 'block'],
          default: 'allow',
        },
      },
    ],
    deviceRestrictions: [
      {
        type: String,
        enum: ['mobile', 'desktop', 'tablet'],
      },
    ],

    // Organization
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },

    // Metadata
    favicon: {
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    ogImage: {
      type: String,
      trim: true,
    },

    // QR Code
    qrCode: {
      type: String, // Base64 encoded QR code image
      select: false,
    },
    qrCodeUrl: {
      type: String,
      trim: true,
    },

    // Ownership and Audit
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Status and State
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'suspended', 'deleted'],
      default: 'active',
    },

    // Performance Metrics
    averageClickTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    bounceRate: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100,
    },
    conversionRate: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100,
    },

    // Notes and Comments
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      select: false, // Internal use only
    },
    companyID: {
      type: String,
      index: true,
      sparse: true,
      // Used for list/summary methods
    },

    // Customization settings for URL behavior
    customization: {
      password: {
        type: String,
        select: false,
      },
      expiresAt: {
        type: Date,
      },
      maxClicks: {
        type: Number,
        min: 0,
      },
    },

    // Additional metadata for linked entities (e.g., documents)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Click counter for tracking
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
urlSchema.index({ shortCode: 1 }, { unique: true });
urlSchema.index({ owner: 1, createdAt: -1 });
urlSchema.index({ expiresAt: 1 });
urlSchema.index({ isActive: 1, isPublic: 1 });
urlSchema.index({ totalClicks: -1 });
urlSchema.index({ linkedModule: 1, linkedEntityId: 1 });
urlSchema.index({ abTestId: 1, abTestGroup: 1 });
urlSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } }
);
urlSchema.index({ companyID: 1 }); // Index for companyID

// Virtual for full shortened URL
urlSchema.virtual('shortenedUrl').get(function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8888';
  const domain = this.customDomain || baseUrl;
  return `${domain}/s/${this.shortCode}`;
});

// Virtual for click rate
urlSchema.virtual('clickRate').get(function () {
  if (this.totalClicks === 0) return 0;
  return ((this.uniqueClicks / this.totalClicks) * 100).toFixed(2);
});

// Virtual for days since creation
urlSchema.virtual('daysSinceCreation').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for expiration status
urlSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for click limit reached
urlSchema.virtual('clickLimitReached').get(function () {
  if (!this.maxClicks) return false;
  return this.totalClicks >= this.maxClicks;
});

// Pre-save middleware
urlSchema.pre('save', function (next) {
  // Ensure originalUrl has protocol
  if (this.originalUrl && !this.originalUrl.match(/^https?:\/\//)) {
    this.originalUrl = 'https://' + this.originalUrl;
  }

  // Set first clicked at
  if (this.totalClicks > 0 && !this.firstClickedAt) {
    this.firstClickedAt = new Date();
  }

  next();
});

// Static method to find by short code
urlSchema.statics.findByShortCode = function (shortCode) {
  return this.findOne({ shortCode, status: 'active' });
};

// Instance method to increment clicks
urlSchema.methods.incrementClicks = function (isUnique = false) {
  this.totalClicks += 1;
  if (isUnique) {
    this.uniqueClicks += 1;
  }
  this.lastClickedAt = new Date();
  return this.save();
};

// Instance method to check if URL is accessible
urlSchema.methods.isAccessible = function (user, ip, country) {
  // Check if active
  if (this.status !== 'active' || !this.isActive) return false;

  // Check expiration
  if (this.expiresAt && new Date() > this.expiresAt) return false;

  // Check click limit
  if (this.maxClicks && this.totalClicks >= this.maxClicks) return false;

  // Check authentication
  if (this.requiresAuth && !user) return false;

  // Check user permissions
  if (this.allowedUsers.length > 0 && user && !this.allowedUsers.includes(user._id)) return false;

  // Check IP restrictions
  if (this.ipRestrictions.length > 0) {
    const ipRule = this.ipRestrictions.find((rule) => rule.ip === ip);
    if (ipRule && ipRule.type === 'blacklist') return false;
    if (this.ipRestrictions.some((rule) => rule.type === 'whitelist') && !ipRule) return false;
  }

  // Check country restrictions
  if (this.countryRestrictions.length > 0 && country) {
    const countryRule = this.countryRestrictions.find((rule) => rule.country === country);
    if (countryRule && countryRule.type === 'block') return false;
    if (this.countryRestrictions.some((rule) => rule.type === 'allow') && !countryRule)
      return false;
  }

  return true;
};

module.exports = mongoose.model('URL', urlSchema);
