const mongoose = require('mongoose');
const Setting = mongoose.model('Setting');
const Client = require('../models/appModels/Client');
const Invoice = require('../models/appModels/Invoice');
const Quote = require('../models/appModels/Quote');
const Payment = require('../models/appModels/Payment');
const Document = require('../models/appModels/Document');
const Task = require('../models/appModels/Task');
const Team = require('../models/appModels/Team');

class ContextAwareService {
  async buildContext(module, data = {}, userId) {
    try {
      // Get company information from settings
      const companyInfo = await this.getCompanyInfo(userId);
      
      // Build module-specific context
      const moduleContext = await this.getModuleContext(module, data, userId);
      
      return {
        company: companyInfo,
        module,
        data: moduleContext,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error building context:', error);
      return {
        company: { name: 'Your Company' }, // Fallback
        module,
        data: {},
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getCompanyInfo(userId) {
    try {
      // Fetch company settings for the user
      const companySettings = await Setting.find({
        owner: userId,
        settingCategory: 'company_settings',
        removed: false
      });

      const companyInfo = {
        name: 'Your Company', // Default fallback
        email: '',
        phone: '',
        address: '',
        website: ''
      };

      // Map settings to company info
      companySettings.forEach(setting => {
        switch (setting.settingKey) {
          case 'company_name':
            companyInfo.name = setting.settingValue || 'Your Company';
            break;
          case 'company_email':
            companyInfo.email = setting.settingValue;
            break;
          case 'company_phone':
            companyInfo.phone = setting.settingValue;
            break;
          case 'company_address':
            companyInfo.address = setting.settingValue;
            break;
          case 'company_website':
            companyInfo.website = setting.settingValue;
            break;
        }
      });

      return companyInfo;
    } catch (error) {
      console.error('Error fetching company info:', error);
      return { name: 'Your Company' };
    }
  }

  async getModuleContext(module, data, userId) {
    try {
      switch (module) {
        case 'client':
        case 'customer':
          return await this.getCustomerContext(data, userId);
        case 'invoice':
          return await this.getInvoiceContext(data, userId);
        case 'quote':
          return await this.getQuoteContext(data, userId);
        case 'document':
          return await this.getDocumentContext(data, userId);
        default:
          return data;
      }
    } catch (error) {
      console.error(`Error getting ${module} context:`, error);
      return data;
    }
  }

  async getCustomerContext(data, userId) {
    // Add customer-specific context like recent interactions, purchase history
    return {
      ...data,
      contextType: 'customer',
      // Add additional customer context here
    };
  }

  async getInvoiceContext(data, userId) {
    // Add invoice-specific context
    return {
      ...data,
      contextType: 'invoice',
      // Add additional invoice context here
    };
  }

  async getQuoteContext(data, userId) {
    // Add quote-specific context
    return {
      ...data,
      contextType: 'quote',
      // Add additional quote context here
    };
  }

  async getDocumentContext(data, userId) {
    // Add document-specific context
    return {
      ...data,
      contextType: 'document',
      // Add additional document context here
    };
  }

  async buildClientContext(data, userId, context) {
    context.clients = {
      total: await Client.countDocuments({ owner: userId, removed: false }),
      active: await Client.countDocuments({ owner: userId, removed: false, enabled: true }),
    };

    if (data.clientId) {
      const client = await Client.findOne({ _id: data.clientId, owner: userId, removed: false });
      if (client) {
        context.currentClient = {
          name: client.name,
          segment: client.customerValue?.segment,
          lifetimeValue: client.customerValue?.lifetimeValue,
          lastPurchase: client.behavior?.lastPurchaseDate,
        };

        // Get related invoices and quotes
        context.relatedInvoices = await Invoice.countDocuments({
          client: data.clientId,
          owner: userId,
          removed: false,
        });

        context.relatedQuotes = await Quote.countDocuments({
          client: data.clientId,
          owner: userId,
          removed: false,
        });
      }
    }

    return context;
  }

  async buildInvoiceContext(data, userId, context) {
    context.invoices = {
      total: await Invoice.countDocuments({ owner: userId, removed: false }),
      paid: await Invoice.countDocuments({ owner: userId, removed: false, paymentStatus: 'paid' }),
      pending: await Invoice.countDocuments({ owner: userId, removed: false, paymentStatus: 'unpaid' }),
      overdue: await Invoice.countDocuments({
        owner: userId,
        removed: false,
        paymentStatus: 'unpaid',
        expiredDate: { $lt: new Date() },
      }),
    };

    if (data.invoiceId) {
      const invoice = await Invoice.findOne({ _id: data.invoiceId, owner: userId, removed: false })
        .populate('client', 'name');
      
      if (invoice) {
        context.currentInvoice = {
          number: invoice.number,
          client: invoice.client?.name,
          total: invoice.total,
          status: invoice.status,
          paymentStatus: invoice.paymentStatus,
          dueDate: invoice.expiredDate,
        };
      }
    }

    return context;
  }

  async buildQuoteContext(data, userId, context) {
    context.quotes = {
      total: await Quote.countDocuments({ owner: userId, removed: false }),
      pending: await Quote.countDocuments({ owner: userId, removed: false, status: 'pending' }),
      accepted: await Quote.countDocuments({ owner: userId, removed: false, status: 'accepted' }),
      expired: await Quote.countDocuments({
        owner: userId,
        removed: false,
        expiredDate: { $lt: new Date() },
      }),
    };

    if (data.quoteId) {
      const quote = await Quote.findOne({ _id: data.quoteId, owner: userId, removed: false })
        .populate('client', 'name');
      
      if (quote) {
        context.currentQuote = {
          number: quote.number,
          client: quote.client?.name,
          total: quote.total,
          status: quote.status,
          expiryDate: quote.expiredDate,
        };
      }
    }

    return context;
  }

  async buildPaymentContext(data, userId, context) {
    context.payments = {
      total: await Payment.countDocuments({ owner: userId, removed: false }),
      thisMonth: await Payment.countDocuments({
        owner: userId,
        removed: false,
        created: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    };

    return context;
  }

  async buildDocumentContext(data, userId, context) {
    context.documents = {
      total: await Document.countDocuments({ owner: userId, removed: false }),
      types: await Document.aggregate([
        { $match: { owner: userId, removed: false } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } },
      ]),
    };

    return context;
  }

  async buildTaskContext(data, userId, context) {
    context.tasks = {
      total: await Task.countDocuments({ owner: userId, removed: false }),
      pending: await Task.countDocuments({ owner: userId, removed: false, status: 'pending' }),
      inProgress: await Task.countDocuments({ owner: userId, removed: false, status: 'in_progress' }),
      completed: await Task.countDocuments({ owner: userId, removed: false, status: 'completed' }),
    };

    return context;
  }

  async buildTeamContext(data, userId, context) {
    context.teams = {
      total: await Team.countDocuments({ owner: userId, removed: false }),
      active: await Team.countDocuments({ owner: userId, removed: false, enabled: true }),
    };

    return context;
  }

  async buildGeneralContext(data, userId, context) {
    // Build summary context across all modules
    context.summary = {
      clients: await Client.countDocuments({ owner: userId, removed: false }),
      invoices: await Invoice.countDocuments({ owner: userId, removed: false }),
      quotes: await Quote.countDocuments({ owner: userId, removed: false }),
      payments: await Payment.countDocuments({ owner: userId, removed: false }),
      documents: await Document.countDocuments({ owner: userId, removed: false }),
      tasks: await Task.countDocuments({ owner: userId, removed: false }),
    };

    return context;
  }

  // Enhanced statistics methods for API endpoints
  async getModuleStatistics(module, userId, options = {}) {
    try {
      const { currency } = options;
      
      switch (module) {
        case 'client':
          return await this.getClientStatistics(userId);
        case 'invoice':
          return await this.getInvoiceStatistics(userId, currency);
        case 'quote':
          return await this.getQuoteStatistics(userId, currency);
        case 'payment':
          return await this.getPaymentStatistics(userId, currency);
        case 'task':
          return await this.getTaskStatistics(userId);
        case 'team':
          return await this.getTeamStatistics(userId);
        case 'document':
          return await this.getDocumentStatistics(userId);
        default:
          return await this.getGeneralStatistics(userId);
      }
    } catch (error) {
      console.error(`Error getting ${module} statistics:`, error);
      throw error;
    }
  }

  async getClientStatistics(userId) {
    const total = await Client.countDocuments({ owner: userId, removed: false });
    const active = await Client.countDocuments({ owner: userId, removed: false, enabled: true });
    const inactive = total - active;
    
    // Get new clients this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = await Client.countDocuments({
      owner: userId,
      removed: false,
      created: { $gte: startOfMonth }
    });

    // Get VIP clients (platinum/gold segments)
    const vipClients = await Client.countDocuments({
      owner: userId,
      removed: false,
      'customerValue.segment': { $in: ['platinum', 'gold'] }
    });

    return {
      total,
      active,
      inactive,
      newThisMonth,
      vipClients
    };
  }

  async getInvoiceStatistics(userId, currency = 'USD') {
    const currencyFilter = currency ? { currency } : {};
    const baseFilter = { owner: userId, removed: false, ...currencyFilter };

    // Count statistics
    const total = await Invoice.countDocuments(baseFilter);
    const paid = await Invoice.countDocuments({ ...baseFilter, paymentStatus: 'paid' });
    const unpaid = await Invoice.countDocuments({ ...baseFilter, paymentStatus: 'unpaid' });
    const overdue = await Invoice.countDocuments({
      ...baseFilter,
      paymentStatus: 'unpaid',
      expiredDate: { $lt: new Date() }
    });

    // Amount statistics
    const amountStats = await Invoice.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] }
          },
          unpaidAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, '$total', 0] }
          }
        }
      }
    ]);

    const amounts = amountStats[0] || { totalAmount: 0, paidAmount: 0, unpaidAmount: 0 };

    // Performance by status
    const performance = await Invoice.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$total' }
        }
      }
    ]);

    return {
      count: total,
      count_paid: paid,
      count_unpaid: unpaid,
      count_overdue: overdue,
      total: amounts.totalAmount,
      total_paid: amounts.paidAmount,
      total_undue: amounts.unpaidAmount,
      performance: performance.map(p => ({
        status: p._id,
        count: p.count,
        amount: p.amount
      }))
    };
  }

  async getQuoteStatistics(userId, currency = 'USD') {
    const currencyFilter = currency ? { currency } : {};
    const baseFilter = { owner: userId, removed: false, ...currencyFilter };

    const total = await Quote.countDocuments(baseFilter);
    
    // Amount statistics
    const amountStats = await Quote.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    // Performance by status
    const performance = await Quote.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$total' }
        }
      }
    ]);

    const amounts = amountStats[0] || { totalAmount: 0 };

    return {
      count: total,
      total: amounts.totalAmount,
      performance: performance.map(p => ({
        status: p._id,
        count: p.count,
        amount: p.amount
      }))
    };
  }

  async getPaymentStatistics(userId, currency = 'USD') {
    const currencyFilter = currency ? { currency } : {};
    const baseFilter = { owner: userId, removed: false, ...currencyFilter };

    const total = await Payment.countDocuments(baseFilter);
    
    // Amount statistics
    const amountStats = await Payment.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // This month payments
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonth = await Payment.countDocuments({
      ...baseFilter,
      created: { $gte: startOfMonth }
    });

    const amounts = amountStats[0] || { totalAmount: 0 };

    return {
      count: total,
      total: amounts.totalAmount,
      thisMonth
    };
  }

  async getTaskStatistics(userId) {
    const baseFilter = { owner: userId, removed: false };

    const total = await Task.countDocuments(baseFilter);
    const pending = await Task.countDocuments({ ...baseFilter, status: 'pending' });
    const inProgress = await Task.countDocuments({ ...baseFilter, status: 'in_progress' });
    const completed = await Task.countDocuments({ ...baseFilter, status: 'completed' });
    const overdue = await Task.countDocuments({
      ...baseFilter,
      deadline: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue
    };
  }

  async getTeamStatistics(userId) {
    const teams = await Team.find({ owner: userId, removed: false }).populate('members');
    
    const totalTeams = teams.length;
    const activeTeams = teams.filter(team => team.enabled !== false).length;
    const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    const teamLeads = teams.filter(team => team.teamLead).length;
    
    // New teams this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = teams.filter(team => new Date(team.created) >= startOfMonth).length;

    return {
      totalTeams,
      activeTeams,
      totalMembers,
      teamLeads,
      newThisMonth
    };
  }

  async getDocumentStatistics(userId) {
    const total = await Document.countDocuments({ owner: userId, removed: false });
    
    // Documents by type
    const typeStats = await Document.aggregate([
      { $match: { owner: userId, removed: false } },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      }
    ]);

    // New documents this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = await Document.countDocuments({
      owner: userId,
      removed: false,
      created: { $gte: startOfMonth }
    });

    // Total file size
    const sizeStats = await Document.aggregate([
      { $match: { owner: userId, removed: false } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' }
        }
      }
    ]);

    const totalSize = sizeStats[0]?.totalSize || 0;

    return {
      total,
      newThisMonth,
      totalSize,
      categories: typeStats.length,
      byType: typeStats.map(t => ({
        type: t._id,
        count: t.count
      }))
    };
  }

  async getGeneralStatistics(userId) {
    return {
      clients: await Client.countDocuments({ owner: userId, removed: false }),
      invoices: await Invoice.countDocuments({ owner: userId, removed: false }),
      quotes: await Quote.countDocuments({ owner: userId, removed: false }),
      payments: await Payment.countDocuments({ owner: userId, removed: false }),
      documents: await Document.countDocuments({ owner: userId, removed: false }),
      tasks: await Task.countDocuments({ owner: userId, removed: false }),
      teams: await Team.countDocuments({ owner: userId, removed: false })
    };
  }
}

module.exports = new ContextAwareService();