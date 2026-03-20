// @ts-nocheck
const revertToVersion = require('./revertToVersion');
const revertToOriginal = require('./revertToOriginal');

/**
 * General revert controller that handles both version number and 'original' reverts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const revert = async (req, res) => {
  try {
    const { versionNumber } = req.body;

    if (!versionNumber) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Version number is required for revert operation',
      });
    }

    // Handle 'original' version specially
    if (versionNumber === 'original') {
      // Delegate to revertToOriginal controller
      return revertToOriginal(req, res);
    } else {
      // Set the versionNumber in params for revertToVersion controller
      req.params.versionNumber = versionNumber;
      return revertToVersion(req, res);
    }
  } catch (error) {
    console.error('Revert operation error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = revert;
