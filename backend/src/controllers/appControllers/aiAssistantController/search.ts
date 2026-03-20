// @ts-nocheck
const AiAssistant = require('../../../models/appModels/AiAssistant');
const { catchErrors } = require('../../../handlers/errorHandlers');

const search = async (req, res) => {
  try {
    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { q, type, enabled, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Search query is required',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search filter
    const filter = {
      owner: owner,
      removed: false,
      $text: { $search: q },
    };

    if (type) {
      filter.type = type;
    }

    if (enabled !== undefined) {
      filter.enabled = enabled === 'true';
    }

    // Get total count
    const totalItems = await AiAssistant.countDocuments(filter);

    // Get search results with text score
    const items = await AiAssistant.find(filter, { score: { $meta: 'textScore' } })
      .populate('knowledgeBase', 'name description domain')
      .sort({ score: { $meta: 'textScore' }, created: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    return res.status(200).json({
      success: true,
      result: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          limit: parseInt(limit),
        },
        searchQuery: q,
      },
      message: 'Search completed successfully',
    });
  } catch (error) {
    console.error('AI Assistant search error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Search failed',
      error: error.message,
    });
  }
};

module.exports = catchErrors(search);
