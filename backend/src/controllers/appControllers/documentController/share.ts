// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('AppDocument');

const share = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, permissions } = req.body;

    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    // Find the document
    const document = await Model.findOne({
      _id: id,
      owner: owner,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Add collaborators to the document
    const collaborators = userIds.map((userId) => ({
      user: userId,
      permissions: permissions || ['read'],
      addedAt: new Date(),
      addedBy: owner,
    }));

    const result = await Model.findOneAndUpdate(
      { _id: id },
      {
        $addToSet: { collaborators: { $each: collaborators } },
        updated: new Date(),
      },
      { new: true }
    ).exec();

    return res.status(200).json({
      success: true,
      result: {
        document: result,
        collaborators: result.collaborators,
      },
      message: 'Document shared successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = share;
