// @ts-nocheck
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
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
    // Alternative name fields for testing compatibility
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      default: 'member',
      enum: ['member', 'lead', 'admin', 'editor', 'owner'],
    },
    team: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
      required: false,
    },
    companyOwner: {
      type: mongoose.Schema.ObjectId,
      ref: 'CompanyOwner',
    },
    companyID: {
      type: String,
      sparse: true,
    },
    permissions: {
      // Invoices
      canViewInvoices: { type: Boolean, default: false },
      canCreateInvoices: { type: Boolean, default: false },
      canUpdateInvoices: { type: Boolean, default: false },
      canDeleteInvoices: { type: Boolean, default: false },
      // Clients
      canViewClients: { type: Boolean, default: false },
      canCreateClients: { type: Boolean, default: false },
      canUpdateClients: { type: Boolean, default: false },
      canDeleteClients: { type: Boolean, default: false },
      // Payments
      canViewPayments: { type: Boolean, default: false },
      canCreatePayments: { type: Boolean, default: false },
      canUpdatePayments: { type: Boolean, default: false },
      canDeletePayments: { type: Boolean, default: false },
      // Quotes
      canViewQuotes: { type: Boolean, default: false },
      canCreateQuotes: { type: Boolean, default: false },
      canUpdateQuotes: { type: Boolean, default: false },
      canDeleteQuotes: { type: Boolean, default: false },
      // Offers
      canViewOffers: { type: Boolean, default: false },
      canCreateOffers: { type: Boolean, default: false },
      canUpdateOffers: { type: Boolean, default: false },
      canDeleteOffers: { type: Boolean, default: false },
      // Marketing
      canViewMarketing: { type: Boolean, default: false },
      canCreateMarketing: { type: Boolean, default: false },
      canUpdateMarketing: { type: Boolean, default: false },
      canDeleteMarketing: { type: Boolean, default: false },
      // Reputation
      canViewReputation: { type: Boolean, default: false },
      canCreateReputation: { type: Boolean, default: false },
      canViewReputation: { type: Boolean, default: false },
      canDeleteReputation: { type: Boolean, default: false },
      // Tasks
      canViewTasks: { type: Boolean, default: false },
      canCreateTasks: { type: Boolean, default: false },
      canUpdateTasks: { type: Boolean, default: false },
      canDeleteTasks: { type: Boolean, default: false },
      // Documents
      canViewDocuments: { type: Boolean, default: false },
      canCreateDocuments: { type: Boolean, default: false },
      canUpdateDocuments: { type: Boolean, default: false },
      canDeleteDocuments: { type: Boolean, default: false },
      // Reports
      canViewReports: { type: Boolean, default: false },
      canCreateReports: { type: Boolean, default: false },
      canUpdateReports: { type: Boolean, default: false },
      canDeleteReports: { type: Boolean, default: false },
      // Analytics
      canViewAnalytics: { type: Boolean, default: false },
      canCreateAnalytics: { type: Boolean, default: false },
      canUpdateAnalytics: { type: Boolean, default: false },
      canDeleteAnalytics: { type: Boolean, default: false },
      // Settings
      canViewSettings: { type: Boolean, default: false },
      canCreateSettings: { type: Boolean, default: false },
      canUpdateSettings: { type: Boolean, default: false },
      canDeleteSettings: { type: Boolean, default: false },
      // Notifications
      canViewNotifications: { type: Boolean, default: false },
      canCreateNotifications: { type: Boolean, default: false },
      canUpdateNotifications: { type: Boolean, default: false },
      canDeleteNotifications: { type: Boolean, default: false },
      // AI Assistant
      canViewAiAssistants: { type: Boolean, default: false },
      canCreateAiAssistants: { type: Boolean, default: false },
      canUpdateAiAssistants: { type: Boolean, default: false },
      canDeleteAiAssistants: { type: Boolean, default: false },
      // Taxes
      canViewTaxes: { type: Boolean, default: false },
      canCreateTaxes: { type: Boolean, default: false },
      canUpdateTaxes: { type: Boolean, default: false },
      canDeleteTaxes: { type: Boolean, default: false },
      // Currency
      canViewCurrency: { type: Boolean, default: false },
      canCreateCurrency: { type: Boolean, default: false },
      canUpdateCurrency: { type: Boolean, default: false },
      canDeleteCurrency: { type: Boolean, default: false },
      // Team
      canViewTeams: { type: Boolean, default: false },
      canCreateTeams: { type: Boolean, default: false },
      canUpdateTeams: { type: Boolean, default: false },
      canDeleteTeams: { type: Boolean, default: false },
      // Workflow
      canViewWorkflows: { type: Boolean, default: false },
      canCreateWorkflows: { type: Boolean, default: false },
      canUpdateWorkflows: { type: Boolean, default: false },
      canDeleteWorkflows: { type: Boolean, default: false },
      // Social Media
      canViewSocialAccounts: { type: Boolean, default: false },
      canCreateSocialAccounts: { type: Boolean, default: false },
      canUpdateSocialAccounts: { type: Boolean, default: false },
      canDeleteSocialAccounts: { type: Boolean, default: false },
      canViewSocialPosts: { type: Boolean, default: false },
      canCreateSocialPosts: { type: Boolean, default: false },
      canUpdateSocialPosts: { type: Boolean, default: false },
      canDeleteSocialPosts: { type: Boolean, default: false },
      canViewSocialCampaigns: { type: Boolean, default: false },
      canCreateSocialCampaigns: { type: Boolean, default: false },
      canUpdateSocialCampaigns: { type: Boolean, default: false },
      canDeleteSocialCampaigns: { type: Boolean, default: false },
      // URL Management
      canViewUrls: { type: Boolean, default: false },
      canCreateUrls: { type: Boolean, default: false },
      canUpdateUrls: { type: Boolean, default: false },
      canDeleteUrls: { type: Boolean, default: false },
      // Add more domains/actions as needed
    },
    effectivePermissions: {
      type: [String],
      default: [],
    },
    invitationToken: {
      type: String,
    },
    invitationExpires: {
      type: Date,
    },
    isInvitationAccepted: {
      type: Boolean,
      default: false,
    },
    invitedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'CompanyOwner',
      required: false,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    joinedAt: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },

    // Fields from userModel.js
    isAnonymized: {
      type: Boolean,
      default: false,
    },
    anonymizationDate: {
      type: Date,
      default: null,
    },
    anonymizationReason: {
      type: String,
      trim: true,
      default: null,
    },
    consentPreferences: {
      marketing: {
        type: Boolean,
        default: false,
      },
      analytics: {
        type: Boolean,
        default: false,
      },
      thirdPartySharing: {
        type: Boolean,
        default: false,
      },
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
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } }
);

// Handle alternative name formats BEFORE validation (runs first)
userSchema.pre('validate', function (next) {
  // Handle alternative name formats BEFORE validation
  if (!this.name && (this.firstName || this.lastName || this.username)) {
    if (this.firstName && this.lastName) {
      this.name = `${this.firstName} ${this.lastName}`;
    } else if (this.username) {
      this.name = this.username;
    } else if (this.firstName) {
      this.name = this.firstName;
    } else if (this.lastName) {
      this.name = this.lastName;
    }
  }

  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    console.log('Hashing password for User:', this.email);
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Update the 'updated' field before saving
userSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log('Comparing password (async) for:', this.email);
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Async password comparison error:', error);
    return false;
  }
};

// Add authenticate method for consistency with CompanyOwnerPassword model
userSchema.methods.authenticate = function (candidatePassword) {
  try {
    console.log('Authenticating (sync) password for:', this.email);
    const result = bcrypt.compareSync(candidatePassword, this.password);
    console.log('Authentication result:', result);
    return result;
  } catch (error) {
    console.error('Password authentication error:', error);
    return false;
  }
};

// Create text index for search
userSchema.index({ name: 'text', email: 'text' });

// Check if this model has already been compiled to prevent the OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
