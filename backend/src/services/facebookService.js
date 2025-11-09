const axios = require('axios');

class FacebookService {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.apiVersion = 'v18.0';
  }

  // Authentication and account management
  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await axios.get(`${this.baseURL}/oauth/access_token`, {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: redirectUri,
          code: code,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Facebook token exchange failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getAccountInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email,picture.width(200).height(200)',
        },
      });

      return {
        accountId: response.data.id,
        username: response.data.name,
        displayName: response.data.name,
        email: response.data.email,
        profilePicture: response.data.picture?.data?.url,
      };
    } catch (error) {
      throw new Error(`Failed to get Facebook account info: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getPageAccounts(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,picture,fan_count,talking_about_count',
        },
      });

      return response.data.data.map(page => ({
        accountId: page.id,
        username: page.name,
        displayName: page.name,
        accessToken: page.access_token,
        profilePicture: page.picture?.data?.url,
        accountMetrics: {
          followers: page.fan_count || 0,
          engagement: page.talking_about_count || 0,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to get Facebook pages: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Post management
  async createPost(accessToken, pageId, postData) {
    try {
      const params = {
        access_token: accessToken,
        message: postData.content,
      };

      // Handle media attachments
      if (postData.mediaUrls && postData.mediaUrls.length > 0) {
        if (postData.mediaUrls.length === 1) {
          // Single media post
          const mediaUrl = postData.mediaUrls[0];
          if (this.isImage(mediaUrl)) {
            params.url = mediaUrl;
          } else if (this.isVideo(mediaUrl)) {
            params.source = mediaUrl;
          }
        } else {
          // Multiple media - create carousel
          const attachedMedia = await this.uploadMultipleMedia(accessToken, pageId, postData.mediaUrls);
          params.attached_media = JSON.stringify(attachedMedia);
        }
      }

      // Handle scheduled posting
      if (postData.scheduledTime && new Date(postData.scheduledTime) > new Date()) {
        params.published = false;
        params.scheduled_publish_time = Math.floor(new Date(postData.scheduledTime).getTime() / 1000);
      }

      const endpoint = postData.mediaUrls?.some(url => this.isVideo(url)) 
        ? `${this.baseURL}/${pageId}/videos`
        : `${this.baseURL}/${pageId}/feed`;

      const response = await axios.post(endpoint, null, { params });

      return {
        postId: response.data.id,
        platformUrl: `https://facebook.com/${response.data.id}`,
        status: params.published === false ? 'scheduled' : 'published',
        publishedAt: params.published === false ? null : new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create Facebook post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async uploadMultipleMedia(accessToken, pageId, mediaUrls) {
    const uploadedMedia = [];

    for (const mediaUrl of mediaUrls) {
      try {
        const uploadResponse = await axios.post(`${this.baseURL}/${pageId}/photos`, null, {
          params: {
            access_token: accessToken,
            url: mediaUrl,
            published: false,
          },
        });

        uploadedMedia.push({
          media_fbid: uploadResponse.data.id,
        });
      } catch (error) {
        console.error('Failed to upload media:', error);
      }
    }

    return uploadedMedia;
  }

  async deletePost(accessToken, postId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${postId}`, {
        params: {
          access_token: accessToken,
        },
      });

      return response.data.success;
    } catch (error) {
      throw new Error(`Failed to delete Facebook post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Analytics and metrics
  async getPostMetrics(accessToken, postId) {
    try {
      const response = await axios.get(`${this.baseURL}/${postId}`, {
        params: {
          access_token: accessToken,
          fields: 'likes.summary(true),comments.summary(true),shares,reactions.summary(true),created_time',
        },
      });

      const post = response.data;
      return {
        likes: post.likes?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
        reactions: post.reactions?.summary?.total_count || 0,
        engagement: (post.likes?.summary?.total_count || 0) + 
                   (post.comments?.summary?.total_count || 0) + 
                   (post.shares?.count || 0),
      };
    } catch (error) {
      throw new Error(`Failed to get Facebook post metrics: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getPageInsights(accessToken, pageId, period = 'day', since, until) {
    try {
      const metrics = [
        'page_fans',
        'page_fan_adds',
        'page_fan_removes',
        'page_impressions',
        'page_reach',
        'page_post_engagements',
        'page_posts_impressions',
        'page_video_views',
      ];

      const response = await axios.get(`${this.baseURL}/${pageId}/insights`, {
        params: {
          access_token: accessToken,
          metric: metrics.join(','),
          period: period,
          since: since,
          until: until,
        },
      });

      return this.parseInsightsData(response.data.data);
    } catch (error) {
      throw new Error(`Failed to get Facebook insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  parseInsightsData(insightsData) {
    const metrics = {};
    
    insightsData.forEach(insight => {
      const metricName = insight.name;
      const values = insight.values || [];
      
      if (values.length > 0) {
        const latestValue = values[values.length - 1];
        metrics[metricName] = latestValue.value;
      }
    });

    return {
      followers: metrics.page_fans || 0,
      followerGrowth: (metrics.page_fan_adds || 0) - (metrics.page_fan_removes || 0),
      reach: metrics.page_reach || 0,
      impressions: metrics.page_impressions || 0,
      engagement: metrics.page_post_engagements || 0,
      videoViews: metrics.page_video_views || 0,
    };
  }

  // Social listening and mentions
  async searchMentions(accessToken, query, options = {}) {
    try {
      // Note: Facebook's search capabilities are limited for brand monitoring
      // This would typically require Facebook's Brand Monitoring API or third-party tools
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          access_token: accessToken,
          q: query,
          type: 'post',
          limit: options.limit || 25,
        },
      });

      return response.data.data.map(post => ({
        postId: post.id,
        content: post.message || '',
        authorId: post.from?.id,
        authorName: post.from?.name,
        datePosted: new Date(post.created_time),
        postUrl: `https://facebook.com/${post.id}`,
        engagement: {
          likes: post.likes?.summary?.total_count || 0,
          comments: post.comments?.summary?.total_count || 0,
          shares: post.shares?.count || 0,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to search Facebook mentions: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Utility methods
  isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  isVideo(url) {
    return /\.(mp4|mov|avi|wmv|flv|webm)$/i.test(url);
  }

  async validateToken(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
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

  generateAuthUrl(redirectUri, scopes = ['pages_manage_posts', 'pages_read_engagement']) {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: Math.random().toString(36).substring(7),
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }
}

module.exports = new FacebookService();
