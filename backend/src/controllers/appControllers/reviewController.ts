// @ts-nocheck

import { notificationService } from '../../services/notificationService';
import { sentimentAnalysisService } from '../../services/sentimentAnalysisService';
import Review from '../../models/appModels/Review';
import Business from '../../models/appModels/Business';
/**
 * Create a new review
 * Can be used for both internal creation and public submission
 */
const create = async (req, res) => {
  try {
    const { 
      rating, 
      comment, 
      clientName, 
      clientEmail, 
      clientPhone, 
      businessId, 
      platform = 'direct', 
      source = 'review_link' 
    } = req.body;

    // Validate required fields
    if (!rating || !comment || !clientName || !businessId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        result: null
      });
    }

    // Get business
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null
      });
    }

    // Analyze sentiment
    const sentimentData = await sentimentAnalysisService.analyzeReviewSentiment(comment, rating);

    // Create review
    const review = new Review({
      rating,
      comment,
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone
      },
      business: businessId,
      platform,
      source,
      sentiment: sentimentData,
      status: 'new',
      submittedAt: new Date()
    });

    await review.save();

    // Send notifications
    const owner = business.owner;
    
    // Always send an in-app notification
    await notificationService.sendReviewSubmissionNotification(review, owner);

    // If negative review (rating < 3), send urgent notification
    if (rating < 3) {
      await notificationService.sendNegativeReviewNotification(review, owner);
    }

    // Send thank you notification to client if email provided
    if (clientEmail) {
      await notificationService.sendReviewThankYouNotification(review, clientEmail);
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      result: review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

/**
 * Get a specific review
 */
const read = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const review = await Review.findOne({ 
      _id: id,
      owner: ownerId
    }).populate('business');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        result: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review retrieved successfully',
      result: review
    });
  } catch (error) {
    console.error('Review retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review',
      error: error.message
    });
  }
};

/**
 * Update a review
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const { status, flags, notes } = req.body;

    const review = await Review.findOne({ 
      _id: id,
      owner: ownerId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        result: null
      });
    }

    // Update allowed fields
    if (status) review.status = status;
    if (flags) review.flags = flags;
    if (notes) review.notes = notes;

    review.updatedAt = new Date();
    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      result: review
    });
  } catch (error) {
    console.error('Review update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

/**
 * Delete a review (soft delete)
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const review = await Review.findOne({ 
      _id: id,
      owner: ownerId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        result: null
      });
    }

    review.removed = true;
    review.removedAt = new Date();
    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      result: null
    });
  } catch (error) {
    console.error('Review deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

/**
 * List reviews with filtering and pagination
 */
const list = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      page = 1,
      limit = 20,
      businessId,
      status,
      platform,
      minRating,
      maxRating,
      startDate,
      endDate,
      search,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { 
      owner: ownerId,
      removed: false
    };

    if (businessId) filter.business = businessId;
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = Number(minRating);
      if (maxRating) filter.rating.$lte = Number(maxRating);
    }

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { 'client.name': { $regex: search, $options: 'i' } },
        { 'client.email': { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    // Set up pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('business')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      result: {
        data: reviews,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Review listing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews',
      error: error.message
    });
  }
};

/**
 * Search reviews with text search
 */
const search = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        result: null
      });
    }

    const filter = {
      owner: ownerId,
      removed: false,
      $text: { $search: query }
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('business')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      result: {
        data: reviews,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Review search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search reviews',
      error: error.message
    });
  }
};

/**
 * Get review statistics
 */
const getStats = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { businessId, days = 30 } = req.query;

    const filter = { 
      owner: ownerId,
      removed: false
    };

    if (businessId) filter.business = businessId;

    // Add date filter for last X days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    filter.submittedAt = { $gte: startDate };

    const stats = await Review.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingCounts: {
            $push: { rating: '$rating' }
          },
          positiveSentiment: { 
            $sum: { 
              $cond: [
                { $eq: ['$sentiment.label', 'positive'] }, 
                1, 
                0
              ] 
            } 
          },
          neutralSentiment: { 
            $sum: { 
              $cond: [
                { $eq: ['$sentiment.label', 'neutral'] }, 
                1, 
                0
              ] 
            } 
          },
          negativeSentiment: { 
            $sum: { 
              $cond: [
                { $eq: ['$sentiment.label', 'negative'] }, 
                1, 
                0
              ] 
            } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          averageRating: { $round: ['$averageRating', 1] },
          ratingDistribution: {
            1: { 
              $size: {
                $filter: {
                  input: '$ratingCounts',
                  as: 'item',
                  cond: { $eq: ['$$item.rating', 1] }
                }
              }
            },
            2: { 
              $size: {
                $filter: {
                  input: '$ratingCounts',
                  as: 'item',
                  cond: { $eq: ['$$item.rating', 2] }
                }
              }
            },
            3: { 
              $size: {
                $filter: {
                  input: '$ratingCounts',
                  as: 'item',
                  cond: { $eq: ['$$item.rating', 3] }
                }
              }
            },
            4: { 
              $size: {
                $filter: {
                  input: '$ratingCounts',
                  as: 'item',
                  cond: { $eq: ['$$item.rating', 4] }
                }
              }
            },
            5: { 
              $size: {
                $filter: {
                  input: '$ratingCounts',
                  as: 'item',
                  cond: { $eq: ['$$item.rating', 5] }
                }
              }
            }
          },
          sentimentDistribution: {
            positive: '$positiveSentiment',
            neutral: '$neutralSentiment',
            negative: '$negativeSentiment'
          }
        }
      }
    ]);

    // Get platform distribution
    const platformStats = await Review.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          platform: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          _id: 0
        }
      }
    ]);

    // Get recent reviews
    const recentReviews = await Review.find(filter)
      .populate('business')
      .sort({ submittedAt: -1 })
      .limit(5);

    const result = {
      summary: stats[0] || {
        total: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 }
      },
      platforms: platformStats,
      recentReviews,
      period: `${days} days`
    };

    return res.status(200).json({
      success: true,
      message: 'Review statistics retrieved successfully',
      result
    });
  } catch (error) {
    console.error('Review stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review statistics',
      error: error.message
    });
  }
};

export = {
  create,
  read,
  update,
  delete: remove,
  list,
  search,
  getStats
};
