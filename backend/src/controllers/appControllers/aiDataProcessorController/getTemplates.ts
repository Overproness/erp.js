// @ts-nocheck
const AiExtractionTemplate = require('@/models/appModels/AiExtractionTemplate');

const getTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      documentType,
      enabled,
      search,
      sortBy = 'created',
      sortOrder = 'desc'
    } = req.query;

    // Build filter criteria
    const filter = {
      owner: req.admin._id,
      removed: false,
    };

    if (category) {
      filter.category = category;
    }

    if (documentType) {
      filter.documentType = documentType;
    }

    if (enabled !== undefined) {
      filter.enabled = enabled === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort criteria
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [templates, total] = await Promise.all([
      AiExtractionTemplate.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('owner', 'name email')
        .lean(),
      AiExtractionTemplate.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // Get category statistics
    const categoryStats = await AiExtractionTemplate.aggregate([
      { $match: { owner: req.admin._id, removed: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get usage statistics
    const usageStats = await AiExtractionTemplate.aggregate([
      { $match: { owner: req.admin._id, removed: false } },
      {
        $group: {
          _id: null,
          totalTemplates: { $sum: 1 },
          totalUsage: { $sum: '$usage_count' },
          enabledTemplates: {
            $sum: { $cond: ['$enabled', 1, 0] }
          },
          averageUsage: { $avg: '$usage_count' }
        }
      }
    ]);

    const result = {
      items: templates,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      statistics: {
        categories: categoryStats,
        usage: usageStats[0] || {
          totalTemplates: 0,
          totalUsage: 0,
          enabledTemplates: 0,
          averageUsage: 0
        }
      }
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Templates retrieved successfully',
    });

  } catch (error) {
    console.error('Get Templates Error:', error);
    
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve templates',
      error: error.message,
    });
  }
};

module.exports = getTemplates;
