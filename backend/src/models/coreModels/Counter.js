const mongoose = require('mongoose');

const counterSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'AdminModel',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    sequence: {
      type: Number,
      default: 1,
    },
    companyID: {
      type: String,
      index: true,
      sparse: true, // Used for list/summary methods
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per name/owner/year combination
counterSchema.index({ name: 1, owner: 1, year: 1 }, { unique: true });
counterSchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('Counter', counterSchema);
