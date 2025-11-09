const summary = async (Model, req, res) => {
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

  // Get companyID from user or companyOwner context
  const companyID = req.user?.companyID || req.companyOwner?.companyID;

  if (!companyID) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Company context not found - authentication required',
    });
  }

  //  Query the database for a list of all results
  const countPromise = Model.countDocuments({
    removed: false,
    companyID: companyID,
  });

  const resultsPromise = await Model.countDocuments({
    removed: false,
    companyID: companyID,
  })
    .where(req.query.filter)
    .equals(req.query.equal)
    .exec();
  // Resolving both promises
  const [countFilter, countAllDocs] = await Promise.all([resultsPromise, countPromise]);

  return res.status(200).json({
    success: true,
    result: { countFilter, countAllDocs },
    message: 'Successfully count all documents',
  });
};

module.exports = summary;
