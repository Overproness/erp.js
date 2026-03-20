// @ts-nocheck
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const AiKnowledgeBase = require('@/models/appModels/AiKnowledgeBase');
const { catchErrors } = require('@/handlers/errorHandlers');

const methods = createCRUDController('AiKnowledgeBase');

// Override list to include search functionality
const list = catchErrors(async (req, res) => {
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
  const category = req.query.category;
  const search = req.query.search;

  const query = {
    owner: owner,
    removed: false,
  };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$text = { $search: search };
  }

  const items = await AiKnowledgeBase.find(query)
    .sort({ 'usage.viewCount': -1, created: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalItems = await AiKnowledgeBase.countDocuments(query);

  res.status(200).json({
    success: true,
    result: {
      items,
      pagination: {
        page: page,
        pages: Math.ceil(totalItems / limit),
        count: totalItems,
        limit: limit,
        total: totalItems,
      },
    },
    pagination: {
      page: page,
      pages: Math.ceil(totalItems / limit),
      count: totalItems,
      limit: limit,
      total: totalItems,
    },
    message: 'Knowledge base items retrieved successfully',
  });
});

// Override read to increment view count
const read = catchErrors(async (req, res) => {
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

  const item = await AiKnowledgeBase.findOneAndUpdate(
    { _id: req.params.id, owner: owner },
    {
      $inc: { 'usage.viewCount': 1 },
      $set: { 'usage.lastAccessed': new Date() },
    },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Knowledge base item not found',
    });
  }

  res.status(200).json({
    success: true,
    result: item,
    message: 'Knowledge base item retrieved successfully',
  });
});

// Search knowledge base
const search = catchErrors(async (req, res) => {
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

  const { query, category, tags } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const searchQuery = {
    owner: owner,
    removed: false,
    enabled: true,
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (category) {
    searchQuery.category = category;
  }

  if (tags) {
    const tagArray = tags.split(',').map((tag) => tag.trim());
    searchQuery.tags = { $in: tagArray };
  }

  const items = await AiKnowledgeBase.find(searchQuery)
    .sort({ score: { $meta: 'textScore' }, 'usage.viewCount': -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Increment search count for found items
  await AiKnowledgeBase.updateMany(
    { _id: { $in: items.map((item) => item._id) } },
    { $inc: { 'usage.searchCount': 1 } }
  );

  const totalItems = await AiKnowledgeBase.countDocuments(searchQuery);

  res.status(200).json({
    success: true,
    result: {
      items,
      pagination: {
        current: page,
        pages: Math.ceil(totalItems / limit),
        count: totalItems,
      },
    },
    message: 'Search completed successfully',
  });
});

// Add feedback to knowledge base item
const addFeedback = catchErrors(async (req, res) => {
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

  const { id } = req.params;
  const { rating, comment } = req.body;

  const item = await AiKnowledgeBase.findOneAndUpdate(
    { _id: id, owner: owner },
    {
      $push: {
        'usage.feedback': {
          rating,
          comment,
          user: req.user ? req.user._id : null,
          date: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Knowledge base item not found',
    });
  }

  res.status(200).json({
    success: true,
    result: item,
    message: 'Feedback added successfully',
  });
});

module.exports = {
  ...methods,
  list,
  read,
  search,
  addFeedback,
};
