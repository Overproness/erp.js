const mongoose = require('mongoose');
const DocumentVersion = mongoose.model('DocumentVersion');
const Document = mongoose.model('AppDocument');

const getVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    // First verify document exists and user has access
    const document = await Document.findOne({
      _id: id,
      owner: req.admin._id,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Find the requested version
    const version = await DocumentVersion.findOne({
      document: id,
      versionNumber: parseInt(versionNumber),
    })
      .populate('createdBy', 'name email')
      .exec();

    if (!version) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Version not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: version,
      message: 'Document version retrieved successfully',
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

module.exports = getVersion;
