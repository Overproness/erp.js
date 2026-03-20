import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const BusinessSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdByModel',
    },
    createdByModel: {
      type: String,
      enum: ['CompanyOwner', 'User'],
      default: 'CompanyOwner',
    },
    type: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    contact: {
      name: String,
      title: String,
      email: String,
      phone: String,
    },
    branding: {
      logoUrl: String,
      primaryColor: {
        type: String,
        default: '#4CAF50',
      },
      secondaryColor: {
        type: String,
        default: '#2196F3',
      },
      fonts: {
        main: {
          type: String,
          default: 'Roboto, sans-serif',
        },
        headings: {
          type: String,
          default: 'Poppins, sans-serif',
        },
      },
    },
    socialLinks: {
      website: String,
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String,
    },
    settings: {
      reviewSettings: {
        autoRespond: {
          type: Boolean,
          default: false,
        },
        notifyOnReview: {
          type: Boolean,
          default: true,
        },
        reminderSettings: {
          enabled: {
            type: Boolean,
            default: false,
          },
          frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'weekly',
          },
        },
      },
      notificationSettings: {
        email: {
          enabled: {
            type: Boolean,
            default: true,
          },
          recipients: [String],
        },
        sms: {
          enabled: {
            type: Boolean,
            default: false,
          },
          recipients: [String],
        },
      },
    },
    removed: {
      type: Boolean,
      default: false,
    },
    companyID: {
      type: String,    },
  },
  {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
BusinessSchema.index({ owner: 1, name: 1 });
BusinessSchema.index({ removed: 1 });
BusinessSchema.index({ 'address.city': 1, 'address.country': 1 });
BusinessSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('Business', BusinessSchema);
export default exportedModel;
module.exports = exportedModel;