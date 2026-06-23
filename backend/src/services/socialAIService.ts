// @ts-nocheck

import openaiHelper from '../helpers/openaiHelper';
import Setting from '../models/coreModels/Setting';
class SocialAIService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.platformLimits = {
      facebook: { text: 63206 },
      instagram: { text: 2200 },
      twitter: { text: 280 },
      linkedin: { text: 3000 },
      youtube: { text: 5000 },
      tiktok: { text: 2200 }
    };
  }

  async initialize(ownerId) {
    try {
      // Try to get owner-specific API key first
      let apiKeySetting = await Setting.findOne({
        settingKey: 'openai_api_key',
        owner: ownerId
      });

      // Fall back to global setting if no owner-specific key
      if (!apiKeySetting) {
        apiKeySetting = await Setting.findOne({
          settingKey: 'openai_api_key',
          owner: null
        });
      }

      if (!apiKeySetting || !apiKeySetting.settingValue) {
        throw new Error('OpenAI API key not configured');
      }

      this.apiKey = apiKeySetting.settingValue;
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing social AI service:', error);
      throw error;
    }
  }

  async generateContent(prompt, platform, ownerId, options = {}) {
    if (!this.initialized) {
      await this.initialize(ownerId);
    }

    try {
      const platformLimit = this.platformLimits[platform.toLowerCase()];
      const maxLength = platformLimit ? platformLimit.text : 2200;
      
      const systemPrompt = this.buildSystemPrompt(platform, maxLength, options);
      const userPrompt = this.buildUserPrompt(prompt, options);

      const response = await openaiHelper.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: options.model || 'gpt-3.5-turbo',
        parameters: {
          temperature: options.temperature || 0.7,
          max_tokens: Math.min(options.maxTokens || 500, 1000),
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0
        }
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const generatedContent = response.data.choices[0].message.content;
      
      return {
        success: true,
        content: generatedContent,
        platform,
        metadata: {
          characterCount: generatedContent.length,
          estimatedTokens: response.usage?.total_tokens || 0,
          cost: response.cost || 0,
          model: options.model || 'gpt-3.5-turbo'
        },
        suggestions: this.extractContentSuggestions(generatedContent, platform),
        hashtags: this.extractHashtags(generatedContent),
        mentions: this.extractMentions(generatedContent)
      };
    } catch (error) {
      console.error('Error generating social media content:', error);
      return {
        success: false,
        error: error.message,
        platform
      };
    }
  }

  async generateMultiplePosts(prompt, platforms, ownerId, options = {}) {
    try {
      const results = {};
      
      for (const platform of platforms) {
        try {
          const result = await this.generateContent(prompt, platform, ownerId, options);
          results[platform] = result;
        } catch (error) {
          results[platform] = {
            success: false,
            error: error.message,
            platform
          };
        }
      }

      return {
        success: true,
        results,
        totalCost: Object.values(results).reduce((sum, result) => 
          sum + (result.metadata?.cost || 0), 0)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateHashtags(content, platform, count = 10, ownerId) {
    if (!this.initialized) {
      await this.initialize(ownerId);
    }

    try {
      const systemPrompt = `You are a social media hashtag expert. Generate relevant, trending hashtags for ${platform} content. 
      Return only hashtags separated by spaces, no explanations. Focus on:
      - Relevant industry hashtags
      - Trending hashtags for ${platform}
      - Brand-specific hashtags
      - Community hashtags
      Maximum ${count} hashtags.`;

      const response = await openaiHelper.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate hashtags for this content: ${content}` }
        ],
        model: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.8,
          max_tokens: 200
        }
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const hashtags = response.data.choices[0].message.content
        .split(/\s+/)
        .filter(tag => tag.startsWith('#'))
        .slice(0, count);

      return {
        success: true,
        hashtags,
        platform,
        count: hashtags.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async optimizeContent(content, platform, ownerId, options = {}) {
    if (!this.initialized) {
      await this.initialize(ownerId);
    }

    try {
      const platformLimit = this.platformLimits[platform.toLowerCase()];
      const maxLength = platformLimit ? platformLimit.text : 2200;

      const systemPrompt = `You are a social media optimization expert. Optimize the given content for ${platform}.
      Requirements:
      - Maximum ${maxLength} characters
      - Platform-appropriate tone and style
      - Maintain original message intent
      - Add relevant call-to-action if appropriate
      - Optimize for engagement`;

      const response = await openaiHelper.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Optimize this content: ${content}` }
        ],
        model: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.6,
          max_tokens: 300
        }
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const optimizedContent = response.data.choices[0].message.content;

      return {
        success: true,
        originalContent: content,
        optimizedContent,
        platform,
        improvements: {
          characterReduction: content.length - optimizedContent.length,
          withinLimit: optimizedContent.length <= maxLength
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateCaptionFromImage(imageDescription, platform, ownerId, options = {}) {
    if (!this.initialized) {
      await this.initialize(ownerId);
    }

    try {
      const platformLimit = this.platformLimits[platform.toLowerCase()];
      const maxLength = platformLimit ? platformLimit.text : 2200;

      const systemPrompt = `You are a creative social media caption writer. Create an engaging caption for ${platform} based on the image description.
      - Maximum ${maxLength} characters
      - Include relevant emojis
      - Add call-to-action
      - Make it engaging and shareable`;

      const response = await openaiHelper.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a caption for this image: ${imageDescription}` }
        ],
        model: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.8,
          max_tokens: 300
        }
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const caption = response.data.choices[0].message.content;

      return {
        success: true,
        caption,
        platform,
        imageDescription,
        metadata: {
          characterCount: caption.length,
          estimatedTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateEngagementResponse(originalPost, comment, tone = 'professional', ownerId) {
    if (!this.initialized) {
      await this.initialize(ownerId);
    }

    try {
      const systemPrompt = `You are a social media manager responding to comments. 
      Generate a ${tone} response that:
      - Addresses the comment appropriately
      - Maintains brand voice
      - Encourages further engagement
      - Is authentic and helpful
      - Keeps it concise (under 200 characters)`;

      const response = await openaiHelper.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Original post: "${originalPost}"\nComment: "${comment}"\nGenerate response:` }
        ],
        model: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.7,
          max_tokens: 150
        }
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      return {
        success: true,
        response: response.data.choices[0].message.content,
        tone,
        originalComment: comment
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildSystemPrompt(platform, maxLength, options = {}) {
    const tone = options.tone || 'professional';
    const includeHashtags = options.includeHashtags !== false;
    const includeEmojis = options.includeEmojis !== false;
    const callToAction = options.callToAction || false;

    let prompt = `You are an expert social media content creator specializing in ${platform}. 

Create engaging, ${tone} content that:
- Stays within ${maxLength} characters
- Follows ${platform} best practices and trends
- Uses appropriate formatting for ${platform}`;

    if (includeHashtags) {
      prompt += `\n- Includes relevant hashtags (3-5 for most platforms, up to 30 for Instagram)`;
    }

    if (includeEmojis) {
      prompt += `\n- Uses emojis strategically to enhance engagement`;
    }

    if (callToAction) {
      prompt += `\n- Includes a clear call-to-action`;
    }

    prompt += `\n- Optimizes for engagement and shareability
- Maintains authenticity and brand voice

Platform-specific guidelines for ${platform}:`;

    switch (platform.toLowerCase()) {
      case 'facebook':
        prompt += `
- Use conversational tone
- Ask questions to encourage comments
- Share valuable insights or stories
- Use line breaks for readability`;
        break;
      case 'instagram':
        prompt += `
- Use visual storytelling approach
- Include up to 30 relevant hashtags
- Add emojis for visual appeal
- Create shareable, aesthetic content`;
        break;
      case 'twitter':
        prompt += `
- Be concise and punchy
- Use trending hashtags sparingly (1-2)
- Encourage retweets and replies
- Consider thread format for longer content`;
        break;
      case 'linkedin':
        prompt += `
- Professional and thought-leadership focused
- Share industry insights
- Use professional hashtags
- Encourage professional discussion`;
        break;
      default:
        prompt += `\n- Follow general social media best practices`;
    }

    return prompt;
  }

  buildUserPrompt(prompt, options = {}) {
    let userPrompt = prompt;

    if (options.context) {
      userPrompt = `Context: ${options.context}\n\n${userPrompt}`;
    }

    if (options.targetAudience) {
      userPrompt += `\n\nTarget audience: ${options.targetAudience}`;
    }

    if (options.brandVoice) {
      userPrompt += `\n\nBrand voice: ${options.brandVoice}`;
    }

    if (options.keywords) {
      userPrompt += `\n\nInclude these keywords naturally: ${options.keywords.join(', ')}`;
    }

    return userPrompt;
  }

  extractContentSuggestions(content, platform) {
    const suggestions = [];

    // Length optimization
    const limit = this.platformLimits[platform.toLowerCase()]?.text || 2200;
    if (content.length > limit * 0.9) {
      suggestions.push('Consider shortening content for better engagement');
    }

    // Hashtag suggestions
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (platform.toLowerCase() === 'instagram' && hashtagCount < 5) {
      suggestions.push('Consider adding more hashtags for Instagram visibility');
    } else if (platform.toLowerCase() === 'twitter' && hashtagCount > 2) {
      suggestions.push('Consider reducing hashtags for Twitter');
    }

    // Call-to-action check
    const cta_words = ['click', 'visit', 'buy', 'subscribe', 'follow', 'share', 'comment', 'like'];
    const hasCTA = cta_words.some(word => content.toLowerCase().includes(word));
    if (!hasCTA) {
      suggestions.push('Consider adding a call-to-action');
    }

    return suggestions;
  }

  extractHashtags(content) {
    const hashtagRegex = /#[\w]+/g;
    return content.match(hashtagRegex) || [];
  }

  extractMentions(content) {
    const mentionRegex = /@[\w]+/g;
    return content.match(mentionRegex) || [];
  }
}

export = new SocialAIService();
