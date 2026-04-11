// backend/src/models/utils/commonFields.js
const mongoose = require('mongoose');

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

module.exports = commonFields;
export {};
