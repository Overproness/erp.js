import mongoose from 'mongoose';
const Schema = mongoose.Schema;

import bcrypt from 'bcryptjs';

const CompanyOwnerPasswordSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  user: { type: mongoose.Schema.ObjectId, ref: 'CompanyOwner', required: true, unique: true },
  password: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  emailToken: String,
  resetToken: String,
  emailVerified: {
    type: Boolean,
    default: true, // Changed to true by default for easier testing
  },
  authType: {
    type: String,
    default: 'email',
  },
  loggedSessions: {
    type: [String],
    default: [],
  },
}, { 
  timestamps: true // Add timestamps for debugging
});

// generating a hash
CompanyOwnerPasswordSchema.methods.generateHash = function (salt: string, password: string) {
  return bcrypt.hashSync(salt + password);
};

// checking if password is valid
CompanyOwnerPasswordSchema.methods.validPassword = function (salt: string, userpassword: string) {
  return bcrypt.compareSync(salt + userpassword, this.password);
};

// Simple authenticate method for consistency
CompanyOwnerPasswordSchema.methods.authenticate = function (password: string) {
  try {
    return bcrypt.compareSync(this.salt + password, this.password);
  } catch (error) {
    console.error('Password authentication error:', error);
    return false;
  }
};

const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword', CompanyOwnerPasswordSchema);
export default CompanyOwnerPassword;
module.exports = CompanyOwnerPassword;
