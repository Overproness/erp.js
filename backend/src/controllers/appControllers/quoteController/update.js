const mongoose = require('mongoose');

const Model = mongoose.model('Quote');

const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');

const update = async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canUpdateQuotes) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Permission denied: cannot update quotes',
    });
  }

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
  // let credit = 0;

  //Calculate the items array with subTotal, total, taxTotal
  items.map((item) => {
    let total = calculate.multiply(item['quantity'], item['price']);
    //sub total
    subTotal = calculate.add(subTotal, total);
    //item total
    item['total'] = total;
  });
  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  total = calculate.add(subTotal, taxTotal);

  let body = req.body;

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = items;
  body['pdf'] = 'quote-' + req.params.id + '.pdf';

  if (body.hasOwnProperty('currency')) {
    delete body.currency;
  }
  // Find document by id and updates with the required fields
  const doc = await Model.findById(req.params.id).exec();
  if (!doc || doc.removed) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Document not found',
    });
  }
  // Check companyID match
  const userCompanyID = req.user ? req.user.companyID : req.companyOwner.companyID;
  if (doc.companyID !== userCompanyID) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Permission denied: cannot update quotes from another company',
    });
  }

  const result = await Model.findOneAndUpdate(
    {
      _id: req.params.id,
      removed: false,
      owner: req.user ? req.user._id : req.companyOwner._id,
    },
    body,
    {
      new: true, // return the new result instead of the old one
    }
  ).exec();

  // Returning successfull response

  return res.status(200).json({
    success: true,
    result,
    message: 'we update this document ',
  });
};
module.exports = update;
