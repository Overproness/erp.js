const axios = require('axios');

class InstagramService {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.apiVersion = 'v18.0';
  }

  // Authentication and account management
  async getInstagramBusinessAccounts(accessToken) {
    try {
      // First get Facebook pages
      const pagesResponse = await axios.get(`${this.baseURL}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,instagram_business_account',
        },
      });

      const instagramAccounts = [];

      for (const page of pagesResponse.data.data) {
        if (page.instagram_business_account) {
          const igAccountId = page.instagram_business_account.id;
          
          // Get Instagram account details
          const igResponse = await axios.get(`${this.baseURL}/${igAccountId}`, {
            params: {
              access_token: accessToken,
              fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
            },
          });

          instagramAccounts.push({
            accountId: igResponse.data.id,
            username: igResponse.data.username,
            displayName: igResponse.data.name,
            profilePicture: igResponse.data.profile_picture_url,
            accountMetrics: {
              followers: igResponse.data.followers_count || 0,
              following: igResponse.data.follows_count || 0,
              posts: igResponse.data.media_count || 0,
            },
            facebookPageId: page.id,
          });
        }
      }

      return instagramAccounts;
    } catch (error) {
      throw new Error(`Failed to get Instagram accounts: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Post management
  async createPost(accessToken, igAccountId, postData) {
    try {
      // Step 1: Create media object
      const mediaParams = {
        access_token: accessToken,
        caption: postData.content,
      };

      let mediaEndpoint;
      let isVideo = false;

      if (postData.mediaUrls && postData.mediaUrls.length > 0) {
        const mediaUrl = postData.mediaUrls[0]; // Instagram supports single media per post
        
        if (this.isVideo(mediaUrl)) {
          mediaEndpoint = `${this.baseURL}/${igAccountId}/media`;
          mediaParams.media_type = 'VIDEO';
          mediaParams.video_url = mediaUrl;
          isVideo = true;
        } else if (this.isImage(mediaUrl)) {
          mediaEndpoint = `${this.baseURL}/${igAccountId}/media`;
          mediaParams.image_url = mediaUrl;
        } else {
          throw new Error('Unsupported media type for Instagram');
        }
      } else {
        throw new Error('Instagram posts require media');
      }

      // Create media object
      const mediaResponse = await axios.post(mediaEndpoint, null, {
        params: mediaParams,
      });

      const mediaId = mediaResponse.data.id;

      // Step 2: Check if media is ready (especially for videos)
      if (isVideo) {
        await this.waitForMediaProcessing(accessToken, mediaId);
      }

      // Step 3: Publish the media
      const publishResponse = await axios.post(`${this.baseURL}/${igAccountId}/media_publish`, null, {
        params: {
          access_token: accessToken,
          creation_id: mediaId,
        },
      });

      return {
        postId: publishResponse.data.id,
        platformUrl: `https://instagram.com/p/${this.getPostShortcode(publishResponse.data.id)}`,
        status: 'published',
        publishedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create Instagram post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async waitForMediaProcessing(accessToken, mediaId, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${this.baseURL}/${mediaId}`, {
          params: {
            access_token: accessToken,
            fields: 'status_code',
          },
        });

        if (response.data.status_code === 'FINISHED') {
          return true;
        }

        if (response.data.status_code === 'ERROR') {
          throw new Error('Media processing failed');
        }

        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Media processing timeout');
  }

  async createStory(accessToken, igAccountId, storyData) {
    try {
      const mediaParams = {
        access_token: accessToken,
        media_type: 'STORIES',
      };

      if (storyData.mediaUrls && storyData.mediaUrls.length > 0) {
        const mediaUrl = storyData.mediaUrls[0];
        
        if (this.isVideo(mediaUrl)) {
          mediaParams.video_url = mediaUrl;
        } else if (this.isImage(mediaUrl)) {
          mediaParams.image_url = mediaUrl;
        }
      }

      // Create story media
      const mediaResponse = await axios.post(`${this.baseURL}/${igAccountId}/media`, null, {
        params: mediaParams,
      });

      // Publish story
      const publishResponse = await axios.post(`${this.baseURL}/${igAccountId}/media_publish`, null, {
        params: {
          access_token: accessToken,
          creation_id: mediaResponse.data.id,
        },
      });

      return {
        storyId: publishResponse.data.id,
        status: 'published',
        publishedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create Instagram story: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Analytics and metrics
  async getPostMetrics(accessToken, postId) {
    try {
      const response = await axios.get(`${this.baseURL}/${postId}/insights`, {
        params: {
          access_token: accessToken,
          metric: 'likes,comments,shares,saves,reach,impressions',
        },
      });

      const metrics = {};
      response.data.data.forEach(metric => {
        metrics[metric.name] = metric.values[0]?.value || 0;
      });

      return {
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        saves: metrics.saves || 0,
        reach: metrics.reach || 0,
        impressions: metrics.impressions || 0,
        engagement: (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0) + (metrics.saves || 0),
      };
    } catch (error) {
      throw new Error(`Failed to get Instagram post metrics: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getAccountInsights(accessToken, igAccountId, period = 'day', since, until) {
    try {
      const metrics = [
        'follower_count',
        'reach',
        'impressions',
        'profile_views',
        'website_clicks',
      ];

      const response = await axios.get(`${this.baseURL}/${igAccountId}/insights`, {
        params: {
          access_token: accessToken,
          metric: metrics.join(','),
          period: period,
          since: since,
          until: until,
        },
      });

      const parsedMetrics = {};
      response.data.data.forEach(metric => {
        parsedMetrics[metric.name] = metric.values[0]?.value || 0;
      });

      return {
        followers: parsedMetrics.follower_count || 0,
        reach: parsedMetrics.reach || 0,
        impressions: parsedMetrics.impressions || 0,
        profileVisits: parsedMetrics.profile_views || 0,
        websiteClicks: parsedMetrics.website_clicks || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get Instagram insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getTopPosts(accessToken, igAccountId, limit = 25) {
    try {
      const response = await axios.get(`${this.baseURL}/${igAccountId}/media`, {
        params: {
          access_token: accessToken,
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          limit: limit,
        },
      });

      return response.data.data.map(post => ({
        postId: post.id,
        content: post.caption || '',
        mediaType: post.media_type,
        mediaUrl: post.media_url,
        postUrl: post.permalink,
        datePosted: new Date(post.timestamp),
        metrics: {
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to get Instagram top posts: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Hashtag and mention tracking
  async searchHashtag(accessToken, igAccountId, hashtag) {
    try {
      // Search for hashtag ID
      const hashtagResponse = await axios.get(`${this.baseURL}/ig_hashtag_search`, {
        params: {
          access_token: accessToken,
          user_id: igAccountId,
          q: hashtag,
        },
      });

      if (hashtagResponse.data.data.length === 0) {
        return [];
      }

      const hashtagId = hashtagResponse.data.data[0].id;

      // Get top posts for hashtag
      const postsResponse = await axios.get(`${this.baseURL}/${hashtagId}/top_media`, {
        params: {
          access_token: accessToken,
          user_id: igAccountId,
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
        },
      });

      return postsResponse.data.data.map(post => ({
        postId: post.id,
        content: post.caption || '',
        mediaType: post.media_type,
        postUrl: post.permalink,
        datePosted: new Date(post.timestamp),
        hashtag: hashtag,
        metrics: {
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to search Instagram hashtag: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getMentions(accessToken, igAccountId) {
    try {
      // Get recently tagged posts
      const response = await axios.get(`${this.baseURL}/${igAccountId}`, {
        params: {
          access_token: accessToken,
          fields: 'tags{id,caption,media_type,permalink,timestamp,like_count,comments_count,owner}',
        },
      });

      return response.data.tags?.data?.map(post => ({
        postId: post.id,
        content: post.caption || '',
        authorId: post.owner?.id,
        postUrl: post.permalink,
        datePosted: new Date(post.timestamp),
        mentionType: 'direct_mention',
        metrics: {
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
        },
      })) || [];
    } catch (error) {
      throw new Error(`Failed to get Instagram mentions: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Utility methods
  isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  isVideo(url) {
    return /\.(mp4|mov|avi|wmv|flv|webm)$/i.test(url);
  }

  getPostShortcode(postId) {
    // Instagram post IDs can be converted to shortcodes
    // This is a simplified version - actual conversion is more complex
    return postId.replace(/_\d+$/, '');
  }

  async validateToken(accessToken, igAccountId) {
    try {
      const response = await axios.get(`${this.baseURL}/${igAccountId}`, {
        params: {
          access_token: accessToken,
          fields: 'id',
        },
      });

      return !!response.data.id;
    } catch (error) {
      return false;
    }
  }

  generateAuthUrl(redirectUri, scopes = ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement']) {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID, // Instagram uses Facebook App ID
      redirect_uri: redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: Math.random().toString(36).substring(7),
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }
}

module.exports = new InstagramService();
