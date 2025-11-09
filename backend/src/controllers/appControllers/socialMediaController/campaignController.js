const SocialCampaign = require('@/models/appModels/SocialCampaign');
const SocialPost = require('@/models/appModels/SocialPost');
const SocialAccount = require('@/models/appModels/SocialAccount');

// Create new campaign
const createCampaign = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      name,
      description,
      objective,
      startDate,
      endDate,
      budget,
      targetAudience,
      platforms,
      hashtags,
      trackingUrls,
      kpis,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Campaign name is required',
      });
    }

    if (!objective) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Campaign objective is required',
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Start date and end date are required',
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'End date must be after start date',
      });
    }

    // Validate platforms if provided
    if (platforms && platforms.length > 0) {
      const accountIds = platforms.map(p => p.accountId);
      const accounts = await SocialAccount.find({
        _id: { $in: accountIds },
        owner: ownerId,
        removed: false,
      });

      if (accounts.length !== platforms.length) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'One or more social accounts not found',
        });
      }
    }

    // Create campaign
    const campaign = new SocialCampaign({
      name: name.trim(),
      description: description?.trim(),
      objective,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: budget || { amount: 0, currency: 'USD', spent: 0 },
      targetAudience: targetAudience || {},
      platforms: platforms || [],
      hashtags: hashtags || [],
      trackingUrls: trackingUrls || {},
      kpis: kpis || {},
      owner: ownerId,
    });

    await campaign.save();
    await campaign.populate('platforms.accountId');

    return res.status(201).json({
      success: true,
      result: campaign,
      message: 'Campaign created successfully',
    });

  } catch (error) {
    console.error('Create Campaign Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to create campaign',
      error: error.message,
    });
  }
};

// Get all campaigns
const getCampaigns = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      page = 1,
      limit = 10,
      status,
      objective,
      platform,
      search,
    } = req.query;

    // Build filter
    const filter = { owner: ownerId, removed: false };

    if (status) filter.status = status;
    if (objective) filter.objective = objective;
    if (platform) filter['platforms.platform'] = platform;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [campaigns, total] = await Promise.all([
      SocialCampaign.find(filter)
        .populate('platforms.accountId')
        .sort({ created: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SocialCampaign.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      result: {
        items: campaigns,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      message: 'Campaigns retrieved successfully',
    });

  } catch (error) {
    console.error('Get Campaigns Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve campaigns',
      error: error.message,
    });
  }
};

// Get single campaign
const getCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const campaign = await SocialCampaign.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    }).populate('platforms.accountId');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Campaign not found',
      });
    }

    // Get campaign posts
    const posts = await SocialPost.findByCampaign(id);

    return res.status(200).json({
      success: true,
      result: {
        campaign,
        posts,
        postsCount: posts.length,
      },
      message: 'Campaign retrieved successfully',
    });

  } catch (error) {
    console.error('Get Campaign Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve campaign',
      error: error.message,
    });
  }
};

// Update campaign
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const updateData = req.body;

    const campaign = await SocialCampaign.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Campaign not found',
      });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'description', 'status', 'endDate', 'budget', 
      'targetAudience', 'platforms', 'hashtags', 'trackingUrls', 'kpis'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'budget' || field === 'targetAudience' || field === 'trackingUrls' || field === 'kpis') {
          campaign[field] = { ...campaign[field], ...updateData[field] };
        } else {
          campaign[field] = updateData[field];
        }
      }
    });

    // Validate dates if updated
    if (updateData.endDate && new Date(campaign.startDate) >= new Date(updateData.endDate)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'End date must be after start date',
      });
    }

    await campaign.save();
    await campaign.populate('platforms.accountId');

    return res.status(200).json({
      success: true,
      result: campaign,
      message: 'Campaign updated successfully',
    });

  } catch (error) {
    console.error('Update Campaign Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to update campaign',
      error: error.message,
    });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const campaign = await SocialCampaign.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Campaign not found',
      });
    }

    // Check if campaign has active posts
    const activePosts = await SocialPost.countDocuments({
      campaign: id,
      status: { $in: ['scheduled', 'publishing'] },
      removed: false,
    });

    if (activePosts > 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Cannot delete campaign with active or scheduled posts',
      });
    }

    // Soft delete
    campaign.removed = true;
    campaign.status = 'cancelled';
    await campaign.save();

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Campaign deleted successfully',
    });

  } catch (error) {
    console.error('Delete Campaign Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to delete campaign',
      error: error.message,
    });
  }
};

// Get campaign analytics
const getCampaignAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const campaign = await SocialCampaign.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Campaign not found',
      });
    }

    // Get campaign posts with analytics
    const posts = await SocialPost.find({
      campaign: id,
      removed: false,
    }).populate('platforms.accountId');

    // Calculate aggregated analytics
    const analytics = {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
      failedPosts: posts.filter(p => p.status === 'failed').length,
      
      totalImpressions: posts.reduce((sum, post) => sum + (post.analytics.impressions || 0), 0),
      totalReach: posts.reduce((sum, post) => sum + (post.analytics.reach || 0), 0),
      totalLikes: posts.reduce((sum, post) => sum + (post.analytics.likes || 0), 0),
      totalComments: posts.reduce((sum, post) => sum + (post.analytics.comments || 0), 0),
      totalShares: posts.reduce((sum, post) => sum + (post.analytics.shares || 0), 0),
      totalClicks: posts.reduce((sum, post) => sum + (post.analytics.clicks || 0), 0),
      
      // Platform breakdown
      platformBreakdown: posts.reduce((acc, post) => {
        post.platforms.forEach(platform => {
          if (!acc[platform.platform]) {
            acc[platform.platform] = {
              posts: 0,
              impressions: 0,
              engagement: 0,
            };
          }
          acc[platform.platform].posts += 1;
          acc[platform.platform].impressions += post.analytics.impressions || 0;
          acc[platform.platform].engagement += post.totalEngagement || 0;
        });
        return acc;
      }, {}),
    };

    // Calculate engagement rate
    analytics.engagementRate = analytics.totalImpressions > 0 
      ? ((analytics.totalLikes + analytics.totalComments + analytics.totalShares) / analytics.totalImpressions) * 100 
      : 0;

    // Update campaign analytics
    await campaign.updateAnalytics(analytics);

    return res.status(200).json({
      success: true,
      result: {
        campaign,
        analytics,
        posts: posts.slice(0, 10), // Return latest 10 posts
      },
      message: 'Campaign analytics retrieved successfully',
    });

  } catch (error) {
    console.error('Get Campaign Analytics Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve campaign analytics',
      error: error.message,
    });
  }
};

// Get active campaigns
const getActiveCampaigns = async (req, res) => {
  try {
    const ownerId = req.admin._id;

    const campaigns = await SocialCampaign.findActiveCampaigns(ownerId);

    return res.status(200).json({
      success: true,
      result: campaigns,
      message: 'Active campaigns retrieved successfully',
    });

  } catch (error) {
    console.error('Get Active Campaigns Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve active campaigns',
      error: error.message,
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignAnalytics,
  getActiveCampaigns,
};
