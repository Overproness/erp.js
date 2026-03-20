// @ts-nocheck
const mongoose = require('mongoose');
const Invoice = mongoose.model('Invoice');
const CustomerFollowUp = mongoose.model('CustomerFollowUp');

/**
 * Calculate next billing date based on frequency
 */
const calculateNextBillingDate = (currentDate, frequency) => {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'semiannually':
      next.setMonth(next.getMonth() + 6);
      break;
    case 'annually':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }

  return next;
};

/**
 * Generate next invoice from recurring template
 */
const generateRecurringInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Permission check
    if (req.user && !req.user.permissions?.canCreateInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to generate invoices',
      });
    }

    // Find the parent recurring invoice
    const parentInvoice = await Invoice.findOne({
      _id: id,
      removed: false,
      isRecurring: true,
    });

    if (!parentInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Recurring invoice template not found',
      });
    }

    // Company access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    if (parentInvoice.companyID !== companyID) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Access denied',
      });
    }

    const config = parentInvoice.recurringConfig;

    // Check if recurring has ended
    if (config.endDate && new Date() > new Date(config.endDate)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Recurring billing has ended',
      });
    }

    // Check if paused
    if (config.pausedUntil && new Date() < new Date(config.pausedUntil)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Recurring billing is paused',
      });
    }

    // Check if max occurrences reached
    if (config.occurrences && config.occurrencesCompleted >= config.occurrences) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Maximum occurrences reached',
      });
    }

    // Get the next invoice number
    const lastInvoice = await Invoice.findOne({ companyID }).sort({ number: -1 }).limit(1);
    const nextNumber = lastInvoice ? lastInvoice.number + 1 : 1;

    // Create new invoice from template
    const newInvoiceData = {
      ...parentInvoice.toObject(),
      _id: new mongoose.Types.ObjectId(),
      number: nextNumber,
      date: config.nextBillingDate || new Date(),
      expiredDate: new Date(config.nextBillingDate || new Date()).setDate(
        new Date(config.nextBillingDate || new Date()).getDate() + 30
      ),
      parentRecurringInvoice: parentInvoice._id,
      generatedFromRecurring: true,
      isRecurring: false,
      recurringConfig: undefined,
      payment: [],
      credit: 0,
      paymentStatus: 'unpaid',
      status: config.autoSend ? 'sent' : 'draft',
      created: new Date(),
      updated: new Date(),
    };

    delete newInvoiceData.__v;

    const newInvoice = await new Invoice(newInvoiceData).save();

    // Update parent invoice
    const nextBillingDate = calculateNextBillingDate(
      config.nextBillingDate || new Date(),
      config.frequency
    );

    await Invoice.findByIdAndUpdate(id, {
      $set: {
        'recurringConfig.nextBillingDate': nextBillingDate,
        'recurringConfig.lastBillingDate': new Date(),
        'recurringConfig.occurrencesCompleted': (config.occurrencesCompleted || 0) + 1,
      },
    });

    // Create follow-up reminder if autoSend is enabled
    if (config.autoSend) {
      const owner = req.user ? req.user._id : req.companyOwner._id;
      await CustomerFollowUp.create({
        owner: owner,
        customer: parentInvoice.client,
        type: 'email',
        reason: 'invoice_reminder',
        relatedEntity: {
          entityType: 'invoice',
          entityId: newInvoice._id,
        },
        scheduledDate: new Date(),
        subject: `Invoice #${newInvoice.number}/${newInvoice.year}`,
        message: `Your recurring invoice has been generated and is ready for payment.`,
        createdBy: owner,
      });
    }

    return res.status(200).json({
      success: true,
      result: newInvoice,
      message: 'Recurring invoice generated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

/**
 * Pause recurring billing
 */
const pauseRecurringBilling = async (req, res) => {
  try {
    const { id } = req.params;
    const { pausedUntil } = req.body;

    // Permission check
    if (req.user && !req.user.permissions?.canUpdateInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to update invoices',
      });
    }

    const invoice = await Invoice.findOne({
      _id: id,
      removed: false,
      isRecurring: true,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Recurring invoice not found',
      });
    }

    // Company access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    if (invoice.companyID !== companyID) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Access denied',
      });
    }

    const result = await Invoice.findByIdAndUpdate(
      id,
      {
        $set: {
          'recurringConfig.pausedUntil': pausedUntil ? new Date(pausedUntil) : null,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result,
      message: pausedUntil ? 'Recurring billing paused' : 'Recurring billing resumed',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

/**
 * Stop recurring billing
 */
const stopRecurringBilling = async (req, res) => {
  try {
    const { id } = req.params;

    // Permission check
    if (req.user && !req.user.permissions?.canUpdateInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to update invoices',
      });
    }

    const invoice = await Invoice.findOne({
      _id: id,
      removed: false,
      isRecurring: true,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Recurring invoice not found',
      });
    }

    // Company access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    if (invoice.companyID !== companyID) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Access denied',
      });
    }

    const result = await Invoice.findByIdAndUpdate(
      id,
      {
        $set: {
          isRecurring: false,
          'recurringConfig.endDate': new Date(),
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result,
      message: 'Recurring billing stopped',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

/**
 * Get all invoices generated from a recurring template
 */
const getRecurringInvoiceHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Permission check
    if (req.user && !req.user.permissions?.canReadInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to read invoices',
      });
    }

    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    const history = await Invoice.find({
      parentRecurringInvoice: id,
      companyID,
      removed: false,
    })
      .sort({ created: -1 })
      .populate('client', 'name email')
      .populate('payment');

    return res.status(200).json({
      success: true,
      result: history,
      message: 'Recurring invoice history retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

/**
 * Process all due recurring invoices (cron job)
 */
const processRecurringInvoices = async (req, res) => {
  try {
    // This should ideally be called by a cron job, not exposed as API
    // Permission check - only admin
    if (!req.companyOwner) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Access denied',
      });
    }

    const now = new Date();
    const dueInvoices = await Invoice.find({
      isRecurring: true,
      removed: false,
      'recurringConfig.nextBillingDate': { $lte: now },
      $or: [{ 'recurringConfig.endDate': null }, { 'recurringConfig.endDate': { $gte: now } }],
      $or: [
        { 'recurringConfig.pausedUntil': null },
        { 'recurringConfig.pausedUntil': { $lt: now } },
      ],
    });

    const results = [];
    for (const invoice of dueInvoices) {
      const config = invoice.recurringConfig;

      // Check if max occurrences reached
      if (config.occurrences && config.occurrencesCompleted >= config.occurrences) {
        continue;
      }

      try {
        // Get next invoice number
        const lastInvoice = await Invoice.findOne({ companyID: invoice.companyID })
          .sort({ number: -1 })
          .limit(1);
        const nextNumber = lastInvoice ? lastInvoice.number + 1 : 1;

        // Create new invoice
        const newInvoiceData = {
          ...invoice.toObject(),
          _id: new mongoose.Types.ObjectId(),
          number: nextNumber,
          date: config.nextBillingDate,
          expiredDate: new Date(config.nextBillingDate).setDate(
            new Date(config.nextBillingDate).getDate() + 30
          ),
          parentRecurringInvoice: invoice._id,
          generatedFromRecurring: true,
          isRecurring: false,
          recurringConfig: undefined,
          payment: [],
          credit: 0,
          paymentStatus: 'unpaid',
          status: config.autoSend ? 'sent' : 'draft',
          created: new Date(),
          updated: new Date(),
        };

        delete newInvoiceData.__v;

        const newInvoice = await new Invoice(newInvoiceData).save();

        // Update parent invoice
        const nextBillingDate = calculateNextBillingDate(config.nextBillingDate, config.frequency);

        await Invoice.findByIdAndUpdate(invoice._id, {
          $set: {
            'recurringConfig.nextBillingDate': nextBillingDate,
            'recurringConfig.lastBillingDate': new Date(),
            'recurringConfig.occurrencesCompleted': (config.occurrencesCompleted || 0) + 1,
          },
        });

        // Create follow-up reminder
        if (config.autoSend) {
          await CustomerFollowUp.create({
            owner: invoice.owner,
            customer: invoice.client,
            type: 'email',
            reason: 'invoice_reminder',
            relatedEntity: {
              entityType: 'invoice',
              entityId: newInvoice._id,
            },
            scheduledDate: new Date(),
            subject: `Invoice #${newInvoice.number}/${newInvoice.year}`,
            message: `Your recurring invoice has been generated and is ready for payment.`,
            createdBy: invoice.createdBy,
          });
        }

        results.push({
          success: true,
          invoiceId: newInvoice._id,
          number: newInvoice.number,
        });
      } catch (error) {
        results.push({
          success: false,
          invoiceId: invoice._id,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      result: results,
      message: `Processed ${results.length} recurring invoices`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = {
  generateRecurringInvoice,
  pauseRecurringBilling,
  stopRecurringBilling,
  getRecurringInvoiceHistory,
  processRecurringInvoices,
};
