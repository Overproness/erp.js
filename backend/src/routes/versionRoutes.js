const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * @route   GET /api/version
 * @desc    Get application version information
 * @access  Public
 */
router.get('/version', async (req, res) => {
  try {
    // Read package.json for version
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Try to read version.json if it exists (created by CI/CD)
    let buildMetadata = {};
    const versionJsonPath = path.join(__dirname, '../../public/version.json');
    
    try {
      if (fs.existsSync(versionJsonPath)) {
        buildMetadata = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
      }
    } catch (error) {
      // version.json might not exist in development
      console.log('version.json not found, using package.json only');
    }

    const versionInfo = {
      version: buildMetadata.version || packageJson.version,
      name: packageJson.name,
      commit: buildMetadata.commit || 'local-dev',
      buildDate: buildMetadata.buildDate || new Date().toISOString(),
      branch: buildMetadata.branch || 'development',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };

    return res.status(200).json({
      success: true,
      result: versionInfo,
    });
  } catch (error) {
    console.error('Error fetching version info:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching version information',
      error: error.message,
    });
  }
});

module.exports = router;
