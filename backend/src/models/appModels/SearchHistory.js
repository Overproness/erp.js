const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SearchHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyOwner: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    searchQuery: {
      type: Schema.Types.Mixed,
      required: true,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    companyID: {
      type: String,
      index: true,
      sparse: true,
      // Used for list/summary methods
    },
  },
  {
    collection: 'searchhistory',
    timestamps: true,
  }
);

// Index for efficient queries
SearchHistorySchema.index({ userId: 1, timestamp: -1 });
SearchHistorySchema.index({ companyOwner: 1, timestamp: -1 });
SearchHistorySchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);
