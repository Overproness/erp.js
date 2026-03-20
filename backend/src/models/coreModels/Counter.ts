// @ts-nocheck
import mongoose from 'mongoose';

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
      type: String,    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per name/owner/year combination
counterSchema.index({ name: 1, owner: 1, year: 1 }, { unique: true });
counterSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
module.exports = Counter;
