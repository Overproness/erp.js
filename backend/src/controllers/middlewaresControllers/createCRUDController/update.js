const update = async (Model, req, res) => {
  try {
    // Permission checking for users (not companyOwners)
    if (req.user) {
      const modelName = Model.modelName;
      const permissionMap = {
        Client: 'canUpdateClients',
        Invoice: 'canUpdateInvoices',
        Payment: 'canUpdatePayments',
        Quote: 'canUpdateQuotes',
        Task: 'canUpdateTasks',
        AppDocument: 'canUpdateDocuments',
        SocialPost: 'canUpdateSocialPosts',
        SocialAccount: 'canUpdateSocialAccounts',
        SocialCampaign: 'canUpdateSocialCampaigns',
        Url: 'canUpdateUrls',
        Team: 'canUpdateTeams',
        Workflow: 'canUpdateWorkflows',
        Notification: 'canUpdateNotifications',
        AiAssistant: 'canUpdateAiAssistants',
        Tax: 'canUpdateTaxes',
        Currency: 'canUpdateCurrency',
        Report: 'canUpdateReports',
        Analytics: 'canUpdateAnalytics',
        Marketing: 'canUpdateMarketing',
        Reputation: 'canUpdateReputation',
        Offer: 'canUpdateOffers',
        Setting: 'canUpdateSettings',
      };

      const requiredPermission = permissionMap[modelName];

      if (requiredPermission && !req.user.permissions?.[requiredPermission]) {
        return res.status(403).json({
          success: false,
          result: null,
          message: `You do not have permission to update ${modelName.toLowerCase()}s`,
        });
      }

      // Not defined in User: permission for model types not in the map
      if (!requiredPermission) {
        // Comment: Not defined in User permission system
      }
    }

    // Get owner, updatedBy, and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const updatedBy = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    req.body.removed = false;
    req.body.updated = Date.now();
    req.body.updatedBy = updatedBy;

    const result = await Model.findOneAndUpdate(
      {
        _id: req.params.id,
        companyID: companyID,
        removed: false,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).exec();

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

    return res.status(200).json({
      success: true,
      result: plainResult,
      message: 'Document updated successfully',
    });
  } catch (error) {
    // Handle validation errors with 400 status
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = update;
