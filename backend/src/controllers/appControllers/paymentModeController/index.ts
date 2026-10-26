// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('PaymentMode');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('PaymentMode');

// Helper to get authenticated person and companyID
function getAuthContext(req) {
  if (req.companyOwner) {
    return { person: req.companyOwner, companyID: req.companyOwner.companyID, isOwner: true };
  }
  if (req.user) {
    return { person: req.user, companyID: req.user.companyID, isOwner: false };
  }
  return { person: null, companyID: null, isOwner: false };
}

methods.create = async (req, res) => {
  try {
    const { isDefault } = req.body;
    const { person, companyID, isOwner } = getAuthContext(req);

    if (!person) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required to create payment modes',
      });
    }

    // Permission check for user
    if (!isOwner && !req.user.permissions?.canCreatePayments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create payment modes',
      });
    }

    // Add owner, createdBy, and companyID
    req.body.owner = person._id;
    req.body.createdBy = person._id;
    req.body.companyID = companyID;

    if (isDefault) {
      await Model.updateMany({ owner: person._id, companyID }, { isDefault: false });
    }

    const countDefault = await Model.countDocuments({
      isDefault: true,
      owner: person._id,
      companyID,
    });

    const result = await new Model({
      ...req.body,
      isDefault: countDefault < 1 ? true : false,
    }).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Payment mode created successfully',
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
  const { id } = req.params;
  const { person, companyID, isOwner } = getAuthContext(req);

  if (!person) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Authentication required to delete payment modes',
    });
  }

  // Permission check for user
  if (!isOwner && !req.user.permissions?.canDeletePayments) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You do not have permission to delete payment modes',
    });
  }

  // Check if this is the only enabled payment mode for this company
  const modeCount = await Model.countDocuments({ removed: false, enabled: true, companyID });

  if (modeCount <= 1) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Cannot delete the only available payment mode',
    });
  }

  // Soft delete the payment mode, only if companyID matches
  const result = await Model.findOneAndUpdate(
    { _id: id, removed: false, companyID },
    {
      removed: true,
      removedBy: person._id,
      removedAt: new Date(),
    },
    { new: true }
  );

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Payment mode not found or access denied',
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Payment mode deleted successfully',
  });
};

methods.update = async (req, res) => {
  const { id } = req.params;
  const { person, companyID, isOwner } = getAuthContext(req);

  // Permission check for user
  if (!person) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Authentication required to update payment modes',
    });
  }
  if (!isOwner && !req.user.permissions?.canUpdatePayments) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You do not have permission to update payment modes',
    });
  }

  // Only update if companyID matches
  const paymentMode = await Model.findOne({
    _id: id,
    removed: false,
    companyID,
  }).exec();

  if (!paymentMode) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Payment mode not found or access denied',
    });
  }

  const { isDefault = paymentMode.isDefault, enabled = paymentMode.enabled } = req.body;

  if (!isDefault || (!enabled && isDefault)) {
    await Model.findOneAndUpdate({ _id: { $ne: id }, enabled: true, companyID }, { isDefault: true });
  }

  if (isDefault && enabled) {
    await Model.updateMany({ _id: { $ne: id }, companyID }, { isDefault: false });
  }

  const paymentModeCount = await Model.countDocuments({ companyID });

  if ((!enabled || !isDefault) && paymentModeCount <= 1) {
    return res.status(422).json({
      success: false,
      result: null,
      message: 'You cannot disable the paymentMode because it is the only existing one',
    });
  }

  const result = await Model.findOneAndUpdate({ _id: id, companyID }, req.body, {
    new: true,
  });

  return res.status(200).json({
    success: true,
    message: 'paymentMode updated successfully',
    result,
  });
};

// List: show only payment modes with same companyID
methods.list = async (req, res) => {
  try {
    const { person, companyID } = getAuthContext(req);

    if (!person) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required to access payment modes',
      });
    }

    const {
      page = 1,
      items = 10,
      limit = 10,
      search = '',
      sortBy = 'created',
      sortValue = -1,
    } = req.query;

    const itemsPerPage = parseInt(items || limit);
    const pageNumber = parseInt(page);

    // Filter by companyID
    const filter = {
      companyID,
      removed: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await Model.countDocuments(filter);
    const skip = (pageNumber - 1) * itemsPerPage;
    const numericSort = parseInt(sortValue);
    const resolvedSort = !Number.isNaN(numericSort) ? numericSort : (sortValue === 'asc' || sortValue === 'ascend' ? 1 : -1);
    const sortOptions = { [sortBy]: resolvedSort };

    const result = await Model.find(filter).sort(sortOptions).skip(skip).limit(itemsPerPage).exec();

    return res.status(200).json({
      success: true,
      result,
      pagination: {
        page: pageNumber,
        pages: Math.ceil(count / itemsPerPage),
        count: count,
        total: count,
        pageSize: itemsPerPage,
      },
      message: 'Payment modes retrieved successfully',
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

methods.read = async (req, res) => {
  try {
    const { id } = req.params;
    const { person, companyID } = getAuthContext(req);

    if (!person) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required to access payment modes',
      });
    }

    if (!id) {
      return methods.list(req, res);
    }

    // Only allow access if companyID matches
    const result = await Model.findOne({
      _id: id,
      companyID,
      removed: false,
    }).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Payment mode not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Payment mode retrieved successfully',
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

module.exports = methods;