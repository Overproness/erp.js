const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companyOwnerSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  name: { type: String, required: true },
  surname: { type: String },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  role: {
    type: String,
    default: 'owner',
    enum: ['owner'],
  },
  onboardingComplete: {
    type: Boolean,
    default: false,
  },
  companyID: {
    type: String,
    unique: true,
    sparse: true,
  },
});

// Auto-generate companyID if not present when creating a new CompanyOwner
companyOwnerSchema.pre('save', function (next) {
  if (!this.companyID) {
    this.companyID = new mongoose.Types.ObjectId().toString();
  }
  next();
});

const CompanyOwner = mongoose.model('CompanyOwner', companyOwnerSchema);
module.exports = CompanyOwner;
