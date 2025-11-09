const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bcrypt = require('bcryptjs');

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
CompanyOwnerPasswordSchema.methods.generateHash = function (salt, password) {
  return bcrypt.hashSync(salt + password);
};

// checking if password is valid
CompanyOwnerPasswordSchema.methods.validPassword = function (salt, userpassword) {
  return bcrypt.compareSync(salt + userpassword, this.password);
};

// Simple authenticate method for consistency
CompanyOwnerPasswordSchema.methods.authenticate = function (password) {
  try {
    return bcrypt.compareSync(this.salt + password, this.password);
  } catch (error) {
    console.error('Password authentication error:', error);
    return false;
  }
};

module.exports = mongoose.model('CompanyOwnerPassword', CompanyOwnerPasswordSchema);
