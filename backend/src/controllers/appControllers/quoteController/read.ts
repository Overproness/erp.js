// @ts-nocheck
const mongoose = require('mongoose');

const Model = mongoose.model('Quote');

const read = async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewQuotes) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Permission denied: cannot view quotes',
    });
  }
  // Find document by id
  const result = await Model.findOne({
    _id: req.params.id,
    removed: false,
    owner: req.user ? req.user._id : req.companyOwner._id,
  })
    .populate('createdBy', 'name')
    .exec();
  // If no results found, return document not found
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  }
  // Check companyID match
  const userCompanyID = req.user ? req.user.companyID : req.companyOwner.companyID;
  if (result.companyID !== userCompanyID) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Permission denied: cannot view quotes from another company',
    });
  }
  // Return success resposne
  return res.status(200).json({
    success: true,
    result,
    message: 'we found this document ',
  });
};

module.exports = read;
