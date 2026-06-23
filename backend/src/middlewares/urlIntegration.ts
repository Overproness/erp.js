// @ts-nocheck
import { URL, Campaign, URLClick } from '../models';
import marketingURLHelper from '../utils/marketingURLHelper';
/**
 * URL Integration Middleware
 * 
 * Integrates marketing campaigns with existing URL system
 */

/**
 * Process campaign tracking parameters
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next
 */
const processCampaignUrl = async (req, res, next) => {
  try {
    // Process for URL shortener redirect endpoint
    const shortCode = req.params.shortCode;
    if (!shortCode) {
      return next();
    }
    
    // Look up URL by short code
    const url = await URL.findOne({ shortCode });
    
    if (!url) {
      return next();
    }
    
    // Extract campaign ID if it exists
    const campaignId = url.metadata?.campaignId || 
                      url.utmParameters?.campaign || 
                      req.query.utm_campaign;
    
    if (campaignId) {
      // If this is a campaign URL, update stats
      try {
        const campaign = await Campaign.findById(campaignId);
        if (campaign) {
          // Record URL click
          const clickData = {
            url: url._id,
            campaign: campaignId,
            visitor: {
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              referrer: req.headers.referer || req.headers.referrer,
            },
            parameters: {
              ...req.query,
              originalParams: url.utmParameters
            },
            owner: campaign.owner
          };

          // Record click asynchronously - don't block response
          URLClick.create(clickData)
            .then(click => {
              // Update campaign click metrics
              return Campaign.findByIdAndUpdate(
                campaignId, 
                { $inc: { 'metrics.clicked': 1 } },
                { new: true }
              );
            })
            .catch(err => {
              console.error('Error recording campaign URL click:', err);
            });
        }
      } catch (error) {
        console.error('Error updating campaign click stats:', error);
        // Continue with redirect even if tracking fails
      }
    }
    
    // Store URL information for redirect handler
    req.resolvedUrl = url;
    next();
  } catch (error) {
    console.error('Error processing campaign URL:', error);
    next(); // Continue to regular URL handler
  }
};

/**
 * Middleware to attach campaign parameters to generated URLs
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next
 */
const attachCampaignParameters = async (req, res, next) => {
  try {
    // Only process for URL creation endpoints
    if (!req.body.url) {
      return next();
    }
    
    // Check if this is a campaign URL creation request
    const campaignId = req.body.campaignId || req.query.campaignId;
    if (!campaignId) {
      return next();
    }
    
    // Find campaign to get tracking parameters
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return next();
    }
    
    // Add campaign parameters to URL creation request
    req.body.metadata = req.body.metadata || {};
    req.body.metadata.campaignId = campaignId;
    
    // Add UTM parameters from campaign
    req.body.utmParameters = {
      source: campaign.tracking?.utmSource || 'campaign',
      medium: campaign.tracking?.utmMedium || req.body.utmParameters?.medium || 'email',
      campaign: campaignId,
      content: req.body.utmParameters?.content || req.body.alias || '',
      term: campaign.tracking?.utmTerm || req.body.utmParameters?.term || '',
    };
    
    next();
  } catch (error) {
    console.error('Error attaching campaign parameters:', error);
    next(); // Continue with URL creation even if campaign attachment fails
  }
};

/**
 * Process URL click tracking from campaign
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express next function
 */
const trackCampaignUrlClick = async (req, res, next) => {
  // Extract URL ID and campaign ID
  const { urlId } = req.params;
  const campaignId = req.query.campaignId || req.body.campaignId;
  
  if (!urlId || !campaignId) {
    return next();
  }
  
  try {
    // Find URL and campaign
    const [url, campaign] = await Promise.all([
      URL.findById(urlId),
      Campaign.findById(campaignId)
    ]);
    
    if (!url || !campaign) {
      return res.status(404).json({
        success: false,
        message: 'URL or campaign not found'
      });
    }
    
    // Record click
    const clickData = {
      url: urlId,
      campaign: campaignId,
      visitor: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer || req.headers.referrer,
        customerId: req.body.customerId || null
      },
      parameters: req.query,
      owner: campaign.owner
    };
    
    const click = await URLClick.create(clickData);
    
    // Update campaign click metrics
    await Campaign.findByIdAndUpdate(
      campaignId, 
      { 
        $inc: { 'metrics.clicked': 1 },
        $set: { 'metrics.lastUpdated': new Date() }
      }
    );
    
    // Return click information
    return res.status(200).json({
      success: true,
      result: {
        clickId: click._id,
        timestamp: click.timestamp
      },
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking campaign URL click:', error);
    return res.status(500).json({
      success: false,
      message: 'Error tracking click'
    });
  }
};

/**
 * Generate campaign URLs in bulk
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
const generateCampaignUrls = async (req, res) => {
  try {
    const { campaignId, baseUrls, medium = 'email' } = req.body;
    
    if (!campaignId || !baseUrls || !Array.isArray(baseUrls)) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID and array of base URLs are required'
      });
    }
    
    // Find campaign
    const campaign = await Campaign.findOne({
      _id: campaignId,
      owner: req.admin._id,
      removed: false
    });
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Generate URLs for each base URL
    const urlPromises = baseUrls.map(baseUrl => {
      return marketingURLHelper.generateCampaignURL({
        baseUrl: baseUrl.url,
        campaignId,
        source: campaign.tracking?.utmSource || 'campaign',
        medium,
        content: baseUrl.content || '',
        shorten: true,
        ownerId: req.admin._id,
        title: baseUrl.title || `${campaign.name} - ${medium}`
      });
    });
    
    const generatedUrls = await Promise.all(urlPromises);
    
    return res.status(200).json({
      success: true,
      result: generatedUrls,
      message: `Generated ${generatedUrls.length} campaign URLs`
    });
  } catch (error) {
    console.error('Error generating campaign URLs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating campaign URLs',
      error: error.message
    });
  }
};

export = {
  processCampaignUrl,
  attachCampaignParameters,
  trackCampaignUrlClick,
  generateCampaignUrls
};
