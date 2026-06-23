// @ts-nocheck

import Team from '@/models/appModels/Team';
import Client from '@/models/appModels/Client';
import Quote from '@/models/appModels/Quote';
import Invoice from '@/models/appModels/Invoice';
import Payment from '@/models/appModels/Payment';
import Task from '@/models/appModels/Task';
import CustomerFollowUp from '@/models/appModels/CustomerFollowUp';
const getMemberPerformance = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { timeframe = '30' } = req.query; // Default 30 days

    // Get company ID
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;

    // Check if team exists and belongs to the same company
    const team = await Team.findOne({
      _id: teamId,
      removed: false,
      companyID: requesterCompanyID,
    }).populate({
      path: 'members.user',
      select: 'name email role enabled permissions',
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or access denied',
      });
    }

    // Find the specific member in the team
    const member = team.members.find((m) => m.user && m.user._id.toString() === memberId);

    if (!member || !member.user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    const user = member.user;
    const permissions = user.permissions || {};

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe));

    // Base filter for queries
    const dateFilter = {
      created: { $gte: startDate, $lte: endDate },
      removed: { $ne: true },
      companyID: requesterCompanyID,
    };

    // Initialize performance metrics
    const performance = {
      member: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: member.role,
      },
      timeframe: {
        days: parseInt(timeframe),
        startDate,
        endDate,
      },
      moduleAccess: {},
      metrics: {},
      summary: {
        totalActivities: 0,
        topPerformingModule: null,
      },
    };

    // Check Customers/Clients Module Access
    if (permissions.canViewClients || permissions.canCreateClients) {
      performance.moduleAccess.customers = true;

      // Count customers added by this user
      const customersAdded = await Client.countDocuments({
        ...dateFilter,
        createdBy: user._id,
      });

      // Count leads generated (customers in 'lead' status or similar)
      const leadsGenerated = await Client.countDocuments({
        ...dateFilter,
        createdBy: user._id,
        customerType: 'individual', // Assuming leads are individuals
      });

      performance.metrics.customers = {
        customersAdded,
        leadsGenerated,
        total: customersAdded + leadsGenerated,
      };
      performance.summary.totalActivities += customersAdded + leadsGenerated;
    }

    // Check Quotes Module Access
    if (permissions.canViewQuotes || permissions.canCreateQuotes) {
      performance.moduleAccess.quotes = true;

      const quotesSent = await Quote.countDocuments({
        ...dateFilter,
        createdBy: user._id,
      });

      // Get total quote value
      const quoteStats = await Quote.aggregate([
        {
          $match: {
            created: { $gte: startDate, $lte: endDate },
            removed: { $ne: true },
            companyID: requesterCompanyID,
            createdBy: user._id,
          },
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
      ]);

      performance.metrics.quotes = {
        quotesSent,
        totalValue: quoteStats.length > 0 ? quoteStats[0].totalValue : 0,
      };
      performance.summary.totalActivities += quotesSent;
    }

    // Check Invoices Module Access
    if (permissions.canViewInvoices || permissions.canCreateInvoices) {
      performance.moduleAccess.invoices = true;

      const invoicesSent = await Invoice.countDocuments({
        ...dateFilter,
        createdBy: user._id,
      });

      // Get total invoice value
      const invoiceStats = await Invoice.aggregate([
        {
          $match: {
            created: { $gte: startDate, $lte: endDate },
            removed: { $ne: true },
            companyID: requesterCompanyID,
            createdBy: user._id,
          },
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
      ]);

      performance.metrics.invoices = {
        invoicesSent,
        totalValue: invoiceStats.length > 0 ? invoiceStats[0].totalValue : 0,
      };
      performance.summary.totalActivities += invoicesSent;
    }

    // Check Payments Module Access
    if (permissions.canViewPayments || permissions.canCreatePayments) {
      performance.moduleAccess.payments = true;

      // Get payments made by customers associated with this user
      // This could be customers they created or payments they recorded
      const paymentStats = await Payment.aggregate([
        {
          $match: {
            created: { $gte: startDate, $lte: endDate },
            removed: { $ne: true },
            companyID: requesterCompanyID,
            createdBy: user._id,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      const paymentsMade = paymentStats.length > 0 ? paymentStats[0].count : 0;
      const revenueGenerated = paymentStats.length > 0 ? paymentStats[0].totalRevenue : 0;

      performance.metrics.payments = {
        paymentsMade,
        revenueGenerated,
      };
      performance.summary.totalActivities += paymentsMade;
    }

    // Check Follow-up Management Module Access
    // Note: There's no specific "canViewFollowUps" permission in the User model
    // We'll check if they have access to clients or marketing modules
    if (permissions.canViewClients || permissions.canViewMarketing) {
      performance.moduleAccess.followUps = true;

      // Count follow-ups completed
      const followUpsCompleted = await CustomerFollowUp.countDocuments({
        created: { $gte: startDate, $lte: endDate },
        owner: requesterCompanyID,
        status: { $in: ['sent', 'delivered', 'responded'] },
        // Assuming follow-ups have a createdBy or similar field
        // If not, we might need to adjust this query
      });

      performance.metrics.followUps = {
        followUpsCompleted,
      };
      performance.summary.totalActivities += followUpsCompleted;
    }

    // Check Tasks Module Access
    if (permissions.canViewTasks || permissions.canCreateTasks) {
      performance.moduleAccess.tasks = true;

      // Count tasks completed by this user
      const tasksCompleted = await Task.countDocuments({
        updated: { $gte: startDate, $lte: endDate },
        removed: { $ne: true },
        companyID: requesterCompanyID,
        status: 'completed',
        $or: [{ assignedTo: user._id }, { createdBy: user._id }],
      });

      // Count tasks assigned to this user (total)
      const tasksAssigned = await Task.countDocuments({
        created: { $gte: startDate, $lte: endDate },
        removed: { $ne: true },
        companyID: requesterCompanyID,
        assignedTo: user._id,
      });

      performance.metrics.tasks = {
        tasksCompleted,
        tasksAssigned,
        completionRate: tasksAssigned > 0 ? ((tasksCompleted / tasksAssigned) * 100).toFixed(2) : 0,
      };
      performance.summary.totalActivities += tasksCompleted;
    }

    // Determine top performing module
    let maxActivities = 0;
    let topModule = null;

    Object.entries(performance.metrics).forEach(([module, data]) => {
      let activityCount = 0;

      switch (module) {
        case 'customers':
          activityCount = data.total || 0;
          break;
        case 'quotes':
          activityCount = data.quotesSent || 0;
          break;
        case 'invoices':
          activityCount = data.invoicesSent || 0;
          break;
        case 'payments':
          activityCount = data.paymentsMade || 0;
          break;
        case 'followUps':
          activityCount = data.followUpsCompleted || 0;
          break;
        case 'tasks':
          activityCount = data.tasksCompleted || 0;
          break;
      }

      if (activityCount > maxActivities) {
        maxActivities = activityCount;
        topModule = module;
      }
    });

    performance.summary.topPerformingModule = topModule;

    return res.status(200).json({
      success: true,
      result: performance,
      message: 'Member performance retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching member performance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching member performance',
      error: error.message,
    });
  }
};

export = getMemberPerformance;
