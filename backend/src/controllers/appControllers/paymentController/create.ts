// @ts-nocheck

import { calculate } from '../../../helpers';
import mongoose from 'mongoose';
import schema from './schemaValidate';
import '../../../models/appModels/Payment';
import '../../../models/appModels/Invoice';
// Ensure Payment model is registered
let Model;
try {
  Model = mongoose.model('Payment');
} catch (error) {
  Model = mongoose.model('Payment');
}

// Ensure Invoice model is registered
let Invoice;
try {
  Invoice = mongoose.model('Invoice');
} catch (error) {
  Invoice = mongoose.model('Invoice');
}

const create = async (req, res) => {
  try {
    // Permission check for create
    if (req.user && !req.user.permissions?.canCreatePayments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create payments',
      });
    }

    // Validate request body
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        result: null,
        message: error.details[0].message,
      });
    }

    if (value.amount === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: `The Minimum Amount couldn't be 0`,
      });
    }

    // Find invoice and validate payment amount
    const currentInvoice = await Invoice.findOne({
      _id: value.invoice,
      removed: false,
    });

    if (!currentInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    // Check if invoice belongs to same company
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    if (currentInvoice.companyID !== companyID) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to access this invoice',
      });
    }

    const { total, discount = 0, credit = 0 } = currentInvoice;

    // Ensure all values are numbers
    const invoiceTotal = Number(total) || 0;
    const invoiceDiscount = Number(discount) || 0;
    const invoiceCredit = Number(credit) || 0;

    const maxAmount = calculate.sub(calculate.sub(invoiceTotal, invoiceDiscount), invoiceCredit);

    if (value.amount > maxAmount) {
      return res.status(400).json({
        success: false,
        result: null,
        message: `The Max Amount you can add is ${maxAmount}`,
      });
    }

    // Add owner, createdBy, and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    value.owner = owner;
    value.createdBy = owner;
    value.companyID = companyID;

    // Create payment
    const result = await new Model(value).save();

    // Generate PDF file ID
    const fileId = 'payment-' + result._id + '.pdf';

    // Update payment with PDF
    const updatePath = await Model.findOneAndUpdate(
      { _id: result._id },
      { pdf: fileId },
      { new: true }
    ).exec();

    // Update invoice payment status
    const paymentStatus =
      calculate.sub(total, discount) === calculate.add(credit, value.amount)
        ? 'paid'
        : calculate.add(credit, value.amount) > 0
        ? 'partially'
        : 'unpaid';

    await Invoice.findOneAndUpdate(
      { _id: value.invoice },
      {
        $push: { payment: result._id },
        $inc: { credit: value.amount },
        $set: { paymentStatus },
      }
    );

    return res.status(200).json({
      success: true,
      result: updatePath,
      message: 'Payment created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

export = create;
