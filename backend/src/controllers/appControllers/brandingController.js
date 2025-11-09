const Business = require('../../models/appModels/Business');

/**
 * Get business branding settings
 */
const getBrandingSettings = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { businessId } = req.params;

    const business = await Business.findOne({
      _id: businessId,
      owner: ownerId,
      removed: false
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null
      });
    }

    // Return branding settings or empty object if not set
    const branding = business.branding || {};

    return res.status(200).json({
      success: true,
      message: 'Branding settings retrieved successfully',
      result: branding
    });
  } catch (error) {
    console.error('Get branding settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve branding settings',
      error: error.message
    });
  }
};

/**
 * Update business branding settings
 */
const updateBrandingSettings = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { businessId } = req.params;
    const brandingSettings = req.body;

    const business = await Business.findOne({
      _id: businessId,
      owner: ownerId,
      removed: false
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null
      });
    }

    // Validate branding settings - could be moved to a validator
    const validColors = validateColors(brandingSettings);
    if (!validColors.valid) {
      return res.status(400).json({
        success: false,
        message: validColors.message,
        result: null
      });
    }

    // Update branding settings
    business.branding = {
      ...(business.branding || {}), // Keep existing settings
      ...brandingSettings // Overwrite with new settings
    };

    await business.save();

    return res.status(200).json({
      success: true,
      message: 'Branding settings updated successfully',
      result: business.branding
    });
  } catch (error) {
    console.error('Update branding settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update branding settings',
      error: error.message
    });
  }
};

/**
 * Upload logo for business
 */
const uploadLogo = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { businessId } = req.params;

    // Check if a file was uploaded
    if (!req.files || !req.files.logo) {
      return res.status(400).json({
        success: false,
        message: 'No logo file uploaded',
        result: null
      });
    }

    const business = await Business.findOne({
      _id: businessId,
      owner: ownerId,
      removed: false
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null
      });
    }

    // Process the uploaded file
    const logoFile = req.files.logo;
    const logoExtension = logoFile.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif'];

    // Validate file type
    if (!allowedExtensions.includes(logoExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed types: jpg, jpeg, png, svg, gif',
        result: null
      });
    }

    // Generate unique filename
    const fileName = `${businessId}-logo-${Date.now()}.${logoExtension}`;
    const uploadPath = `${process.env.UPLOAD_DIR || './uploads'}/logos/${fileName}`;

    // Save the file
    await logoFile.mv(uploadPath);

    // Set logo URL in business model
    const logoUrl = `/uploads/logos/${fileName}`;
    business.logo = logoUrl;

    // Update branding settings if they exist
    if (!business.branding) {
      business.branding = {};
    }
    business.branding.logoUrl = logoUrl;

    await business.save();

    return res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      result: {
        logoUrl: logoUrl
      }
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message
    });
  }
};

/**
 * Update portal customization settings
 */
const updatePortalSettings = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { businessId } = req.params;
    const portalSettings = req.body;

    const business = await Business.findOne({
      _id: businessId,
      owner: ownerId,
      removed: false
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null
      });
    }

    // Initialize branding if it doesn't exist
    if (!business.branding) {
      business.branding = {};
    }

    // Update portal-specific settings
    if (portalSettings.portalTitle !== undefined) business.branding.portalTitle = portalSettings.portalTitle;
    if (portalSettings.portalDescription !== undefined) business.branding.portalDescription = portalSettings.portalDescription;
    if (portalSettings.thankYouTitle !== undefined) business.branding.thankYouTitle = portalSettings.thankYouTitle;
    if (portalSettings.thankYouMessage !== undefined) business.branding.thankYouMessage = portalSettings.thankYouMessage;
    if (portalSettings.redirectUrl !== undefined) business.branding.redirectUrl = portalSettings.redirectUrl;
    if (portalSettings.redirectDelay !== undefined) business.branding.redirectDelay = portalSettings.redirectDelay;
    if (portalSettings.customCss !== undefined) business.branding.customCss = portalSettings.customCss;
    
    // Update form customization
    if (portalSettings.requiredFields !== undefined) business.branding.requiredFields = portalSettings.requiredFields;
    if (portalSettings.optionalFields !== undefined) business.branding.optionalFields = portalSettings.optionalFields;
    if (portalSettings.hiddenFields !== undefined) business.branding.hiddenFields = portalSettings.hiddenFields;
    if (portalSettings.ratingLabels !== undefined) business.branding.ratingLabels = portalSettings.ratingLabels;
    if (portalSettings.submitButtonText !== undefined) business.branding.submitButtonText = portalSettings.submitButtonText;
    
    // Update social proof settings
    if (portalSettings.showSocialProof !== undefined) business.branding.showSocialProof = portalSettings.showSocialProof;

    await business.save();

    return res.status(200).json({
      success: true,
      message: 'Portal settings updated successfully',
      result: business.branding
    });
  } catch (error) {
    console.error('Update portal settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update portal settings',
      error: error.message
    });
  }
};

/**
 * Get default branding settings
 */
const getDefaultBrandingSettings = async (req, res) => {
  try {
    // Return default branding settings
    const defaultSettings = {
      primaryColor: '#3498db',
      secondaryColor: '#2c3e50',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      portalTitle: 'Leave a Review',
      portalDescription: 'We value your feedback! Please take a moment to share your experience.',
      thankYouTitle: 'Thank You!',
      thankYouMessage: 'Thank you for your feedback! Your review is valuable to us.',
      redirectDelay: 3,
      submitButtonText: 'Submit Review',
      requiredFields: ['name', 'rating', 'comment'],
      optionalFields: ['email', 'phone'],
      hiddenFields: [],
      ratingLabels: ["Very Poor", "Poor", "Average", "Good", "Excellent"],
      showSocialProof: true
    };

    return res.status(200).json({
      success: true,
      message: 'Default branding settings retrieved successfully',
      result: defaultSettings
    });
  } catch (error) {
    console.error('Get default branding settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve default branding settings',
      error: error.message
    });
  }
};

/**
 * Apply a branding theme
 */
const applyBrandingTheme = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { businessId } = req.params;
    const { theme } = req.body;

    const business = await Business.findOne({
      _id: businessId,
      owner: ownerId,
      removed: false
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null
      });
    }

    // Get theme settings
    let themeSettings = {};
    switch (theme) {
      case 'modern':
        themeSettings = {
          primaryColor: '#3498db',
          secondaryColor: '#2c3e50',
          backgroundColor: '#ffffff',
          textColor: '#333333',
          fontFamily: 'Roboto, sans-serif'
        };
        break;
      case 'classic':
        themeSettings = {
          primaryColor: '#4a6fa5',
          secondaryColor: '#334455',
          backgroundColor: '#f9f9f9',
          textColor: '#222222',
          fontFamily: 'Georgia, serif'
        };
        break;
      case 'minimal':
        themeSettings = {
          primaryColor: '#555555',
          secondaryColor: '#333333',
          backgroundColor: '#ffffff',
          textColor: '#333333',
          fontFamily: 'Arial, sans-serif'
        };
        break;
      case 'vibrant':
        themeSettings = {
          primaryColor: '#e74c3c',
          secondaryColor: '#9b59b6',
          backgroundColor: '#ffffff',
          textColor: '#2c3e50',
          fontFamily: 'Montserrat, sans-serif'
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid theme name',
          result: null
        });
    }

    // Update branding settings
    if (!business.branding) {
      business.branding = themeSettings;
    } else {
      business.branding = {
        ...business.branding,
        ...themeSettings
      };
    }

    await business.save();

    return res.status(200).json({
      success: true,
      message: `Theme "${theme}" applied successfully`,
      result: business.branding
    });
  } catch (error) {
    console.error('Apply branding theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply branding theme',
      error: error.message
    });
  }
};

/**
 * Validate color formats
 */
function validateColors(settings) {
  const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  
  // Check primary color
  if (settings.primaryColor && !hexColorRegex.test(settings.primaryColor)) {
    return {
      valid: false,
      message: 'Primary color must be in hex format (e.g., #3498db)'
    };
  }
  
  // Check secondary color
  if (settings.secondaryColor && !hexColorRegex.test(settings.secondaryColor)) {
    return {
      valid: false,
      message: 'Secondary color must be in hex format (e.g., #2c3e50)'
    };
  }
  
  // Check background color
  if (settings.backgroundColor && !hexColorRegex.test(settings.backgroundColor)) {
    return {
      valid: false,
      message: 'Background color must be in hex format (e.g., #ffffff)'
    };
  }
  
  // Check text color
  if (settings.textColor && !hexColorRegex.test(settings.textColor)) {
    return {
      valid: false,
      message: 'Text color must be in hex format (e.g., #333333)'
    };
  }
  
  return { valid: true };
}

module.exports = {
  getBrandingSettings,
  updateBrandingSettings,
  uploadLogo,
  updatePortalSettings,
  getDefaultBrandingSettings,
  applyBrandingTheme
};
