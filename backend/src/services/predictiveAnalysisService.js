const Invoice = require('../models/appModels/Invoice');
const Quote = require('../models/appModels/Quote');
const Payment = require('../models/appModels/Payment');
const Client = require('../models/appModels/Client');

const predictiveAnalysisService = {
  // Predict customer lifetime value
  async predictCustomerLifetimeValue(clientId, ownerId) {
    try {
      const client = await Client.findOne({ _id: clientId, owner: ownerId, removed: false });
      if (!client) {
        throw new Error('Client not found');
      }

      // Get historical data
      const invoices = await Invoice.find({
        client: clientId,
        owner: ownerId,
        removed: false,
        paymentStatus: 'paid',
      }).sort({ created: 1 });

      if (invoices.length < 2) {
        return {
          predictedLTV: 0,
          confidence: 0.1,
          factors: ['Insufficient historical data'],
          recommendations: ['Continue building relationship to gather more data'],
        };
      }

      // Calculate metrics
      const totalSpent = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const avgOrderValue = totalSpent / invoices.length;
      
      const firstInvoice = new Date(invoices[0].created);
      const lastInvoice = new Date(invoices[invoices.length - 1].created);
      const relationshipMonths = Math.max(1, (lastInvoice - firstInvoice) / (1000 * 60 * 60 * 24 * 30));
      
      const purchaseFrequency = invoices.length / relationshipMonths; // purchases per month
      
      // Predict retention rate based on purchase pattern
      let retentionRate = 0.8; // Base retention rate
      if (purchaseFrequency > 1) retentionRate = 0.9;
      if (purchaseFrequency > 2) retentionRate = 0.95;
      
      // Simple CLV calculation: AOV × Purchase Frequency × Retention Rate × Predicted Lifetime (months)
      const predictedLifetimeMonths = 24; // 2 years default
      const predictedLTV = avgOrderValue * purchaseFrequency * retentionRate * predictedLifetimeMonths;

      const confidence = Math.min(0.9, Math.max(0.3, invoices.length / 10));

      return {
        predictedLTV: Math.round(predictedLTV),
        confidence,
        avgOrderValue: Math.round(avgOrderValue),
        purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
        retentionRate,
        factors: [
          `${invoices.length} historical purchases`,
          `${relationshipMonths.toFixed(1)} months relationship`,
          `$${avgOrderValue.toFixed(2)} average order value`,
        ],
        recommendations: this.generateCLVRecommendations(predictedLTV, purchaseFrequency, avgOrderValue),
      };
    } catch (error) {
      console.error('Predict CLV error:', error);
      return {
        predictedLTV: 0,
        confidence: 0,
        factors: ['Error in calculation'],
        recommendations: ['Unable to generate predictions'],
      };
    }
  },

  // Predict quote conversion probability
  async predictQuoteConversion(quoteId, ownerId) {
    try {
      const quote = await Quote.findOne({ _id: quoteId, owner: ownerId, removed: false })
        .populate('client', 'name');

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Get historical quote data for this client
      const clientQuotes = await Quote.find({
        client: quote.client._id,
        owner: ownerId,
        removed: false,
        _id: { $ne: quoteId }, // Exclude current quote
      });

      // Calculate base probability factors
      let probability = 0.5; // Base 50% probability
      const factors = [];

      // Client history factor
      if (clientQuotes.length > 0) {
        const acceptedQuotes = clientQuotes.filter(q => q.status === 'accepted').length;
        const conversionRate = acceptedQuotes / clientQuotes.length;
        probability = (probability + conversionRate) / 2;
        factors.push(`Client has ${Math.round(conversionRate * 100)}% historical conversion rate`);
      }

      // Quote amount factor
      const avgQuoteAmount = clientQuotes.length > 0 
        ? clientQuotes.reduce((sum, q) => sum + q.total, 0) / clientQuotes.length
        : quote.total;

      if (quote.total <= avgQuoteAmount * 1.2) {
        probability += 0.1;
        factors.push('Quote amount is within normal range');
      } else if (quote.total > avgQuoteAmount * 2) {
        probability -= 0.2;
        factors.push('Quote amount is significantly higher than usual');
      }

      // Time factor - quotes expire, urgency increases conversion
      const daysUntilExpiry = Math.ceil(
        (new Date(quote.expiredDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 7) {
        probability += 0.1;
        factors.push('Quote expires soon, creating urgency');
      } else if (daysUntilExpiry > 30) {
        probability -= 0.05;
        factors.push('Long expiry period may reduce urgency');
      }

      // Quote age factor
      const quoteAge = Math.ceil(
        (new Date() - new Date(quote.created)) / (1000 * 60 * 60 * 24)
      );

      if (quoteAge > 14) {
        probability -= 0.1;
        factors.push('Quote is aging, conversion probability decreases');
      }

      // Ensure probability stays within bounds
      probability = Math.max(0.1, Math.min(0.9, probability));

      return {
        conversionProbability: Math.round(probability * 100),
        confidence: clientQuotes.length > 0 ? 0.8 : 0.4,
        factors,
        recommendations: this.generateConversionRecommendations(probability, daysUntilExpiry, quoteAge),
      };
    } catch (error) {
      console.error('Predict quote conversion error:', error);
      return {
        conversionProbability: 50,
        confidence: 0.1,
        factors: ['Error in calculation'],
        recommendations: ['Unable to generate predictions'],
      };
    }
  },

  // Predict cash flow
  async predictCashFlow(ownerId, days = 30) {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      // Get pending invoices that should be paid within the timeframe
      const pendingInvoices = await Invoice.find({
        owner: ownerId,
        removed: false,
        paymentStatus: { $in: ['unpaid', 'partially'] },
        expiredDate: { $lte: endDate },
      });

      // Get historical payment patterns to estimate collection probability
      const paidInvoices = await Invoice.find({
        owner: ownerId,
        removed: false,
        paymentStatus: 'paid',
        created: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      });

      // Calculate payment delay patterns
      let avgPaymentDelay = 0;
      let onTimePaymentRate = 0.8; // Default

      if (paidInvoices.length > 0) {
        const delays = paidInvoices.map(inv => {
          const dueDate = new Date(inv.expiredDate);
          const paidDate = new Date(inv.updated); // Approximation
          return Math.max(0, (paidDate - dueDate) / (1000 * 60 * 60 * 24));
        });

        avgPaymentDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
        onTimePaymentRate = delays.filter(delay => delay <= 5).length / delays.length;
      }

      // Predict cash flow
      const predictions = [];
      let cumulativeInflow = 0;

      // Group by week
      for (let week = 0; week < Math.ceil(days / 7); week++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() + week * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekInvoices = pendingInvoices.filter(inv => {
          const expectedPayDate = new Date(inv.expiredDate);
          expectedPayDate.setDate(expectedPayDate.getDate() + avgPaymentDelay);
          return expectedPayDate >= weekStart && expectedPayDate < weekEnd;
        });

        const expectedInflow = weekInvoices.reduce((sum, inv) => {
          const remainingAmount = inv.total - (inv.credit || 0);
          return sum + (remainingAmount * onTimePaymentRate);
        }, 0);

        cumulativeInflow += expectedInflow;

        predictions.push({
          period: `Week ${week + 1}`,
          startDate: weekStart,
          endDate: weekEnd,
          expectedInflow: Math.round(expectedInflow),
          cumulativeInflow: Math.round(cumulativeInflow),
          invoiceCount: weekInvoices.length,
        });
      }

      return {
        predictions,
        totalExpectedInflow: Math.round(cumulativeInflow),
        avgPaymentDelay: Math.round(avgPaymentDelay),
        onTimePaymentRate: Math.round(onTimePaymentRate * 100),
        confidence: paidInvoices.length > 5 ? 0.7 : 0.4,
        factors: [
          `Based on ${paidInvoices.length} historical payments`,
          `Average payment delay: ${Math.round(avgPaymentDelay)} days`,
          `On-time payment rate: ${Math.round(onTimePaymentRate * 100)}%`,
        ],
      };
    } catch (error) {
      console.error('Predict cash flow error:', error);
      return {
        predictions: [],
        totalExpectedInflow: 0,
        confidence: 0,
        factors: ['Error in calculation'],
      };
    }
  },

  // Generate CLV recommendations
  generateCLVRecommendations(predictedLTV, purchaseFrequency, avgOrderValue) {
    const recommendations = [];

    if (predictedLTV < 1000) {
      recommendations.push('Consider strategies to increase customer engagement');
      recommendations.push('Focus on upselling and cross-selling opportunities');
    } else if (predictedLTV > 5000) {
      recommendations.push('High-value customer - prioritize retention efforts');
      recommendations.push('Consider VIP treatment and personalized service');
    }

    if (purchaseFrequency < 0.5) {
      recommendations.push('Low purchase frequency - implement re-engagement campaigns');
    }

    if (avgOrderValue < 500) {
      recommendations.push('Low average order value - explore bundling opportunities');
    }

    return recommendations;
  },

  // Generate quote conversion recommendations
  generateConversionRecommendations(probability, daysUntilExpiry, quoteAge) {
    const recommendations = [];

    if (probability < 0.3) {
      recommendations.push('Low conversion probability - consider revising terms or pricing');
      recommendations.push('Schedule a follow-up call to address concerns');
    } else if (probability > 0.7) {
      recommendations.push('High conversion probability - follow up proactively');
    }

    if (daysUntilExpiry <= 7) {
      recommendations.push('Quote expires soon - contact client urgently');
    } else if (daysUntilExpiry > 30) {
      recommendations.push('Consider shorter expiry period to create urgency');
    }

    if (quoteAge > 14) {
      recommendations.push('Quote is aging - consider sending a reminder or updated quote');
    }

    return recommendations;
  },

  // Predict seasonal trends
  async predictSeasonalTrends(ownerId, module = 'invoice') {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      let data = [];
      
      switch (module) {
        case 'invoice':
          data = await Invoice.find({
            owner: ownerId,
            removed: false,
            created: { $gte: oneYearAgo },
          });
          break;
        case 'quote':
          data = await Quote.find({
            owner: ownerId,
            removed: false,
            created: { $gte: oneYearAgo },
          });
          break;
      }

      if (data.length < 12) {
        return {
          trends: [],
          confidence: 0.1,
          message: 'Insufficient data for seasonal analysis',
        };
      }

      // Group by month
      const monthlyData = {};
      data.forEach(item => {
        const month = new Date(item.created).getMonth();
        if (!monthlyData[month]) {
          monthlyData[month] = { count: 0, total: 0 };
        }
        monthlyData[month].count++;
        monthlyData[month].total += item.total || 0;
      });

      // Calculate seasonal trends
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const trends = months.map((month, index) => {
        const data = monthlyData[index] || { count: 0, total: 0 };
        return {
          month,
          count: data.count,
          total: Math.round(data.total),
          averageValue: data.count > 0 ? Math.round(data.total / data.count) : 0,
        };
      });

      // Find peak months
      const avgCount = trends.reduce((sum, t) => sum + t.count, 0) / 12;
      const peakMonths = trends.filter(t => t.count > avgCount * 1.2);

      return {
        trends,
        peakMonths: peakMonths.map(t => t.month),
        avgMonthlyCount: Math.round(avgCount),
        confidence: 0.7,
        insights: this.generateSeasonalInsights(trends, peakMonths),
      };
    } catch (error) {
      console.error('Predict seasonal trends error:', error);
      return {
        trends: [],
        confidence: 0,
        message: 'Error analyzing seasonal trends',
      };
    }
  },

  // Generate seasonal insights
  generateSeasonalInsights(trends, peakMonths) {
    const insights = [];

    if (peakMonths.length > 0) {
      insights.push(`Peak activity months: ${peakMonths.join(', ')}`);
    }

    const sortedTrends = [...trends].sort((a, b) => b.count - a.count);
    const bestMonth = sortedTrends[0];
    const worstMonth = sortedTrends[sortedTrends.length - 1];

    if (bestMonth.count > 0) {
      insights.push(`Strongest month: ${bestMonth.month} (${bestMonth.count} items)`);
    }

    if (worstMonth.count >= 0) {
      insights.push(`Weakest month: ${worstMonth.month} (${worstMonth.count} items)`);
    }

    return insights;
  },
};

module.exports = predictiveAnalysisService;
