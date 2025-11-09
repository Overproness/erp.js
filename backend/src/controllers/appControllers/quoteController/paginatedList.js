const mongoose = require('mongoose');

const Model = mongoose.model('Quote');

const paginatedList = async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewQuotes) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Permission denied: cannot view quotes',
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

  // Add owner filter
  const ownerFilter = { owner: req.user ? req.user._id : req.companyOwner._id };
  const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

  const resultsPromise = Model.find({
    removed: false,
    ...ownerFilter,
    companyID, // Filter by companyID
    [filter]: equal,
    ...fields,
  })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
    .populate('createdBy', 'name')
    .exec();

  const countPromise = Model.countDocuments({
    removed: false,
    ...ownerFilter,
    companyID, // Filter by companyID
    [filter]: equal,
    ...fields,
  });

  const [result, count] = await Promise.all([resultsPromise, countPromise]);

  const pages = Math.ceil(count / limit);
  const pagination = { page, pages, count };

  return res.status(200).json({
    success: true,
    result,
    pagination,
    message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty',
  });
};

module.exports = paginatedList;
