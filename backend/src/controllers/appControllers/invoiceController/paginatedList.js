const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const paginatedList = async (req, res) => {
  try {
    // Permission check for user
    if (req.user && !req.user.permissions?.canViewInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view invoices',
      });
    }
    // Get companyID from user or companyOwner
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    const page = req.query.page || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = page * limit - limit;

    const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;

    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    let fields;
    fields = fieldsArray.length === 0 ? {} : { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }

    // Add companyID filter to ensure users only see their own company's invoices
    const companyFilter = { companyID: companyID };

    const resultsPromise = Model.find({
      removed: false,
      ...companyFilter,
      [filter]: equal,
      ...fields,
    })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue })
      .populate('createdBy', 'name')
      .exec();

    // Also add companyID filter to the count query
    const countPromise = Model.countDocuments({
      removed: false,
      ...companyFilter,
      [filter]: equal,
      ...fields,
    });

    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(200).json({
        success: true,
        result: [],
        pagination,
        message: 'Collection is Empty',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = paginatedList;
