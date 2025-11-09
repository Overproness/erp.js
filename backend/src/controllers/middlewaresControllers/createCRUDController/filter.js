const filter = async (Model, req, res) => {
  console.log('🔍 === CRUD FILTER CONTROLLER ENTRY ===', Model.modelName, req.method, req.url);
  console.log('🔍 Filter query params:', req.query);

  try {
    const page = parseInt(req.query.page) || 1;
    const items = parseInt(req.query.items) || parseInt(req.query.limit) || 10;

    // Get user/company for ownership filtering
    const owner = req.admin?._id || req.user?._id || req.companyOwner?._id;
    const company = req.admin?._id || req.user?.companyOwner || req.companyOwner?._id;
    const ownerId = company || owner;

    console.log('Owner context:', { owner, company, ownerId });

    // Build filter query based on query params
    const filterQuery = { removed: false };

    // Add ownership filter if we have an owner
    if (ownerId) {
      filterQuery.owner = ownerId;
    }

    // Apply filters from query params
    const { filter: filterParam, equal, contains, startswith, ...otherParams } = req.query;

    if (filterParam && equal) {
      // Handle nested properties with dot notation
      if (filterParam.includes('.')) {
        filterQuery[filterParam] = equal;
      } else {
        filterQuery[filterParam] = equal;
      }
    }

    if (filterParam && contains) {
      filterQuery[filterParam] = { $regex: contains, $options: 'i' };
    }

    if (filterParam && startswith) {
      filterQuery[filterParam] = { $regex: `^${startswith}`, $options: 'i' };
    }

    // Handle direct field filters (e.g., customerType=company)
    Object.keys(otherParams).forEach((key) => {
      if (key !== 'page' && key !== 'items' && key !== 'limit' && otherParams[key]) {
        filterQuery[key] = otherParams[key];
      }
    });

    console.log('Filter query:', JSON.stringify(filterQuery, null, 2));

    // Execute query with fallback for models without pagination
    let result;
    const options = {
      page,
      limit: items,
      sort: { createdAt: -1 },
    };

    if (Model.paginate) {
      result = await Model.paginate(filterQuery, options);

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
        message: `Successfully found ${Model.modelName.toLowerCase()} documents`,
      });
    } else {
      // Fallback for models without pagination
      const docs = await Model.find(filterQuery)
        .sort({ createdAt: -1 })
        .limit(items)
        .skip((page - 1) * items);

      const total = await Model.countDocuments(filterQuery);

      return res.status(200).json({
        success: true,
        result: {
          items: docs,
          pagination: {
            page,
            pages: Math.ceil(total / items),
            count: total,
            limit: items,
            total,
          },
        },
        pagination: {
          page,
          pages: Math.ceil(total / items),
          count: total,
          limit: items,
          total,
        },
        total,
        message: `Successfully found ${Model.modelName.toLowerCase()} documents`,
      });
    }
  } catch (error) {
    console.error('Filter error:', error);
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
      message: error.message || 'Filter operation failed',
      error: error.toString(),
    });
  }
};

module.exports = filter;
