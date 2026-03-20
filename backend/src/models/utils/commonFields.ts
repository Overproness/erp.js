// backend/src/models/utils/commonFields.js
import mongoose from 'mongoose';

const commonFields = {
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    autopopulate: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    autopopulate: true,
  },
  removedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    autopopulate: true,
  },
  removed: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
  },
  removedAt: {
    type: Date,
  },
};

export default commonFields;
module.exports = commonFields;
