// @ts-nocheck
const mongoose = require('mongoose');
const DocumentVersion = mongoose.model('DocumentVersion');
const Document = mongoose.model('AppDocument');

const listVersions = async (req, res) => {
  try {
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

    const { id } = req.params;

    // First verify document exists and user has access
    const document = await Document.findOne({
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

    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Execute queries with pagination
    const countPromise = DocumentVersion.countDocuments({ document: id });
    const versionsPromise = DocumentVersion.find({ document: id })
      .sort({ versionNumber: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    const [count, versions] = await Promise.all([countPromise, versionsPromise]);
    const pages = Math.ceil(count / limit);

    // Return versions with pagination data
    return res.status(200).json({
      success: true,
      result: {
        items: versions,
        pagination: {
          page,
          limit,
          pages,
          total: count,
        },
      },
      message: 'Document versions retrieved successfully',
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

module.exports = listVersions;
