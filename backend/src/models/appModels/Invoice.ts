const mongoose = require('mongoose');
const commonFields = require('../utils/commonFields');

const invoiceSchema = new mongoose.Schema({
  ...commonFields,
  companyID: {
    type: String,
          },
  number: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  content: String,
  recurring: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'annually', 'quarter'],
  },
  // Recurring billing management
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringConfig: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'annually'],
    },
    startDate: Date,
    endDate: Date, // null means indefinite
    nextBillingDate: Date,
    lastBillingDate: Date,
    occurrences: Number, // Total occurrences (null for indefinite)
    occurrencesCompleted: {
      type: Number,
      default: 0,
    },
    autoSend: {
      type: Boolean,
      default: false, // Automatically send invoice when generated
    },
    pausedUntil: Date, // Temporarily pause recurring billing
  },
  parentRecurringInvoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
  },
  generatedFromRecurring: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    required: true,
  },
  expiredDate: {
    type: Date,
    required: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  converted: {
    from: {
      type: String,
      enum: ['quote', 'offer'],
    },
    offer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Offer',
    },
    quote: {
      type: mongoose.Schema.ObjectId,
      ref: 'Quote',
    },
  },
  items: [
    {
      // product: {
      //   type: mongoose.Schema.ObjectId,
      //   ref: 'Product',
      //   // required: true,
      // },
      itemName: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      quantity: {
        type: Number,
        default: 1,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      // discount: {
      //   type: Number,
      //   default: 0,
      // },
      // taxRate: {
      //   type: Number,
      //   default: 0,
      // },
      // subTotal: {
      //   type: Number,
      //   default: 0,
      // },
      // taxTotal: {
      //   type: Number,
      //   default: 0,
      // },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  taxRate: {
    type: Number,
    default: 0,
  },
  subTotal: {
    type: Number,
    default: 0,
  },
  taxTotal: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'NA',
    uppercase: true,
    required: true,
  },
  credit: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  payment: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Payment',
    },
  ],
  paymentStatus: {
    type: String,
    default: 'unpaid',
    enum: ['unpaid', 'paid', 'partially'],
  },
  isOverdue: {
    type: Boolean,
    default: false,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'sent', 'refunded', 'cancelled', 'on hold'],
    default: 'draft',
  },
  pdf: {
    type: String,
  },
  files: [
    {
      id: String,
      name: String,
      path: String,
      description: String,
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
  ],
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

invoiceSchema.plugin(require('mongoose-autopopulate'));

invoiceSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.owner) {
      throw new Error('Owner field is required');
    }
  }
  next();
});

invoiceSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('Invoice', invoiceSchema);
module.exports = exportedModel;
