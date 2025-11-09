const SocialPost = require('@/models/appModels/SocialPost');
const SocialAccount = require('@/models/appModels/SocialAccount');
const { facebookService } = require('@/services/facebookService');
const { instagramService } = require('@/services/instagramService');
const { twitterService } = require('@/services/twitterService');
const { urlShortener } = require('@/helpers/urlShortener');

// Create a new social media post
const createPost = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      title,
      content,
      mediaUrls,
      platforms,
      scheduledAt,
      postType,
      hashtags,
      mentions,
      campaignId,
      trackingUrl,
    } = req.body;

    // Validation
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Post content is required',
      });
    }

    if (!platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'At least one platform must be selected',
      });
    }

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Scheduled time is required',
      });
    }

    // Validate that all specified accounts exist and belong to the user
    const accountIds = platforms.map(p => p.accountId);
    const accounts = await SocialAccount.find({
      _id: { $in: accountIds },
      owner: ownerId,
      removed: false,
      isActive: true,
    });

    if (accounts.length !== platforms.length) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'One or more social accounts not found or inactive',
      });
    }

    // Process tracking URL
    let shortUrl = null;
    if (trackingUrl) {
      try {
        shortUrl = await urlShortener.createShortUrl(trackingUrl, ownerId);
      } catch (error) {
        console.warn('Failed to create short URL:', error.message);
      }
    }

    // Create the post
    const newPost = new SocialPost({
      title: title?.trim(),
      content: content.trim(),
      mediaUrls: mediaUrls || [],
      platforms: platforms.map(platform => ({
        platform: platform.platform,
        accountId: platform.accountId,
        status: 'scheduled',
      })),
      scheduledAt: new Date(scheduledAt),
      postType: postType || 'post',
      hashtags: hashtags || [],
      mentions: mentions || [],
      campaign: campaignId || null,
      trackingUrl,
      shortUrl,
      owner: ownerId,
    });

    await newPost.save();

    // Populate account information
    await newPost.populate('platforms.accountId campaign');

    return res.status(201).json({
      success: true,
      result: newPost,
      message: 'Social media post created successfully',
    });

  } catch (error) {
    console.error('Create Post Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to create social media post',
      error: error.message,
    });
  }
};

// Get all posts for a user
const getPosts = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      page = 1,
      limit = 10,
      status,
      platform,
      campaign,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build filter
    const filter = { owner: ownerId, removed: false };

    if (status) filter.status = status;
    if (campaign) filter.campaign = campaign;
    if (platform) filter['platforms.platform'] = platform;

    if (startDate || endDate) {
      filter.scheduledAt = {};
      if (startDate) filter.scheduledAt.$gte = new Date(startDate);
      if (endDate) filter.scheduledAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { hashtags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [posts, total] = await Promise.all([
      SocialPost.find(filter)
        .populate('platforms.accountId campaign')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SocialPost.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      result: {
        items: posts,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      message: 'Posts retrieved successfully',
    });

  } catch (error) {
    console.error('Get Posts Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve posts',
      error: error.message,
    });
  }
};

// Get single post
const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const post = await SocialPost.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    }).populate('platforms.accountId campaign');

    if (!post) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media post not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: post,
      message: 'Post retrieved successfully',
    });

  } catch (error) {
    console.error('Get Post Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve post',
      error: error.message,
    });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const updateData = req.body;

    const post = await SocialPost.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media post not found',
      });
    }

    // Check if post can be updated (not already published)
    if (post.status === 'published') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Cannot update a published post',
      });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'content', 'mediaUrls', 'scheduledAt', 
      'postType', 'hashtags', 'mentions', 'trackingUrl'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        post[field] = updateData[field];
      }
    });

    // Update short URL if tracking URL changed
    if (updateData.trackingUrl && updateData.trackingUrl !== post.trackingUrl) {
      try {
        post.shortUrl = await urlShortener.createShortUrl(updateData.trackingUrl, ownerId);
      } catch (error) {
        console.warn('Failed to update short URL:', error.message);
      }
    }

    await post.save();
    await post.populate('platforms.accountId campaign');

    return res.status(200).json({
      success: true,
      result: post,
      message: 'Post updated successfully',
    });

  } catch (error) {
    console.error('Update Post Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to update post',
      error: error.message,
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const post = await SocialPost.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media post not found',
      });
    }

    // Soft delete
    post.removed = true;
    post.status = 'cancelled';
    await post.save();

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Post deleted successfully',
    });

  } catch (error) {
    console.error('Delete Post Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
};

// Publish post immediately
const publishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const post = await SocialPost.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    }).populate('platforms.accountId');

    if (!post) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media post not found',
      });
    }

    if (post.status === 'published') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Post is already published',
      });
    }

    post.status = 'publishing';
    await post.save();

    // Publish to each platform
    const publishResults = [];
    
    for (const platformData of post.platforms) {
      try {
        const account = platformData.accountId;
        let result;

        switch (platformData.platform) {
          case 'facebook':
            result = await facebookService.publishPost(
              account.accessToken,
              account.platformAccountId,
              {
                content: post.content,
                mediaUrls: post.mediaUrls,
                hashtags: post.hashtags,
                link: post.shortUrl || post.trackingUrl,
              }
            );
            break;

          case 'instagram':
            result = await instagramService.publishPost(
              account.accessToken,
              account.platformAccountId,
              {
                content: post.content,
                mediaUrls: post.mediaUrls,
                hashtags: post.hashtags,
              }
            );
            break;

          case 'twitter':
            result = await twitterService.publishPost(
              account.accessToken,
              {
                content: post.content,
                mediaUrls: post.mediaUrls,
                hashtags: post.hashtags,
                link: post.shortUrl || post.trackingUrl,
              }
            );
            break;

          default:
            throw new Error(`Unsupported platform: ${platformData.platform}`);
        }

        await post.updatePlatformStatus(platformData.platform, 'published', {
          platformPostId: result.postId,
          postUrl: result.postUrl,
        });

        publishResults.push({
          platform: platformData.platform,
          success: true,
          postId: result.postId,
          postUrl: result.postUrl,
        });

      } catch (error) {
        console.error(`Failed to publish to ${platformData.platform}:`, error);
        
        await post.updatePlatformStatus(platformData.platform, 'failed', {
          errorMessage: error.message,
        });

        publishResults.push({
          platform: platformData.platform,
          success: false,
          error: error.message,
        });
      }
    }

    // Update overall post status
    const allSuccessful = publishResults.every(result => result.success);
    const anySuccessful = publishResults.some(result => result.success);

    if (allSuccessful) {
      post.status = 'published';
    } else if (anySuccessful) {
      post.status = 'published'; // Partially published
    } else {
      post.status = 'failed';
    }

    await post.save();

    return res.status(200).json({
      success: true,
      result: {
        post,
        publishResults,
      },
      message: allSuccessful ? 'Post published successfully' : 'Post published with some errors',
    });

  } catch (error) {
    console.error('Publish Post Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to publish post',
      error: error.message,
    });
  }
};

// Get scheduled posts that need to be published
const getScheduledPosts = async (req, res) => {
  try {
    const posts = await SocialPost.findScheduledPosts();

    return res.status(200).json({
      success: true,
      result: posts,
      message: 'Scheduled posts retrieved successfully',
    });

  } catch (error) {
    console.error('Get Scheduled Posts Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve scheduled posts',
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  publishPost,
  getScheduledPosts,
};
