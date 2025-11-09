const ReviewLink = require('../../models/appModels/ReviewLink');
const Business = require('../../models/appModels/Business');
const Review = require('../../models/appModels/Review');
const { sentimentAnalysisService } = require('../../services/sentimentAnalysisService');
const { notificationService } = require('../../services/notificationService');
const path = require('path');
const fs = require('fs');

/**
 * Get review portal configuration
 */
const getPortalConfig = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find the review link
    const reviewLink = await ReviewLink.findOne({
      linkCode: code,
      isActive: true,
      removed: false
    }).populate('business');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found or inactive',
        result: null
      });
    }

    // Check if link is expired
    if (reviewLink.expiresAt && new Date(reviewLink.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'This review link has expired',
        result: null
      });
    }

    // Track this visit
    const visit = {
      date: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      deviceType: detectDeviceType(req.headers['user-agent'] || ''),
      referrer: req.headers.referer || 'direct'
    };

    reviewLink.visitData.push(visit);
    reviewLink.visitCount = (reviewLink.visitCount || 0) + 1;
    reviewLink.lastVisitedAt = new Date();
    await reviewLink.save();

    // Get business branding settings
    const business = reviewLink.business;
    const customBranding = reviewLink.customBranding || {};
    const businessBranding = business.branding || {};

    // Prepare portal configuration
    const portalConfig = {
      business: {
        name: business.name,
        description: business.description,
        logo: business.logo || null
      },
      branding: {
        // Use custom branding from link if available, otherwise fall back to business branding
        title: customBranding.title || businessBranding.portalTitle || `Leave a review for ${business.name}`,
        description: customBranding.description || businessBranding.portalDescription || `We value your feedback!`,
        logo: customBranding.logoUrl || business.logo,
        colors: {
          primary: customBranding.primaryColor || businessBranding.primaryColor || '#3498db',
          background: customBranding.backgroundColor || businessBranding.backgroundColor || '#ffffff',
          text: customBranding.textColor || businessBranding.textColor || '#333333'
        },
        font: customBranding.fontFamily || businessBranding.fontFamily || 'Arial, sans-serif',
        customCss: businessBranding.customCss || null
      },
      form: {
        // Form field requirements
        requiredFields: customBranding.requiredFields || businessBranding.requiredFields || ['name', 'rating', 'comment'],
        optionalFields: customBranding.optionalFields || businessBranding.optionalFields || ['email', 'phone'],
        hiddenFields: customBranding.hiddenFields || businessBranding.hiddenFields || [],
        ratingLabels: customBranding.ratingLabels || businessBranding.ratingLabels || [
          "Very Poor", "Poor", "Average", "Good", "Excellent"
        ],
        submitButtonText: customBranding.submitButtonText || businessBranding.submitButtonText || "Submit Review"
      },
      thankYouPage: {
        title: customBranding.thankYouTitle || businessBranding.thankYouTitle || "Thank You!",
        message: customBranding.thankYouMessage || businessBranding.thankYouMessage || 
                 `Thank you for your feedback! Your review is valuable to us.`,
        redirectUrl: customBranding.redirectUrl || businessBranding.redirectUrl || null,
        redirectDelay: customBranding.redirectDelay || businessBranding.redirectDelay || 3 // seconds
      },
      social: {
        showSocialProof: customBranding.showSocialProof || businessBranding.showSocialProof || false,
        reviewCount: business.reviewStats?.count || 0,
        averageRating: business.reviewStats?.averageRating || 0
      },
      linkCode: reviewLink.linkCode,
      requestMode: reviewLink.requestMethod || 'direct'
    };

    // Return portal configuration
    return res.status(200).json({
      success: true,
      message: 'Portal configuration retrieved successfully',
      result: portalConfig
    });
  } catch (error) {
    console.error('Portal configuration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve portal configuration',
      error: error.message
    });
  }
};

/**
 * Submit a review through the portal
 */
const submitReview = async (req, res) => {
  try {
    const { code } = req.params;
    const {
      rating,
      comment,
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      title
    } = req.body;

    // Find the review link
    const reviewLink = await ReviewLink.findOne({
      linkCode: code,
      isActive: true,
      removed: false
    }).populate('business');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found or inactive',
        result: null
      });
    }

    // Check if link is expired
    if (reviewLink.expiresAt && new Date(reviewLink.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'This review link has expired',
        result: null
      });
    }

    // Validate required fields
    if (!rating || !clientName) {
      return res.status(400).json({
        success: false,
        message: 'Rating and name are required',
        result: null
      });
    }

    // Get business
    const business = reviewLink.business;

    // Analyze sentiment if comment exists
    let sentimentData = { label: 'neutral', score: 0.5 };
    if (comment) {
      sentimentData = await sentimentAnalysisService.analyzeReviewSentiment(comment, rating);
    }

    // Create review
    const review = new Review({
      rating,
      comment: comment || '',
      title: title || '',
      client: {
        name: clientName,
        email: clientEmail || '',
        phone: clientPhone || ''
      },
      business: business._id,
      owner: business.owner,
      platform: reviewLink.requestMethod || 'direct',
      source: 'review_link',
      reviewLink: reviewLink._id,
      sentiment: sentimentData,
      status: 'new',
      submittedAt: new Date(),
      submissionData: {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        referrer: req.headers.referer || 'direct'
      }
    });

    await review.save();

    // Track this conversion in the review link
    const conversion = {
      date: new Date(),
      reviewId: review._id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      referrer: req.headers.referer || 'direct'
    };

    reviewLink.conversions.push(conversion);
    reviewLink.conversionCount = (reviewLink.conversionCount || 0) + 1;
    reviewLink.lastConversionAt = new Date();
    await reviewLink.save();

    // Send notifications
    const owner = business.owner;
    
    // Send in-app notification
    await notificationService.sendReviewSubmissionNotification(review, owner);

    // If negative review (rating < 3), send urgent notification
    if (rating < 3) {
      await notificationService.sendNegativeReviewNotification(review, owner);
    }

    // Send thank you notification to client if email provided
    if (clientEmail) {
      await notificationService.sendReviewThankYouNotification(review, clientEmail);
    }

    // Return success with thank you page details
    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      result: {
        reviewId: review._id,
        thankYouPage: {
          title: reviewLink.customBranding?.thankYouTitle || business.branding?.thankYouTitle || "Thank You!",
          message: reviewLink.customBranding?.thankYouMessage || business.branding?.thankYouMessage || 
                   `Thank you for your feedback! Your review is valuable to us.`,
          redirectUrl: reviewLink.customBranding?.redirectUrl || business.branding?.redirectUrl || null,
          redirectDelay: reviewLink.customBranding?.redirectDelay || business.branding?.redirectDelay || 3 // seconds
        }
      }
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

/**
 * Get recent reviews for social proof
 */
const getRecentReviews = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find the review link
    const reviewLink = await ReviewLink.findOne({
      linkCode: code,
      isActive: true,
      removed: false
    }).populate('business');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found or inactive',
        result: null
      });
    }

    const business = reviewLink.business;
    const businessId = business._id;
    const ownerId = business.owner;

    // Get approved, non-negative reviews
    const reviews = await Review.find({
      business: businessId,
      owner: ownerId,
      status: 'approved',
      rating: { $gte: 3 },
      removed: false
    })
    .select('rating client.name comment submittedAt')
    .sort({ submittedAt: -1 })
    .limit(5);

    // Format reviews for public consumption
    const formattedReviews = reviews.map(review => ({
      name: review.client.name,
      rating: review.rating,
      comment: review.comment,
      date: review.submittedAt
    }));

    // Get business stats
    const stats = await Review.aggregate([
      { 
        $match: { 
          business: businessId, 
          removed: false,
          status: 'approved'
        } 
      },
      { 
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          _id: 0,
          count: 1,
          averageRating: { $round: ['$averageRating', 1] }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Recent reviews retrieved successfully',
      result: {
        reviews: formattedReviews,
        stats: stats[0] || { count: 0, averageRating: 0 }
      }
    });
  } catch (error) {
    console.error('Recent reviews retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent reviews',
      error: error.message
    });
  }
};

/**
 * Serve the review portal HTML
 */
const servePortalPage = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Validate the review link exists
    const reviewLink = await ReviewLink.findOne({
      linkCode: code,
      isActive: true,
      removed: false
    });

    if (!reviewLink) {
      return res.status(404).send('Review link not found or inactive');
    }

    // Check if link is expired
    if (reviewLink.expiresAt && new Date(reviewLink.expiresAt) < new Date()) {
      return res.status(403).send('This review link has expired');
    }

    // Serve the portal HTML page
    const portalPath = path.join(__dirname, '../../../public/review-portal/portal.html');
    
    // Check if the file exists
    if (!fs.existsSync(portalPath)) {
      return res.status(404).send('Portal page not found');
    }

    // Track this visit
    reviewLink.visitCount = (reviewLink.visitCount || 0) + 1;
    reviewLink.lastVisitedAt = new Date();
    const visit = {
      date: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      deviceType: detectDeviceType(req.headers['user-agent'] || ''),
      referrer: req.headers.referer || 'direct'
    };
    reviewLink.visitData.push(visit);
    await reviewLink.save();

    // Read the HTML file
    fs.readFile(portalPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading portal HTML:', err);
        return res.status(500).send('Error loading review portal');
      }

      // Return the HTML with the review code injected
      const html = data.replace('{{REVIEW_CODE}}', code);
      res.set('Content-Type', 'text/html');
      res.send(html);
    });
  } catch (error) {
    console.error('Portal page error:', error);
    res.status(500).send('Error loading review portal');
  }
};

/**
 * Helper function to detect device type from user agent
 */
function detectDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/smart[-_\s]?tv|hbbtv|appletv|roku|tvos/i.test(userAgent)) return 'tv';
  return 'desktop';
}

module.exports = {
  getPortalConfig,
  submitReview,
  getRecentReviews,
  servePortalPage
};
