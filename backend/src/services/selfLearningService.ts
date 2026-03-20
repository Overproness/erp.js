// @ts-nocheck
const AILearningData = require('../models/appModels/AILearningData');
const mongoose = require('mongoose');
const cron = require('node-cron');

/**
 * AI Self-Learning Service
 * Tracks interactions, learns from feedback, and improves responses over time
 */
class SelfLearningService {
  constructor() {
    this.learningThreshold = 10;
    this.confidenceBoost = 0.05;
    this.patterns = new Map();
  }

  /**
   * Initialize self-learning service
   */
  async initialize() {
    // console.log('🧠 Initializing AI Self-Learning Service...');

    await this.loadPatterns();

    this.schedulePatternAnalysis();

    this.scheduleModelOptimization();

    // console.log('✅ Self-Learning Service initialized');
  }

  /**
   * Track AI interaction for learning
   */
  async trackInteraction(userId, interactionData) {
    try {
      const {
        type,
        input,
        output,
        module,
        assistantId,
        context,
        model,
        durationMs,
        tokenCount,
        cost,
      } = interactionData;

      const features = await this.extractFeatures(input, context);

      const learningEntry = await AILearningData.create({
        owner: userId,
        interactionType: type,
        input: {
          message: input.message,
          context: context,
          module: module,
          assistantId: assistantId,
        },
        output: {
          response: output.response,
          suggestions: output.suggestions || [],
          confidence: output.confidence || 0.7,
          model: model,
        },
        mlMetadata: {
          features: features,
          embedding: output.embedding || [],
        },
        usageStats: {
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
          durationMs: durationMs,
          tokenCount: tokenCount,
          cost: cost,
        },
      });

      console.log(`📊 Interaction tracked: ${learningEntry._id}`);

      return {
        success: true,
        learningId: learningEntry._id,
      };
    } catch (error) {
      console.error('Track interaction error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Record user feedback on AI response
   */
  async recordFeedback(learningId, feedbackData) {
    try {
      const learningEntry = await AILearningData.findById(learningId);

      if (!learningEntry) {
        throw new Error('Learning entry not found');
      }

      learningEntry.feedback = {
        rating: feedbackData.rating,
        wasHelpful: feedbackData.wasHelpful,
        wasAccurate: feedbackData.wasAccurate,
        wasImplemented: feedbackData.wasImplemented,
        userComment: feedbackData.comment,
        feedbackDate: new Date(),
      };

      if (feedbackData.outcome) {
        learningEntry.outcome = feedbackData.outcome;
      }

      await learningEntry.save();

      await this.updatePatternConfidence(learningEntry);

      console.log(`✅ Feedback recorded for ${learningId}`);

      return {
        success: true,
        message: 'Feedback recorded successfully',
      };
    } catch (error) {
      console.error('Record feedback error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract features from input for pattern recognition
   */
  async extractFeatures(input, context) {
    try {
      const features = {
        messageLength: input.message ? input.message.length : 0,
        hasContext: !!context && Object.keys(context).length > 0,
        module: context?.module || 'general',
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),

        keywords: this.extractKeywords(input.message),

        sentiment: this.estimateSentiment(input.message),

        complexity: this.estimateComplexity(input.message),

        hasEntityReference: !!context?.entityId,
      };

      return features;
    } catch (error) {
      console.error('Extract features error:', error);
      return {};
    }
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    if (!text) return [];

    const commonWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'is',
      'are',
      'was',
      'were',
      'to',
      'from',
      'in',
      'on',
      'at',
      'for',
    ];

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.includes(word));

    const wordCounts = {};
    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Estimate sentiment of text (simple implementation)
   */
  estimateSentiment(text) {
    if (!text) return 'neutral';

    const positiveWords = [
      'good',
      'great',
      'excellent',
      'perfect',
      'amazing',
      'wonderful',
      'best',
      'love',
      'thank',
      'thanks',
    ];
    const negativeWords = [
      'bad',
      'poor',
      'terrible',
      'awful',
      'worst',
      'hate',
      'wrong',
      'error',
      'problem',
      'issue',
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.some((pw) => word.includes(pw))) positiveCount++;
      if (negativeWords.some((nw) => word.includes(nw))) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Estimate complexity of query
   */
  estimateComplexity(text) {
    if (!text) return 0;

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    let complexity = 0;

    if (sentences.length > 3) complexity += 0.3;
    if (words.length > 50) complexity += 0.3;
    if (avgWordLength > 6) complexity += 0.2;
    if (text.includes('?') && text.split('?').length > 2) complexity += 0.2;

    return Math.min(complexity, 1);
  }

  /**
   * Update pattern confidence based on feedback
   */
  async updatePatternConfidence(learningEntry) {
    try {
      if (!learningEntry.feedback || !learningEntry.mlMetadata?.features) return;

      const features = learningEntry.mlMetadata.features;
      const patternKey = this.generatePatternKey(features);

      const pattern = this.patterns.get(patternKey) || {
        key: patternKey,
        features: features,
        interactions: 0,
        positiveOutcomes: 0,
        negativeOutcomes: 0,
        averageRating: 0,
        confidence: 0.5,
      };

      pattern.interactions++;

      if (learningEntry.feedback.wasHelpful) {
        pattern.positiveOutcomes++;
      } else if (learningEntry.feedback.wasHelpful === false) {
        pattern.negativeOutcomes++;
      }

      if (learningEntry.feedback.rating) {
        pattern.averageRating =
          (pattern.averageRating * (pattern.interactions - 1) + learningEntry.feedback.rating) /
          pattern.interactions;
      }

      pattern.confidence = pattern.positiveOutcomes / Math.max(pattern.interactions, 1);

      this.patterns.set(patternKey, pattern);

      if (pattern.interactions >= this.learningThreshold) {
        await this.persistPattern(learningEntry.owner, pattern);
      }

      console.log(
        `🔄 Pattern updated: ${patternKey} (confidence: ${pattern.confidence.toFixed(2)})`
      );
    } catch (error) {
      console.error('Update pattern confidence error:', error);
    }
  }

  /**
   * Generate unique key for pattern
   */
  generatePatternKey(features) {
    return `${features.module}_${
      features.timeOfDay >= 9 && features.timeOfDay <= 17 ? 'business' : 'off'
    }_${features.complexity > 0.5 ? 'complex' : 'simple'}`;
  }

  /**
   * Persist learned pattern to database
   */
  async persistPattern(userId, pattern) {
    try {
      const existingPattern = await AILearningData.findOne({
        owner: userId,
        'patterns.category': pattern.key,
      });

      if (existingPattern) {
        existingPattern.patterns.frequency = pattern.interactions;
        existingPattern.output.confidence = pattern.confidence;
        await existingPattern.save();
      } else {
        await AILearningData.create({
          owner: userId,
          interactionType: 'recommendation',
          input: {
            message: 'Pattern learned',
            context: { patternKey: pattern.key },
          },
          output: {
            response: 'Pattern recognized and stored',
            confidence: pattern.confidence,
          },
          patterns: {
            category: pattern.key,
            frequency: pattern.interactions,
          },
        });
      }

      console.log(`💾 Pattern persisted: ${pattern.key}`);
    } catch (error) {
      console.error('Persist pattern error:', error);
    }
  }

  /**
   * Load patterns from database
   */
  async loadPatterns() {
    try {
      const storedPatterns = await AILearningData.find({
        interactionType: 'recommendation',
        'patterns.frequency': { $gte: this.learningThreshold },
      });

      storedPatterns.forEach((pattern) => {
        if (pattern.patterns?.category) {
          this.patterns.set(pattern.patterns.category, {
            key: pattern.patterns.category,
            interactions: pattern.patterns.frequency,
            confidence: pattern.output?.confidence || 0.5,
          });
        }
      });

      // console.log(`📚 Loaded ${this.patterns.size} learned patterns`);
    } catch (error) {
      console.error('Load patterns error:', error);
    }
  }

  /**
   * Get learned insights for a module
   */
  async getLearnedInsights(userId, module) {
    try {
      const insights = await AILearningData.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
            'input.module': module,
            'feedback.wasHelpful': true,
            'feedback.rating': { $gte: 4 },
          },
        },
        {
          $group: {
            _id: '$mlMetadata.features.keywords',
            count: { $sum: 1 },
            avgRating: { $avg: '$feedback.rating' },
            avgConfidence: { $avg: '$output.confidence' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      return {
        success: true,
        insights,
      };
    } catch (error) {
      console.error('Get learned insights error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Suggest response based on learned patterns
   */
  async suggestResponse(userId, input, context) {
    try {
      const features = await this.extractFeatures(input, context);
      const patternKey = this.generatePatternKey(features);

      const pattern = this.patterns.get(patternKey);

      if (pattern && pattern.confidence >= 0.7) {
        const similarInteractions = await AILearningData.find({
          owner: userId,
          'mlMetadata.features.module': features.module,
          'feedback.wasHelpful': true,
          'feedback.rating': { $gte: 4 },
        })
          .sort({ 'feedback.feedbackDate': -1 })
          .limit(3);

        if (similarInteractions.length > 0) {
          return {
            success: true,
            suggestion: {
              basedOn: 'learned_pattern',
              confidence: pattern.confidence,
              pattern: patternKey,
              similarInteractions: similarInteractions.map((si) => ({
                response: si.output.response,
                rating: si.feedback.rating,
              })),
            },
          };
        }
      }

      return {
        success: false,
        message: 'No confident pattern match found',
      };
    } catch (error) {
      console.error('Suggest response error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Schedule pattern analysis
   */
  schedulePatternAnalysis() {
    cron.schedule('0 */6 * * *', async () => {
      try {
        console.log('🔍 Running pattern analysis...');

        await Promise.race([
          this.analyzeAllPatterns(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10 * 60 * 1000)
          ),
        ]);
      } catch (error) {
        console.error('⚠️ Error in pattern analysis (non-blocking):', error.message);
      }
    });

    // console.log('📅 Pattern analysis scheduled (every 6 hours)');
  }

  /**
   * Analyze all patterns for improvements
   */
  async analyzeAllPatterns() {
    try {
      const recentInteractions = await AILearningData.find({
        created: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        'feedback.rating': { $exists: true },
      });

      const patternStats = {};

      recentInteractions.forEach((interaction) => {
        if (interaction.mlMetadata?.features) {
          const key = this.generatePatternKey(interaction.mlMetadata.features);

          if (!patternStats[key]) {
            patternStats[key] = {
              total: 0,
              positive: 0,
              negative: 0,
              avgRating: 0,
              ratings: [],
            };
          }

          patternStats[key].total++;
          patternStats[key].ratings.push(interaction.feedback.rating);

          if (interaction.feedback.wasHelpful) {
            patternStats[key].positive++;
          } else {
            patternStats[key].negative++;
          }
        }
      });

      for (const [key, stats] of Object.entries(patternStats)) {
        stats.avgRating = stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length;

        const existingPattern = this.patterns.get(key) || {};
        this.patterns.set(key, {
          ...existingPattern,
          key,
          interactions: (existingPattern.interactions || 0) + stats.total,
          positiveOutcomes: (existingPattern.positiveOutcomes || 0) + stats.positive,
          negativeOutcomes: (existingPattern.negativeOutcomes || 0) + stats.negative,
          averageRating: stats.avgRating,
          confidence: stats.positive / Math.max(stats.total, 1),
        });
      }

      console.log(`✅ Analyzed ${Object.keys(patternStats).length} patterns`);
    } catch (error) {
      console.error('Analyze all patterns error:', error);
    }
  }

  /**
   * Schedule model optimization
   */
  scheduleModelOptimization() {
    cron.schedule('0 2 * * 0', async () => {
      try {
        console.log('🎯 Running model optimization...');

        await Promise.race([
          this.optimizeModels(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 15 * 60 * 1000)
          ),
        ]);
      } catch (error) {
        console.error('⚠️ Error in model optimization (non-blocking):', error.message);
      }
    });

    // console.log('📅 Model optimization scheduled (weekly)');
  }

  /**
   * Optimize AI models based on feedback
   */
  async optimizeModels() {
    try {
      const modelPerformance = await AILearningData.aggregate([
        {
          $match: {
            'feedback.rating': { $exists: true },
            created: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: '$output.model',
            avgRating: { $avg: '$feedback.rating' },
            totalInteractions: { $sum: 1 },
            helpfulCount: {
              $sum: { $cond: ['$feedback.wasHelpful', 1, 0] },
            },
          },
        },
        { $sort: { avgRating: -1 } },
      ]);

      console.log('📊 Model performance analysis:', modelPerformance);

      return {
        success: true,
        performance: modelPerformance,
      };
    } catch (error) {
      console.error('Optimize models error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(userId) {
    try {
      const stats = await AILearningData.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalInteractions: { $sum: 1 },
            withFeedback: {
              $sum: { $cond: [{ $ifNull: ['$feedback.rating', false] }, 1, 0] },
            },
            helpful: {
              $sum: { $cond: ['$feedback.wasHelpful', 1, 0] },
            },
            avgRating: { $avg: '$feedback.rating' },
            implemented: {
              $sum: { $cond: ['$feedback.wasImplemented', 1, 0] },
            },
          },
        },
      ]);

      const result = stats[0] || {
        totalInteractions: 0,
        withFeedback: 0,
        helpful: 0,
        avgRating: 0,
        implemented: 0,
      };

      return {
        success: true,
        stats: {
          ...result,
          feedbackRate: result.totalInteractions
            ? ((result.withFeedback / result.totalInteractions) * 100).toFixed(1)
            : 0,
          helpfulRate: result.withFeedback
            ? ((result.helpful / result.withFeedback) * 100).toFixed(1)
            : 0,
          implementationRate: result.withFeedback
            ? ((result.implemented / result.withFeedback) * 100).toFixed(1)
            : 0,
          learnedPatterns: this.patterns.size,
        },
      };
    } catch (error) {
      console.error('Get learning stats error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const selfLearningService = new SelfLearningService();

module.exports = selfLearningService;
