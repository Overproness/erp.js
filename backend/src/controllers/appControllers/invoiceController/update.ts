// @ts-nocheck
const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');
const schema = require('./schemaValidate');

const update = async (req, res) => {
  try {
    // Permission check for user
    if (req.user && !req.user.permissions?.canUpdateInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to update invoices',
      });
    }

    // Get the owner ID from the appropriate auth property
    const ownerId = req.companyOwner?._id || req.user?._id;
    const companyID = req.companyOwner?.companyID || req.user?.companyID;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    // First check if user owns this invoice and companyID matches
    const invoice = await Model.findOne({
      _id: req.params.id,
      owner: ownerId,
      companyID: companyID,
      removed: false,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found or you do not have permission to update it',
      });
    }

    const body = req.body;

    const { error, value } = schema.validate(body);
    if (error) {
      const { details } = error;
      return res.status(400).json({
        success: false,
        result: null,
        message: details[0]?.message,
      });
    }

    const previousInvoice = await Model.findOne({
      _id: req.params.id,
      removed: false,
    });

    const { credit } = previousInvoice;

    const { items = [], taxRate = 0, discount = 0 } = req.body;

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Items cannot be empty',
      });
    }

    // default
    let subTotal = 0;
    let taxTotal = 0;
    let total = 0;

    //Calculate the items array with subTotal, total, taxTotal
    items.map((item) => {
      const total = calculate.multiply(item['quantity'], item['price']);
      //sub total
      subTotal = calculate.add(subTotal, total);
      //item total
      item['total'] = total;
    });
    taxTotal = calculate.multiply(subTotal, taxRate / 100);
    total = calculate.add(subTotal, taxTotal);

    body['subTotal'] = subTotal;
    body['taxTotal'] = taxTotal;
    body['total'] = total;
    body['items'] = items;
    body['pdf'] = 'invoice-' + req.params.id + '.pdf';
    if (body.hasOwnProperty('currency')) {
      delete body.currency;
    }
    // Find document by id and updates with the required fields

    const paymentStatus =
      calculate.sub(total, discount) === credit ? 'paid' : credit > 0 ? 'partially' : 'unpaid';
    body['paymentStatus'] = paymentStatus;

    const result = await Model.findOneAndUpdate(
      { _id: req.params.id, owner: ownerId }, // Use the correct owner ID
      body,
      {
        new: true, // return the new result instead of the old one
      }
    ).exec();

    // Returning successfull response

    return res.status(200).json({
      success: true,
      result,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = update;
