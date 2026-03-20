// @ts-nocheck
const SocialMention = require('@/models/appModels/SocialMention');
const { facebookService } = require('@/services/facebookService');
const { instagramService } = require('@/services/instagramService');
const { twitterService } = require('@/services/twitterService');

// Get all mentions
const getMentions = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      page = 1,
      limit = 20,
      platform,
      sentiment,
      status,
      priority,
      startDate,
      endDate,
      search,
      keywords,
    } = req.query;

    // Build filter
    const filter = { owner: ownerId, removed: false };

    if (platform) filter.platform = platform;
    if (sentiment) filter['sentiment.label'] = sentiment;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (startDate || endDate) {
      filter.publishedAt = {};
      if (startDate) filter.publishedAt.$gte = new Date(startDate);
      if (endDate) filter.publishedAt.$lte = new Date(endDate);
    }

    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim());
      filter.keywords = { $in: keywordArray };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [mentions, total] = await Promise.all([
      SocialMention.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SocialMention.countDocuments(filter)
    ]);

    // Get summary statistics
    const stats = await SocialMention.aggregate([
      { $match: { owner: ownerId, removed: false } },
      {
        $group: {
          _id: null,
          totalMentions: { $sum: 1 },
          newMentions: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          positiveMentions: {
            $sum: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] }
          },
          negativeMentions: {
            $sum: { $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0] }
          },
          avgInfluenceScore: { $avg: '$influence.influenceScore' },
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      result: {
        items: mentions,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        statistics: stats[0] || {
          totalMentions: 0,
          newMentions: 0,
          positiveMentions: 0,
          negativeMentions: 0,
          avgInfluenceScore: 0,
        },
      },
      message: 'Mentions retrieved successfully',
    });

  } catch (error) {
    console.error('Get Mentions Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve mentions',
      error: error.message,
    });
  }
};

// Get single mention
const getMention = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const mention = await SocialMention.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!mention) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Mention not found',
      });
    }

    // Mark as viewed if it was new
    if (mention.status === 'new') {
      mention.status = 'viewed';
      await mention.save();
    }

    return res.status(200).json({
      success: true,
      result: mention,
      message: 'Mention retrieved successfully',
    });

  } catch (error) {
    console.error('Get Mention Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve mention',
      error: error.message,
    });
  }
};

// Update mention (assign, change status, add tags)
const updateMention = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const { status, assignedTo, priority, tags, notes } = req.body;

    const mention = await SocialMention.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!mention) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Mention not found',
      });
    }

    // Update fields
    if (status) mention.status = status;
    if (assignedTo) mention.assignedTo = assignedTo;
    if (priority) mention.priority = priority;
    if (tags) mention.tags = tags;
    if (notes) mention.notes = notes;

    await mention.save();

    return res.status(200).json({
      success: true,
      result: mention,
      message: 'Mention updated successfully',
    });

  } catch (error) {
    console.error('Update Mention Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to update mention',
      error: error.message,
    });
  }
};

// Reply to mention
const replyToMention = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const { responseText, platformAccountId } = req.body;

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Response text is required',
      });
    }

    const mention = await SocialMention.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!mention) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Mention not found',
      });
    }

    try {
      let replyResult;

      // Reply on the appropriate platform
      switch (mention.platform) {
        case 'facebook':
          replyResult = await facebookService.replyToPost(
            platformAccountId,
            mention.platformPostId,
            responseText
          );
          break;

        case 'instagram':
          replyResult = await instagramService.replyToPost(
            platformAccountId,
            mention.platformPostId,
            responseText
          );
          break;

        case 'twitter':
          replyResult = await twitterService.replyToTweet(
            platformAccountId,
            mention.platformPostId,
            responseText
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            result: null,
            message: 'Platform not supported for replies',
          });
      }

      // Update mention with reply information
      await mention.markAsReplied(responseText, ownerId);

      mention.response.responseUrl = replyResult.responseUrl;
      await mention.save();

      return res.status(200).json({
        success: true,
        result: {
          mention,
          replyResult,
        },
        message: 'Reply sent successfully',
      });

    } catch (replyError) {
      console.error('Reply error:', replyError);
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to send reply',
        error: replyError.message,
      });
    }

  } catch (error) {
    console.error('Reply to Mention Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to process reply',
      error: error.message,
    });
  }
};

// Get sentiment analysis
const getSentimentAnalysis = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { days = 30, platform } = req.query;

    const filter = { owner: ownerId, removed: false };
    if (platform) filter.platform = platform;

    const sentimentData = await SocialMention.getSentimentAnalysis(ownerId, days);

    // Get trending keywords
    const trendingKeywords = await SocialMention.getTrendingKeywords(ownerId, 7, 10);

    // Get recent mentions by sentiment
    const recentPositive = await SocialMention.findBysentiment(ownerId, 'positive', 5);
    const recentNegative = await SocialMention.findBysentiment(ownerId, 'negative', 5);

    return res.status(200).json({
      success: true,
      result: {
        sentimentBreakdown: sentimentData,
        trendingKeywords,
        recentSentiment: {
          positive: recentPositive,
          negative: recentNegative,
        },
        period: `${days} days`,
      },
      message: 'Sentiment analysis retrieved successfully',
    });

  } catch (error) {
    console.error('Get Sentiment Analysis Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve sentiment analysis',
      error: error.message,
    });
  }
};

// Search mentions by keywords
const searchMentions = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { 
      keywords, 
      platforms,
      startDate,
      endDate,
      limit = 50 
    } = req.query;

    if (!keywords) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Keywords are required for search',
      });
    }

    const keywordArray = keywords.split(',').map(k => k.trim());
    const platformArray = platforms ? platforms.split(',') : null;

    // Build search filter
    const filter = {
      owner: ownerId,
      removed: false,
      keywords: { $in: keywordArray },
    };

    if (platformArray) {
      filter.platform = { $in: platformArray };
    }

    if (startDate || endDate) {
      filter.publishedAt = {};
      if (startDate) filter.publishedAt.$gte = new Date(startDate);
      if (endDate) filter.publishedAt.$lte = new Date(endDate);
    }

    const mentions = await SocialMention.find(filter)
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit));

    // Group by sentiment and platform
    const grouped = {
      bySentiment: {},
      byPlatform: {},
      byKeyword: {},
    };

    mentions.forEach(mention => {
      // Group by sentiment
      const sentiment = mention.sentiment.label;
      if (!grouped.bySentiment[sentiment]) {
        grouped.bySentiment[sentiment] = [];
      }
      grouped.bySentiment[sentiment].push(mention);

      // Group by platform
      if (!grouped.byPlatform[mention.platform]) {
        grouped.byPlatform[mention.platform] = [];
      }
      grouped.byPlatform[mention.platform].push(mention);

      // Group by keyword
      mention.keywords.forEach(keyword => {
        if (keywordArray.includes(keyword)) {
          if (!grouped.byKeyword[keyword]) {
            grouped.byKeyword[keyword] = [];
          }
          grouped.byKeyword[keyword].push(mention);
        }
      });
    });

    return res.status(200).json({
      success: true,
      result: {
        mentions,
        grouped,
        summary: {
          total: mentions.length,
          sentimentCounts: Object.keys(grouped.bySentiment).reduce((acc, sentiment) => {
            acc[sentiment] = grouped.bySentiment[sentiment].length;
            return acc;
          }, {}),
          platformCounts: Object.keys(grouped.byPlatform).reduce((acc, platform) => {
            acc[platform] = grouped.byPlatform[platform].length;
            return acc;
          }, {}),
        },
        searchParams: { keywords: keywordArray, platforms: platformArray },
      },
      message: 'Mention search completed successfully',
    });

  } catch (error) {
    console.error('Search Mentions Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to search mentions',
      error: error.message,
    });
  }
};

module.exports = {
  getMentions,
  getMention,
  updateMention,
  replyToMention,
  getSentimentAnalysis,
  searchMentions,
};
