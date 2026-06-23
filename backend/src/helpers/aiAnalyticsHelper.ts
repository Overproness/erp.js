// @ts-nocheck

import AiAnalytics from '../models/appModels/AiAnalytics';
import AiConversation from '../models/appModels/AiConversation';
class AiAnalyticsHelper {
  async recordUsage(userId, assistantId, type, data) {
    try {
      const analytics = new AiAnalytics({
        type: 'usage',
        module: type,
        aiAssistant: assistantId,
        user: userId,
        owner: userId,
        data,
        metrics: {
          tokensUsed: data.tokens || 0,
          cost: data.cost || 0,
          responseTime: data.responseTime || 0,
        },
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Error recording AI usage:', error);
      throw error;
    }
  }

  async getUsageMetrics(userId, timeframe = '30_days') {
    try {
      const startDate = this.getStartDate(timeframe);
      
      const usage = await AiAnalytics.aggregate([
        {
          $match: {
            owner: userId,
            type: 'usage',
            created: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalTokens: { $sum: '$metrics.tokensUsed' },
            totalCost: { $sum: '$metrics.cost' },
            avgResponseTime: { $avg: '$metrics.responseTime' },
            modules: { $addToSet: '$module' }
          }
        }
      ]);

      const moduleBreakdown = await AiAnalytics.aggregate([
        {
          $match: {
            owner: userId,
            type: 'usage',
            created: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$module',
            count: { $sum: 1 },
            tokens: { $sum: '$metrics.tokensUsed' },
            cost: { $sum: '$metrics.cost' }
          }
        }
      ]);

      return {
        summary: usage[0] || {
          totalConversations: 0,
          totalTokens: 0,
          totalCost: 0,
          avgResponseTime: 0,
          modules: []
        },
        moduleBreakdown,
        timeframe
      };
    } catch (error) {
      console.error('Error getting usage metrics:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(userId, assistantId = null) {
    try {
      const filter = { owner: userId, type: 'usage' };
      if (assistantId) filter.aiAssistant = assistantId;

      const performance = await AiAnalytics.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$created' } }
            },
            avgResponseTime: { $avg: '$metrics.responseTime' },
            totalTokens: { $sum: '$metrics.tokensUsed' },
            conversationCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.day': 1 } },
        { $limit: 30 }
      ]);

      return performance.map(p => ({
        date: p._id.day,
        responseTime: Math.round(p.avgResponseTime),
        tokens: p.totalTokens,
        conversations: p.conversationCount
      }));
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  async getCostAnalysis(userId, timeframe = '30_days') {
    try {
      const startDate = this.getStartDate(timeframe);
      
      const costByModel = await AiAnalytics.aggregate([
        {
          $match: {
            owner: userId,
            type: 'usage',
            created: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'aiassistants',
            localField: 'aiAssistant',
            foreignField: '_id',
            as: 'assistant'
          }
        },
        {
          $group: {
            _id: '$assistant.model.modelName',
            totalCost: { $sum: '$metrics.cost' },
            totalTokens: { $sum: '$metrics.tokensUsed' },
            usage: { $sum: 1 }
          }
        }
      ]);

      const dailyCosts = await AiAnalytics.aggregate([
        {
          $match: {
            owner: userId,
            type: 'usage',
            created: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$created' } }
            },
            cost: { $sum: '$metrics.cost' }
          }
        },
        { $sort: { '_id.day': 1 } }
      ]);

      return {
        byModel: costByModel,
        daily: dailyCosts.map(d => ({
          date: d._id.day,
          cost: Number(d.cost.toFixed(4))
        })),
        timeframe
      };
    } catch (error) {
      console.error('Error getting cost analysis:', error);
      throw error;
    }
  }

  async getInsights(userId, assistantId = null) {
    try {
      const insights = [];
      
      // Usage pattern insights
      const usagePatterns = await this.analyzeUsagePatterns(userId, assistantId);
      insights.push(...usagePatterns);

      // Performance insights
      const performanceInsights = await this.analyzePerformance(userId, assistantId);
      insights.push(...performanceInsights);

      // Cost insights
      const costInsights = await this.analyzeCosts(userId, assistantId);
      insights.push(...costInsights);

      return insights;
    } catch (error) {
      console.error('Error getting insights:', error);
      throw error;
    }
  }

  async analyzeUsagePatterns(userId, assistantId) {
    const insights = [];
    
    // Most active hours
    const hourlyUsage = await AiAnalytics.aggregate([
      {
        $match: {
          owner: userId,
          type: 'usage',
          ...(assistantId && { aiAssistant: assistantId })
        }
      },
      {
        $group: {
          _id: { $hour: '$created' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (hourlyUsage.length > 0) {
      const peakHour = hourlyUsage[0]._id;
      insights.push({
        type: 'usage_pattern',
        title: 'Peak Usage Time',
        description: `Most AI interactions happen at ${peakHour}:00`,
        priority: 'medium',
        actionable: true
      });
    }

    return insights;
  }

  async analyzePerformance(userId, assistantId) {
    const insights = [];
    
    // Average response time analysis
    const avgResponseTime = await AiAnalytics.aggregate([
      {
        $match: {
          owner: userId,
          type: 'usage',
          ...(assistantId && { aiAssistant: assistantId })
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$metrics.responseTime' }
        }
      }
    ]);

    if (avgResponseTime.length > 0) {
      const avgTime = avgResponseTime[0].avgTime;
      if (avgTime > 5000) { // 5 seconds
        insights.push({
          type: 'performance',
          title: 'Slow Response Times',
          description: `Average response time is ${Math.round(avgTime)}ms, consider optimizing`,
          priority: 'high',
          actionable: true
        });
      }
    }

    return insights;
  }

  async analyzeCosts(userId, assistantId) {
    const insights = [];
    
    // High cost analysis
    const monthlyCost = await AiAnalytics.aggregate([
      {
        $match: {
          owner: userId,
          type: 'usage',
          created: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          ...(assistantId && { aiAssistant: assistantId })
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$metrics.cost' }
        }
      }
    ]);

    if (monthlyCost.length > 0) {
      const cost = monthlyCost[0].totalCost;
      if (cost > 50) { // $50 threshold
        insights.push({
          type: 'cost',
          title: 'High Monthly Costs',
          description: `Monthly AI costs are $${cost.toFixed(2)}, consider usage optimization`,
          priority: 'high',
          actionable: true
        });
      }
    }

    return insights;
  }

  getStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '7_days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30_days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90_days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1_year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

export = new AiAnalyticsHelper();
