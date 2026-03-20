// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');
const ModelPayment = mongoose.model('Payment');

const remove = async (req, res) => {
  try {
    // Permission check for user
    if (req.user && !req.user.permissions?.canDeleteInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to delete invoices',
      });
    }
    const ownerId = req.companyOwner?._id || req.user?._id;
    const companyID = req.companyOwner?.companyID || req.user?.companyID;

    const deletedInvoice = await Model.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: ownerId,
        companyID: companyID,
        removed: false,
      },
      {
        removed: true,
        removedBy: ownerId,
      }
    ).exec();

    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found or you do not have permission to delete it',
      });
    }

    // Update related payments
    await ModelPayment.updateMany(
      { 
        invoice: deletedInvoice._id,
        owner: ownerId,
        companyID: companyID
      },
      { 
        removed: true,
        removedBy: ownerId
      }
    );

    return res.status(200).json({
      success: true,
      result: deletedInvoice,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message
    });
  }
};

module.exports = remove;
