// @ts-nocheck

import { Client, Invoice, Quote, Campaign, Review, Task } from '../models';
import UnifiedAIHelper from '../helpers/unifiedAIHelper';
/**
 * AI Insights Service
 * Provides AI-powered business insights and recommendations
 */

/**
 * Analyze modules and provide insights
 */
async function analyzeModules(ownerId, modules, analysisType = 'comprehensive') {
  try {
    const moduleData = await gatherModuleData(ownerId, modules);

    const prompt = buildAnalysisPrompt(moduleData, analysisType);

    // Create AI helper instance
    const aiHelper = await UnifiedAIHelper.createForUser(ownerId);

    if (!aiHelper.hasAnyApiKey()) {
      throw new Error(
        'No AI API keys configured. Please add at least one API key (OpenAI, Claude, or Gemini) in Settings > AI Settings.'
      );
    }

    const systemPrompt = `You are a business analytics expert. Analyze the provided data and give actionable insights, trends, and recommendations. Focus on:
1. Key performance indicators
2. Trends and patterns
3. Areas of improvement
4. Growth opportunities
5. Risk factors

Provide specific, actionable recommendations in markdown format.`;

    // Call AI with chat completion
    const aiResponse = await aiHelper.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4o-mini', // Use a default model
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error || 'Failed to get AI insights');
    }

    const insights = aiResponse.data.choices[0].message.content;

    return {
      success: true,
      insights,
      analyzedModules: modules,
      timestamp: new Date(),
      dataPoints: calculateDataPoints(moduleData),
    };
  } catch (error) {
    console.error('Error analyzing modules:', error);
    throw error;
  }
}

/**
 * Get insights for a specific module
 */
async function getModuleInsights(ownerId, moduleName) {
  try {
    // Create AI helper instance
    const aiHelper = await UnifiedAIHelper.createForUser(ownerId);

    if (!aiHelper.hasAnyApiKey()) {
      throw new Error(
        'No AI API keys configured. Please add at least one API key (OpenAI, Claude, or Gemini) in Settings > AI Settings.'
      );
    }

    let data = null;
    let context = '';

    switch (moduleName.toLowerCase()) {
      case 'crm':
      case 'customers':
        data = await getCustomerInsights(ownerId);
        context = 'customer relationship management and sales pipeline';
        break;

      case 'sales':
        data = await getSalesInsights(ownerId);
        context = 'sales performance and revenue generation';
        break;

      case 'marketing':
        data = await getMarketingInsights(ownerId);
        context = 'marketing campaigns and customer engagement';
        break;

      case 'reputation':
        data = await getReputationInsights(ownerId);
        context = 'customer satisfaction and brand reputation';
        break;

      case 'tasks':
        data = await getTaskInsights(ownerId);
        context = 'task management and productivity';
        break;

      default:
        throw new Error('Invalid module name');
    }

    const prompt = `Analyze the following ${moduleName} data and provide insights:

${JSON.stringify(data, null, 2)}

Please provide:
1. Current performance summary
2. Key trends and patterns
3. Specific recommendations for improvement
4. Predicted outcomes if current trends continue
5. Action items to implement`;

    const systemPrompt = `You are a ${context} expert. Provide specific, actionable insights based on the data. Be concise but thorough. Format your response in markdown.`;

    // Call AI with chat completion
    const aiResponse = await aiHelper.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4o-mini',
      parameters: {
        temperature: 0.7,
        max_tokens: 1500,
      },
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error || 'Failed to get module insights');
    }

    const insights = aiResponse.data.choices[0].message.content;

    return {
      success: true,
      module: moduleName,
      insights,
      data,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error getting module insights:', error);
    throw error;
  }
}

/**
 * Gather data from multiple modules
 */
async function gatherModuleData(ownerId, modules) {
  const data = {};

  for (const module of modules) {
    switch (module.toLowerCase()) {
      case 'crm':
      case 'customers':
        data.customers = await getCustomerData(ownerId);
        break;

      case 'sales':
        data.sales = await getSalesData(ownerId);
        break;

      case 'marketing':
        data.marketing = await getMarketingData(ownerId);
        break;

      case 'reputation':
        data.reputation = await getReputationData(ownerId);
        break;

      case 'tasks':
        data.tasks = await getTaskData(ownerId);
        break;
    }
  }

  return data;
}

/**
 * Build analysis prompt from module data
 */
function buildAnalysisPrompt(moduleData, analysisType) {
  let prompt = `Perform a ${analysisType} analysis of the following business data:\n\n`;

  Object.keys(moduleData).forEach((module) => {
    prompt += `\n## ${module.toUpperCase()}\n`;
    prompt += JSON.stringify(moduleData[module], null, 2);
    prompt += '\n';
  });

  prompt += `\n\nProvide comprehensive insights including:
1. Overall business health assessment
2. Cross-module correlations and patterns
3. Specific recommendations for each module
4. Strategic priorities for the next quarter
5. Potential risks and mitigation strategies`;

  return prompt;
}

/**
 * Calculate total data points analyzed
 */
function calculateDataPoints(moduleData) {
  let total = 0;
  Object.values(moduleData).forEach((data) => {
    if (data.stats) total += Object.keys(data.stats).length;
    if (data.trends) total += data.trends.length;
    if (data.records) total += data.records.length;
  });
  return total;
}

// Module-specific data gathering functions
async function getCustomerData(ownerId) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [total, new30Days, topCustomers] = await Promise.all([
    Client.countDocuments({ owner: ownerId, removed: false }),
    Client.countDocuments({
      owner: ownerId,
      removed: false,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    Client.find({ owner: ownerId, removed: false })
      .sort({ totalRevenue: -1 })
      .limit(5)
      .select('name email totalRevenue orderCount')
      .lean(),
  ]);

  return {
    stats: {
      total,
      new30Days,
      growthRate: total > 0 ? ((new30Days / total) * 100).toFixed(2) : 0,
    },
    topCustomers: topCustomers.map((c) => ({
      name: c.name || 'N/A',
      revenue: c.totalRevenue || 0,
      orders: c.orderCount || 0,
    })),
  };
}

async function getSalesData(ownerId) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [revenue, invoices, quotes] = await Promise.all([
    Invoice.aggregate([
      { $match: { owner: ownerId, removed: false, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Invoice.countDocuments({ owner: ownerId, removed: false }),
    Quote.aggregate([
      { $match: { owner: ownerId, removed: false, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  return {
    stats: {
      revenue30Days: revenue[0]?.total || 0,
      invoices30Days: revenue[0]?.count || 0,
      avgInvoiceValue: revenue[0]?.count ? (revenue[0].total / revenue[0].count).toFixed(2) : 0,
      quoteConversionRate: quotes[0]?.total
        ? ((quotes[0].converted / quotes[0].total) * 100).toFixed(2)
        : 0,
    },
  };
}

async function getMarketingData(ownerId) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const campaigns = await Campaign.aggregate([
    { $match: { owner: ownerId, removed: false, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalClicks: { $sum: '$analytics.clicks' },
        totalConversions: { $sum: '$analytics.conversions' },
      },
    },
  ]);

  return {
    stats: {
      activeCampaigns: campaigns.find((c) => c._id === 'active')?.count || 0,
      totalClicks: campaigns.reduce((sum, c) => sum + (c.totalClicks || 0), 0),
      totalConversions: campaigns.reduce((sum, c) => sum + (c.totalConversions || 0), 0),
    },
  };
}

async function getReputationData(ownerId) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const reviews = await Review.aggregate([
    { $match: { owner: ownerId, removed: false, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        total: { $sum: 1 },
        positive: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
        negative: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } },
      },
    },
  ]);

  return {
    stats: {
      avgRating: reviews[0]?.avgRating?.toFixed(2) || 0,
      total30Days: reviews[0]?.total || 0,
      positiveRate: reviews[0]?.total
        ? ((reviews[0].positive / reviews[0].total) * 100).toFixed(2)
        : 0,
      negativeRate: reviews[0]?.total
        ? ((reviews[0].negative / reviews[0].total) * 100).toFixed(2)
        : 0,
    },
  };
}

async function getTaskData(ownerId) {
  const tasks = await Task.aggregate([
    { $match: { owner: ownerId, removed: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = tasks.reduce((sum, t) => sum + t.count, 0);
  const completed = tasks.find((t) => t._id === 'completed')?.count || 0;

  return {
    stats: {
      total,
      completed,
      pending: tasks.find((t) => t._id === 'pending')?.count || 0,
      inProgress: tasks.find((t) => t._id === 'in-progress')?.count || 0,
      completionRate: total ? ((completed / total) * 100).toFixed(2) : 0,
    },
  };
}

// Detailed insights functions
async function getCustomerInsights(ownerId) {
  const data = await getCustomerData(ownerId);

  // Add churn risk analysis
  const at30Days = new Date();
  at30Days.setDate(at30Days.getDate() - 30);

  const recentActivity = await Client.aggregate([
    { $match: { owner: ownerId, removed: false } },
    {
      $lookup: {
        from: 'invoices',
        localField: '_id',
        foreignField: 'client',
        as: 'recentInvoices',
      },
    },
    {
      $project: {
        name: 1,
        lastActivity: { $max: '$recentInvoices.createdAt' },
        inactive: {
          $cond: {
            if: { $lt: [{ $max: '$recentInvoices.createdAt' }, at30Days] },
            then: 1,
            else: 0,
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalInactive: { $sum: '$inactive' },
      },
    },
  ]);

  data.churnRisk = {
    inactiveCustomers: recentActivity[0]?.totalInactive || 0,
    riskLevel: recentActivity[0]?.totalInactive > data.stats.total * 0.2 ? 'high' : 'low',
  };

  return data;
}

async function getSalesInsights(ownerId) {
  const data = await getSalesData(ownerId);

  // Add sales velocity
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const velocity = await Invoice.aggregate([
    { $match: { owner: ownerId, removed: false, createdAt: { $gte: last7Days } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
      },
    },
  ]);

  data.velocity = {
    dailyAverage: velocity.length
      ? (velocity.reduce((sum, v) => sum + v.revenue, 0) / velocity.length).toFixed(2)
      : 0,
    trend:
      velocity.length > 3
        ? velocity[velocity.length - 1].revenue > velocity[0].revenue
          ? 'increasing'
          : 'decreasing'
        : 'stable',
  };

  return data;
}

async function getMarketingInsights(ownerId) {
  return await getMarketingData(ownerId);
}

async function getReputationInsights(ownerId) {
  const data = await getReputationData(ownerId);

  // Add sentiment trend
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const sentimentTrend = await Review.aggregate([
    { $match: { owner: ownerId, removed: false, createdAt: { $gte: last30Days } } },
    {
      $group: {
        _id: {
          week: { $week: '$createdAt' },
        },
        avgRating: { $avg: '$rating' },
      },
    },
    { $sort: { '_id.week': 1 } },
  ]);

  data.trend = {
    weekly: sentimentTrend.map((t) => ({
      week: t._id.week,
      rating: t.avgRating.toFixed(2),
    })),
    direction:
      sentimentTrend.length > 1
        ? sentimentTrend[sentimentTrend.length - 1].avgRating > sentimentTrend[0].avgRating
          ? 'improving'
          : 'declining'
        : 'stable',
  };

  return data;
}

async function getTaskInsights(ownerId) {
  const data = await getTaskData(ownerId);

  // Add overdue tasks
  const now = new Date();
  const overdue = await Task.countDocuments({
    owner: ownerId,
    removed: false,
    dueDate: { $lt: now },
    status: { $ne: 'completed' },
  });

  data.overdue = {
    count: overdue,
    percentage: data.stats.total ? ((overdue / data.stats.total) * 100).toFixed(2) : 0,
  };

  return data;
}

export = {
  analyzeModules,
  getModuleInsights,
  gatherModuleData,
};
