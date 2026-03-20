// @ts-nocheck
import mongoose from 'mongoose';

const abTestSchema = new mongoose.Schema({
  // Basic Information
  testName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  hypothesis: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Test Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // Test URLs
  controlUrl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'URL',
    required: true
  },
  variants: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'URL',
      required: true
    },
    trafficAllocation: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }],

  // Traffic Distribution
  controlTrafficAllocation: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Test Configuration
  testType: {
    type: String,
    enum: ['split_url', 'redirect_test', 'content_test'],
    default: 'split_url'
  },
  
  // Duration and Timing
  startDate: {
    type: Date,
    index: true
  },
  endDate: {
    type: Date,
    index: true
  },
  duration: {
    type: Number, // in days
    min: 1,
    max: 365
  },
  
  // Success Metrics
  primaryMetric: {
    type: String,
    enum: ['click_rate', 'conversion_rate', 'time_on_site', 'bounce_rate', 'custom'],
    default: 'click_rate'
  },
  secondaryMetrics: [{
    type: String,
    enum: ['click_rate', 'conversion_rate', 'time_on_site', 'bounce_rate', 'custom']
  }],
  conversionGoal: {
    type: String,
    trim: true
  },
  
  // Sample Size and Statistics
  minimumSampleSize: {
    type: Number,
    default: 100,
    min: 10
  },
  confidenceLevel: {
    type: Number,
    default: 95,
    min: 80,
    max: 99
  },
  minimumDetectableEffect: {
    type: Number,
    default: 5, // percentage
    min: 1,
    max: 50
  },
  
  // Current Results
  totalParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  controlParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  variantParticipants: [{
    variantName: String,
    participants: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  
  // Performance Metrics
  results: {
    control: {
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      averageTimeOnSite: { type: Number, default: 0 },
      bounceRate: { type: Number, default: 0 }
    },
    variants: [{
      name: String,
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      averageTimeOnSite: { type: Number, default: 0 },
      bounceRate: { type: Number, default: 0 }
    }]
  },
  
  // Statistical Analysis
  statisticalSignificance: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  pValue: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  },
  winner: {
    type: String,
    enum: ['control', 'variant_a', 'variant_b', 'variant_c', 'inconclusive'],
    default: 'inconclusive'
  },
  winnerDeclaredAt: {
    type: Date
  },
  
  // Segments and Targeting
  targetAudience: {
    countries: [String],
    devices: [{
      type: String,
      enum: ['mobile', 'desktop', 'tablet']
    }],
    userTypes: [{
      type: String,
      enum: ['new', 'returning', 'authenticated', 'anonymous']
    }],
    trafficSources: [String]
  },
  
  // Quality Assurance
  excludeBots: {
    type: Boolean,
    default: true
  },
  excludeInternalTraffic: {
    type: Boolean,
    default: true
  },
  qualityThreshold: {
    type: Number,
    default: 90, // percentage
    min: 50,
    max: 100
  },
  
  // Notifications and Alerts
  alerts: {
    significanceReached: {
      type: Boolean,
      default: false
    },
    sampleSizeReached: {
      type: Boolean,
      default: false
    },
    testCompleted: {
      type: Boolean,
      default: false
    }
  },
  
  // Notes and Comments
  notes: [{
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Ownership and Audit
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Archive and Cleanup
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: {
    type: Date
  },
  
  // Company ID
  companyID: {
    type: String,  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
abTestSchema.index({ testName: 1, status: 1 });
abTestSchema.index({ status: 1, startDate: 1, endDate: 1 });
abTestSchema.index({ owner: 1, status: 1 });
abTestSchema.index({ createdAt: -1 });
abTestSchema.index({ controlUrl: 1 });
abTestSchema.index({ 'variants.url': 1 });
abTestSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Virtual for test duration in days
abTestSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days running
abTestSchema.virtual('daysRunning').get(function() {
  if (!this.startDate) return 0;
  const endDate = this.endDate || new Date();
  return Math.ceil((endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage
abTestSchema.virtual('completionPercentage').get(function() {
  if (!this.minimumSampleSize) return 0;
  return Math.min((this.totalParticipants / this.minimumSampleSize) * 100, 100);
});

// Virtual for is statistically significant
abTestSchema.virtual('isStatisticallySignificant').get(function() {
  return this.statisticalSignificance >= this.confidenceLevel;
});

// Virtual for can declare winner
abTestSchema.virtual('canDeclareWinner').get(function() {
  return this.isStatisticallySignificant && 
         this.totalParticipants >= this.minimumSampleSize &&
         this.status === 'active';
});

// Pre-save middleware to validate traffic allocation
abTestSchema.pre('save', function(next) {
  // Validate traffic allocation sums to 100%
  const totalAllocation = this.controlTrafficAllocation + 
    this.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
  
  if (Math.abs(totalAllocation - 100) > 0.01) {
    return next(new Error('Traffic allocation must sum to 100%'));
  }
  
  // Set end date if duration is provided
  if (this.startDate && this.duration && !this.endDate) {
    this.endDate = new Date(this.startDate.getTime() + (this.duration * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Instance method to assign variant to user
abTestSchema.methods.assignVariant = function(userId) {
  if (this.status !== 'active') {
    return 'control'; // Default to control if test is not active
  }
  
  // Use consistent hash function based on userId and test ID
  const hash = require('crypto')
    .createHash('md5')
    .update(userId + this._id.toString())
    .digest('hex');
  
  // Convert hash to number between 0 and 100
  const hashNumber = parseInt(hash.substring(0, 8), 16) % 100;
  
  let cumulativeAllocation = 0;
  
  // Check control
  if (hashNumber < this.controlTrafficAllocation) {
    return 'control';
  }
  cumulativeAllocation = this.controlTrafficAllocation;
  
  // Check variants
  for (let i = 0; i < this.variants.length; i++) {
    cumulativeAllocation += this.variants[i].trafficAllocation;
    if (hashNumber < cumulativeAllocation) {
      return `variant_${String.fromCharCode(97 + i)}`; // variant_a, variant_b, etc.
    }
  }
  
  return 'control'; // Fallback to control
};

// Instance method to record participation
abTestSchema.methods.recordParticipation = function(variant) {
  this.totalParticipants += 1;
  
  if (variant === 'control') {
    this.controlParticipants += 1;
  } else {
    // Find and update variant participants
    const variantIndex = variant.charCodeAt(variant.length - 1) - 97; // Get index from variant_a, variant_b, etc.
    if (this.variantParticipants[variantIndex]) {
      this.variantParticipants[variantIndex].participants += 1;
    }
  }
  
  return this.save();
};

// Instance method to calculate statistical significance
abTestSchema.methods.calculateStatisticalSignificance = function() {
  if (this.totalParticipants < this.minimumSampleSize) {
    this.statisticalSignificance = 0;
    this.pValue = 1;
    return;
  }
  
  // Simple z-test for proportions (should use proper statistical library in production)
  const controlRate = this.results.control.conversionRate / 100;
  const controlSample = this.controlParticipants;
  
  let maxSignificance = 0;
  let minPValue = 1;
  
  this.results.variants.forEach(variant => {
    const variantRate = variant.conversionRate / 100;
    const variantSample = this.variantParticipants.find(vp => vp.variantName === variant.name)?.participants || 0;
    
    if (variantSample > 0) {
      // Z-test calculation (simplified)
      const pooledRate = ((controlRate * controlSample) + (variantRate * variantSample)) / (controlSample + variantSample);
      const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * ((1 / controlSample) + (1 / variantSample)));
      
      if (standardError > 0) {
        const zScore = Math.abs(variantRate - controlRate) / standardError;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore))); // Two-tailed test
        const significance = (1 - pValue) * 100;
        
        if (significance > maxSignificance) {
          maxSignificance = significance;
          minPValue = pValue;
        }
      }
    }
  });
  
  this.statisticalSignificance = maxSignificance;
  this.pValue = minPValue;
};

// Helper method for normal CDF (cumulative distribution function)
abTestSchema.methods.normalCDF = function(x) {
  // Approximation of normal CDF using error function
  return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
};

// Helper method for error function approximation
abTestSchema.methods.erf = function(x) {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
};

// Static method to find active tests for a URL
abTestSchema.statics.findActiveTestsForUrl = function(urlId) {
  return this.find({
    $or: [
      { controlUrl: urlId },
      { 'variants.url': urlId }
    ],
    status: 'active',
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $gte: new Date() } },
      { endDate: null }
    ]
  });
};

const exportedModel = mongoose.model('ABTest', abTestSchema);
export default exportedModel;
module.exports = exportedModel;
