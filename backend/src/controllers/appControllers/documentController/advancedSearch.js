const mongoose = require('mongoose');

const advancedSearch = async (req, res) => {
  try {
    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    const userId = req.user?._id || req.companyOwner?._id;

    if (!companyID && !userId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication context not found',
      });
    }

    const AppDocument = mongoose.model('AppDocument');

    // Build base filter - use companyID if available, otherwise filter by owner
    let baseFilter = { removed: false };

    if (companyID) {
      baseFilter.companyID = companyID;
    } else {
      baseFilter.owner = userId;
    }

    // Extract search parameters from request body
    const {
      text,
      documentType,
      tags,
      dateFrom,
      dateTo,
      fileSizeMin,
      fileSizeMax,
      sortField = 'created',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.body;

    console.log('Advanced Search Parameters:', {
      text,
      documentType,
      tags,
      dateFrom,
      dateTo,
      companyID,
      userId,
    });

    // Build advanced search query
    const searchQuery = { ...baseFilter };

    // Text search across multiple fields including extracted text
    if (text) {
      searchQuery.$or = [
        { title: { $regex: text, $options: 'i' } },
        { description: { $regex: text, $options: 'i' } },
        { fileName: { $regex: text, $options: 'i' } },
        { documentType: { $regex: text, $options: 'i' } },
        { extractedText: { $regex: text, $options: 'i' } },
      ];
    }

    // Filter by document type (handle both array and single value)
    if (documentType) {
      if (Array.isArray(documentType) && documentType.length > 0) {
        searchQuery.documentType = { $in: documentType };
      } else if (typeof documentType === 'string') {
        searchQuery.documentType = documentType;
      }
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      searchQuery.tags = { $in: tags };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      searchQuery.created = {};
      if (dateFrom) {
        searchQuery.created.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        searchQuery.created.$lte = new Date(dateTo);
      }
    }

    // Filter by file size range
    if (fileSizeMin !== undefined || fileSizeMax !== undefined) {
      searchQuery.fileSize = {};
      if (fileSizeMin !== undefined) {
        searchQuery.fileSize.$gte = parseInt(fileSizeMin);
      }
      if (fileSizeMax !== undefined) {
        searchQuery.fileSize.$lte = parseInt(fileSizeMax);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    console.log('Search Query:', JSON.stringify(searchQuery, null, 2));

    // Execute queries
    const countPromise = AppDocument.countDocuments(searchQuery);
    const documentsPromise = AppDocument.find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email')
      .lean();

    const [total, documents] = await Promise.all([countPromise, documentsPromise]);

    const pages = Math.ceil(total / limit);

    console.log('Advanced Search Results:', {
      total,
      returned: documents.length,
      page,
      pages,
    });

    return res.status(200).json({
      success: true,
      result: documents,
      pagination: {
        page,
        limit,
        pages,
        total,
      },
      message: 'Advanced search completed successfully',
    });
  } catch (error) {
    console.error('Document advanced search error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error performing advanced search',
      error: error.message,
    });
  }
};

module.exports = advancedSearch;
