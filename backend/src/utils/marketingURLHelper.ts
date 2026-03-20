// @ts-nocheck
/**
 * Marketing URL Helper
 * Utilities for generating and tracking marketing campaign URLs
 */
const { URL, URLClick } = require('../models');
const crypto = require('crypto');

/**
 * Generate a campaign tracking URL
 * @param {Object} options URL generation options
 * @param {string} options.baseUrl The base URL to use
 * @param {string} options.campaignId The campaign ID
 * @param {string} options.source UTM source parameter
 * @param {string} options.medium UTM medium parameter
 * @param {string} options.content UTM content parameter
 * @param {boolean} options.shorten Whether to create a shortened URL
 * @returns {Promise<Object>} The created URL object
 */
const generateCampaignURL = async (options) => {
  try {
    const {
      baseUrl,
      campaignId,
      source = 'marketing_automation',
      medium = 'email',
      content = '',
      shorten = true,
      ownerId,
      title = 'Marketing Campaign URL'
    } = options;

    // Construct URL with UTM parameters
    const urlObj = new URL();
    urlObj.originalUrl = baseUrl;
    urlObj.campaignId = campaignId;
    urlObj.owner = ownerId;
    urlObj.title = title;
    urlObj.created = new Date();
    urlObj.utmParams = {
      source,
      medium,
      campaign: campaignId,
      content
    };

    // Generate shortened URL if needed
    if (shorten) {
      urlObj.shortCode = await generateShortCode();
      urlObj.shortUrl = `${process.env.BASE_URL}/r/${urlObj.shortCode}`;
    }

    await urlObj.save();
    return urlObj;
  } catch (error) {
    console.error('Error generating campaign URL:', error);
    throw error;
  }
};

/**
 * Generate a unique short code for URLs
 * @returns {Promise<string>} A unique short code
 */
const generateShortCode = async () => {
  // Generate a random 6 character alphanumeric code
  const generateCode = () => {
    return crypto.randomBytes(4).toString('hex').substring(0, 6);
  };

  // Keep generating until we find a unique one
  let code = generateCode();
  let existingUrl = await URL.findOne({ shortCode: code });
  
  // If code exists, generate a new one
  while (existingUrl) {
    code = generateCode();
    existingUrl = await URL.findOne({ shortCode: code });
  }

  return code;
};

/**
 * Record a click on a tracking URL
 * @param {string} shortCode The URL's short code
 * @param {Object} clickData Data about the click
 * @returns {Promise<Object>} The created click record
 */
const recordURLClick = async (shortCode, clickData = {}) => {
  try {
    const url = await URL.findOne({ shortCode });
    
    if (!url) {
      throw new Error('URL not found');
    }

    const click = new URLClick({
      url: url._id,
      campaign: url.campaignId,
      ipAddress: clickData.ipAddress,
      userAgent: clickData.userAgent,
      referrer: clickData.referrer,
      timestamp: new Date(),
      location: clickData.location,
      device: clickData.device,
      owner: url.owner,
    });

    await click.save();
    
    // Update click count on the URL
    url.clickCount = (url.clickCount || 0) + 1;
    url.lastClicked = new Date();
    await url.save();

    return click;
  } catch (error) {
    console.error('Error recording URL click:', error);
    throw error;
  }
};

/**
 * Get campaign performance metrics based on URL clicks
 * @param {string} campaignId Campaign ID
 * @returns {Promise<Object>} Click metrics for the campaign
 */
const getCampaignURLMetrics = async (campaignId) => {
  try {
    // Get all URLs for this campaign
    const urls = await URL.find({ campaignId });
    const urlIds = urls.map(url => url._id);
    
    // Get click analytics
    const totalClicks = await URLClick.countDocuments({ 
      url: { $in: urlIds } 
    });
    
    // Get unique visitors (by IP)
    const uniqueVisitors = await URLClick.distinct('ipAddress', { 
      url: { $in: urlIds } 
    });
    
    // Get clicks by medium
    const clicksByMedium = await URLClick.aggregate([
      { $match: { url: { $in: urlIds } } },
      { $lookup: { from: 'urls', localField: 'url', foreignField: '_id', as: 'urlData' } },
      { $unwind: '$urlData' },
      { $group: {
        _id: '$urlData.utmParams.medium',
        count: { $sum: 1 }
      }},
      { $project: { medium: '$_id', count: 1, _id: 0 } }
    ]);

    // Get clicks by source
    const clicksBySource = await URLClick.aggregate([
      { $match: { url: { $in: urlIds } } },
      { $lookup: { from: 'urls', localField: 'url', foreignField: '_id', as: 'urlData' } },
      { $unwind: '$urlData' },
      { $group: {
        _id: '$urlData.utmParams.source',
        count: { $sum: 1 }
      }},
      { $project: { source: '$_id', count: 1, _id: 0 } }
    ]);

    // Get clicks by device
    const clicksByDevice = await URLClick.aggregate([
      { $match: { url: { $in: urlIds } } },
      { $group: {
        _id: '$device',
        count: { $sum: 1 }
      }},
      { $project: { device: '$_id', count: 1, _id: 0 } }
    ]);

    return {
      totalUrls: urls.length,
      totalClicks,
      uniqueVisitors: uniqueVisitors.length,
      clicksByMedium,
      clicksBySource,
      clicksByDevice,
      urls: urls.map(url => ({
        id: url._id,
        originalUrl: url.originalUrl,
        shortUrl: url.shortUrl,
        clickCount: url.clickCount || 0,
        lastClicked: url.lastClicked
      }))
    };
  } catch (error) {
    console.error('Error getting campaign URL metrics:', error);
    throw error;
  }
};

module.exports = {
  generateCampaignURL,
  recordURLClick,
  getCampaignURLMetrics,
  generateShortCode
};
