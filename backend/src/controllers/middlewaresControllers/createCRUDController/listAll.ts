// @ts-nocheck
const listAll = async (Model, req, res) => {
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

  const sort = req.query.sort || 'desc';
  const enabled = req.query.enabled || undefined;

  const query = {
    removed: false,
    owner: owner,
  };

  if (enabled !== undefined) {
    query.enabled = enabled;
  }

  const result = await Model.find(query).sort({ created: sort }).populate().exec();

  if (result.length > 0) {
    return res.status(200).json({
      success: true,
      result: {
        items: result,
        pagination: {
          page: 1,
          pages: 1,
          count: result.length,
          limit: result.length,
          total: result.length,
        },
      },
      message: 'Successfully found all documents',
    });
  }
  return res.status(203).json({
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
    message: 'Collection is Empty',
  });
};

module.exports = listAll;
