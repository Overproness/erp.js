// @ts-nocheck
const bulkUpdate = async (Model, req, res) => {
  try {
    // Get owner and user from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);
    const updatedBy = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Updates array is required and must not be empty',
      });
    }

    let modifiedCount = 0;

    // Process each update
    for (const update of updates) {
      const { id, ...updateData } = update;

      const result = await Model.findOneAndUpdate(
        {
          _id: id,
          owner: owner,
          removed: false,
        },
        {
          $set: {
            ...updateData,
            updatedBy,
            updated: new Date(),
          },
        },
        { new: true }
      );

      if (result) {
        modifiedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      modifiedCount,
      message: `Successfully updated ${modifiedCount} documents`,
    });
  } catch (error) {
    // Return 400 for validation errors, 500 for other errors
    const status = error.name === 'ValidationError' ? 400 : 500;
    return res.status(status).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = bulkUpdate;
