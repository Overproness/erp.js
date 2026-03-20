// @ts-nocheck
const {
  Client,
  Invoice,
  Quote,
  Payment,
  Campaign,
  Review,
  Survey,
  Task,
  Appointment,
  Document,
  SocialPost,
  URL,
} = require('../../../models');
const predictiveService = require('../../../services/predictiveService');
const aiInsightsService = require('../../../services/aiInsightsService');

/**
 * Global Analytics Controller
 * Provides comprehensive analytics across all modules
 */

/**
 * Get global dashboard with metrics from all modules
 */
const getGlobalDashboard = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dateFilter = {
      createdAt: { $gte: start, $lte: end },
    };

    // Parallel fetching of metrics from different modules
    const [customerStats, salesStats, marketingStats, reputationStats, taskStats, documentStats] =
      await Promise.all([
        // CRM Stats
        Client.aggregate([
          { $match: { owner: ownerId, removed: false, ...dateFilter } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              newCustomers: { $sum: 1 },
            },
          },
        ]),

        // Sales Stats
        Promise.all([
          Invoice.aggregate([
            { $match: { owner: ownerId, removed: false, ...dateFilter } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                invoiceCount: { $sum: 1 },
                avgValue: { $avg: '$total' },
              },
            },
          ]),
          Quote.aggregate([
            { $match: { owner: ownerId, removed: false, ...dateFilter } },
            {
              $group: {
                _id: null,
                quoteCount: { $sum: 1 },
                quoteValue: { $sum: '$total' },
              },
            },
          ]),
          Payment.aggregate([
            { $match: { owner: ownerId, removed: false, ...dateFilter } },
            {
              $group: {
                _id: null,
                paymentCount: { $sum: 1 },
                paymentTotal: { $sum: '$amount' },
              },
            },
          ]),
        ]),

        // Marketing Stats
        Promise.all([
          Campaign.aggregate([
            { $match: { owner: ownerId, removed: false, ...dateFilter } },
            {
              $group: {
                _id: null,
                campaignCount: { $sum: 1 },
                activeCampaigns: {
                  $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                },
              },
            },
          ]),
          SocialPost.aggregate([
            { $match: { owner: ownerId, removed: false, ...dateFilter } },
            {
              $group: {
                _id: null,
                postCount: { $sum: 1 },
                totalEngagement: { $sum: { $add: ['$likes', '$shares', '$comments'] } },
              },
            },
          ]),
        ]),

        // Reputation Stats
        Review.aggregate([
          { $match: { owner: ownerId, removed: false, ...dateFilter } },
          {
            $group: {
              _id: null,
              reviewCount: { $sum: 1 },
              avgRating: { $avg: '$rating' },
              positiveReviews: {
                $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] },
              },
            },
          },
        ]),

        // Task Stats
        Task.aggregate([
          { $match: { owner: ownerId, removed: false, ...dateFilter } },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
              },
              pendingTasks: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
              },
            },
          },
        ]),

        // Document Stats
        Document.aggregate([
          { $match: { owner: ownerId, removed: false, ...dateFilter } },
          {
            $group: {
              _id: null,
              documentCount: { $sum: 1 },
              totalSize: { $sum: '$size' },
            },
          },
        ]),
      ]);

    // Format response
    const dashboard = {
      dateRange: { start, end },
      crm: {
        totalCustomers: customerStats[0]?.total || 0,
        newCustomers: customerStats[0]?.newCustomers || 0,
      },
      sales: {
        revenue: salesStats[0][0]?.totalRevenue || 0,
        invoices: salesStats[0][0]?.invoiceCount || 0,
        quotes: salesStats[1][0]?.quoteCount || 0,
        payments: salesStats[2][0]?.paymentCount || 0,
        avgInvoiceValue: salesStats[0][0]?.avgValue || 0,
      },
      marketing: {
        campaigns: marketingStats[0][0]?.campaignCount || 0,
        activeCampaigns: marketingStats[0][0]?.activeCampaigns || 0,
        socialPosts: marketingStats[1][0]?.postCount || 0,
        engagement: marketingStats[1][0]?.totalEngagement || 0,
      },
      reputation: {
        reviews: reputationStats[0]?.reviewCount || 0,
        avgRating: reputationStats[0]?.avgRating || 0,
        positiveReviews: reputationStats[0]?.positiveReviews || 0,
      },
      tasks: {
        total: taskStats[0]?.totalTasks || 0,
        completed: taskStats[0]?.completedTasks || 0,
        pending: taskStats[0]?.pendingTasks || 0,
        completionRate: taskStats[0]?.totalTasks
          ? ((taskStats[0]?.completedTasks / taskStats[0]?.totalTasks) * 100).toFixed(2)
          : 0,
      },
      documents: {
        count: documentStats[0]?.documentCount || 0,
        totalSize: documentStats[0]?.totalSize || 0,
      },
    };

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching global dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch global dashboard',
      error: error.message,
    });
  }
};

/**
 * Get real-time metrics
 */
const getRealTimeMetrics = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;
    const now = new Date();
    const hourAgo = new Date(now - 60 * 60 * 1000);

    const [recentCustomers, recentInvoices, recentTasks] = await Promise.all([
      Client.countDocuments({
        owner: ownerId,
        removed: false,
        createdAt: { $gte: hourAgo },
      }),
      Invoice.countDocuments({
        owner: ownerId,
        removed: false,
        createdAt: { $gte: hourAgo },
      }),
      Task.countDocuments({
        owner: ownerId,
        removed: false,
        updatedAt: { $gte: hourAgo },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        timestamp: now,
        lastHour: {
          newCustomers: recentCustomers,
          newInvoices: recentInvoices,
          taskUpdates: recentTasks,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time metrics',
      error: error.message,
    });
  }
};

/**
 * Get analytics for a specific module
 */
const getModuleAnalytics = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;
    const { moduleName } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let data = {};

    switch (moduleName.toLowerCase()) {
      case 'crm':
      case 'customers':
        data = await getCustomerAnalytics(ownerId, start, end);
        break;
      case 'sales':
        data = await getSalesAnalytics(ownerId, start, end);
        break;
      case 'marketing':
        data = await getMarketingAnalytics(ownerId, start, end);
        break;
      case 'reputation':
        data = await getReputationAnalytics(ownerId, start, end);
        break;
      case 'tasks':
        data = await getTaskAnalytics(ownerId, start, end);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid module name',
        });
    }

    return res.status(200).json({
      success: true,
      data: {
        module: moduleName,
        dateRange: { start, end },
        ...data,
      },
    });
  } catch (error) {
    console.error('Error fetching module analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch module analytics',
      error: error.message,
    });
  }
};

/**
 * Get overview of all modules
 */
const getAllModulesOverview = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;

    const modules = [
      {
        name: 'CRM',
        icon: 'customer',
        count: await Client.countDocuments({ owner: ownerId, removed: false }),
      },
      {
        name: 'Sales',
        icon: 'invoice',
        count: await Invoice.countDocuments({ owner: ownerId, removed: false }),
      },
      {
        name: 'Marketing',
        icon: 'campaign',
        count: await Campaign.countDocuments({ owner: ownerId, removed: false }),
      },
      {
        name: 'Reputation',
        icon: 'star',
        count: await Review.countDocuments({ owner: ownerId, removed: false }),
      },
      {
        name: 'Tasks',
        icon: 'check',
        count: await Task.countDocuments({ owner: ownerId, removed: false }),
      },
      {
        name: 'Documents',
        icon: 'file',
        count: await Document.countDocuments({ owner: ownerId, removed: false }),
      },
    ];

    return res.status(200).json({
      success: true,
      data: modules,
    });
  } catch (error) {
    console.error('Error fetching modules overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch modules overview',
      error: error.message,
    });
  }
};

/**
 * Create custom report
 */
const createCustomReport = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;
    const { name, description, modules, visualizations, filters } = req.body;

    // Generate report data immediately
    const reportData = await generateReportData(ownerId, modules, filters);

    // Store report configuration with data
    const reportConfig = {
      name,
      description,
      modules,
      visualizations,
      filters,
      data: reportData,
      owner: ownerId,
      createdAt: new Date(),
      generatedAt: new Date(),
    };

    // TODO: Save to database (create ReportConfig model)

    return res.status(201).json({
      success: true,
      message: 'Custom report created and generated successfully',
      report: reportConfig,
    });
  } catch (error) {
    console.error('Error creating custom report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create custom report',
      error: error.message,
    });
  }
};

/**
 * Helper function to generate report data
 */
async function generateReportData(ownerId, modules, filters) {
  const reportData = {};
  const dateRange = parseDateRange(filters.dateRange);

  for (const module of modules) {
    switch (module.toLowerCase()) {
      case 'crm':
      case 'customers':
        reportData.customers = await getCustomerAnalytics(ownerId, dateRange.start, dateRange.end);
        break;

      case 'sales':
        reportData.sales = await getSalesAnalytics(ownerId, dateRange.start, dateRange.end);
        break;

      case 'marketing':
        reportData.marketing = await getMarketingAnalytics(ownerId, dateRange.start, dateRange.end);
        break;

      case 'reputation':
        reportData.reputation = await getReputationAnalytics(
          ownerId,
          dateRange.start,
          dateRange.end
        );
        break;

      case 'tasks':
        reportData.tasks = await getTaskAnalytics(ownerId, dateRange.start, dateRange.end);
        break;

      default:
        break;
    }
  }

  return reportData;
}

/**
 * Helper function to parse date range
 */
function parseDateRange(rangeString) {
  const end = new Date();
  const start = new Date();

  switch (rangeString) {
    case 'last7days':
      start.setDate(start.getDate() - 7);
      break;
    case 'last30days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last90days':
      start.setDate(start.getDate() - 90);
      break;
    case 'thisMonth':
      start.setDate(1);
      break;
    case 'lastMonth':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      break;
    case 'thisYear':
      start.setMonth(0);
      start.setDate(1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

/**
 * Get predictive analytics
 */
const getPredictiveAnalytics = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;
    const { metric, period } = req.body;

    const prediction = await predictiveService.predict(ownerId, metric, period);

    // The service already returns { success, data } structure
    if (!prediction.success) {
      return res.status(400).json(prediction);
    }

    return res.status(200).json(prediction);
  } catch (error) {
    console.error('Error getting predictive analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get predictive analytics',
      error: error.message,
    });
  }
};

/**
 * Get AI-powered insights
 */
const getAIInsights = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;
    const { modules, analysisType } = req.body;

    const insights = await aiInsightsService.analyzeModules(ownerId, modules, analysisType);

    return res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI insights',
      error: error.message,
    });
  }
};

/**
 * Get AI insights for specific modules
 */
const getAIModuleInsights = async (req, res) => {
  try {
    const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;
    const { moduleName } = req.body;

    const insights = await aiInsightsService.getModuleInsights(ownerId, moduleName);

    return res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error getting AI module insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI module insights',
      error: error.message,
    });
  }
};

// Helper functions for module-specific analytics
async function getCustomerAnalytics(ownerId, start, end) {
  const customers = await Client.aggregate([
    {
      $match: {
        owner: ownerId,
        removed: false,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return { timeline: customers };
}

async function getSalesAnalytics(ownerId, start, end) {
  const sales = await Invoice.aggregate([
    {
      $match: {
        owner: ownerId,
        removed: false,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return { timeline: sales };
}

async function getMarketingAnalytics(ownerId, start, end) {
  const campaigns = await Campaign.aggregate([
    {
      $match: {
        owner: ownerId,
        removed: false,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return { campaigns };
}

async function getReputationAnalytics(ownerId, start, end) {
  const reviews = await Review.aggregate([
    {
      $match: {
        owner: ownerId,
        removed: false,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return { ratingDistribution: reviews };
}

async function getTaskAnalytics(ownerId, start, end) {
  const tasks = await Task.aggregate([
    {
      $match: {
        owner: ownerId,
        removed: false,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return { statusDistribution: tasks };
}

// Export data
const exportData = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { format, modules, startDate, endDate } = req.body;

    // TODO: Implement export logic
    return res.status(200).json({
      success: true,
      message: 'Export functionality to be implemented',
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message,
    });
  }
};

// Placeholder functions for report management
const listReports = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getReport = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const generateReport = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Placeholder functions for schedule management
const createSchedule = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(201).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const listSchedules = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getSchedule = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getTrendAnalysis = async (req, res) => {
  try {
    // TODO: Implement
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getGlobalDashboard,
  getRealTimeMetrics,
  getModuleAnalytics,
  getAllModulesOverview,
  createCustomReport,
  listReports,
  getReport,
  generateReport,
  deleteReport,
  createSchedule,
  listSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  getPredictiveAnalytics,
  getTrendAnalysis,
  getAIInsights,
  getAIModuleInsights,
  exportData,
};
