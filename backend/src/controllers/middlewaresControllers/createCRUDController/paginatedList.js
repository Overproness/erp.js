const paginatedList = async (Model, req, res) => {
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'created', sortValue = -1, filter, equal } = req.query;
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    let fields = fieldsArray.length === 0 ? {} : { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }

    // Get companyID from user or companyOwner
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    const baseQuery = {
      removed: false,
      companyID: companyID,
      ...(filter && equal && { [filter]: equal }),
      ...fields,
    };

    const resultsPromise = Model.find(baseQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue, _id: sortValue }) // Add _id as secondary sort for consistency
      .exec();

    const countPromise = Model.countDocuments(baseQuery);

    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    // Ensure owner is ID for all results
    const processedResult = result.map((doc) => {
      const plainDoc = doc.toObject();
      if (plainDoc.owner && typeof plainDoc.owner === 'object') {
        plainDoc.owner = plainDoc.owner._id || plainDoc.owner;
      }
      return plainDoc;
    });

    const pagination = {
      page: parseInt(page),
      pages,
      count,
      limit: parseInt(limit),
      total: count,
    };

    return res.status(200).json({
      success: true,
      result: {
        items: processedResult,
        pagination,
      },
      pagination,
      message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = paginatedList;
