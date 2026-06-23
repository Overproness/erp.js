// @ts-nocheck


import { catchErrors } from '@/handlers/errorHandlers';
import mongoose from 'mongoose';
import URL from '@/models/appModels/URL';
import URLClick from '@/models/appModels/URLClick';
import analyticsService from '@/services/urlAnalyticsService';
import analyticsHelpers from '@/helpers/analyticsHelpers';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
// Helper to get ownerId from request
function getOwnerId(req) {
  // Only companyOwner or user
  const id =
    req.companyOwner?._id ||
    req.user?._id ||
    req.companyOwner?.id ||
    req.user?.id;
  return id ? id.toString() : null;
}

// Helper to get companyID from request
function getCompanyID(req) {
  return req.companyOwner?.companyID || req.user?.companyID || null;
}

// Defensive: always use req.params.id as a string
function getUrlId(req) {
  if (!req.params || (!req.params.id && typeof req.params.id !== 'string')) {
    return null;
  }
  return typeof req.params.id === 'string' ? req.params.id : req.params.id.toString();
}

// Get comprehensive analytics for a URL
const getAnalytics = catchErrors(async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewAnalytics) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied: canViewAnalytics required'
    });
  }
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const {
    startDate,
    endDate,
    granularity = 'day',
    timezone = 'UTC'
  } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  // Build date filter
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = {
    url: new mongoose.Types.ObjectId(id),
    isValidClick: true,
    isBot: false
  };

  if (Object.keys(dateFilter).length > 0) {
    matchStage.clickedAt = dateFilter;
  }

  // Get comprehensive analytics
  const [
    overview,
    timeSeriesData,
    geographicData,
    deviceData,
    browserData,
    osData,
    referrerData,
    utmData,
    hourlyDistribution,
    dailyDistribution
  ] = await Promise.all([
    getOverviewStats(matchStage),
    getTimeSeriesData(matchStage, granularity, timezone),
    getGeographicStats(matchStage),
    getDeviceStats(matchStage),
    getBrowserStats(matchStage),
    getOSStats(matchStage),
    getReferrerStats(matchStage),
    getUTMStats(matchStage),
    getHourlyDistribution(matchStage),
    getDailyDistribution(matchStage)
  ]);

  return res.status(200).json({
    success: true,
    result: {
      url: {
        id: url._id,
        shortCode: url.shortCode,
        title: url.title,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt
      },
      overview,
      timeSeries: timeSeriesData,
      geographic: geographicData,
      devices: deviceData,
      browsers: browserData,
      operatingSystems: osData,
      referrers: referrerData,
      utm: utmData,
      hourlyDistribution,
      dailyDistribution
    }
  });
});

// Get click history for a URL
const getClickHistory = catchErrors(async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewAnalytics) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied: canViewAnalytics required'
    });
  }
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const {
    page = 1,
    limit = 50,
    startDate,
    endDate,
    country,
    device,
    referrer
  } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  // Build filter
  const filter = {
    url: id,
    isValidClick: true
  };

  if (startDate || endDate) {
    filter.clickedAt = {};
    if (startDate) filter.clickedAt.$gte = new Date(startDate);
    if (endDate) filter.clickedAt.$lte = new Date(endDate);
  }

  if (country) filter.country = country;
  if (device) filter['device.type'] = device;
  if (referrer) filter.referrerDomain = referrer;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { clickedAt: -1 },
    select: 'clickedAt country city device browser os referrerDomain utmSource utmMedium utmCampaign isBot'
  };

  // For list/summary, filter by companyID
  filter.companyID = companyID;

  const result = await URLClick.paginate(filter, options);

  return res.status(200).json({
    success: true,
    result: result.docs,
    pagination: {
      page: result.page,
      pages: result.totalPages,
      count: result.totalDocs,
      limit: result.limit
    }
  });
});

// Get geographic analytics
const getGeographicData = catchErrors(async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewAnalytics) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied: canViewAnalytics required'
    });
  }
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const { startDate, endDate, level = 'country' } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  const matchStage = {
    url: new mongoose.Types.ObjectId(id),
    isValidClick: true,
    isBot: false
  };

  if (startDate || endDate) {
    matchStage.clickedAt = {};
    if (startDate) matchStage.clickedAt.$gte = new Date(startDate);
    if (endDate) matchStage.clickedAt.$lte = new Date(endDate);
  }

  let groupField;
  switch (level) {
    case 'country':
      groupField = '$country';
      matchStage.country = { $exists: true, $ne: null };
      break;
    case 'region':
      groupField = { country: '$country', region: '$region' };
      matchStage.region = { $exists: true, $ne: null };
      break;
    case 'city':
      groupField = { country: '$country', region: '$region', city: '$city' };
      matchStage.city = { $exists: true, $ne: null };
      break;
    default:
      groupField = '$country';
      matchStage.country = { $exists: true, $ne: null };
  }

  const result = await URLClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupField,
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' },
        lastClick: { $max: '$clickedAt' }
      }
    },
    {
      $project: {
        _id: 1,
        clicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' },
        lastClick: 1
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 100 }
  ]);

  return res.status(200).json({
    success: true,
    result
  });
});

// Get device and browser statistics
const getDeviceStats = catchErrors(async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewAnalytics) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied: canViewAnalytics required'
    });
  }
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const { startDate, endDate } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  const matchStage = {
    url: new mongoose.Types.ObjectId(id),
    isValidClick: true,
    isBot: false
  };

  if (startDate || endDate) {
    matchStage.clickedAt = {};
    if (startDate) matchStage.clickedAt.$gte = new Date(startDate);
    if (endDate) matchStage.clickedAt.$lte = new Date(endDate);
  }

  const [deviceTypes, browsers, operatingSystems] = await Promise.all([
    URLClick.aggregate([
      { $match: matchStage },
      { $group: { _id: '$device.type', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } }
    ]),
    URLClick.aggregate([
      { $match: matchStage },
      { $group: { _id: '$browser.name', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 }
    ]),
    URLClick.aggregate([
      { $match: matchStage },
      { $group: { _id: '$os.name', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 }
    ])
  ]);

  return res.status(200).json({
    success: true,
    result: {
      deviceTypes,
      browsers,
      operatingSystems
    }
  });
});

// Get traffic sources and referrer analytics
const getTrafficSources = catchErrors(async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewAnalytics) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied: canViewAnalytics required'
    });
  }
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const { startDate, endDate } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  const matchStage = {
    url: new mongoose.Types.ObjectId(id),
    isValidClick: true,
    isBot: false
  };

  if (startDate || endDate) {
    matchStage.clickedAt = {};
    if (startDate) matchStage.clickedAt.$gte = new Date(startDate);
    if (endDate) matchStage.clickedAt.$lte = new Date(endDate);
  }

  const [referrerTypes, topReferrers, utmSources, utmMediums, utmCampaigns] = await Promise.all([
    URLClick.aggregate([
      { $match: matchStage },
      { $group: { _id: '$referrerType', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, referrerDomain: { $exists: true, $ne: null } } },
      { $group: { _id: '$referrerDomain', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, utmSource: { $exists: true, $ne: null } } },
      { $group: { _id: '$utmSource', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, utmMedium: { $exists: true, $ne: null } } },
      { $group: { _id: '$utmMedium', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, utmCampaign: { $exists: true, $ne: null } } },
      { $group: { _id: '$utmCampaign', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { _id: 1, clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 }
    ])
  ]);

  return res.status(200).json({
    success: true,
    result: {
      referrerTypes,
      topReferrers,
      utmSources,
      utmMediums,
      utmCampaigns
    }
  });
});

// Export analytics data
const exportAnalytics = catchErrors(async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewAnalytics) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied: canViewAnalytics required'
    });
  }
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const { format = 'csv', startDate, endDate, includeRawClicks = false } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  try {
    let exportData;
    
    if (includeRawClicks === 'true') {
      // Export raw click data
      const filter = {
        url: id,
        isValidClick: true
      };

      if (startDate || endDate) {
        filter.clickedAt = {};
        if (startDate) filter.clickedAt.$gte = new Date(startDate);
        if (endDate) filter.clickedAt.$lte = new Date(endDate);
      }

      const clicks = await URLClick.find(filter)
        .select('clickedAt country city device browser os referrerDomain utmSource utmMedium utmCampaign')
        .sort({ clickedAt: -1 })
        .limit(10000) // Limit for performance
        .lean();

      exportData = clicks;
    } else {
      // Export aggregated analytics
      const matchStage = {
        url: new mongoose.Types.ObjectId(id),
        isValidClick: true,
        isBot: false
      };

      if (startDate || endDate) {
        matchStage.clickedAt = {};
        if (startDate) matchStage.clickedAt.$gte = new Date(startDate);
        if (endDate) matchStage.clickedAt.$lte = new Date(endDate);
      }

      const [overview, geographic, devices, traffic] = await Promise.all([
        getOverviewStats(matchStage),
        getGeographicStats(matchStage),
        getDeviceStats(matchStage),
        getReferrerStats(matchStage)
      ]);

      exportData = { overview, geographic, devices, traffic };
    }

    if (format === 'csv') {
      const csv = await analyticsHelpers.convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${url.shortCode}-${Date.now()}.csv"`);
      return res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${url.shortCode}-${Date.now()}.json"`);
      return res.json(exportData);
    } else if (format === 'xlsx' || format === 'excel') {
      // Excel export using xlsx
      let wb, ws;
      if (Array.isArray(exportData)) {
        ws = XLSX.utils.json_to_sheet(exportData);
        wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
      } else {
        wb = XLSX.utils.book_new();
        Object.entries(exportData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            const sheet = XLSX.utils.json_to_sheet(value);
            XLSX.utils.book_append_sheet(wb, sheet, key);
          } else {
            const sheet = XLSX.utils.json_to_sheet([value]);
            XLSX.utils.book_append_sheet(wb, sheet, key);
          }
        });
      }
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${url.shortCode}-${Date.now()}.xlsx"`);
      return res.send(buffer);
    } else if (format === 'pdf') {
      // PDF export using pdfkit
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const filename = `analytics-${url.shortCode}-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      doc.pipe(res);

      doc.fontSize(18).text('URL Analytics Export', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Short Code: ${url.shortCode}`);
      doc.text(`Original URL: ${url.originalUrl}`);
      doc.text(`Exported: ${new Date().toLocaleString()}`);
      doc.moveDown();

      function renderSection(title, arr) {
        doc.fontSize(14).text(title, { underline: true });
        if (!arr || !arr.length) {
          doc.fontSize(10).text('No data', { italic: true });
          doc.moveDown();
          return;
        }
        const keys = Object.keys(arr[0]);
        doc.fontSize(10).text(keys.join(' | '));
        arr.forEach(row => {
          doc.text(keys.map(k => row[k]).join(' | '));
        });
        doc.moveDown();
      }

      if (Array.isArray(exportData)) {
        renderSection('Data', exportData);
      } else {
        Object.entries(exportData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            renderSection(key.charAt(0).toUpperCase() + key.slice(1), value);
          } else if (typeof value === 'object' && value !== null) {
            doc.fontSize(14).text(key.charAt(0).toUpperCase() + key.slice(1), { underline: true });
            Object.entries(value).forEach(([k, v]) => {
              doc.fontSize(10).text(`${k}: ${v}`);
            });
            doc.moveDown();
          }
        });
      }
      doc.end();
      return;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported export format'
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
});

// Get real-time analytics for dashboard
const getRealTimeAnalytics = catchErrors(async (req, res) => {
  // Permission check for users
  if (req.user && !req.user.permissions?.canViewAnalytics) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied: canViewAnalytics required'
    });
  }
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const { hours = 24 } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  const hoursAgo = new Date(Date.now() - (parseInt(hours) * 60 * 60 * 1000));

  const matchStage = {
    url: new mongoose.Types.ObjectId(id),
    clickedAt: { $gte: hoursAgo },
    isValidClick: true,
    isBot: false
  };

  const [recentClicks, activeUsers, topCountries, recentActivity] = await Promise.all([
    URLClick.countDocuments(matchStage),
    URLClick.aggregate([
      { $match: { ...matchStage, clickedAt: { $gte: new Date(Date.now() - (30 * 60 * 1000)) } } },
      { $group: { _id: null, uniqueUsers: { $addToSet: '$userId' } } },
      { $project: { count: { $size: '$uniqueUsers' } } }
    ]),
    URLClick.aggregate([
      { $match: matchStage },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    URLClick.find(matchStage)
      .sort({ clickedAt: -1 })
      .limit(10)
      .select('clickedAt country device browser')
      .lean()
  ]);

  return res.status(200).json({
    success: true,
    result: {
      recentClicks,
      activeUsers: activeUsers[0]?.count || 0,
      topCountries,
      recentActivity
    }
  });
});

// Get conversion analytics
const getConversionAnalytics = catchErrors(async (req, res) => {
  // Permission check for users
  // Not defined in User: add comment
  // Permission for conversion analytics not defined in User model
  const id = getUrlId(req);
  if (!id) {
    return res && res.status ? res.status(400).json({
      success: false,
      message: 'Missing URL id parameter'
    }) : null;
  }
  const { startDate, endDate, conversionGoal } = req.query;

  const ownerId = getOwnerId(req);
  const companyID = getCompanyID(req);
  // ...existing code...
  const url = await URL.findById(id);
  if (!url) {
    return res && res.status ? res.status(404).json({
      success: false,
      message: 'URL not found'
    }) : null;
  }
  // CompanyID access control
  if (url.companyID !== companyID) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: companyID mismatch'
    });
  }

  const matchStage = {
    url: new mongoose.Types.ObjectId(id),
    isValidClick: true,
    isBot: false
  };

  if (startDate || endDate) {
    matchStage.clickedAt = {};
    if (startDate) matchStage.clickedAt.$gte = new Date(startDate);
    if (endDate) matchStage.clickedAt.$lte = new Date(endDate);
  }

  // Add conversion tracking logic based on conversionGoal
  if (conversionGoal) {
    matchStage.conversionGoal = conversionGoal;
  }

  const [funnelData, conversionsBySource, conversionsByDevice] = await Promise.all([
    URLClick.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          conversions: { $sum: { $cond: [{ $eq: ['$isConversion', true] }, 1, 0] } },
          uniqueVisitors: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          totalClicks: 1,
          conversions: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          conversionRate: { 
            $multiply: [
              { $divide: ['$conversions', '$totalClicks'] }, 
              100
            ] 
          }
        }
      }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, isConversion: true } },
      { $group: { _id: '$utmSource', conversions: { $sum: 1 } } },
      { $sort: { conversions: -1 } },
      { $limit: 10 }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, isConversion: true } },
      { $group: { _id: '$device.type', conversions: { $sum: 1 } } },
      { $sort: { conversions: -1 } }
    ])
  ]);

  return res.status(200).json({
    success: true,
    result: {
      funnel: funnelData[0] || { totalClicks: 0, conversions: 0, uniqueVisitors: 0, conversionRate: 0 },
      conversionsBySource,
      conversionsByDevice
    }
  });
});

// Helper functions for aggregating data

const getOverviewStats = async (matchStage) => {
  const [stats] = await URLClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' },
        countries: { $addToSet: '$country' },
        avgResponseTime: { $avg: '$responseTime' },
        firstClick: { $min: '$clickedAt' },
        lastClick: { $max: '$clickedAt' }
      }
    },
    {
      $project: {
        totalClicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' },
        countries: { $size: '$countries' },
        avgResponseTime: 1,
        firstClick: 1,
        lastClick: 1
      }
    }
  ]);

  return stats || {
    totalClicks: 0,
    uniqueClicks: 0,
    countries: 0,
    avgResponseTime: 0,
    firstClick: null,
    lastClick: null
  };
};

const getTimeSeriesData = async (matchStage, granularity, timezone) => {
  let dateGroup;
  let formatPattern;
  
  switch (granularity) {
    case 'hour':
      dateGroup = {
        year: { $year: '$clickedAt' },
        month: { $month: '$clickedAt' },
        day: { $dayOfMonth: '$clickedAt' },
        hour: { $hour: '$clickedAt' }
      };
      formatPattern = '%Y-%m-%d %H:00';
      break;
    case 'day':
      dateGroup = {
        year: { $year: '$clickedAt' },
        month: { $month: '$clickedAt' },
        day: { $dayOfMonth: '$clickedAt' }
      };
      formatPattern = '%Y-%m-%d';
      break;
    case 'week':
      dateGroup = {
        year: { $year: '$clickedAt' },
        week: { $week: '$clickedAt' }
      };
      formatPattern = '%Y-W%U';
      break;
    case 'month':
      dateGroup = {
        year: { $year: '$clickedAt' },
        month: { $month: '$clickedAt' }
      };
      formatPattern = '%Y-%m';
      break;
    default:
      dateGroup = {
        year: { $year: '$clickedAt' },
        month: { $month: '$clickedAt' },
        day: { $dayOfMonth: '$clickedAt' }
      };
      formatPattern = '%Y-%m-%d';
  }

  const rawData = await URLClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: dateGroup,
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' },
        date: { $first: '$clickedAt' }
      }
    },
    {
      $project: {
        _id: 1,
        clicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' },
        date: 1
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ]);

  // Format the data for better frontend consumption
  return rawData.map(item => {
    let formattedDate;
    let displayLabel;
    
    if (granularity === 'hour') {
      const date = new Date(item._id.year, item._id.month - 1, item._id.day, item._id.hour);
      formattedDate = date.toISOString();
      displayLabel = `${String(item._id.month).padStart(2, '0')}/${String(item._id.day).padStart(2, '0')} ${String(item._id.hour).padStart(2, '0')}:00`;
    } else if (granularity === 'day') {
      const date = new Date(item._id.year, item._id.month - 1, item._id.day);
      formattedDate = date.toISOString().split('T')[0];
      displayLabel = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
    } else if (granularity === 'week') {
      formattedDate = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      displayLabel = `Week ${item._id.week}, ${item._id.year}`;
    } else if (granularity === 'month') {
      formattedDate = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      displayLabel = `${getMonthName(item._id.month)} ${item._id.year}`;
    }

    return {
      date: formattedDate,
      label: displayLabel,
      clicks: item.clicks,
      uniqueClicks: item.uniqueClicks,
      period: item._id
    };
  });
};

// Helper function to get month name
const getMonthName = (monthNumber) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNumber - 1] || 'Unknown';
};

const getGeographicStats = async (matchStage) => {
  const data = await URLClick.aggregate([
    { $match: { ...matchStage, country: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$country',
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        country: '$_id',
        clicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' },
        percentage: 1
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 50 }
  ]);

  // Calculate percentages
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
  return data.map(item => ({
    ...item,
    percentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100 * 100) / 100 : 0
  }));
};


const getBrowserStats = async (matchStage) => {
  const data = await URLClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $ifNull: ['$browser.name', 'Unknown'] },
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        browser: '$_id',
        clicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 20 }
  ]);

  // Calculate percentages
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
  return data.map(item => ({
    ...item,
    percentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100 * 100) / 100 : 0
  }));
};

const getOSStats = async (matchStage) => {
  const data = await URLClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $ifNull: ['$os.name', 'Unknown'] },
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        os: '$_id',
        clicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 20 }
  ]);

  // Calculate percentages
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
  return data.map(item => ({
    ...item,
    percentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100 * 100) / 100 : 0
  }));
};

const getReferrerStats = async (matchStage) => {
  const data = await URLClick.aggregate([
    { $match: { ...matchStage, referrerDomain: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$referrerDomain',
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        referrer: '$_id',
        clicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 20 }
  ]);

  // Calculate percentages
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
  return data.map(item => ({
    ...item,
    percentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100 * 100) / 100 : 0
  }));
};

const getUTMStats = async (matchStage) => {
  const [sources, mediums, campaigns] = await Promise.all([
    URLClick.aggregate([
      { $match: { ...matchStage, utmSource: { $exists: true, $ne: null } } },
      { $group: { _id: '$utmSource', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { source: '$_id', clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, utmMedium: { $exists: true, $ne: null } } },
      { $group: { _id: '$utmMedium', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { medium: '$_id', clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]),
    URLClick.aggregate([
      { $match: { ...matchStage, utmCampaign: { $exists: true, $ne: null } } },
      { $group: { _id: '$utmCampaign', clicks: { $sum: 1 }, uniqueClicks: { $addToSet: '$userId' } } },
      { $project: { campaign: '$_id', clicks: 1, uniqueClicks: { $size: '$uniqueClicks' } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ])
  ]);

  return { sources, mediums, campaigns };
};

const getHourlyDistribution = async (matchStage) => {
  const data = await URLClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $hour: '$clickedAt' },
        clicks: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Create complete 24-hour array with proper labels
  const hourlyData = Array.from({ length: 24 }, (_, index) => {
    const existingData = data.find(item => item._id === index);
    return {
      hour: index,
      label: `${String(index).padStart(2, '0')}:00`,
      displayLabel: index === 0 ? '12 AM' : 
                   index < 12 ? `${index} AM` : 
                   index === 12 ? '12 PM' : 
                   `${index - 12} PM`,
      clicks: existingData ? existingData.clicks : 0
    };
  });

  return hourlyData;
};

const getDailyDistribution = async (matchStage) => {
  const data = await URLClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dayOfWeek: '$clickedAt' },
        clicks: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Create complete week array with proper labels (MongoDB dayOfWeek: 1=Sunday, 7=Saturday)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const dailyData = Array.from({ length: 7 }, (_, index) => {
    const mongoDay = index + 1; // MongoDB uses 1-based indexing for days
    const existingData = data.find(item => item._id === mongoDay);
    return {
      day: index, // 0-based for frontend
      dayOfWeek: mongoDay,
      label: dayAbbr[index],
      fullLabel: dayNames[index],
      clicks: existingData ? existingData.clicks : 0
    };
  });

  return dailyData;
};

// Export methods
export = {
  getAnalytics,
  getClickHistory,
  getGeographicData,
  getDeviceStats,
  getTrafficSources,
  exportAnalytics,
  getRealTimeAnalytics,
  getConversionAnalytics
};
