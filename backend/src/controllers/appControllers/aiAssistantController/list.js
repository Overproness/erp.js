const AiAssistant = require('../../../models/appModels/AiAssistant');
const { catchErrors } = require('../../../handlers/errorHandlers');

const list = async (req, res) => {
  try {
    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: {
          items: [],
          pagination: {
            page: 1,
            pages: 0,
            count: 0,
            limit: 10,
            total: 0,
          },
        },
        message: 'Owner context not found - authentication required',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { type, enabled } = req.query;

    // Build filter
    const filter = {
      owner: owner,
      removed: false,
    };

    if (type) {
      filter.type = type;
    }

    if (enabled !== undefined) {
      filter.enabled = enabled === 'true';
    }

    // Get total count
    const totalItems = await AiAssistant.countDocuments(filter);

    // Get paginated results
    const items = await AiAssistant.find(filter)
      .populate('knowledgeBase', 'name description domain')
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalItems / limit);

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      success: true,
      result: {
        items,
        pagination: {
          page: page,
          pages: totalPages,
          count: totalItems,
          limit: limit,
          total: totalItems,
        },
      },
      pagination: {
        page: page,
        pages: totalPages,
        count: totalItems,
        limit: limit,
        total: totalItems,
      },
      message: 'AI Assistants retrieved successfully',
    });
  } catch (error) {
    console.error('AI Assistant list error:', error);
    res.set('Cache-Control', 'no-store');
    return res.status(500).json({
      success: false,
      result: {
        items: [],
        pagination: {
          page: 1,
          pages: 0,
          count: 0,
          limit: 10,
          total: 0,
        },
      },
      message: 'Failed to retrieve AI Assistants',
      error: error.message,
    });
  }
};

module.exports = catchErrors(list);
