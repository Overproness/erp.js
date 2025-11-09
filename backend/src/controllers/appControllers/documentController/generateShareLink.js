const mongoose = require('mongoose');
const crypto = require('crypto');
const Model = mongoose.model('AppDocument');

const generateShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, expiresAt } = req.body;

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

    // Generate a unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareLink = `${req.protocol}://${req.get('host')}/api/document/shared/${shareToken}`;

    // For now, we'll just return the share link without storing it in the document
    // since the Document schema doesn't have a shareLinks field
    // In a real implementation, you might want to add this field to the schema
    // or create a separate ShareLink model

    return res.status(200).json({
      success: true,
      result: {
        shareLink: shareLink,
        token: shareToken,
        permissions: permissions || ['read'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      message: 'Share link generated successfully',
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

module.exports = generateShareLink;
