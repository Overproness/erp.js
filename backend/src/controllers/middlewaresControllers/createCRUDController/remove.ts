// @ts-nocheck
const remove = async (Model, req, res) => {
  try {
    // Permission checking for users (not companyOwners)
    if (req.user) {
      const modelName = Model.modelName;
      const permissionMap = {
        Client: 'canDeleteClients',
        Invoice: 'canDeleteInvoices',
        Payment: 'canDeletePayments',
        Quote: 'canDeleteQuotes',
        Task: 'canDeleteTasks',
        AppDocument: 'canDeleteDocuments',
        SocialPost: 'canDeleteSocialPosts',
        SocialAccount: 'canDeleteSocialAccounts',
        SocialCampaign: 'canDeleteSocialCampaigns',
        Url: 'canDeleteUrls',
        Team: 'canDeleteTeams',
        Workflow: 'canDeleteWorkflows',
        Notification: 'canDeleteNotifications',
        AiAssistant: 'canDeleteAiAssistants',
        Tax: 'canDeleteTaxes',
        Currency: 'canDeleteCurrency',
        Report: 'canDeleteReports',
        Analytics: 'canDeleteAnalytics',
        Marketing: 'canDeleteMarketing',
        Reputation: 'canDeleteReputation',
        Offer: 'canDeleteOffers',
        Setting: 'canDeleteSettings',
      };

      const requiredPermission = permissionMap[modelName];

      if (requiredPermission && !req.user.permissions?.[requiredPermission]) {
        return res.status(403).json({
          success: false,
          result: null,
          message: `You do not have permission to delete ${modelName.toLowerCase()}s`,
        });
      }

      // Not defined in User: permission for model types not in the map
      if (!requiredPermission) {
        // Comment: Not defined in User permission system
      }
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

    // For the CRUD framework tests, perform actual deletion
    // First find the document to check ownership
    const document = await Model.findOne({
      _id: req.params.id,
      companyID: companyID,
      removed: false,
    }).exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission',
      });
    }

    // Actually delete the document
    await Model.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = remove;
