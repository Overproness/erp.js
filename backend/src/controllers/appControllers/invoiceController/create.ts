// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');
const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  try {
    // Permission check for user
    if (req.user && !req.user.permissions?.canCreateInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create invoices',
      });
    }

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        result: null,
        message: error.details[0].message,
      });
    }
    const { items = [], taxRate = 0, discount = 0 } = value;

    // Calculate totals
    let subTotal = 0;
    let taxTotal = 0;

    // Validate and calculate items
    items.forEach((item) => {
      const total = Number(item.quantity) * Number(item.price);
      item.total = total;
      subTotal += total;
    });

    // Apply discount before calculating tax
    const discountAmount = Number(discount);
    const discountedSubTotal = subTotal - discountAmount;
    taxTotal = discountedSubTotal * (Number(taxRate) / 100);
    const total = discountedSubTotal + taxTotal;

    // Set owner and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    // Auto-generate missing fields
    const currentYear = new Date().getFullYear();

    // Improved invoice number generation to handle concurrency
    let invoiceNumber = value.number;
    if (!invoiceNumber) {
      // Use findOneAndUpdate with upsert to atomically get next number
      const counterDoc = await mongoose
        .model('Counter')
        .findOneAndUpdate(
          {
            name: 'invoice',
            owner: companyID,
            year: currentYear,
          },
          { $inc: { sequence: 1 } },
          { upsert: true, new: true }
        )
        .catch(async () => {
          // Fallback to simple method if Counter model doesn't exist
          const lastInvoice = await Model.findOne({
            owner: companyID,
            year: currentYear,
          }).sort({ number: -1 });
          return { sequence: lastInvoice ? lastInvoice.number + 1 : 1 };
        });

      invoiceNumber = counterDoc.sequence;
    }

    const invoiceData = {
      ...value,
      number: invoiceNumber,
      year: value.year || currentYear,
      status: value.status || 'draft',
      subTotal,
      taxTotal,
      total,
      discount: discountAmount,
      items,
      owner: owner,
      companyID: companyID, // Set companyID
      createdBy: owner,
      paymentStatus: 'unpaid',
    };

    const result = await new Model(invoiceData).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = create;
