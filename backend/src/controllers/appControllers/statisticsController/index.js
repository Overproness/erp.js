const mongoose = require('mongoose');

// Import models
const Client = require('../../models/appModels/Client');
const Invoice = require('../../models/appModels/Invoice');
const Quote = require('../../models/appModels/Quote');
const Payment = require('../../models/appModels/Payment');
const PaymentMode = require('../../models/appModels/PaymentMode');
const Tax = require('../../models/appModels/Tax');
const Task = require('../../models/appModels/Task');
const Team = require('../../models/appModels/Team');
const Document = require('../../models/appModels/Document');

/**
 * Get dashboard statistics
 * GET /api/stats/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    // Aggregate all statistics in parallel
    const [invoiceStats, quoteStats, paymentStats, clientStats, recentInvoices, recentQuotes] =
      await Promise.all([
        // Invoice statistics
        Invoice.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              totalAmount: [{ $group: { _id: null, total: { $sum: '$total' } } }],
              thisMonth: [
                {
                  $match: {
                    date: { $gte: dateFrom },
                  },
                },
                { $count: 'count' },
              ],
              byStatus: [
                {
                  $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$total' },
                  },
                },
              ],
              unpaid: [
                {
                  $match: {
                    paymentStatus: { $in: ['unpaid', 'partially'] },
                  },
                },
                {
                  $group: {
                    _id: null,
                    count: { $sum: 1 },
                    total: { $sum: '$total' },
                  },
                },
              ],
            },
          },
        ]),

        // Quote statistics
        Quote.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              totalAmount: [{ $group: { _id: null, total: { $sum: '$total' } } }],
              thisMonth: [
                {
                  $match: {
                    date: { $gte: dateFrom },
                  },
                },
                { $count: 'count' },
              ],
              byStatus: [
                {
                  $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$total' },
                  },
                },
              ],
              pending: [
                {
                  $match: {
                    status: 'pending',
                  },
                },
                {
                  $group: {
                    _id: null,
                    count: { $sum: 1 },
                    total: { $sum: '$total' },
                  },
                },
              ],
            },
          },
        ]),

        // Payment statistics
        Payment.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              totalAmount: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
              thisMonth: [
                {
                  $match: {
                    date: { $gte: dateFrom },
                  },
                },
                {
                  $group: {
                    _id: null,
                    count: { $sum: 1 },
                    total: { $sum: '$amount' },
                  },
                },
              ],
              byMethod: [
                {
                  $group: {
                    _id: '$paymentMode',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' },
                  },
                },
              ],
            },
          },
        ]),

        // Client statistics
        Client.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              active: [
                {
                  $match: {
                    enabled: true,
                  },
                },
                { $count: 'count' },
              ],
              newThisMonth: [
                {
                  $match: {
                    created: { $gte: dateFrom },
                  },
                },
                { $count: 'count' },
              ],
              companies: [
                {
                  $match: {
                    customerType: 'company',
                  },
                },
                { $count: 'count' },
              ],
              individuals: [
                {
                  $match: {
                    customerType: 'individual',
                  },
                },
                { $count: 'count' },
              ],
            },
          },
        ]),

        // Recent invoices for performance chart
        Invoice.find()
          .populate('client', 'name')
          .sort({ date: -1 })
          .limit(10)
          .select('number client total status paymentStatus date currency'),

        // Recent quotes for performance chart
        Quote.find()
          .populate('client', 'name')
          .sort({ date: -1 })
          .limit(10)
          .select('number client total status date currency'),
      ]);

    // Format the response
    const stats = {
      invoices: {
        total: invoiceStats[0]?.total[0]?.count || 0,
        totalAmount: invoiceStats[0]?.totalAmount[0]?.total || 0,
        thisMonth: invoiceStats[0]?.thisMonth[0]?.count || 0,
        byStatus: invoiceStats[0]?.byStatus || [],
        unpaid: {
          count: invoiceStats[0]?.unpaid[0]?.count || 0,
          total: invoiceStats[0]?.unpaid[0]?.total || 0,
        },
      },
      quotes: {
        total: quoteStats[0]?.total[0]?.count || 0,
        totalAmount: quoteStats[0]?.totalAmount[0]?.total || 0,
        thisMonth: quoteStats[0]?.thisMonth[0]?.count || 0,
        byStatus: quoteStats[0]?.byStatus || [],
        pending: {
          count: quoteStats[0]?.pending[0]?.count || 0,
          total: quoteStats[0]?.pending[0]?.total || 0,
        },
      },
      payments: {
        total: paymentStats[0]?.total[0]?.count || 0,
        totalAmount: paymentStats[0]?.totalAmount[0]?.total || 0,
        thisMonth: paymentStats[0]?.thisMonth[0] || { count: 0, total: 0 },
        byMethod: paymentStats[0]?.byMethod || [],
      },
      clients: {
        total: clientStats[0]?.total[0]?.count || 0,
        active: clientStats[0]?.active[0]?.count || 0,
        newThisMonth: clientStats[0]?.newThisMonth[0]?.count || 0,
        companies: clientStats[0]?.companies[0]?.count || 0,
        individuals: clientStats[0]?.individuals[0]?.count || 0,
      },
      performance: {
        recentInvoices: recentInvoices || [],
        recentQuotes: recentQuotes || [],
      },
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result: stats,
      message: 'Dashboard statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Get client/customer statistics
 * GET /api/stats/clients
 */
const getClientStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const stats = await Client.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [
            {
              $match: { enabled: true },
            },
            { $count: 'count' },
          ],
          newThisMonth: [
            {
              $match: { created: { $gte: dateFrom } },
            },
            { $count: 'count' },
          ],
          companies: [
            {
              $match: { customerType: 'company' },
            },
            { $count: 'count' },
          ],
          byType: [
            {
              $group: {
                _id: '$customerType',
                count: { $sum: 1 },
              },
            },
          ],
          recentActivity: [
            {
              $match: { updated: { $gte: dateFrom } },
            },
            {
              $project: {
                name: 1,
                email: 1,
                phone: 1,
                updated: 1,
                enabled: 1,
              },
            },
            { $sort: { updated: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ]);

    const result = {
      totalClients: stats[0]?.total[0]?.count || 0,
      activeClients: stats[0]?.active[0]?.count || 0,
      newThisMonth: stats[0]?.newThisMonth[0]?.count || 0,
      companies: stats[0]?.companies[0]?.count || 0,
      byType: stats[0]?.byType || [],
      recentActivity: stats[0]?.recentActivity || [],
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Client statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Client Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve client statistics',
      error: error.message,
    });
  }
};

/**
 * Get invoice statistics
 * GET /api/stats/invoices
 */
const getInvoiceStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const stats = await Invoice.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          totalAmount: [{ $group: { _id: null, total: { $sum: '$total' } } }],
          thisMonth: [{ $match: { date: { $gte: dateFrom } } }, { $count: 'count' }],
          thisMonthAmount: [
            { $match: { date: { $gte: dateFrom } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$total' },
              },
            },
          ],
          byPaymentStatus: [
            {
              $group: {
                _id: '$paymentStatus',
                count: { $sum: 1 },
                total: { $sum: '$total' },
              },
            },
          ],
          unpaidTotal: [
            {
              $match: { paymentStatus: { $in: ['unpaid', 'partially'] } },
            },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                paymentStatus: { $in: ['unpaid', 'partially'] },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                total: { $sum: '$total' },
              },
            },
          ],
        },
      },
    ]);

    const result = {
      totalInvoices: stats[0]?.total[0]?.count || 0,
      totalAmount: stats[0]?.totalAmount[0]?.total || 0,
      thisMonth: stats[0]?.thisMonth[0]?.count || 0,
      thisMonthAmount: stats[0]?.thisMonthAmount[0]?.total || 0,
      byStatus: stats[0]?.byStatus || [],
      byPaymentStatus: stats[0]?.byPaymentStatus || [],
      unpaidTotal: stats[0]?.unpaidTotal[0]?.total || 0,
      overdue: stats[0]?.overdue[0] || { count: 0, total: 0 },
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Invoice statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Invoice Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve invoice statistics',
      error: error.message,
    });
  }
};

/**
 * Get quote statistics
 * GET /api/stats/quotes
 */
const getQuoteStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const stats = await Quote.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          totalAmount: [{ $group: { _id: null, total: { $sum: '$total' } } }],
          thisMonth: [{ $match: { date: { $gte: dateFrom } } }, { $count: 'count' }],
          thisMonthAmount: [
            { $match: { date: { $gte: dateFrom } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$total' },
              },
            },
          ],
          pending: [
            { $match: { status: 'pending' } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                total: { $sum: '$total' },
              },
            },
          ],
          accepted: [
            { $match: { status: 'accepted' } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                total: { $sum: '$total' },
              },
            },
          ],
          expired: [
            {
              $match: {
                expiredDate: { $lt: new Date() },
                status: { $nin: ['accepted', 'declined'] },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                total: { $sum: '$total' },
              },
            },
          ],
        },
      },
    ]);

    const result = {
      totalQuotes: stats[0]?.total[0]?.count || 0,
      totalAmount: stats[0]?.totalAmount[0]?.total || 0,
      thisMonth: stats[0]?.thisMonth[0]?.count || 0,
      thisMonthAmount: stats[0]?.thisMonthAmount[0]?.total || 0,
      byStatus: stats[0]?.byStatus || [],
      pending: stats[0]?.pending[0] || { count: 0, total: 0 },
      accepted: stats[0]?.accepted[0] || { count: 0, total: 0 },
      expired: stats[0]?.expired[0] || { count: 0, total: 0 },
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Quote statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Quote Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve quote statistics',
      error: error.message,
    });
  }
};

/**
 * Get payment statistics
 * GET /api/stats/payments
 */
const getPaymentStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const stats = await Payment.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          totalAmount: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
          thisMonth: [
            { $match: { date: { $gte: dateFrom } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                total: { $sum: '$amount' },
              },
            },
          ],
          byMethod: [
            {
              $group: {
                _id: '$paymentMode',
                count: { $sum: 1 },
                total: { $sum: '$amount' },
              },
            },
          ],
          dailyTrend: [
            {
              $match: { date: { $gte: dateFrom } },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$date' },
                },
                count: { $sum: 1 },
                total: { $sum: '$amount' },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const result = {
      totalPayments: stats[0]?.total[0]?.count || 0,
      totalAmount: stats[0]?.totalAmount[0]?.total || 0,
      thisMonth: stats[0]?.thisMonth[0] || { count: 0, total: 0 },
      byMethod: stats[0]?.byMethod || [],
      dailyTrend: stats[0]?.dailyTrend || [],
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Payment statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Payment Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve payment statistics',
      error: error.message,
    });
  }
};

/**
 * Get team statistics
 * GET /api/stats/teams
 */
const getTeamStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const [teamStats, taskStats] = await Promise.all([
      Team.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { status: 'active' } }, { $count: 'count' }],
            members: [{ $unwind: '$members' }, { $count: 'count' }],
            newThisMonth: [{ $match: { createdAt: { $gte: dateFrom } } }, { $count: 'count' }],
          },
        },
      ]),
      Task.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
            inProgress: [{ $match: { status: 'in_progress' } }, { $count: 'count' }],
            pending: [{ $match: { status: 'pending' } }, { $count: 'count' }],
          },
        },
      ]),
    ]);

    const result = {
      totalTeams: teamStats[0]?.total[0]?.count || 0,
      activeTeams: teamStats[0]?.active[0]?.count || 0,
      totalMembers: teamStats[0]?.members[0]?.count || 0,
      newThisMonth: teamStats[0]?.newThisMonth[0]?.count || 0,
      tasks: {
        total: taskStats[0]?.total[0]?.count || 0,
        completed: taskStats[0]?.completed[0]?.count || 0,
        inProgress: taskStats[0]?.inProgress[0]?.count || 0,
        pending: taskStats[0]?.pending[0]?.count || 0,
      },
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Team statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Team Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve team statistics',
      error: error.message,
    });
  }
};

/**
 * Get task statistics
 * GET /api/stats/tasks
 */
const getTaskStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const stats = await Task.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          inProgress: [{ $match: { status: 'in_progress' } }, { $count: 'count' }],
          pending: [{ $match: { status: 'pending' } }, { $count: 'count' }],
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                status: { $nin: ['completed', 'cancelled'] },
              },
            },
            { $count: 'count' },
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
          ],
          completedThisMonth: [
            {
              $match: {
                status: 'completed',
                updatedAt: { $gte: dateFrom },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const result = {
      totalTasks: stats[0]?.total[0]?.count || 0,
      completed: stats[0]?.completed[0]?.count || 0,
      inProgress: stats[0]?.inProgress[0]?.count || 0,
      pending: stats[0]?.pending[0]?.count || 0,
      overdue: stats[0]?.overdue[0]?.count || 0,
      byPriority: stats[0]?.byPriority || [],
      completedThisMonth: stats[0]?.completedThisMonth[0]?.count || 0,
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Task statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Task Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve task statistics',
      error: error.message,
    });
  }
};

/**
 * Get document statistics
 * GET /api/stats/documents
 */
const getDocumentStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const stats = await Document.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          uploadedThisMonth: [{ $match: { created: { $gte: dateFrom } } }, { $count: 'count' }],
          totalSize: [
            {
              $group: {
                _id: null,
                size: { $sum: '$size' },
              },
            },
          ],
        },
      },
    ]);

    const result = {
      totalDocuments: stats[0]?.total[0]?.count || 0,
      byType: stats[0]?.byType || [],
      byStatus: stats[0]?.byStatus || [],
      uploadedThisMonth: stats[0]?.uploadedThisMonth[0]?.count || 0,
      totalSize: stats[0]?.totalSize[0]?.size || 0,
      timeframe: `${timeframe} days`,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Document statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get Document Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve document statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getClientStats,
  getInvoiceStats,
  getQuoteStats,
  getPaymentStats,
  getTeamStats,
  getTaskStats,
  getDocumentStats,
};
