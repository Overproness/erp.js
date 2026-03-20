// @ts-nocheck
const mongoose = require('mongoose');

const filter = async (req, res) => {
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

    const { documentType, tags, status, fileType } = req.query;

    const AppDocument = mongoose.model('AppDocument');

    // Build filter criteria
    const filterCriteria = {
      owner: owner,
      removed: false,
    };

    if (documentType) {
      filterCriteria.documentType = documentType;
    }

    if (tags) {
      const tagArray = tags.split(',').map((tag) => tag.trim());
      filterCriteria.tags = { $in: tagArray };
    }

    if (status) {
      filterCriteria.status = status;
    }

    if (fileType) {
      filterCriteria.fileType = fileType;
    }

    const documents = await AppDocument.find(filterCriteria).sort({ created: -1 }).limit(50);

    return res.status(200).json({
      success: true,
      result: documents,
      message: 'Documents filtered successfully',
    });
  } catch (error) {
    console.error('Document filter error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error filtering documents',
      error: error.message,
    });
  }
};

module.exports = filter;
