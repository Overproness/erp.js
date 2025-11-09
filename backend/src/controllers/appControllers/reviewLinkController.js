const crypto = require('crypto');
const ReviewLink = require('../../models/appModels/ReviewLink');
const Business = require('../../models/appModels/Business');

/**
 * Create a new review link
 */
const create = async (req, res) => {
  try {
    // Permission check for review management
    if (req.user && !req.user.permissions?.canCreateReputation) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create review links',
      });
    }

    // Get owner and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    const {
      businessId,
      name,
      expiresAt,
      customBranding = {},
      redirectUrl,
      requestMethod = 'direct',
      requestSettings = {},
    } = req.body;

    if (!businessId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Business ID and name are required',
        result: null,
      });
    }

    // Verify business exists and belongs to same company
    const business = await Business.findOne({
      _id: businessId,
      companyID: companyID,
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null,
      });
    }

    // Generate unique code
    const linkCode = crypto.randomBytes(6).toString('hex');

    // Create review link
    const reviewLink = new ReviewLink({
      owner: owner,
      companyID: companyID,
      business: businessId,
      name,
      linkCode,
      expiresAt: expiresAt || null,
      customBranding,
      redirectUrl,
      requestMethod,
      requestSettings,
      createdAt: new Date(),
      isActive: true,
    });

    await reviewLink.save();

    // Include full URL in response
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    reviewLink.fullUrl = `${baseUrl}/review/${linkCode}`;

    return res.status(201).json({
      success: true,
      message: 'Review link created successfully',
      result: reviewLink,
    });
  } catch (error) {
    console.error('Review link creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create review link',
      error: error.message,
    });
  }
};

/**
 * Get a specific review link
 */
const read = async (req, res) => {
  try {
    // Permission check for review management
    if (req.user && !req.user.permissions?.canViewReputation) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view review links',
      });
    }

    const { id } = req.params;
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    const reviewLink = await ReviewLink.findOne({
      _id: id,
      companyID: companyID,
    }).populate('business');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found',
        result: null,
      });
    }

    // Add full URL to response
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    reviewLink.fullUrl = `${baseUrl}/review/${reviewLink.linkCode}`;

    return res.status(200).json({
      success: true,
      message: 'Review link retrieved successfully',
      result: reviewLink,
    });
  } catch (error) {
    console.error('Review link retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review link',
      error: error.message,
    });
  }
};

/**
 * Update a review link
 */
const update = async (req, res) => {
  try {
    // Permission check for review management
    if (req.user && !req.user.permissions?.canManageReputation) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to update review links',
      });
    }

    const { id } = req.params;
    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    const {
      name,
      expiresAt,
      customBranding,
      redirectUrl,
      requestMethod,
      requestSettings,
      isActive,
    } = req.body;

    const reviewLink = await ReviewLink.findOne({
      _id: id,
      companyID: companyID,
    });

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found',
        result: null,
      });
    }

    // Update allowed fields
    if (name) reviewLink.name = name;
    if (expiresAt !== undefined) reviewLink.expiresAt = expiresAt;
    if (customBranding)
      reviewLink.customBranding = { ...reviewLink.customBranding, ...customBranding };
    if (redirectUrl) reviewLink.redirectUrl = redirectUrl;
    if (requestMethod) reviewLink.requestMethod = requestMethod;
    if (requestSettings)
      reviewLink.requestSettings = { ...reviewLink.requestSettings, ...requestSettings };
    if (isActive !== undefined) reviewLink.isActive = isActive;

    reviewLink.updatedAt = new Date();
    await reviewLink.save();

    // Add full URL to response
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    reviewLink.fullUrl = `${baseUrl}/review/${reviewLink.linkCode}`;

    return res.status(200).json({
      success: true,
      message: 'Review link updated successfully',
      result: reviewLink,
    });
  } catch (error) {
    console.error('Review link update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update review link',
      error: error.message,
    });
  }
};

/**
 * Delete a review link (soft delete)
 */
const remove = async (req, res) => {
  try {
    // Permission check for review management
    if (req.user && !req.user.permissions?.canManageReputation) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to delete review links',
      });
    }

    const { id } = req.params;
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    const reviewLink = await ReviewLink.findOne({
      _id: id,
      companyID: companyID,
    });

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found',
        result: null,
      });
    }

    reviewLink.removed = true;
    reviewLink.isActive = false;
    reviewLink.removedAt = new Date();
    await reviewLink.save();

    return res.status(200).json({
      success: true,
      message: 'Review link deleted successfully',
      result: null,
    });
  } catch (error) {
    console.error('Review link deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review link',
      error: error.message,
    });
  }
};

/**
 * List all review links
 */
const list = async (req, res) => {
  try {
    // Permission check for review management
    if (req.user && !req.user.permissions?.canViewReputation) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view review links',
      });
    }

    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    const {
      page = 1,
      limit = 20,
      businessId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    // Build filter
    const filter = {
      companyID: companyID,
      removed: false,
    };

    if (businessId) filter.business = businessId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Set up pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [reviewLinks, total] = await Promise.all([
      ReviewLink.find(filter).populate('business').sort(sort).skip(skip).limit(Number(limit)),
      ReviewLink.countDocuments(filter),
    ]);

    // Add full URLs to response
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const linksWithUrls = reviewLinks.map((link) => {
      const linkObj = link.toObject();
      linkObj.fullUrl = `${baseUrl}/review/${link.linkCode}`;
      return linkObj;
    });

    return res.status(200).json({
      success: true,
      message: 'Review links retrieved successfully',
      result: {
        data: linksWithUrls,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Review link listing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review links',
      error: error.message,
    });
  }
};

/**
 * Get analytics for a review link
 */
const getLinkAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const { period = '30' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reviewLink = await ReviewLink.findOne({
      _id: id,
      owner: ownerId,
    }).populate('business');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found',
        result: null,
      });
    }

    // Filter conversions by date
    const recentConversions = reviewLink.conversions.filter(
      (conv) => new Date(conv.date) >= startDate
    );

    // Get daily visit/conversion counts
    const dailyData = {};

    // Initialize days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { visits: 0, conversions: 0 };
    }

    // Fill in visit data
    reviewLink.visitData.forEach((visit) => {
      if (new Date(visit.date) >= startDate) {
        const dateStr = new Date(visit.date).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].visits += 1;
        }
      }
    });

    // Fill in conversion data
    recentConversions.forEach((conv) => {
      const dateStr = new Date(conv.date).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].conversions += 1;
      }
    });

    // Calculate device and referrer breakdowns
    const deviceBreakdown = {};
    const referrerBreakdown = {};

    reviewLink.visitData.forEach((visit) => {
      if (new Date(visit.date) >= startDate) {
        // Device breakdown
        const device = visit.deviceType || 'unknown';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;

        // Referrer breakdown
        const referrer = visit.referrer || 'direct';
        referrerBreakdown[referrer] = (referrerBreakdown[referrer] || 0) + 1;
      }
    });

    const analytics = {
      summary: {
        totalVisits: reviewLink.visitData.filter((v) => new Date(v.date) >= startDate).length,
        totalConversions: recentConversions.length,
        conversionRate:
          reviewLink.visitCount > 0
            ? Math.round(
                (recentConversions.length /
                  reviewLink.visitData.filter((v) => new Date(v.date) >= startDate).length) *
                  100
              )
            : 0,
      },
      dailyData: Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          visits: data.visits,
          conversions: data.conversions,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      deviceBreakdown,
      referrerBreakdown,
      period: `${days} days`,
    };

    return res.status(200).json({
      success: true,
      message: 'Review link analytics retrieved successfully',
      result: analytics,
    });
  } catch (error) {
    console.error('Review link analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review link analytics',
      error: error.message,
    });
  }
};

/**
 * Get review link by code (public endpoint)
 */
const getLinkByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const reviewLink = await ReviewLink.findOne({
      linkCode: code,
      isActive: true,
      removed: false,
    }).populate('business');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found or inactive',
        result: null,
      });
    }

    // Check if link is expired
    if (reviewLink.expiresAt && new Date(reviewLink.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'This review link has expired',
        result: null,
      });
    }

    // Track this visit
    const visit = {
      date: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      deviceType: detectDeviceType(req.headers['user-agent'] || ''),
      referrer: req.headers.referer || 'direct',
    };

    reviewLink.visitData.push(visit);
    reviewLink.visitCount = (reviewLink.visitCount || 0) + 1;
    reviewLink.lastVisitedAt = new Date();
    await reviewLink.save();

    // Only return necessary information for public consumption
    const publicLinkData = {
      linkCode: reviewLink.linkCode,
      business: {
        name: reviewLink.business.name,
        logo: reviewLink.business.logo,
        description: reviewLink.business.description,
      },
      customBranding: reviewLink.customBranding,
      redirectUrl: reviewLink.redirectUrl,
    };

    return res.status(200).json({
      success: true,
      message: 'Review link retrieved successfully',
      result: publicLinkData,
    });
  } catch (error) {
    console.error('Public review link retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review link',
      error: error.message,
    });
  }
};

/**
 * Helper function to detect device type from user agent
 */
function detectDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/smart[-_\s]?tv|hbbtv|appletv|roku|tvos/i.test(userAgent)) return 'tv';
  return 'desktop';
}

module.exports = {
  create,
  read,
  update,
  delete: remove,
  list,
  getLinkAnalytics,
  getLinkByCode,
};
