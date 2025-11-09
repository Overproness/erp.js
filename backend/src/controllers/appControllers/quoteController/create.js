const mongoose = require('mongoose');
const Model = mongoose.model('Quote');
const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  try {
    // Permission check for users
    if (req.user && !req.user.permissions?.canCreateQuotes) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Permission denied: cannot create quotes',
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

    const { items = [], taxRate = 0 } = value;

    // Calculate totals
    let subTotal = 0;
    let taxTotal = 0;

    // Validate and calculate items
    items.forEach((item) => {
      const total = Number(item.quantity) * Number(item.price);
      item.total = total;
      subTotal += total;
    });

    taxTotal = subTotal * (Number(taxRate) / 100);
    const total = subTotal + taxTotal;

    // Auto-generate missing fields
    const currentYear = new Date().getFullYear();

    // Simple quote number generation - in production this should be more sophisticated
    let quoteNumber = value.number;
    if (!quoteNumber) {
      // Find the highest existing quote number for this year and owner
      const owner = req.user ? req.user._id : req.companyOwner._id;
      const company = req.user ? req.user.companyOwner : req.companyOwner._id;

      const lastQuote = await Model.findOne({
        owner: company || owner,
        year: currentYear,
      }).sort({ number: -1 });

      quoteNumber = lastQuote ? lastQuote.number + 1 : 1;
    }

    // Create quote data with owner
    const quoteData = {
      ...value,
      number: quoteNumber,
      year: value.year || currentYear,
      status: value.status || 'draft',
      subTotal,
      taxTotal,
      total,
      items,
      owner: req.user ? req.user.companyOwner || req.user._id : req.companyOwner._id,
      createdBy: req.user ? req.user._id : req.companyOwner._id,
      companyID: req.user ? req.user.companyID : req.companyOwner.companyID, // Set companyID
    };

    const result = await new Model(quoteData).save();

    const fileId = 'quote-' + result._id + '.pdf';
    const updateResult = await Model.findOneAndUpdate(
      { _id: result._id },
      { pdf: fileId },
      { new: true }
    ).exec();

    await increaseBySettingKey({
      settingKey: 'last_quote_number',
    });

    return res.status(200).json({
      success: true,
      result: updateResult,
      message: 'Quote created successfully',
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
