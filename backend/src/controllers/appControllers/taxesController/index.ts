// @ts-nocheck
const mongoose = require('mongoose');

// Ensure Taxes model is registered
let Model;
try {
  Model = mongoose.model('Taxes');
} catch (error) {
  // Model not registered, require it
  require('../../../models/appModels/Taxes');
  Model = mongoose.model('Taxes');
}

const createCRUDController = require('../../middlewaresControllers/createCRUDController');
const methods = createCRUDController('Taxes');

methods.create = async (req, res) => {
  try {
    // Permission check for users
    if (req.user && !req.user.permissions?.canCreateTaxes) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create taxes',
      });
    }
    const { isDefault } = req.body;

    if (isDefault) {
      await Model.updateMany({}, { isDefault: false });
    }

    const countDefault = await Model.countDocuments({
      isDefault: true,
    });

    // Get companyID from user or companyOwner
    const companyID =
      (req.user && req.user.companyID) ||
      (req.companyOwner && req.companyOwner.companyID);

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    // Add companyID and owner
    req.body.companyID = companyID;
    req.body.owner = req.companyOwner ? req.companyOwner._id : req.user._id;
    req.body.createdBy = req.user ? req.user._id : req.companyOwner._id;

    const result = await new Model({
      ...req.body,
      isDefault: countDefault < 1 ? true : false,
    }).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Tax created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

methods.delete = async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canDeleteTaxes) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You do not have permission to delete taxes',
    });
  }

  const { id } = req.params;
  // Find the tax and check companyID
  const taxDoc = await Model.findById(id);
  const companyID =
    (req.user && req.user.companyID) ||
    (req.companyOwner && req.companyOwner.companyID);

  if (!taxDoc || taxDoc.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You do not have access to this tax',
    });
  }

  // Check if this is the only enabled tax
  const taxCount = await Model.countDocuments({ removed: false, enabled: true, companyID });

  if (taxCount <= 1) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Cannot delete the only available tax',
    });
  }

  // Soft delete the tax
  const result = await Model.findOneAndUpdate(
    { _id: id, removed: false, companyID },
    {
      removed: true,
      removedBy: req.user ? req.user._id : req.companyOwner._id,
      removedAt: new Date(),
    },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    result,
    message: 'Tax deleted successfully',
  });
};

methods.update = async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canUpdateTaxes) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You do not have permission to update taxes',
    });
  }

  const { id } = req.params;
  const tax = await Model.findOne({
    _id: req.params.id,
    removed: false,
  }).exec();

  const companyID =
    (req.user && req.user.companyID) ||
    (req.companyOwner && req.companyOwner.companyID);

  if (!tax || tax.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You do not have access to this tax',
    });
  }

  const { isDefault = tax.isDefault, enabled = tax.enabled } = req.body;

  // if isDefault:false , we update first - isDefault:true
  // if enabled:false and isDefault:true , we update first - isDefault:true
  if (!isDefault || (!enabled && isDefault)) {
    await Model.findOneAndUpdate({ _id: { $ne: id }, enabled: true, companyID }, { isDefault: true });
  }

  // if isDefault:true and enabled:true, we update other taxes and make is isDefault:false
  if (isDefault && enabled) {
    await Model.updateMany({ _id: { $ne: id }, companyID }, { isDefault: false });
  }

  const taxesCount = await Model.countDocuments({ companyID });

  // if enabled:false and it's only one exist, we can't disable
  if ((!enabled || !isDefault) && taxesCount <= 1) {
    return res.status(422).json({
      success: false,
      result: null,
      message: 'You cannot disable the tax because it is the only existing one',
    });
  }

  const result = await Model.findOneAndUpdate({ _id: id, companyID }, req.body, {
    new: true,
  });

  return res.status(200).json({
    success: true,
    message: 'Tax updated successfully',
    result,
  });
};

methods.list = async (req, res) => {
  console.log('=== TAXES LIST ENDPOINT CALLED ===');
  console.log('Request user:', req.user ? req.user._id : 'No user');
  console.log('Request admin:', req.admin ? req.admin._id : 'No admin');
  console.log('Request companyOwner:', req.companyOwner ? req.companyOwner._id : 'No companyOwner');

  try {
    // Get pagination parameters
    const page = req.query.page || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = page * limit - limit;

    const { sortBy = 'created', sortValue = -1, filter, equal } = req.query;
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    const fields = fieldsArray.length === 0 ? {} : { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }

    // Get companyID from user or companyOwner
    const companyID =
      (req.user && req.user.companyID) ||
      (req.companyOwner && req.companyOwner.companyID);

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    const baseQuery = {
      removed: false,
      companyID,
      ...(filter ? { [filter]: equal } : {}),
      ...fields,
    };

    const resultsPromise = Model.find(baseQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue })
      .exec();

    const countPromise = Model.countDocuments(baseQuery);

    const [result, count] = await Promise.all([resultsPromise, countPromise]);

    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    // Return in the format expected by the frontend CRUD system
    const response = {
      success: true,
      result: result,
      pagination: pagination,
      message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty',
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    console.log('🚀 ~ methods.list= ~ response:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in taxes list:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

methods.read = async (req, res) => {
  try {
    // Get companyID from user or companyOwner
    const companyID =
      (req.user && req.user.companyID) ||
      (req.companyOwner && req.companyOwner.companyID);

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    // Single record request
    if (req.params.id) {
      const result = await Model.findOne({
        _id: req.params.id,
        companyID,
        removed: false,
      }).exec();

      if (!result) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Tax not found',
        });
      }

      return res.status(200).json({
        success: true,
        result,
        message: 'Tax retrieved successfully',
      });
    } else {
      // No ID provided - return array for dropdowns/selects
      const result = await Model.find({ companyID, removed: false })
        .sort({ created: -1 })
        .exec();

      return res.status(200).json({
        success: true,
        result,
        message: 'Taxes retrieved successfully',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

module.exports = methods;
