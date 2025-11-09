const mongoose = require('mongoose');

const read = async (Model, req, res) => {
  try {
    // Permission checking for users (not companyOwners)
    if (req.user) {
      const modelName = Model.modelName;
      const permissionMap = {
        Client: 'canViewClients',
        Invoice: 'canViewInvoices',
        Payment: 'canViewPayments',
        Quote: 'canViewQuotes',
        Task: 'canViewTasks',
        AppDocument: 'canViewDocuments',
        SocialPost: 'canViewSocialPosts',
        SocialAccount: 'canViewSocialAccounts',
        SocialCampaign: 'canViewSocialCampaigns',
        Url: 'canViewUrls',
        Team: 'canViewTeams',
        Workflow: 'canViewWorkflows',
        Notification: 'canViewNotifications',
        AiAssistant: 'canViewAiAssistants',
        Tax: 'canViewTaxes',
        Currency: 'canViewCurrency',
        Report: 'canViewReports',
        Analytics: 'canViewAnalytics',
        Marketing: 'canViewMarketing',
        Reputation: 'canViewReputation',
        Offer: 'canViewOffers',
        Setting: 'canViewSettings',
      };

      const requiredPermission = permissionMap[modelName];

      if (requiredPermission && !req.user.permissions?.[requiredPermission]) {
        return res.status(403).json({
          success: false,
          result: null,
          message: `You do not have permission to view ${modelName.toLowerCase()}s`,
        });
      }

      // Not defined in User: permission for model types not in the map
      if (!requiredPermission) {
        // Comment: Not defined in User permission system
      }
    }

    // Validate ObjectId format first
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid ID format',
      });
    }

    // Get companyID from user or companyOwner context
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    // Find document by id and companyID
    const result = await Model.findOne({
      _id: id,
      companyID: companyID,
      removed: false,
    }).exec();

    // If no results found, return document not found or permission denied
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Convert result to plain object and ensure owner is just the ID
    const plainResult = result.toObject();
    if (plainResult.owner && typeof plainResult.owner === 'object') {
      plainResult.owner = plainResult.owner._id || plainResult.owner;
    }

    // Return success response
    return res.status(200).json({
      success: true,
      result: plainResult,
      message: 'Document found successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = read;
