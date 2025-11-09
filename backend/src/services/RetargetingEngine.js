/**
 * RetargetingEngine Service
 * 
 * Automated retargeting campaign creation based on behavior patterns
 */
const { 
  Campaign, 
  CustomerBehavior, 
  CustomerSegment,
  TriggerRule
} = require('../models');
const segmentMatcher = require('../utils/segmentMatcher');
const campaignExecutor = require('./CampaignExecutor');
const aiOptimizer = require('./AIOptimizer');
const triggerEvaluator = require('../utils/triggerEvaluator');

class RetargetingEngine {
  constructor() {
    this.isRunning = false;
    this.processInterval = null;
    this.retargetingOpportunities = new Map();
    
    // Default retargeting settings
    this.defaultSettings = {
      minimumAudienceSize: 10,           // Minimum audience size to create a retargeting campaign
      abandonedCartThreshold: 2,         // Hours after cart abandonment to trigger retargeting
      productViewThreshold: 3,           // Number of product views to trigger interest retargeting
      websiteVisitThreshold: 2,          // Number of website visits to trigger awareness retargeting
      maximumRetargetingFrequency: 7,    // Days between retargeting campaigns for the same user
      retargetingTemplates: {            // Template IDs for different retargeting types
        abandoned_cart: 'cart_recovery_template',
        product_interest: 'product_interest_template',
        website_visit: 'website_visit_template',
        post_purchase: 'post_purchase_template'
      },
      channelPreferences: ['email', 'push', 'sms']  // Order of channel preference
    };
  }

  /**
   * Start the retargeting engine service
   * @param {Object} options Configuration options
   */
  async start(options = {}) {
    const { 
      interval = 1000 * 60 * 15,   // Default: 15 minutes
      settings = {}
    } = options;

    if (this.isRunning) {
      console.warn('Retargeting engine is already running');
      return;
    }

    // Merge provided settings with defaults
    this.settings = { ...this.defaultSettings, ...settings };
    this.isRunning = true;
    
    console.log('Starting retargeting engine service...');
    
    // Schedule recurring execution
    this.processInterval = setInterval(async () => {
      try {
        await this.detectRetargetingOpportunities();
        await this.processRetargetingOpportunities();
      } catch (error) {
        console.error('Error in retargeting engine process:', error);
      }
    }, interval);

    // Initial execution
    try {
      await this.detectRetargetingOpportunities();
      await this.processRetargetingOpportunities();
    } catch (error) {
      console.error('Error in initial retargeting execution:', error);
    }
  }

  /**
   * Stop the retargeting engine service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.processInterval);
    this.isRunning = false;
    console.log('Retargeting engine service stopped');
  }

  /**
   * Detect retargeting opportunities based on customer behavior
   */
  async detectRetargetingOpportunities() {
    try {
      console.log('Detecting retargeting opportunities...');
      
      // Find abandoned cart opportunities
      await this.detectAbandonedCarts();
      
      // Find product interest opportunities
      await this.detectProductInterest();
      
      // Find website visit opportunities
      await this.detectWebsiteVisitors();
      
      // Find post-purchase opportunities
      await this.detectPostPurchase();
      
      console.log(`Detected ${this.retargetingOpportunities.size} retargeting opportunities`);
    } catch (error) {
      console.error('Error detecting retargeting opportunities:', error);
    }
  }

  /**
   * Detect abandoned cart opportunities
   */
  async detectAbandonedCarts() {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - this.settings.abandonedCartThreshold);
      
      // Find customers who added to cart but didn't purchase
      const abandonedCartEvents = await CustomerBehavior.aggregate([
        {
          $match: {
            eventType: 'add_to_cart',
            timestamp: { $lte: cutoffTime },
            removed: false
          }
        },
        {
          $lookup: {
            from: 'customerbehaviors',
            let: { customerId: '$customerId', cartTimestamp: '$timestamp' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$customerId', '$$customerId'] },
                      { $eq: ['$eventType', 'purchase'] },
                      { $gte: ['$timestamp', '$$cartTimestamp'] }
                    ]
                  }
                }
              }
            ],
            as: 'purchases'
          }
        },
        {
          $match: {
            purchases: { $size: 0 }
          }
        },
        {
          $group: {
            _id: '$customerId',
            cartItems: { $push: '$properties.productId' },
            latestCartTime: { $max: '$timestamp' },
            owner: { $first: '$owner' }
          }
        }
      ]);
      
      // Create or update retargeting opportunities
      for (const cart of abandonedCartEvents) {
        // Check if this customer has been retargeted recently
        const canRetarget = await this.canRetargetCustomer(cart._id, 'abandoned_cart');
        
        if (canRetarget) {
          const opportunityId = `cart_${cart._id}`;
          
          this.retargetingOpportunities.set(opportunityId, {
            type: 'abandoned_cart',
            customerId: cart._id,
            products: cart.cartItems,
            timestamp: cart.latestCartTime,
            owner: cart.owner
          });
        }
      }
    } catch (error) {
      console.error('Error detecting abandoned carts:', error);
    }
  }

  /**
   * Detect product interest opportunities
   */
  async detectProductInterest() {
    try {
      // Find customers who viewed products multiple times without purchasing
      const productInterestEvents = await CustomerBehavior.aggregate([
        {
          $match: {
            eventType: 'product_view',
            timestamp: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) }, // Last 7 days
            removed: false
          }
        },
        {
          $group: {
            _id: {
              customerId: '$customerId',
              productId: '$properties.productId'
            },
            viewCount: { $sum: 1 },
            latestViewTime: { $max: '$timestamp' },
            owner: { $first: '$owner' }
          }
        },
        {
          $match: {
            viewCount: { $gte: this.settings.productViewThreshold }
          }
        },
        {
          $lookup: {
            from: 'customerbehaviors',
            let: { 
              customerId: '$_id.customerId', 
              productId: '$_id.productId' 
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$customerId', '$$customerId'] },
                      { $eq: ['$eventType', 'purchase'] },
                      { $eq: ['$properties.productId', '$$productId'] }
                    ]
                  }
                }
              }
            ],
            as: 'purchases'
          }
        },
        {
          $match: {
            purchases: { $size: 0 }
          }
        },
        {
          $group: {
            _id: '$_id.customerId',
            products: { 
              $push: { 
                productId: '$_id.productId', 
                viewCount: '$viewCount' 
              } 
            },
            latestViewTime: { $max: '$latestViewTime' },
            owner: { $first: '$owner' }
          }
        }
      ]);
      
      // Create or update retargeting opportunities
      for (const interest of productInterestEvents) {
        const canRetarget = await this.canRetargetCustomer(interest._id, 'product_interest');
        
        if (canRetarget) {
          const opportunityId = `interest_${interest._id}`;
          
          this.retargetingOpportunities.set(opportunityId, {
            type: 'product_interest',
            customerId: interest._id,
            products: interest.products,
            timestamp: interest.latestViewTime,
            owner: interest.owner
          });
        }
      }
    } catch (error) {
      console.error('Error detecting product interest:', error);
    }
  }

  /**
   * Detect website visitor opportunities
   */
  async detectWebsiteVisitors() {
    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - 7); // Last 7 days
      
      // Find customers who visited the website multiple times but didn't convert
      const websiteVisitEvents = await CustomerBehavior.aggregate([
        {
          $match: {
            eventType: 'page_view',
            timestamp: { $gte: cutoffTime },
            removed: false
          }
        },
        {
          $group: {
            _id: '$customerId',
            visitCount: { $sum: 1 },
            latestVisitTime: { $max: '$timestamp' },
            owner: { $first: '$owner' }
          }
        },
        {
          $match: {
            visitCount: { $gte: this.settings.websiteVisitThreshold }
          }
        },
        {
          $lookup: {
            from: 'customerbehaviors',
            let: { customerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$customerId', '$$customerId'] },
                      { $eq: ['$eventType', 'purchase'] },
                      { $gte: ['$timestamp', cutoffTime] }
                    ]
                  }
                }
              }
            ],
            as: 'purchases'
          }
        },
        {
          $match: {
            purchases: { $size: 0 }
          }
        }
      ]);
      
      // Create or update retargeting opportunities
      for (const visitor of websiteVisitEvents) {
        const canRetarget = await this.canRetargetCustomer(visitor._id, 'website_visit');
        
        if (canRetarget) {
          const opportunityId = `visit_${visitor._id}`;
          
          this.retargetingOpportunities.set(opportunityId, {
            type: 'website_visit',
            customerId: visitor._id,
            visitCount: visitor.visitCount,
            timestamp: visitor.latestVisitTime,
            owner: visitor.owner
          });
        }
      }
    } catch (error) {
      console.error('Error detecting website visitors:', error);
    }
  }

  /**
   * Detect post-purchase opportunities
   */
  async detectPostPurchase() {
    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - 3); // Purchases from 3-7 days ago
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 7);
      
      // Find customers who made a purchase but haven't returned
      const postPurchaseEvents = await CustomerBehavior.aggregate([
        {
          $match: {
            eventType: 'purchase',
            timestamp: { $gte: startTime, $lte: cutoffTime },
            removed: false
          }
        },
        {
          $lookup: {
            from: 'customerbehaviors',
            let: { customerId: '$customerId', purchaseTime: '$timestamp' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$customerId', '$$customerId'] },
                      { $gt: ['$timestamp', '$$purchaseTime'] }
                    ]
                  }
                }
              }
            ],
            as: 'laterEvents'
          }
        },
        {
          $match: {
            laterEvents: { $size: 0 }
          }
        },
        {
          $group: {
            _id: '$customerId',
            purchases: { $push: '$properties' },
            purchaseTime: { $max: '$timestamp' },
            owner: { $first: '$owner' }
          }
        }
      ]);
      
      // Create or update retargeting opportunities
      for (const purchase of postPurchaseEvents) {
        const canRetarget = await this.canRetargetCustomer(purchase._id, 'post_purchase');
        
        if (canRetarget) {
          const opportunityId = `purchase_${purchase._id}`;
          
          this.retargetingOpportunities.set(opportunityId, {
            type: 'post_purchase',
            customerId: purchase._id,
            purchases: purchase.purchases,
            timestamp: purchase.purchaseTime,
            owner: purchase.owner
          });
        }
      }
    } catch (error) {
      console.error('Error detecting post-purchase opportunities:', error);
    }
  }

  /**
   * Check if a customer can be retargeted
   * @param {string} customerId Customer ID
   * @param {string} retargetingType Type of retargeting
   * @returns {Promise<boolean>} Whether customer can be retargeted
   */
  async canRetargetCustomer(customerId, retargetingType) {
    try {
      // Check if customer exists
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return false;
      }

      // Check if customer has opted out of marketing
      if (customer.marketingPreferences?.optOut) {
        return false;
      }

      // Check if customer was recently retargeted
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - this.settings.maximumRetargetingFrequency);
      
      const recentCampaigns = await Campaign.countDocuments({
        type: 'retargeting',
        'targetSegments.criteria.customerId': customerId,
        'targetSegments.criteria.retargetingType': retargetingType,
        startDate: { $gte: cutoffTime },
        removed: false
      });
      
      return recentCampaigns === 0;
    } catch (error) {
      console.error(`Error checking if customer ${customerId} can be retargeted:`, error);
      return false;
    }
  }

  /**
   * Process retargeting opportunities
   */
  async processRetargetingOpportunities() {
    try {
      console.log(`Processing ${this.retargetingOpportunities.size} retargeting opportunities...`);
      
      // Group opportunities by type and owner
      const groupedOpportunities = this.groupOpportunities();
      
      // Process each group
      for (const [key, group] of Object.entries(groupedOpportunities)) {
        const [owner, type] = key.split('_');
        
        if (group.customerIds.length >= this.settings.minimumAudienceSize) {
          await this.createRetargetingCampaign(type, group.customerIds, owner, group.data);
        } else {
          console.log(`Skipping ${type} campaign for ${owner}: audience size ${group.customerIds.length} below threshold ${this.settings.minimumAudienceSize}`);
        }
      }
      
      // Clear processed opportunities
      this.retargetingOpportunities.clear();
    } catch (error) {
      console.error('Error processing retargeting opportunities:', error);
    }
  }

  /**
   * Group retargeting opportunities by type and owner
   * @returns {Object} Grouped opportunities
   */
  groupOpportunities() {
    const groups = {};
    
    for (const opportunity of this.retargetingOpportunities.values()) {
      const key = `${opportunity.owner}_${opportunity.type}`;
      
      if (!groups[key]) {
        groups[key] = {
          customerIds: [],
          data: {}
        };
      }
      
      groups[key].customerIds.push(opportunity.customerId);
      
      // Store additional data based on opportunity type
      switch (opportunity.type) {
        case 'abandoned_cart':
          if (!groups[key].data.products) groups[key].data.products = [];
          groups[key].data.products = [...groups[key].data.products, ...opportunity.products];
          break;
        case 'product_interest':
          if (!groups[key].data.products) groups[key].data.products = [];
          groups[key].data.products = [...groups[key].data.products, ...opportunity.products.map(p => p.productId)];
          break;
        case 'website_visit':
          if (!groups[key].data.visitCounts) groups[key].data.visitCounts = [];
          groups[key].data.visitCounts.push(opportunity.visitCount);
          break;
        case 'post_purchase':
          if (!groups[key].data.purchases) groups[key].data.purchases = [];
          groups[key].data.purchases = [...groups[key].data.purchases, ...opportunity.purchases];
          break;
      }
    }
    
    return groups;
  }

  /**
   * Create a retargeting campaign
   * @param {string} retargetingType Type of retargeting
   * @param {Array} customerIds Customer IDs to target
   * @param {string} ownerId Owner ID
   * @param {Object} additionalData Additional data for campaign
   * @returns {Promise<Object>} Created campaign
   */
  async createRetargetingCampaign(retargetingType, customerIds, ownerId, additionalData) {
    try {
      // Create or get retargeting segment
      const segmentName = `Retargeting - ${this.getRetargetingName(retargetingType)}`;
      const segment = await this.createOrUpdateSegment(segmentName, customerIds, retargetingType, ownerId);
      
      // Get template ID for this retargeting type
      const templateId = this.settings.retargetingTemplates[retargetingType];
      if (!templateId) {
        throw new Error(`No template defined for retargeting type: ${retargetingType}`);
      }
      
      // Determine best channel for this audience
      const channel = await this.determineBestChannel(customerIds);
      
      // Create campaign
      const campaign = new Campaign({
        name: `${this.getRetargetingName(retargetingType)} Retargeting - ${new Date().toLocaleDateString()}`,
        description: `Automatically generated ${retargetingType} retargeting campaign`,
        type: 'retargeting',
        status: 'draft',
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days duration
        targetSegments: [segment._id],
        content: {
          template: templateId,
          templateVariables: this.generateTemplateVariables(retargetingType, additionalData)
        },
        channels: [{
          type: channel,
          enabled: true,
          deliveryOrder: 0
        }],
        aiOptimization: {
          enabled: true,
          optimizeFor: 'clicks',
          testingPercent: 15
        },
        tracking: {
          utmSource: 'retargeting',
          utmMedium: channel,
          utmCampaign: retargetingType,
          googleAnalytics: {
            enabled: true
          }
        },
        owner: ownerId,
        created: new Date(),
        updated: new Date(),
        metadata: {
          isAutomated: true,
          retargetingType,
          customerCount: customerIds.length
        }
      });
      
      await campaign.save();
      
      // Generate variants for A/B testing
      await aiOptimizer.generateVariants(campaign._id);
      
      console.log(`Created retargeting campaign ${campaign._id} for ${retargetingType} targeting ${customerIds.length} customers`);
      
      return campaign;
    } catch (error) {
      console.error(`Error creating retargeting campaign for ${retargetingType}:`, error);
      throw error;
    }
  }

  /**
   * Create or update segment for retargeting
   * @param {string} name Segment name
   * @param {Array} customerIds Customer IDs
   * @param {string} retargetingType Type of retargeting
   * @param {string} ownerId Owner ID
   * @returns {Promise<Object>} Created/updated segment
   */
  async createOrUpdateSegment(name, customerIds, retargetingType, ownerId) {
    try {
      // Check if segment already exists
      let segment = await CustomerSegment.findOne({
        name,
        owner: ownerId,
        'metadata.retargetingType': retargetingType,
        removed: false
      });
      
      if (segment) {
        // Update existing segment
        segment.criteria = {
          customerId: { $in: customerIds },
          retargetingType
        };
        segment.updated = new Date();
        
        await segment.save();
      } else {
        // Create new segment
        segment = new CustomerSegment({
          name,
          description: `Automatically created segment for ${retargetingType} retargeting`,
          criteria: {
            customerId: { $in: customerIds },
            retargetingType
          },
          type: 'automated',
          owner: ownerId,
          created: new Date(),
          updated: new Date(),
          metadata: {
            isAutomated: true,
            retargetingType
          }
        });
        
        await segment.save();
      }
      
      return segment;
    } catch (error) {
      console.error(`Error creating/updating segment for ${retargetingType}:`, error);
      throw error;
    }
  }

  /**
   * Determine best channel for audience
   * @param {Array} customerIds Customer IDs
   * @returns {Promise<string>} Best channel
   */
  async determineBestChannel(customerIds) {
    try {
      // Get customer preferences and behavior data
      const customers = await Customer.find({ _id: { $in: customerIds } });
      
      const channelCounts = {
        email: 0,
        sms: 0,
        push: 0
      };
      
      // Count available channels
      customers.forEach(customer => {
        if (customer.email) channelCounts.email++;
        if (customer.phone) channelCounts.sms++;
        if (customer.pushTokens && customer.pushTokens.length > 0) channelCounts.push++;
      });
      
      // Get channel with highest coverage
      let bestChannel = 'email';  // Default
      let bestCount = 0;
      
      for (const channel of this.settings.channelPreferences) {
        if (channelCounts[channel] > bestCount) {
          bestCount = channelCounts[channel];
          bestChannel = channel;
        }
      }
      
      return bestChannel;
    } catch (error) {
      console.error('Error determining best channel:', error);
      return 'email';  // Default to email on error
    }
  }

  /**
   * Generate template variables based on retargeting type
   * @param {string} retargetingType Type of retargeting
   * @param {Object} data Additional data for templates
   * @returns {Object} Template variables
   */
  generateTemplateVariables(retargetingType, data = {}) {
    const variables = {
      retargetingType,
      currentDate: new Date().toLocaleDateString()
    };
    
    switch (retargetingType) {
      case 'abandoned_cart':
        variables.products = this.getUniqueProducts(data.products || []).slice(0, 3);
        variables.discountCode = this.generateDiscountCode('CART');
        break;
        
      case 'product_interest':
        variables.products = this.getUniqueProducts(data.products || []).slice(0, 5);
        variables.recommendedProducts = this.getRecommendedProducts(variables.products);
        break;
        
      case 'website_visit':
        variables.averageVisits = data.visitCounts ? 
          Math.round(data.visitCounts.reduce((sum, count) => sum + count, 0) / data.visitCounts.length) : 
          2;
        variables.featuredProducts = this.getFeaturedProducts(5);
        variables.discountCode = this.generateDiscountCode('WELCOME');
        break;
        
      case 'post_purchase':
        variables.purchases = data.purchases || [];
        variables.recommendedProducts = this.getRecommendedProducts(
          variables.purchases.map(p => p.productId)
        );
        break;
    }
    
    return variables;
  }

  /**
   * Get unique products from list
   * @param {Array} productIds Product IDs with potential duplicates
   * @returns {Array} Unique product IDs
   */
  getUniqueProducts(productIds) {
    return [...new Set(productIds)];
  }

  /**
   * Get recommended products based on viewed products
   * @param {Array} productIds Product IDs
   * @returns {Array} Recommended product IDs
   */
  getRecommendedProducts(productIds) {
    // In a real implementation, this would use recommendation engine
    // For this example, return some dummy product IDs
    return ['rec_product_1', 'rec_product_2', 'rec_product_3'];
  }

  /**
   * Get featured products
   * @param {number} count Number of products to return
   * @returns {Array} Featured product IDs
   */
  getFeaturedProducts(count = 3) {
    // In a real implementation, this would fetch actual featured products
    // For this example, return dummy product IDs
    return Array.from({ length: count }, (_, i) => `featured_product_${i + 1}`);
  }

  /**
   * Generate a discount code
   * @param {string} prefix Code prefix
   * @returns {string} Generated discount code
   */
  generateDiscountCode(prefix) {
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${randomPart}`;
  }

  /**
   * Get retargeting name for type
   * @param {string} retargetingType Type of retargeting
   * @returns {string} Human-readable name
   */
  getRetargetingName(retargetingType) {
    const names = {
      abandoned_cart: 'Cart Recovery',
      product_interest: 'Product Interest',
      website_visit: 'Website Visit',
      post_purchase: 'Post-Purchase'
    };
    
    return names[retargetingType] || 'Retargeting';
  }
}

module.exports = new RetargetingEngine();
