// @ts-nocheck


import { catchErrors } from '@/handlers/errorHandlers';
import URL from '@/models/appModels/URL';
import URLClick from '@/models/appModels/URLClick';
import ABTest from '@/models/appModels/ABTest';
import urlService from '@/services/urlService';
import analyticsService from '@/services/urlAnalyticsService';
import { createRequire } from 'module';
const load = createRequire(__filename);
const getUrl = catchErrors(async (req, res) => {
  const { shortCode } = req.params;
  const { preview = false, password } = req.query;
  console.log('=== GET URL FUNCTION CALLED ===');

  try {
    // Use isActive: true instead of status: 'active'
    const urlQuery = { shortCode, isActive: true };
    // Explicitly select password field
    const url = await URL.findOne(urlQuery).select('+password');
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    // Remove user authentication logic for public path
    const user = null; // Always null for public path

    // Extract client info for analytics
    const clientInfo = await analyticsService.extractClientInfo(req);

    // Check if URL is accessible
    const accessCheck = await checkUrlAccess(url, user, clientInfo, password);

    // Handle password protection, expiration, and click limit
    if (!accessCheck.allowed) {
      // Password required: show password portal
      if (accessCheck.reason === 'password_required') {
        // Detect document share by category or metadata.documentId
        const isDocShare = url.category === 'document_share' || !!url.metadata?.documentId;

        return res.status(200).json({
          success: false,
          requiresPassword: true,
          message: 'Password required to access this URL',
          portal: 'password', // Indicate to frontend to show password portal
          shortCode: url.shortCode,
          title: url.title,
          description: url.description,
          isPasswordProtected: true,
          category: url.category || (isDocShare ? 'document_share' : null), // Include category to identify document shares
          isDocumentShare: isDocShare, // Explicitly flag document shares
        });
      }
      // Expired: show expired portal
      if (accessCheck.reason === 'expired') {
        const isDocShare = url.category === 'document_share' || !!url.metadata?.documentId;

        return res.status(200).json({
          success: false,
          isExpired: true,
          message: 'This URL has expired',
          portal: 'expired',
          shortCode: url.shortCode,
          title: url.title,
          description: url.description,
          category: url.category || (isDocShare ? 'document_share' : null),
          isDocumentShare: isDocShare,
        });
      }
      // Click limit reached: show limit reached portal
      if (accessCheck.reason === 'limit_reached') {
        const isDocShare = url.category === 'document_share' || !!url.metadata?.documentId;

        return res.status(200).json({
          success: false,
          isLimitReached: true,
          message: 'This URL has reached its maximum click limit',
          portal: 'limit_reached',
          shortCode: url.shortCode,
          title: url.title,
          description: url.description,
          category: url.category || (isDocShare ? 'document_share' : null),
          isDocumentShare: isDocShare,
        });
      }
      // Other access issues
      return res.status(403).json({
        success: false,
        message: accessCheck.message,
        reason: accessCheck.reason,
      });
    }

    // Check for A/B test
    let finalUrl = url;
    let abTestVariant = 'control';

    try {
      const activeTests = await ABTest.find({
        url: url._id,
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (activeTests.length > 0) {
        const test = activeTests[0];
        const userId = user?._id || clientInfo.userId;

        // Simple variant assignment based on user ID hash
        const hash = load('crypto').createHash('md5').update(userId.toString()).digest('hex');
        const hashInt = parseInt(hash.substring(0, 8), 16);
        const variantIndex = hashInt % test.variants.length;
        abTestVariant = test.variants[variantIndex]?.name || 'control';

        if (abTestVariant !== 'control') {
          // Get variant URL
          const variant = test.variants.find((v) => v.name === abTestVariant);
          if (variant && variant.url) {
            const variantUrl = await URL.findById(variant.url);
            if (variantUrl) {
              finalUrl = variantUrl;
            }
          }
        }
      }
    } catch (abTestError) {
      console.error('A/B test error:', abTestError);
      // Continue with original URL if A/B test fails
    }

    // Track the click BEFORE redirect
    try {
      await trackClick(url, user, clientInfo, abTestVariant, null);
    } catch (trackError) {
      console.error('Click tracking error:', trackError);
      // Don't fail redirect if tracking fails
    }

    // Build final redirect URL with UTM parameters
    const redirectUrl = buildRedirectUrl(finalUrl, req.query);

    // Increment click counters
    try {
      await URL.findByIdAndUpdate(url._id, {
        $inc: {
          totalClicks: 1,
          uniqueClicks: clientInfo.isUniqueClick ? 1 : 0,
        },
        lastClickedAt: new Date(),
        ...(url.totalClicks === 0 && { firstClickedAt: new Date() }),
      });
    } catch (updateError) {
      console.error('URL update error:', updateError);
    }

    // Special handling for document share URLs
    // Check by category or metadata.documentId
    if (
      (url.category === 'document_share' || url.metadata?.documentId) &&
      url.metadata?.documentId
    ) {
      // Return document share information for frontend to handle
      return res.status(200).json({
        success: true,
        isDocumentShare: true,
        category: 'document_share',
        result: {
          _id: url._id,
          shortCode: url.shortCode,
          title: url.title,
          description: url.description,
          documentId: url.metadata.documentId,
          documentTitle: url.metadata.documentTitle,
          fileName: url.metadata.fileName,
          fileType: url.metadata.fileType,
          permissions: url.metadata.permissions || ['read'],
          totalClicks: url.totalClicks + 1,
          abTestVariant,
        },
        message: 'Document share accessed successfully',
      });
    }

    // For regular URLs, return JSON with redirect information
    // Only return URL data if not password protected, expired, or limit reached
    return res.status(200).json({
      success: true,
      result: {
        _id: url._id,
        shortCode: url.shortCode,
        originalUrl: redirectUrl, // This is the final URL to redirect to
        title: url.title,
        description: url.description,
        finalUrl: redirectUrl,
        isPasswordProtected: false, // Already checked
        isExpired: false, // Already checked
        isLimitReached: false, // Already checked
        abTestVariant,
        totalClicks: url.totalClicks + 1, // Include the incremented count
      },
    });
  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({
      success: false,
      message: 'Redirect failed',
    });
  }
});

// Check password for protected URLs
const checkPassword = catchErrors(async (req, res) => {
  const { shortCode } = req.params;
  const { password } = req.body;

  const url = await URL.findByShortCode(shortCode);

  if (!url) {
    return res.status(404).json({
      success: false,
      message: 'URL not found',
    });
  }

  if (!url.passwordProtected) {
    return res.status(400).json({
      success: false,
      message: 'URL is not password protected',
    });
  }

  const isValidPassword = await urlService.verifyPassword(password, url.password);

  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password',
    });
  }

  // Generate temporary access token
  const accessToken = await urlService.generateAccessToken(shortCode);

  return res.status(200).json({
    success: true,
    result: { accessToken },
    message: 'Password verified',
  });
});

// Generate QR code for URL
const generateQRCode = catchErrors(async (req, res) => {
  const { shortCode } = req.params;
  const { size = 200, format = 'png' } = req.query;

  const url = await URL.findByShortCode(shortCode);

  if (!url) {
    return res.status(404).json({
      success: false,
      message: 'URL not found',
    });
  }

  try {
    const qrCodeBuffer = await urlService.generateQRCodeBuffer(url.shortenedUrl, {
      size: parseInt(size),
      format,
    });

    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `inline; filename="qr-${shortCode}.${format}"`);
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error('QR Code generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
    });
  }
});

// Helper Functions

// Check URL access permissions
const checkUrlAccess = async (url, user, clientInfo, password) => {
  // Check if URL is active
  if (!url.isActive || url.status !== 'active') {
    return { allowed: false, reason: 'inactive', message: 'URL is not active' };
  }

  // Check expiration
  if (url.expiresAt && new Date() > url.expiresAt) {
    return { allowed: false, reason: 'expired', message: 'URL has expired' };
  }

  // Check click limit
  if (url.maxClicks && url.totalClicks >= url.maxClicks) {
    return { allowed: false, reason: 'limit_reached', message: 'Click limit reached' };
  }

  // Check password protection
  if (url.passwordProtected) {
    if (!password) {
      return { allowed: false, reason: 'password_required', message: 'Password required' };
    }

    const isValidPassword = await urlService.verifyPassword(password, url.password);
    if (!isValidPassword) {
      return { allowed: false, reason: 'invalid_password', message: 'Invalid password' };
    }
  }

  // Check IP restrictions
  if (url.ipRestrictions.length > 0) {
    const ipAllowed = url.ipRestrictions.some((restriction) => {
      if (restriction.type === 'whitelist') {
        return restriction.ip === clientInfo.ipAddress;
      } else {
        return restriction.ip !== clientInfo.ipAddress;
      }
    });

    if (!ipAllowed) {
      return { allowed: false, reason: 'ip_restricted', message: 'IP address not allowed' };
    }
  }

  // Check country restrictions
  if (url.countryRestrictions.length > 0 && clientInfo.country) {
    const countryAllowed = url.countryRestrictions.some((restriction) => {
      if (restriction.type === 'allow') {
        return restriction.country === clientInfo.country;
      } else {
        return restriction.country !== clientInfo.country;
      }
    });

    if (!countryAllowed) {
      return { allowed: false, reason: 'country_restricted', message: 'Country not allowed' };
    }
  }

  // Check device restrictions
  if (url.deviceRestrictions.length > 0 && clientInfo.device) {
    if (!url.deviceRestrictions.includes(clientInfo.device.type)) {
      return { allowed: false, reason: 'device_restricted', message: 'Device not allowed' };
    }
  }

  return { allowed: true };
};

// Track URL click
const trackClick = async (url, user, clientInfo, abTestVariant, abTest) => {
  try {
    const clickData = {
      url: url._id,
      shortCode: url.shortCode,
      user: user?._id,
      isAuthenticated: !!user,
      userId: clientInfo.userId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: clientInfo.sessionId || `session_${Date.now()}`,
      isUniqueClick: clientInfo.isUniqueClick !== false,
      userAgent: clientInfo.userAgent,
      device: clientInfo.device || { type: 'unknown' },
      browser: clientInfo.browser || { name: 'unknown' },
      os: clientInfo.os || { name: 'unknown' },
      ipAddress: clientInfo.ipAddress,
      country: clientInfo.country,
      countryCode: clientInfo.countryCode,
      region: clientInfo.region,
      city: clientInfo.city,
      timezone: clientInfo.timezone,
      referrer: clientInfo.referrer,
      referrerDomain: clientInfo.referrerDomain,
      referrerType: clientInfo.referrerType || 'direct',
      utmSource: clientInfo.utmSource,
      utmMedium: clientInfo.utmMedium,
      utmCampaign: clientInfo.utmCampaign,
      utmTerm: clientInfo.utmTerm,
      utmContent: clientInfo.utmContent,
      abTestGroup: abTestVariant,
      abTestId: abTest?._id,
      isBot: clientInfo.isBot || false,
      isValidClick: !(clientInfo.isBot || false),
      language: clientInfo.language,
      clickedAt: new Date(),
    };

    await new URLClick(clickData).save();
  } catch (error) {
    console.error('Error saving click data:', error);
    // Don't throw error to avoid breaking redirect
  }
};

// Build redirect URL with UTM parameters
const buildRedirectUrl = (url, queryParams) => {
  try {
    const originalUrl = url.originalUrl;
    const targetUrl = new globalThis.URL(originalUrl);

    // Add UTM parameters if they exist in the URL model or query
    const utmParams = {
      utm_source: url.utmSource || queryParams.utm_source,
      utm_medium: url.utmMedium || queryParams.utm_medium,
      utm_campaign: url.utmCampaign || queryParams.utm_campaign,
      utm_term: url.utmTerm || queryParams.utm_term,
      utm_content: url.utmContent || queryParams.utm_content,
    };

    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        targetUrl.searchParams.set(key, value);
      }
    });

    return targetUrl.toString();
  } catch (error) {
    console.error('Error building redirect URL:', error);
    return url.originalUrl;
  }
};

// Extract user from authorization token
const extractUserFromToken = async (authHeader) => {
  try {
    const token = authHeader.replace('Bearer ', '');
    // Verify token and extract user
    // Return user object or null
    return null;
  } catch (error) {
    return null;
  }
};

export = {
  getUrl,
  checkPassword,
  generateQRCode,
};
