const contextAwareService = require('./contextAwareService');
const patternRecognitionService = require('./patternRecognitionService');
const Client = require('../models/appModels/Client');
const Invoice = require('../models/appModels/Invoice');
const Quote = require('../models/appModels/Quote');
const Workflow = require('../models/appModels/Workflow');
const AILearningData = require('../models/appModels/AILearningData');

/**
 * Enhanced Context-Aware Recommendations Service
 * Provides cross-module recommendations and predictive suggestions
 */
class EnhancedContextService {
  /**
   * Get comprehensive context with recommendations
   */
  async getEnhancedContext(module, data, userId) {
    const baseContext = await contextAwareService.buildContext(module, data, userId);

    const recommendations = await this.generateRecommendations(module, data, userId);

    const insights = await this.getBusinessInsights(userId);

    const nextActions = await this.suggestNextActions(module, data, userId);

    const conversationRouting = await this.getConversationRouting(module, data, userId);

    return {
      ...baseContext,
      recommendations,
      insights,
      nextActions,
      conversationRouting,
      enhanced: true,
    };
  }

  /**
   * Generate module-specific recommendations
   */
  async generateRecommendations(module, data, userId) {
    const recommendations = [];

    switch (module) {
      case 'customer':
      case 'client':
        recommendations.push(...(await this.getCustomerRecommendations(data, userId)));
        break;
      case 'invoice':
        recommendations.push(...(await this.getInvoiceRecommendations(data, userId)));
        break;
      case 'quote':
        recommendations.push(...(await this.getQuoteRecommendations(data, userId)));
        break;
      case 'general':
        recommendations.push(...(await this.getGeneralRecommendations(userId)));
        break;
    }

    const historicalRecommendations = await this.getHistoricalRecommendations(module, userId);
    recommendations.push(...historicalRecommendations);

    return recommendations;
  }

  /**
   * Get customer-specific recommendations
   */
  async getCustomerRecommendations(data, userId) {
    const recommendations = [];

    if (data.clientId) {
      const client = await Client.findOne({
        _id: data.clientId,
        owner: userId,
        removed: false,
      });

      if (!client) return recommendations;

      const recentInvoices = await Invoice.find({
        client: data.clientId,
        owner: userId,
        removed: false,
      })
        .sort({ created: -1 })
        .limit(5);

      if (recentInvoices.length > 0) {
        const lastInvoiceDate = recentInvoices[0].created;
        const daysSinceLastInvoice = Math.floor(
          (new Date() - lastInvoiceDate) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastInvoice > 30) {
          recommendations.push({
            type: 'action',
            priority: 'high',
            title: 'Follow up with inactive customer',
            description: `${client.name} hasn't been invoiced in ${daysSinceLastInvoice} days`,
            action: 'create_follow_up',
            data: { clientId: client._id, reason: 'inactive_customer' },
          });
        }
      }

      const pendingQuotes = await Quote.countDocuments({
        client: data.clientId,
        owner: userId,
        status: 'sent',
        removed: false,
      });

      if (pendingQuotes > 0) {
        recommendations.push({
          type: 'insight',
          priority: 'medium',
          title: 'Pending quotes need attention',
          description: `${client.name} has ${pendingQuotes} pending quote(s)`,
          action: 'view_quotes',
          data: { clientId: client._id },
        });
      }

      const unpaidInvoices = await Invoice.find({
        client: data.clientId,
        owner: userId,
        paymentStatus: { $in: ['unpaid', 'partial'] },
        removed: false,
      });

      if (unpaidInvoices.length > 0) {
        const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
        recommendations.push({
          type: 'warning',
          priority: 'high',
          title: 'Outstanding payments',
          description: `${client.name} has ${unpaidInvoices.length} unpaid invoice(s) totaling ${totalUnpaid}`,
          action: 'send_payment_reminder',
          data: { clientId: client._id, amount: totalUnpaid },
        });
      }
    }

    return recommendations;
  }

  /**
   * Get invoice-specific recommendations
   */
  async getInvoiceRecommendations(data, userId) {
    const recommendations = [];

    if (data.invoiceId) {
      const invoice = await Invoice.findOne({
        _id: data.invoiceId,
        owner: userId,
        removed: false,
      }).populate('client');

      if (!invoice) return recommendations;

      if (invoice.paymentStatus === 'unpaid' && new Date(invoice.expiredDate) < new Date()) {
        recommendations.push({
          type: 'urgent',
          priority: 'urgent',
          title: 'Invoice is overdue',
          description: `Invoice #${invoice.number} is overdue. Send payment reminder?`,
          action: 'send_payment_reminder',
          data: { invoiceId: invoice._id },
        });
      }

      if (invoice.paymentStatus === 'unpaid') {
        const daysUntilDue = Math.floor(
          (new Date(invoice.expiredDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue <= 3 && daysUntilDue > 0) {
          recommendations.push({
            type: 'info',
            priority: 'medium',
            title: 'Payment due soon',
            description: `Invoice #${invoice.number} is due in ${daysUntilDue} days`,
            action: 'schedule_reminder',
            data: { invoiceId: invoice._id },
          });
        }
      }

      if (invoice.total > 10000) {
        recommendations.push({
          type: 'insight',
          priority: 'medium',
          title: 'High-value invoice',
          description: `This is a high-value invoice. Consider offering payment terms.`,
          action: 'suggest_payment_plan',
          data: { invoiceId: invoice._id },
        });
      }
    }

    return recommendations;
  }

  /**
   * Get quote-specific recommendations
   */
  async getQuoteRecommendations(data, userId) {
    const recommendations = [];

    if (data.quoteId) {
      const quote = await Quote.findOne({
        _id: data.quoteId,
        owner: userId,
        removed: false,
      }).populate('client');

      if (!quote) return recommendations;

      if (quote.status === 'sent') {
        const daysSinceSent = Math.floor(
          (new Date() - new Date(quote.created)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceSent >= 3) {
          recommendations.push({
            type: 'action',
            priority: 'high',
            title: 'Follow up on pending quote',
            description: `Quote #${quote.number} has been pending for ${daysSinceSent} days`,
            action: 'create_follow_up',
            data: { quoteId: quote._id, reason: 'quote_follow_up' },
          });
        }
      }

      if (quote.status === 'accepted') {
        recommendations.push({
          type: 'action',
          priority: 'high',
          title: 'Convert quote to invoice',
          description: `Quote #${quote.number} has been accepted. Ready to invoice?`,
          action: 'convert_to_invoice',
          data: { quoteId: quote._id },
        });
      }

      if (new Date(quote.expiredDate) < new Date() && quote.status === 'sent') {
        recommendations.push({
          type: 'warning',
          priority: 'medium',
          title: 'Quote has expired',
          description: `Quote #${quote.number} expired. Consider extending or creating a new quote.`,
          action: 'extend_quote',
          data: { quoteId: quote._id },
        });
      }
    }

    return recommendations;
  }

  /**
   * Get general business recommendations
   */
  async getGeneralRecommendations(userId) {
    const recommendations = [];

    const overdueInvoices = await Invoice.countDocuments({
      owner: userId,
      paymentStatus: 'unpaid',
      expiredDate: { $lt: new Date() },
      removed: false,
    });

    if (overdueInvoices > 0) {
      recommendations.push({
        type: 'urgent',
        priority: 'urgent',
        title: 'Overdue invoices need attention',
        description: `You have ${overdueInvoices} overdue invoice(s)`,
        action: 'view_overdue_invoices',
        data: { count: overdueInvoices },
      });
    }

    const pendingQuotes = await Quote.countDocuments({
      owner: userId,
      status: 'sent',
      expiredDate: { $gte: new Date() },
      removed: false,
    });

    if (pendingQuotes > 0) {
      recommendations.push({
        type: 'info',
        priority: 'medium',
        title: 'Active quotes awaiting response',
        description: `You have ${pendingQuotes} pending quote(s)`,
        action: 'view_pending_quotes',
        data: { count: pendingQuotes },
      });
    }

    const workflows = await Workflow.find({
      owner: userId,
      enabled: true,
      status: 'active',
      removed: false,
    });

    if (workflows.length === 0) {
      recommendations.push({
        type: 'suggestion',
        priority: 'low',
        title: 'Automate your workflows',
        description: 'Set up automated workflows to save time on repetitive tasks',
        action: 'create_workflow',
        data: {},
      });
    }

    return recommendations;
  }

  /**
   * Get business insights based on patterns
   */
  async getBusinessInsights(userId) {
    const insights = [];

    try {
      const invoicePatterns = await patternRecognitionService.analyzeInvoicePatterns(userId);

      if (invoicePatterns) {
        if (invoicePatterns.paymentPatterns.latePayments > 0) {
          const latePaymentRate =
            (invoicePatterns.paymentPatterns.latePayments /
              (invoicePatterns.paymentPatterns.latePayments +
                invoicePatterns.paymentPatterns.onTimePayments)) *
            100;

          insights.push({
            type: 'payment_behavior',
            title: 'Payment Pattern Analysis',
            insight: `${latePaymentRate.toFixed(1)}% of payments are received late`,
            suggestion:
              latePaymentRate > 30
                ? 'Consider implementing stricter payment terms or offering early payment discounts'
                : 'Payment patterns are healthy',
            data: invoicePatterns.paymentPatterns,
          });
        }

        if (invoicePatterns.clientPatterns.length > 0) {
          const topClient = invoicePatterns.clientPatterns[0];
          insights.push({
            type: 'revenue_concentration',
            title: 'Top Revenue Source',
            insight: `${topClient.clientName} accounts for ${(
              (topClient.totalAmount /
                invoicePatterns.averageAmount /
                invoicePatterns.totalInvoices) *
              100
            ).toFixed(1)}% of revenue`,
            suggestion: 'Consider nurturing this relationship and diversifying revenue sources',
            data: { topClient },
          });
        }
      }

      const anomalies = await patternRecognitionService.detectAnomalies(userId, 'invoice');

      if (anomalies.length > 0) {
        insights.push({
          type: 'anomaly_detection',
          title: 'Unusual Activity Detected',
          insight: `${anomalies.length} unusual pattern(s) detected in recent invoices`,
          suggestion: 'Review these transactions for accuracy',
          data: { anomalies: anomalies.slice(0, 3) },
        });
      }
    } catch (error) {
      console.error('Get business insights error:', error);
    }

    return insights;
  }

  /**
   * Suggest next actions based on context
   */
  async suggestNextActions(module, data, userId) {
    const actions = [];

    try {
      const learningData = await AILearningData.find({
        owner: userId,
        'feedback.wasImplemented': true,
      })
        .sort({ created: -1 })
        .limit(10);

      const successfulActions = learningData.reduce((acc, item) => {
        if (item.outcome && item.outcome.actionTaken) {
          acc[item.outcome.actionTaken] = (acc[item.outcome.actionTaken] || 0) + 1;
        }
        return acc;
      }, {});

      const sortedActions = Object.entries(successfulActions).sort((a, b) => b[1] - a[1]);

      for (const [action, count] of sortedActions.slice(0, 3)) {
        actions.push({
          action,
          confidence: Math.min((count / learningData.length) * 100, 95),
          description: `This action has been successful ${count} times in similar contexts`,
        });
      }

      if (module === 'customer' && data.clientId) {
        actions.push({
          action: 'create_quote',
          confidence: 75,
          description: 'Create a new quote for this customer',
        });

        actions.push({
          action: 'schedule_meeting',
          confidence: 65,
          description: 'Schedule a follow-up meeting',
        });
      }

      if (module === 'quote' && data.quoteId) {
        actions.push({
          action: 'send_reminder',
          confidence: 80,
          description: 'Send a follow-up reminder about the quote',
        });
      }

      if (module === 'invoice' && data.invoiceId) {
        actions.push({
          action: 'send_payment_link',
          confidence: 85,
          description: 'Send a payment link to speed up collection',
        });
      }
    } catch (error) {
      console.error('Suggest next actions error:', error);
    }

    return actions;
  }

  /**
   * Get historical recommendations that were successful
   */
  async getHistoricalRecommendations(module, userId) {
    const recommendations = [];

    try {
      const historicalData = await AILearningData.find({
        owner: userId,
        'input.module': module,
        'feedback.wasHelpful': true,
        'feedback.rating': { $gte: 4 },
      })
        .sort({ 'feedback.feedbackDate': -1 })
        .limit(5);

      for (const data of historicalData) {
        if (data.output && data.output.suggestions) {
          recommendations.push({
            type: 'historical',
            priority: 'low',
            title: 'Previously helpful suggestion',
            description: data.output.suggestions[0] || 'Review past successful actions',
            confidence: data.output.confidence || 0.7,
            basedOn: 'historical_success',
          });
        }
      }
    } catch (error) {
      console.error('Get historical recommendations error:', error);
    }

    return recommendations;
  }

  /**
   * Predict customer behavior
   */
  async predictCustomerBehavior(clientId, userId) {
    try {
      const client = await Client.findOne({
        _id: clientId,
        owner: userId,
        removed: false,
      });

      if (!client) return null;

      const invoiceHistory = await Invoice.find({
        client: clientId,
        owner: userId,
        removed: false,
      }).sort({ created: -1 });

      if (invoiceHistory.length < 3) {
        return {
          prediction: 'insufficient_data',
          confidence: 0,
          message: 'Need more transaction history for accurate prediction',
        };
      }

      const averageDaysBetweenPurchases =
        invoiceHistory.length > 1
          ? invoiceHistory.reduce((acc, inv, idx) => {
              if (idx === 0) return acc;
              const prevDate = new Date(invoiceHistory[idx - 1].created);
              const currDate = new Date(inv.created);
              return acc + (prevDate - currDate) / (1000 * 60 * 60 * 24);
            }, 0) /
            (invoiceHistory.length - 1)
          : 0;

      const lastPurchaseDate = new Date(invoiceHistory[0].created);
      const daysSinceLastPurchase = (new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24);

      const nextPurchaseProbability =
        daysSinceLastPurchase >= averageDaysBetweenPurchases * 0.8 ? 0.75 : 0.3;

      const churnRisk = daysSinceLastPurchase > averageDaysBetweenPurchases * 2 ? 0.7 : 0.2;

      return {
        prediction: 'ready_for_engagement',
        confidence: nextPurchaseProbability,
        churnRisk,
        averagePurchaseCycle: Math.round(averageDaysBetweenPurchases),
        daysSinceLastPurchase: Math.round(daysSinceLastPurchase),
        nextPurchaseEstimate: Math.round(averageDaysBetweenPurchases - daysSinceLastPurchase),
      };
    } catch (error) {
      console.error('Predict customer behavior error:', error);
      return null;
    }
  }

  /**
   * Get intelligent conversation routing recommendations
   */
  async getConversationRouting(module, data, userId) {
    try {
      if (module !== 'customer' && module !== 'client') {
        return null;
      }

      if (!data.clientId) {
        return null;
      }

      const client = await Client.findOne({
        _id: data.clientId,
        owner: userId,
        removed: false,
      });

      if (!client) return null;

      // Determine recommended channel based on customer behavior and preferences
      let recommendedChannel = 'email';
      let channelReason = 'Email is the default professional communication method';
      let tone = 'professional';
      let bestTimeToContact = 'Morning (9-11 AM)';
      const keyTopics = [];
      const talkingPoints = [];

      // Analyze customer segment and value
      const segment = data.segment || client.customerValue?.segment;
      const lifetimeValue = data.lifetimeValue || client.customerValue?.lifetimeValue || 0;
      const leadScore = data.leadScore || client.leadScore || 0;

      // High-value customers get phone calls
      if (lifetimeValue > 10000 || segment === 'VIP' || segment === 'High Value') {
        recommendedChannel = 'call';
        channelReason = 'High-value customer deserves personalized phone contact';
        tone = 'warm and appreciative';
        bestTimeToContact = 'Afternoon (2-4 PM)';
        keyTopics.push('Account appreciation', 'Exclusive offerings', 'Strategic partnership');
        talkingPoints.push(
          `Thank them for being a valued customer with $${lifetimeValue.toFixed(2)} lifetime value`,
          'Discuss exclusive benefits and priority support',
          'Explore opportunities for deeper partnership'
        );
      }
      // Active engaged customers - email or SMS
      else if (leadScore > 70 || data.qualification === 'Hot Lead') {
        recommendedChannel = 'email';
        channelReason = 'Customer is highly engaged and responsive to email communications';
        tone = 'enthusiastic and solution-focused';
        bestTimeToContact = 'Mid-morning (10 AM - 12 PM)';
        keyTopics.push('New opportunities', 'Product updates', 'Success stories');
        talkingPoints.push(
          'Reference their strong engagement and interest',
          'Present relevant solutions that match their needs',
          'Include clear call-to-action for next steps'
        );
      }
      // Inactive customers need re-engagement
      else if (data.lastPurchaseDate) {
        const daysSinceLastPurchase = Math.floor(
          (new Date() - new Date(data.lastPurchaseDate)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastPurchase > 90) {
          recommendedChannel = 'email';
          channelReason = 'Re-engagement email campaign for inactive customer';
          tone = 'friendly and inviting';
          bestTimeToContact = 'Tuesday or Thursday (10 AM)';
          keyTopics.push('We miss you', 'Special offers', 'What changed');
          talkingPoints.push(
            `It's been ${daysSinceLastPurchase} days since last interaction`,
            'Show genuine interest in their business needs',
            'Offer special incentive to re-engage',
            'Ask for feedback on how to serve them better'
          );
        }
      }
      // New or cold leads
      else if (leadScore < 40 || data.qualification === 'Cold Lead') {
        recommendedChannel = 'email';
        channelReason =
          'Email is less intrusive for cold leads and allows them to engage at their pace';
        tone = 'informative and educational';
        bestTimeToContact = 'Wednesday morning (9-11 AM)';
        keyTopics.push('Education', 'Value proposition', 'Social proof');
        talkingPoints.push(
          'Focus on education rather than selling',
          'Share relevant case studies and testimonials',
          'Provide valuable content and resources',
          'Make it easy for them to learn more at their own pace'
        );
      }

      // Adjust based on visit frequency
      const visitFrequency = data.visitFrequency || client.behavior?.visitFrequency;
      if (visitFrequency && visitFrequency > 10) {
        tone = 'familiar and friendly';
        talkingPoints.push('Reference their frequent engagement with our platform');
      }

      return {
        recommendedChannel,
        channelReason,
        tone,
        bestTimeToContact,
        keyTopics,
        talkingPoints,
        analysis: {
          segment: segment || 'Standard',
          lifetimeValue,
          leadScore,
          qualification: data.qualification || 'Unknown',
        },
      };
    } catch (error) {
      console.error('Get conversation routing error:', error);
      return null;
    }
  }
}

const enhancedContextService = new EnhancedContextService();

module.exports = enhancedContextService;
