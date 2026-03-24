// @ts-nocheck
const mongoose = require('mongoose');

/**
 * Statistics Controller - Provides business analytics and metrics
 */
const statisticsController = {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(req, res) {
    try {
      // Get owner from authentication context
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      // Get timeframe from query params (default: 30 days)
      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      // Get models
      const Invoice = mongoose.model('Invoice');
      const Quote = mongoose.model('Quote');
      const Payment = mongoose.model('Payment');
      const Client = mongoose.model('Client');

      // Base filter for owner isolation
      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      // Parallel queries for better performance
      const [
        allInvoices,
        recentInvoices,
        allQuotes,
        recentQuotes,
        allPayments,
        recentPayments,
        allClients,
        recentClients,
      ] = await Promise.all([
        Invoice.find(baseFilter),
        Invoice.find(timeFilter),
        Quote.find(baseFilter),
        Quote.find(timeFilter),
        Payment.find(baseFilter),
        Payment.find(timeFilter),
        Client.find(baseFilter),
        Client.find(timeFilter),
      ]);

      // Calculate invoice statistics
      const invoiceStats = {
        total: allInvoices.length,
        totalAmount: allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        thisMonth: recentInvoices.length,
        thisMonthAmount: recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        byStatus: calculateStatusDistribution(allInvoices, 'status'),
        unpaid: {
          total: allInvoices
            .filter((inv) => inv.paymentStatus === 'unpaid' || inv.status === 'draft')
            .reduce((sum, inv) => sum + (inv.total || 0), 0),
          count: allInvoices.filter(
            (inv) => inv.paymentStatus === 'unpaid' || inv.status === 'draft'
          ).length,
        },
      };

      // Calculate quote statistics
      const quoteStats = {
        total: allQuotes.length,
        totalAmount: allQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0),
        thisMonth: recentQuotes.length,
        thisMonthAmount: recentQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0),
        byStatus: calculateStatusDistribution(allQuotes, 'status'),
      };

      // Calculate payment statistics
      const paymentStats = {
        total: allPayments.length,
        totalAmount: allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        thisMonth: {
          total: recentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
          count: recentPayments.length,
        },
      };

      // Calculate client statistics
      const clientStats = {
        total: allClients.length,
        active: allClients.filter((client) => client.enabled !== false).length,
        newThisMonth: recentClients.length,
        byType: calculateStatusDistribution(allClients, 'customerType'),
      };

      // Calculate performance metrics
      const performance = {
        conversionRate:
          allQuotes.length > 0 ? Number(((allInvoices.length / allQuotes.length) * 100).toFixed(2)) : 0,
        averageInvoiceValue:
          allInvoices.length > 0 ? Number((invoiceStats.totalAmount / allInvoices.length).toFixed(2)) : 0,
        averageQuoteValue:
          allQuotes.length > 0 ? Number((quoteStats.totalAmount / allQuotes.length).toFixed(2)) : 0,
        paymentEfficiency:
          allInvoices.length > 0
            ? Number((
                (allInvoices.filter((inv) => inv.paymentStatus === 'paid').length /
                  allInvoices.length) *
                100
              ).toFixed(2))
            : 0,
      };

      const result = {
        invoices: invoiceStats,
        quotes: quoteStats,
        payments: paymentStats,
        clients: clientStats,
        performance,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Dashboard statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get client-specific statistics
   */
  async getClientStats(req, res) {
    try {
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Client = mongoose.model('Client');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allClients, recentClients] = await Promise.all([
        Client.find(baseFilter),
        Client.find(timeFilter),
      ]);

      const result = {
        total: allClients.length,
        active: allClients.filter((c) => c.enabled !== false).length,
        newThisMonth: recentClients.length,
        byType: calculateStatusDistribution(allClients, 'customerType'),
        bySegment: calculateStatusDistribution(allClients, 'customerValue.segment'),
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Client statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Client stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get invoice-specific statistics
   */
  async getInvoiceStats(req, res) {
    try {
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Invoice = mongoose.model('Invoice');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allInvoices, recentInvoices] = await Promise.all([
        Invoice.find(baseFilter),
        Invoice.find(timeFilter),
      ]);

      const result = {
        totalInvoices: allInvoices.length,
        totalAmount: allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        thisMonth: recentInvoices.length,
        thisMonthAmount: recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        byStatus: calculateStatusDistribution(allInvoices, 'status'),
        byPaymentStatus: calculateStatusDistribution(allInvoices, 'paymentStatus'),
        averageValue:
          allInvoices.length > 0
            ? (
                allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / allInvoices.length
              ).toFixed(2)
            : 0,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Invoice statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Invoice stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get quote-specific statistics
   */
  async getQuoteStats(req, res) {
    try {
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Quote = mongoose.model('Quote');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allQuotes, recentQuotes] = await Promise.all([
        Quote.find(baseFilter),
        Quote.find(timeFilter),
      ]);

      const result = {
        totalQuotes: allQuotes.length,
        totalAmount: allQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0),
        thisMonth: recentQuotes.length,
        thisMonthAmount: recentQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0),
        byStatus: calculateStatusDistribution(allQuotes, 'status'),
        averageValue:
          allQuotes.length > 0
            ? (
                allQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0) / allQuotes.length
              ).toFixed(2)
            : 0,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Quote statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Quote stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get payment-specific statistics
   */
  async getPaymentStats(req, res) {
    try {
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Payment = mongoose.model('Payment');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allPayments, recentPayments] = await Promise.all([
        Payment.find(baseFilter),
        Payment.find(timeFilter),
      ]);

      const result = {
        totalPayments: allPayments.length,
        totalAmount: allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        thisMonth: {
          count: recentPayments.length,
          total: recentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        },
        averageValue:
          allPayments.length > 0
            ? (
                allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) /
                allPayments.length
              ).toFixed(2)
            : 0,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Payment statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Payment stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get team-specific statistics
   */
  async getTeamStats(req, res) {
    try {
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Team = mongoose.model('Team');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allTeams, recentTeams] = await Promise.all([
        Team.find(baseFilter),
        Team.find(timeFilter),
      ]);

      const result = {
        totalTeams: allTeams.length,
        activeTeams: allTeams.filter((team) => team.enabled !== false).length,
        newThisMonth: recentTeams.length,
        totalMembers: allTeams.reduce((sum, team) => sum + (team.members?.length || 0), 0),
        averageTeamSize:
          allTeams.length > 0
            ? (
                allTeams.reduce((sum, team) => sum + (team.members?.length || 0), 0) /
                allTeams.length
              ).toFixed(1)
            : 0,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Team statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Team stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get task-specific statistics
   */
  async getTaskStats(req, res) {
    try {
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Task = mongoose.model('Task');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allTasks, recentTasks] = await Promise.all([
        Task.find(baseFilter),
        Task.find(timeFilter),
      ]);

      const result = {
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter((task) => task.status === 'completed').length,
        pendingTasks: allTasks.filter(
          (task) => task.status === 'pending' || task.status === 'in_progress'
        ).length,
        newThisMonth: recentTasks.length,
        byStatus: calculateStatusDistribution(allTasks, 'status'),
        byPriority: calculateStatusDistribution(allTasks, 'priority'),
        completionRate:
          allTasks.length > 0
            ? (
                (allTasks.filter((task) => task.status === 'completed').length / allTasks.length) *
                100
              ).toFixed(2)
            : 0,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Task statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Task stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get document-specific statistics
   */
  async getDocumentStats(req, res) {
    try {
      // Use the same owner logic as the document controller
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Document = mongoose.model('Document');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allDocuments, recentDocuments] = await Promise.all([
        Document.find(baseFilter),
        Document.find(timeFilter),
      ]);

      const result = {
        totalDocuments: allDocuments.length,
        newThisMonth: recentDocuments.length,
        byType: calculateStatusDistribution(allDocuments, 'type'),
        byStatus: calculateStatusDistribution(allDocuments, 'status'),
        totalSize: allDocuments.reduce((sum, doc) => sum + (doc.size || 0), 0),
        averageSize:
          allDocuments.length > 0
            ? (
                allDocuments.reduce((sum, doc) => sum + (doc.size || 0), 0) / allDocuments.length
              ).toFixed(2)
            : 0,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Document statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Document stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get payment mode statistics
   */
  async getPaymentModeStats(req, res) {
    try {
      // Use the same owner logic as the payment mode controller
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const PaymentMode = mongoose.model('PaymentMode');

      // Use the same filter as the PaymentMode controller
      const baseFilter = { owner, removed: false };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allPaymentModes, recentPaymentModes] = await Promise.all([
        PaymentMode.find(baseFilter),
        PaymentMode.find(timeFilter),
      ]);

      console.log('🚀 ~ PaymentMode Stats Debug:', {
        owner,
        baseFilter,
        allPaymentModes: allPaymentModes.length,
        recentPaymentModes: recentPaymentModes.length,
      });

      const result = {
        totalPaymentModes: allPaymentModes.length,
        activePaymentModes: allPaymentModes.filter((mode) => mode.enabled !== false).length,
        defaultPaymentModes: allPaymentModes.filter((mode) => mode.isDefault === true).length,
        newThisMonth: recentPaymentModes.length,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Payment mode statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Payment mode stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(req, res) {
    try {
      // Use the same owner logic as the workflow controller
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Workflow = mongoose.model('Workflow');
      const WorkflowExecution = mongoose.model('WorkflowExecution');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allWorkflows, recentWorkflows, allExecutions, recentExecutions] = await Promise.all([
        Workflow.find(baseFilter),
        Workflow.find(timeFilter),
        WorkflowExecution.find(baseFilter),
        WorkflowExecution.find(timeFilter),
      ]);

      // Calculate average execution time
      const completedExecutions = allExecutions.filter(
        (ex) => ex.status === 'completed' && ex.startTime && ex.endTime
      );
      const avgExecutionTime =
        completedExecutions.length > 0
          ? completedExecutions.reduce((sum, ex) => {
              const duration = new Date(ex.endTime) - new Date(ex.startTime);
              return sum + duration;
            }, 0) / completedExecutions.length
          : 0;

      const result = {
        totalWorkflows: allWorkflows.length,
        activeWorkflows: allWorkflows.filter((wf) => wf.enabled !== false).length,
        completedTasks: allExecutions.filter((ex) => ex.status === 'completed').length,
        avgExecutionTime: avgExecutionTime > 0 ? `${(avgExecutionTime / 60000).toFixed(1)}m` : '0m',
        newThisMonth: recentWorkflows.length,
        executionsThisMonth: recentExecutions.length,
        byStatus: calculateStatusDistribution(allWorkflows, 'status'),
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Workflow statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Workflow stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  /**
   * Get tax statistics
   */
  async getTaxStats(req, res) {
    try {
      // Use the same owner logic as the taxes controller
      const owner =
        (req.user && (req.user.companyOwner || req.user._id)) ||
        (req.companyOwner && req.companyOwner._id) ||
        (req.admin && req.admin._id);

      if (!owner) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Authentication required',
        });
      }

      const timeframe = parseInt(req.query.timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const Taxes = mongoose.model('Taxes');

      const baseFilter = { owner, removed: { $ne: true } };
      const timeFilter = { ...baseFilter, created: { $gte: startDate } };

      const [allTaxes, recentTaxes] = await Promise.all([
        Taxes.find(baseFilter),
        Taxes.find(timeFilter),
      ]);

      // Calculate average tax rate
      const avgTaxRate =
        allTaxes.length > 0
          ? (
              allTaxes.reduce((sum, tax) => sum + (parseFloat(tax.taxRate) || 0), 0) /
              allTaxes.length
            ).toFixed(1)
          : 0;

      const result = {
        totalTaxes: allTaxes.length,
        activeTaxes: allTaxes.filter((tax) => tax.enabled !== false).length,
        defaultTax: allTaxes.filter((tax) => tax.isDefault === true).length,
        averageRate: parseFloat(avgTaxRate),
        newThisMonth: recentTaxes.length,
        timeframe,
        generatedAt: new Date(),
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'Tax statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Tax stats error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },
};

/**
 * Helper function to calculate status distribution
 */
function calculateStatusDistribution(items, field) {
  const distribution = {};

  items.forEach((item) => {
    // Handle nested fields (e.g., 'customerValue.segment')
    const value = field.includes('.')
      ? field.split('.').reduce((obj, key) => obj?.[key], item)
      : item[field];

    const status = value || 'unknown';
    distribution[status] = (distribution[status] || 0) + 1;
  });

  return Object.entries(distribution).map(([status, count]) => ({
    _id: status,
    count,
    total: items.reduce((sum, item) => {
      const itemValue = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj?.[key], item)
        : item[field];

      return itemValue === status ? sum + (item.total || item.amount || 1) : sum;
    }, 0),
  }));
}

module.exports = statisticsController;
