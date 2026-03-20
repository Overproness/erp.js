// @ts-nocheck
const mongoose = require('mongoose');
const URL = require('@/models/appModels/URL');
const URLClick = require('@/models/appModels/URLClick');
const ABTest = require('@/models/appModels/ABTest');

const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { catchErrors } = require('@/handlers/errorHandlers');

const urlHelpers = require('@/helpers/urlHelpers');
const analyticsHelpers = require('@/helpers/analyticsHelpers');
// FIX: Import urlService as an object, not destructured
const urlService = require('@/services/urlService');

const Model = mongoose.model('URL');

// Create base CRUD controller
const crudController = createCRUDController('URL');

// Helper to debug request context
function debugRequestContext(req, label = '') {
  console.log(`=== URL CONTROLLER DEBUG: ${label} ===`);
  console.log('req.admin:', req.admin);
  console.log('req.companyOwner:', req.companyOwner);
  console.log('req.user:', req.user);
  if (req.admin) {
    console.log('req.admin._id:', req.admin._id);
    console.log('req.admin.email:', req.admin.email);
  }
  if (req.companyOwner) {
    console.log('req.companyOwner._id:', req.companyOwner._id);
    console.log('req.companyOwner.email:', req.companyOwner.email);
  }
  if (req.user) {
    console.log('req.user._id:', req.user._id);
    console.log('req.user.email:', req.user.email);
  }
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
}

// Add a function to sanitize text content
const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Basic list of inappropriate terms to filter
  const inappropriatePatterns = [
    /\bn[i1]gg[e3]r/i,
    /\bf[u*]ck/i,
    /\bb[i1]tch/i,
    // Add more patterns as needed
  ];

  let sanitized = text;
  inappropriatePatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[filtered]');
  });

  return sanitized;
};

// Helper function to safely resolve owner context from request
const resolveOwnerContext = (req) => {
  // Only companyOwner and user
  return (req.companyOwner && req.companyOwner._id) || (req.user && req.user._id);
};

const resolveCompanyID = (req) => {
  return req.companyOwner?.companyID || req.user?.companyID;
};

const hasPermission = (req, permissionName) => {
  // Only check for req.user, companyOwner always allowed
  if (req.user) {
    return req.user.permissions?.[permissionName] === true;
  }
  return true;
};

// Override create method with URL-specific logic
const create = catchErrors(async (req, res) => {
  debugRequestContext(req, 'CREATE');

  // Permission check for user
  if (req.user && !hasPermission(req, 'canCreateUrls')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to create URLs',
    });
  }

  // Sanitize text inputs
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.title) sanitizedBody.title = sanitizeInput(sanitizedBody.title);
  if (sanitizedBody.description)
    sanitizedBody.description = sanitizeInput(sanitizedBody.description);
  if (Array.isArray(sanitizedBody.tags)) {
    sanitizedBody.tags = sanitizedBody.tags.map((tag) => sanitizeInput(tag));
  }

  const {
    originalUrl,
    title,
    description,
    tags,
    requiresAuth,
    passwordProtected,
    password,
    expiresAt,
    maxClicks,
    abTestGroup,
    linkedModule,
    linkedEntityId,
    linkedEntityType,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    ipRestrictions,
    countryRestrictions,
    deviceRestrictions,
    notes,
  } = sanitizedBody;

  // FIX: Use urlService methods as properties
  const sanitizedUrl = await urlService.validateAndSanitizeUrl(originalUrl);
  if (!sanitizedUrl) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL format or unsafe URL detected',
    });
  }

  console.log('DEBUG - Sanitized URL:', sanitizedUrl);

  // Always generate short code in backend
  const shortCode = await urlService.generateShortCode();
  console.log('DEBUG - Generated Short Code:', shortCode);

  // Check for duplicate URLs
  const isDuplicate = await urlService.checkDuplicateUrl(
    sanitizedUrl,
    req.companyOwner?._id || req.admin?._id
  );
  if (isDuplicate) {
    console.log('DEBUG - Duplicate URL detected:', isDuplicate);
    return res.status(409).json({
      success: false,
      message: 'URL already exists in your account',
      result: isDuplicate,
    });
  }

  // Hash password if provided
  let hashedPassword = null;
  if (passwordProtected && password) {
    hashedPassword = await urlService.hashPassword(password);
    console.log('DEBUG - Password protected URL');
  }

  // Safely resolve owner context
  const owner = resolveOwnerContext(req);
  const companyID = resolveCompanyID(req);

  if (!owner || !companyID) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Owner or companyID context not found - authentication required',
    });
  }

  console.log('DEBUG - Owner resolved:', owner);

  // Create URL document
  const urlData = {
    originalUrl: sanitizedUrl,
    shortCode,
    title: title || (await urlService.extractPageTitle(sanitizedUrl)),
    description,
    tags: Array.isArray(tags) ? tags : [],
    requiresAuth: requiresAuth || false,
    passwordProtected: passwordProtected || false,
    password: hashedPassword,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    maxClicks,
    abTestGroup: abTestGroup || 'control',
    linkedModule,
    linkedEntityId,
    linkedEntityType,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    ipRestrictions: Array.isArray(ipRestrictions) ? ipRestrictions : [],
    countryRestrictions: Array.isArray(countryRestrictions) ? countryRestrictions : [],
    deviceRestrictions: Array.isArray(deviceRestrictions) ? deviceRestrictions : [],
    notes,
    owner,
    createdBy: owner,
    companyID, // Add companyID here
    status: 'active',
  };

  console.log('DEBUG - URL data to save:', {
    originalUrl: urlData.originalUrl,
    shortCode: urlData.shortCode,
    title: urlData.title,
    tags: urlData.tags,
    owner: urlData.owner,
    // Omit sensitive info like password
  });

  try {
    const result = await new Model(urlData).save();
    console.log('DEBUG - URL created with ID:', result._id);

    // Build short URL using server base URL and shortCode
    const baseUrl = process.env.PUBLIC_SERVER_FILE || 'http://localhost:8888';
    const shortUrl = `${baseUrl.replace(/\/$/, '')}/s/${result.shortCode}`;
    console.log('DEBUG - Full short URL:', shortUrl);

    // Generate QR code with the full URL instead of just the ID
    console.log('DEBUG - Generating QR code for URL:', shortUrl);
    await urlService.generateQRCode(shortUrl);
    console.log('DEBUG - QR code generation completed');

    // Update the result with the shortUrl field
    await Model.findByIdAndUpdate(result._id, { shortUrl });
    console.log('DEBUG - URL record updated with shortUrl field');

    const finalResult = await Model.findById(result._id).populate('owner', 'name email');
    console.log('DEBUG - Final result ready to return:', {
      id: finalResult._id,
      shortCode: finalResult.shortCode,
      shortUrl: shortUrl,
    });

    return res.status(201).json({
      success: true,
      result: {
        ...finalResult.toObject(),
        shortUrl,
      },
      message: 'URL created successfully',
    });
  } catch (err) {
    console.error('DEBUG - Error creating URL:', err);
    // Return validation errors in a readable format
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
    });
  }
});

// Override read method with analytics
const read = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { includeAnalytics = false } = req.query;

  debugRequestContext(req, 'READ');

  const result = await Model.findById(id)
    .populate('owner', 'name email companyID')
    .populate('allowedUsers', 'name email companyID');

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'URL not found',
    });
  }

  // Permission check for user
  if (req.user && !hasPermission(req, 'canViewUrls')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view URLs',
    });
  }

  // Check companyID match
  const requesterCompanyID = resolveCompanyID(req);
  if (result.companyID !== requesterCompanyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch',
    });
  }

  // Use the helper function to resolve owner
  const requestUserId = resolveOwnerContext(req);

  if (!requestUserId) {
    console.error('READ: No authenticated user context found', {
      admin: req.admin,
      companyOwner: req.companyOwner,
      user: req.user,
    });
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Check if URL has an owner
  if (!result.owner) {
    console.error('READ: URL has no owner', { urlId: id });
    // For URLs without owner, allow access but log the issue
    console.log('Allowing access to URL without owner');
  } else {
    const ownerIdString = result.owner._id ? result.owner._id.toString() : result.owner.toString();
    const requestUserIdString = requestUserId.toString();
    const isOwner = ownerIdString === requestUserIdString;
    const isAllowedUser =
      result.allowedUsers &&
      Array.isArray(result.allowedUsers) &&
      result.allowedUsers.some((user) => user._id.toString() === requestUserIdString);

    // Only check access for URLs with owners
    if (!isOwner && !isAllowedUser) {
      console.log('Access denied - user is not owner or allowed user', {
        ownerIdString,
        requestUserIdString,
        isOwner,
        isAllowedUser,
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
  }

  const responseData = result.toObject();

  // Sanitize sensitive fields in the response
  if (responseData.title) responseData.title = sanitizeInput(responseData.title);
  if (responseData.description) responseData.description = sanitizeInput(responseData.description);
  if (Array.isArray(responseData.tags)) {
    responseData.tags = responseData.tags.map((tag) => sanitizeInput(tag));
  }

  if (includeAnalytics === true || includeAnalytics === 'true') {
    // Get basic analytics
    try {
      const analytics = await getBasicAnalytics(id);
      responseData.analytics = analytics;
    } catch (err) {
      console.error('Error fetching analytics', err);
      // Don't fail the entire request if analytics fails
      responseData.analytics = {
        error: 'Failed to load analytics',
        clickStats: { totalClicks: 0, uniqueClicks: 0, avgResponseTime: 0 },
        geographicStats: [],
        deviceStats: [],
        recentClicks: [],
      };
    }
  }

  // Construct the shortUrl
  const baseUrl = process.env.PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  responseData.shortUrl = `${baseUrl.replace(/\/$/, '')}/s/${responseData.shortCode}`;

  return res.status(200).json({
    success: true,
    result: responseData,
  });
});

// Override update method with validation
const update = catchErrors(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  const requestUserId = resolveOwnerContext(req);

  const existingUrl = await Model.findById(id);
  if (!existingUrl) {
    return res.status(404).json({
      success: false,
      message: 'URL not found',
    });
  }

  // Permission check for user
  if (req.user && !hasPermission(req, 'canUpdateUrls')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update URLs',
    });
  }

  // Check companyID match
  const requesterCompanyID = resolveCompanyID(req);
  if (existingUrl.companyID !== requesterCompanyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch',
    });
  }

  // Validate URL if being updated
  if (updates.originalUrl) {
    const sanitizedUrl = await urlService.validateAndSanitizeUrl(updates.originalUrl);
    if (!sanitizedUrl) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format',
      });
    }
    updates.originalUrl = sanitizedUrl;
  }

  // Validate short code if being updated
  if (updates.shortCode && updates.shortCode !== existingUrl.shortCode) {
    const isValidShortCode = await urlService.validateShortCode(updates.shortCode);
    if (!isValidShortCode) {
      return res.status(400).json({
        success: false,
        message: 'Short code is invalid or already in use',
      });
    }
  }

  // Hash password if provided
  if (updates.passwordProtected && updates.password) {
    updates.password = await urlService.hashPassword(updates.password);
  }

  // Sanitize text inputs
  if (updates.title) updates.title = sanitizeInput(updates.title);
  if (updates.description) updates.description = sanitizeInput(updates.description);
  if (Array.isArray(updates.tags)) {
    updates.tags = updates.tags.map((tag) => sanitizeInput(tag));
  }

  // Add updatedBy field
  updates.updatedBy = requestUserId;

  const result = await Model.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('owner', 'name email');

  return res.status(200).json({
    success: true,
    result,
    message: 'URL updated successfully',
  });
});

// Enhanced list method with filters
const list = catchErrors(async (req, res) => {
  debugRequestContext(req, 'LIST');

  // Permission check for user
  if (req.user && !hasPermission(req, 'canViewUrls')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view URLs',
    });
  }

  const companyID = resolveCompanyID(req);
  if (!companyID) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'CompanyID context not found - authentication required',
    });
  }

  // Parse filters from query
  const {
    status,
    search,
    linkedModule,
    isPublic,
    requiresAuth,
    passwordProtected,
    dateFrom,
    dateTo,
    page,
    limit,
    sort,
  } = req.query;

  // Only show documents with same companyID
  const filter = {
    companyID: companyID,
    status: { $ne: 'deleted' },
  };

  // Apply filters
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { originalUrl: { $regex: search, $options: 'i' } },
      { shortCode: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (linkedModule) {
    filter.linkedModule = linkedModule;
  }

  if (isPublic !== undefined && isPublic !== 'null') {
    filter.isPublic = isPublic === 'true';
  }

  if (requiresAuth !== undefined && requiresAuth !== 'null') {
    filter.requiresAuth = requiresAuth === 'true';
  }

  if (passwordProtected !== undefined && passwordProtected !== 'null') {
    filter.passwordProtected = passwordProtected === 'true';
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Parse pagination and sorting
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const sortOption = typeof sort === 'string' ? sort : '-createdAt';

  try {
    // Query for paginated results
    const totalDocs = await Model.countDocuments(filter);
    const docs = await Model.find(filter)
      .sort(sortOption)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .populate('owner', 'name email');

    return res.status(200).json({
      success: true,
      result: docs,
      pagination: {
        page: pageNum,
        pages: Math.ceil(totalDocs / pageSize),
        count: totalDocs,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('LIST: Database error:', error);
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Failed to fetch URLs',
    });
  }
});

// Search method
const search = catchErrors(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  // Use the helper function to resolve owner
  const owner = resolveOwnerContext(req);

  if (!owner) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Permission check for user
  if (req.user && !hasPermission(req, 'canViewUrls')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to search URLs',
    });
  }

  const companyID = resolveCompanyID(req);
  if (!companyID) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Only search documents with same companyID
  const filter = {
    companyID: companyID,
    status: 'active',
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { originalUrl: { $regex: q, $options: 'i' } },
      { shortCode: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ],
  };

  const results = await Model.find(filter)
    .limit(parseInt(limit))
    .sort({ totalClicks: -1, createdAt: -1 })
    .select('title shortCode originalUrl totalClicks createdAt');

  return res.status(200).json({
    success: true,
    result: results,
  });
});

// Bulk operations
const bulkOperations = catchErrors(async (req, res) => {
  const { operation, ids, data = {} } = req.body;

  if (!operation || !ids || !Array.isArray(ids)) {
    return res.status(400).json({
      success: false,
      message: 'Operation and IDs array are required',
    });
  }

  // Use the helper function to resolve owner
  const owner = resolveOwnerContext(req);

  if (!owner) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Permission check for user
  // Not defined in User: bulk operation permissions
  // Add comment here
  // e.g. // Permission for bulk operations not defined in User model

  const companyID = resolveCompanyID(req);
  if (!companyID) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Only operate on documents with same companyID
  const urls = await Model.find({
    _id: { $in: ids },
    companyID: companyID,
  });

  if (urls.length !== ids.length) {
    return res.status(403).json({
      success: false,
      message: 'Some URLs not found or access denied',
    });
  }

  let result;
  let message;

  switch (operation) {
    case 'activate':
      result = await Model.updateMany(
        { _id: { $in: ids } },
        { status: 'active', isActive: true, updatedBy: owner }
      );
      message = `${result.modifiedCount} URLs activated`;
      break;

    case 'deactivate':
      result = await Model.updateMany(
        { _id: { $in: ids } },
        { status: 'inactive', isActive: false, updatedBy: owner }
      );
      message = `${result.modifiedCount} URLs deactivated`;
      break;

    case 'delete':
      result = await Model.updateMany(
        { _id: { $in: ids } },
        { status: 'deleted', updatedBy: owner }
      );
      message = `${result.modifiedCount} URLs deleted`;
      break;

    case 'updateCategory':
      return res.status(400).json({
        success: false,
        message: 'Category operations are not supported',
      });

    case 'updateExpiration':
      if (!data.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Expiration date is required for updateExpiration operation',
        });
      }
      result = await Model.updateMany(
        { _id: { $in: ids } },
        { expiresAt: new Date(data.expiresAt), updatedBy: owner }
      );
      message = `${result.modifiedCount} URLs updated`;
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid operation',
      });
  }

  return res.status(200).json({
    success: true,
    result: { modifiedCount: result.modifiedCount },
    message,
  });
});

// Clone URL
const clone = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { shortCode: customShortCode, title: customTitle } = req.body;

  const originalUrl = await Model.findById(id);
  if (!originalUrl) {
    return res.status(404).json({
      success: false,
      message: 'URL not found',
    });
  }

  // Use the helper function to resolve owner
  const requestUserId = resolveOwnerContext(req);

  if (!requestUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Permission check for user
  // Not defined in User: clone permission
  // Add comment here
  // e.g. // Permission for cloning URLs not defined in User model

  const requesterCompanyID = resolveCompanyID(req);
  if (originalUrl.companyID !== requesterCompanyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch',
    });
  }

  // Generate new short code
  let shortCode = customShortCode;
  if (!shortCode) {
    shortCode = await urlService.generateShortCode();
  } else {
    const isValidShortCode = await urlService.validateShortCode(shortCode);
    if (!isValidShortCode) {
      return res.status(400).json({
        success: false,
        message: 'Short code is invalid or already in use',
      });
    }
  }

  // Create cloned URL
  const clonedData = {
    ...originalUrl.toObject(),
    _id: undefined,
    shortCode,
    title: customTitle || `${originalUrl.title} (Copy)`,
    totalClicks: 0,
    uniqueClicks: 0,
    lastClickedAt: undefined,
    firstClickedAt: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    createdBy: requestUserId,
    updatedBy: undefined,
    companyID: requesterCompanyID, // Add companyID here
  };

  const clonedUrl = await new Model(clonedData).save();

  // Generate QR code for cloned URL
  await urlService.generateQRCode(clonedUrl._id);

  return res.status(201).json({
    success: true,
    result: await Model.findById(clonedUrl._id).populate('owner', 'name email'),
    message: 'URL cloned successfully',
  });
});

// Get summary statistics
const summary = catchErrors(async (req, res) => {
  debugRequestContext(req, 'SUMMARY');

  // Permission check for user
  // Not defined in User: summary permission
  // Add comment here
  // e.g. // Permission for summary not defined in User model

  const companyID = resolveCompanyID(req);

  if (!companyID) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'CompanyID context not found - authentication required',
    });
  }

  // Only show summary for documents with same companyID
  try {
    const [totalUrls, activeUrls, totalClicks, recentUrls, topUrls] = await Promise.all([
      Model.countDocuments({ companyID: companyID, status: { $ne: 'deleted' } }),
      Model.countDocuments({ companyID: companyID, status: 'active' }),
      Model.aggregate([
        { $match: { companyID: companyID } },
        { $group: { _id: null, total: { $sum: '$totalClicks' } } },
      ]),
      Model.find({ companyID: companyID, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title shortCode totalClicks createdAt'),
      Model.find({ companyID: companyID, status: 'active' })
        .sort({ totalClicks: -1 })
        .limit(5)
        .select('title shortCode totalClicks'),
    ]);

    return res.status(200).json({
      success: true,
      result: {
        totalUrls,
        activeUrls,
        totalClicks: totalClicks[0]?.total || 0,
        recentUrls,
        topUrls,
      },
    });
  } catch (error) {
    console.error('SUMMARY: Database error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to fetch summary statistics',
    });
  }
});

// Helper function to get basic analytics
const getBasicAnalytics = async (urlId) => {
  const [clickStats, geographicStats, deviceStats, recentClicks] = await Promise.all([
    URLClick.aggregate([
      { $match: { url: new mongoose.Types.ObjectId(urlId), isValidClick: true, isBot: false } },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          uniqueClicks: { $addToSet: '$userId' },
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
      {
        $project: {
          totalClicks: 1,
          uniqueClicks: { $size: '$uniqueClicks' },
          avgResponseTime: 1,
        },
      },
    ]),
    URLClick.aggregate([
      {
        $match: {
          url: new mongoose.Types.ObjectId(urlId),
          isValidClick: true,
          country: { $exists: true },
        },
      },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    URLClick.aggregate([
      { $match: { url: new mongoose.Types.ObjectId(urlId), isValidClick: true } },
      { $group: { _id: '$device.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    URLClick.find({ url: urlId, isValidClick: true })
      .sort({ clickedAt: -1 })
      .limit(10)
      .select('clickedAt country device.type referrerDomain'),
  ]);

  return {
    clickStats: clickStats[0] || { totalClicks: 0, uniqueClicks: 0, avgResponseTime: 0 },
    geographicStats,
    deviceStats,
    recentClicks,
  };
};

// Override delete method with URL-specific logic
const deleteUrl = catchErrors(async (req, res) => {
  const { id } = req.params;

  const existingUrl = await Model.findById(id);
  if (!existingUrl) {
    return res.status(404).json({
      success: false,
      message: 'URL not found',
    });
  }

  // Use the helper function to resolve owner
  const requestUserId = resolveOwnerContext(req);

  if (!requestUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Permission check for user
  if (req.user && !hasPermission(req, 'canDeleteUrls')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete URLs',
    });
  }

  // Check companyID match
  const requesterCompanyID = resolveCompanyID(req);
  if (existingUrl.companyID !== requesterCompanyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch',
    });
  }

  try {
    // Soft delete by updating status instead of actually deleting the document
    const result = await Model.findByIdAndUpdate(
      id,
      {
        status: 'deleted',
        isActive: false,
        updatedBy: requestUserId,
        deletedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result: result,
      message: 'URL deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete URL',
    });
  }
});

// Export methods
module.exports = {
  ...crudController,
  create,
  read,
  update,
  list,
  search,
  bulkOperations,
  clone,
  summary,
  filter: list, // Alias for backward compatibility
  delete: deleteUrl, // Override the delete method
};
