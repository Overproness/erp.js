const search = async (Model, req, res) => {
  console.log('=== SEARCH CONTROLLER ENTRY ===', Model.modelName, req.method, req.url);
  console.log('Search query params:', req.query);

  try {
    const { q = '', page = 1, items = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limit = parseInt(items);

    // Get user/company for ownership filtering
    const owner = req.admin?._id || req.user?._id || req.companyOwner?._id;
    const company = req.admin?._id || req.user?.companyOwner || req.companyOwner?._id;
    const ownerId = company || owner;

    // Build search query
    const searchQuery = { removed: false };

    // Add ownership filter if we have an owner
    if (ownerId) {
      searchQuery.owner = ownerId;
    }

    // Add text search if query provided
    if (q && q.trim()) {
      const searchFields = [];

      // Define searchable fields per model
      if (Model.modelName === 'Client') {
        searchFields.push(
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } }
        );
      } else if (Model.modelName === 'Invoice') {
        searchFields.push(
          { 'client.name': { $regex: q, $options: 'i' } },
          { number: { $regex: q, $options: 'i' } }
        );
      } else if (Model.modelName === 'Document') {
        searchFields.push(
          { name: { $regex: q, $options: 'i' } },
          { documentType: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        );
      } else {
        // Generic search for name field
        searchFields.push({ name: { $regex: q, $options: 'i' } });
      }

      if (searchFields.length > 0) {
        searchQuery.$or = searchFields;
      }
    }

    console.log('Search query:', JSON.stringify(searchQuery, null, 2));

    // Execute search with pagination
    const options = {
      page: pageNumber,
      limit,
      sort: { createdAt: -1 },
    };

    let result;
    if (Model.paginate) {
      result = await Model.paginate(searchQuery, options);

      return res.status(200).json({
        success: true,
        result: {
          items: result.docs,
          pagination: {
            page: result.page,
            pages: result.totalPages,
            count: result.totalDocs,
            limit: result.limit,
            total: result.totalDocs,
          },
        },
        pagination: {
          page: result.page,
          pages: result.totalPages,
          count: result.totalDocs,
          limit: result.limit,
          total: result.totalDocs,
        },
        total: result.totalDocs,
        message: `Successfully found ${result.totalDocs} ${Model.modelName.toLowerCase()}(s)`,
      });
    } else {
      // Fallback for models without pagination
      const docs = await Model.find(searchQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((pageNumber - 1) * limit);

      const total = await Model.countDocuments(searchQuery);

      return res.status(200).json({
        success: true,
        result: {
          items: docs,
          pagination: {
            page: pageNumber,
            pages: Math.ceil(total / limit),
            count: total,
            limit,
            total,
          },
        },
        pagination: {
          page: pageNumber,
          pages: Math.ceil(total / limit),
          count: total,
          limit,
          total,
        },
        total,
        message: `Successfully found ${total} ${Model.modelName.toLowerCase()}(s)`,
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      result: {
        items: [],
        pagination: {
          page: 1,
          pages: 0,
          count: 0,
          limit: 0,
          total: 0,
        },
      },
      message: error.message || 'Search operation failed',
      error: error.toString(),
    });
  }
};

module.exports = search;
