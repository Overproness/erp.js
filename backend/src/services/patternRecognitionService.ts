// @ts-nocheck

import Invoice from '../models/appModels/Invoice';
import Quote from '../models/appModels/Quote';
import Payment from '../models/appModels/Payment';
import Client from '../models/appModels/Client';
const patternRecognitionService = {
  // Analyze invoice patterns
  async analyzeInvoicePatterns(ownerId, timeframe = 90) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const invoices = await Invoice.find({
        owner: ownerId,
        removed: false,
        created: { $gte: startDate },
      }).populate('client', 'name');

      const patterns = {
        totalInvoices: invoices.length,
        averageAmount: 0,
        paymentPatterns: {},
        clientPatterns: {},
        statusDistribution: {},
        monthlyTrends: {},
      };

      if (invoices.length === 0) {
        return patterns;
      }

      // Calculate average amount
      patterns.averageAmount = invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length;

      // Payment patterns
      const paymentDelays = invoices
        .filter(inv => inv.paymentStatus === 'paid')
        .map(inv => {
          const dueDate = new Date(inv.expiredDate);
          const paidDate = new Date(inv.updated); // Approximation
          return Math.ceil((paidDate - dueDate) / (1000 * 60 * 60 * 24));
        });

      patterns.paymentPatterns = {
        averagePaymentDelay: paymentDelays.length > 0 
          ? paymentDelays.reduce((sum, delay) => sum + delay, 0) / paymentDelays.length 
          : 0,
        onTimePayments: paymentDelays.filter(delay => delay <= 0).length,
        latePayments: paymentDelays.filter(delay => delay > 0).length,
      };

      // Client patterns
      const clientInvoices = {};
      invoices.forEach(inv => {
        const clientName = inv.client?.name || 'Unknown';
        if (!clientInvoices[clientName]) {
          clientInvoices[clientName] = { count: 0, totalAmount: 0 };
        }
        clientInvoices[clientName].count++;
        clientInvoices[clientName].totalAmount += inv.total;
      });

      patterns.clientPatterns = Object.entries(clientInvoices)
        .map(([name, data]) => ({
          clientName: name,
          invoiceCount: data.count,
          totalAmount: data.totalAmount,
          averageAmount: data.totalAmount / data.count,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      // Status distribution
      invoices.forEach(inv => {
        patterns.statusDistribution[inv.status] = 
          (patterns.statusDistribution[inv.status] || 0) + 1;
      });

      return patterns;
    } catch (error) {
      console.error('Analyze invoice patterns error:', error);
      return null;
    }
  },

  // Detect anomalies in business data
  async detectAnomalies(ownerId, module = 'invoice') {
    try {
      const anomalies = [];

      switch (module) {
        case 'invoice':
          const invoiceAnomalies = await this.detectInvoiceAnomalies(ownerId);
          anomalies.push(...invoiceAnomalies);
          break;
        
        case 'payment':
          const paymentAnomalies = await this.detectPaymentAnomalies(ownerId);
          anomalies.push(...paymentAnomalies);
          break;
        
        case 'client':
          const clientAnomalies = await this.detectClientAnomalies(ownerId);
          anomalies.push(...clientAnomalies);
          break;
      }

      return anomalies;
    } catch (error) {
      console.error('Detect anomalies error:', error);
      return [];
    }
  },

  // Detect invoice anomalies
  async detectInvoiceAnomalies(ownerId) {
    try {
      const anomalies = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentInvoices = await Invoice.find({
        owner: ownerId,
        removed: false,
        created: { $gte: thirtyDaysAgo },
      });

      if (recentInvoices.length < 5) {
        return anomalies; // Not enough data
      }

      const amounts = recentInvoices.map(inv => inv.total);
      const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const stdDev = Math.sqrt(
        amounts.reduce((sum, amt) => sum + Math.pow(amt - average, 2), 0) / amounts.length
      );

      // Detect unusually high amounts (more than 2 standard deviations)
      recentInvoices.forEach(invoice => {
        if (Math.abs(invoice.total - average) > 2 * stdDev) {
          anomalies.push({
            type: 'unusual_amount',
            entity: 'invoice',
            entityId: invoice._id,
            description: `Invoice amount ${invoice.total} is unusual (avg: ${average.toFixed(2)})`,
            severity: 'medium',
            detected: new Date(),
          });
        }
      });

      // Detect overdue invoices
      const now = new Date();
      const overdueInvoices = await Invoice.find({
        owner: ownerId,
        removed: false,
        expiredDate: { $lt: now },
        paymentStatus: { $ne: 'paid' },
      });

      overdueInvoices.forEach(invoice => {
        const daysOverdue = Math.ceil((now - new Date(invoice.expiredDate)) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 30) {
          anomalies.push({
            type: 'long_overdue',
            entity: 'invoice',
            entityId: invoice._id,
            description: `Invoice overdue by ${daysOverdue} days`,
            severity: 'high',
            detected: new Date(),
          });
        }
      });

      return anomalies;
    } catch (error) {
      console.error('Detect invoice anomalies error:', error);
      return [];
    }
  },

  // Detect payment anomalies
  async detectPaymentAnomalies(ownerId) {
    try {
      const anomalies = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPayments = await Payment.find({
        owner: ownerId,
        removed: false,
        created: { $gte: thirtyDaysAgo },
      });

      // Detect unusual payment amounts
      if (recentPayments.length >= 5) {
        const amounts = recentPayments.map(payment => payment.amount);
        const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sum, amt) => sum + Math.pow(amt - average, 2), 0) / amounts.length
        );

        recentPayments.forEach(payment => {
          if (Math.abs(payment.amount - average) > 2 * stdDev) {
            anomalies.push({
              type: 'unusual_payment_amount',
              entity: 'payment',
              entityId: payment._id,
              description: `Payment amount ${payment.amount} is unusual`,
              severity: 'medium',
              detected: new Date(),
            });
          }
        });
      }

      return anomalies;
    } catch (error) {
      console.error('Detect payment anomalies error:', error);
      return [];
    }
  },

  // Detect client anomalies
  async detectClientAnomalies(ownerId) {
    try {
      const anomalies = [];
      
      // Find clients with no recent activity
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const inactiveClients = await Client.find({
        owner: ownerId,
        removed: false,
        enabled: true,
        updated: { $lt: sixMonthsAgo },
      });

      inactiveClients.forEach(client => {
        anomalies.push({
          type: 'inactive_client',
          entity: 'client',
          entityId: client._id,
          description: `Client ${client.name} has been inactive for 6+ months`,
          severity: 'low',
          detected: new Date(),
        });
      });

      return anomalies;
    } catch (error) {
      console.error('Detect client anomalies error:', error);
      return [];
    }
  },

  // Predict future trends
  async predictTrends(ownerId, module = 'invoice', timeframe = 30) {
    try {
      const predictions = [];

      switch (module) {
        case 'invoice':
          const invoiceTrends = await this.predictInvoiceTrends(ownerId, timeframe);
          predictions.push(...invoiceTrends);
          break;
        
        case 'payment':
          const paymentTrends = await this.predictPaymentTrends(ownerId, timeframe);
          predictions.push(...paymentTrends);
          break;
      }

      return predictions;
    } catch (error) {
      console.error('Predict trends error:', error);
      return [];
    }
  },

  // Predict invoice trends
  async predictInvoiceTrends(ownerId, days = 30) {
    try {
      const predictions = [];
      const historicalDays = days * 3; // Use 3x timeframe for historical data
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - historicalDays);

      const invoices = await Invoice.find({
        owner: ownerId,
        removed: false,
        created: { $gte: startDate },
      });

      if (invoices.length < 10) {
        return []; // Not enough data
      }

      // Group by week
      const weeklyData = {};
      invoices.forEach(invoice => {
        const week = Math.floor(
          (new Date(invoice.created) - startDate) / (1000 * 60 * 60 * 24 * 7)
        );
        if (!weeklyData[week]) {
          weeklyData[week] = { count: 0, total: 0 };
        }
        weeklyData[week].count++;
        weeklyData[week].total += invoice.total;
      });

      const weeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
      if (weeks.length < 3) {
        return [];
      }

      // Simple linear trend analysis
      const counts = weeks.map(week => weeklyData[week].count);
      const totals = weeks.map(week => weeklyData[week].total);

      const avgCountTrend = this.calculateTrend(counts);
      const avgTotalTrend = this.calculateTrend(totals);

      predictions.push({
        type: 'invoice_volume',
        prediction: `Expected ${Math.round(avgCountTrend)} invoices per week`,
        confidence: 0.7,
        timeframe: `${days} days`,
        trend: avgCountTrend > 0 ? 'increasing' : 'decreasing',
      });

      predictions.push({
        type: 'revenue_forecast',
        prediction: `Expected weekly revenue: ${avgTotalTrend.toFixed(2)}`,
        confidence: 0.6,
        timeframe: `${days} days`,
        trend: avgTotalTrend > 0 ? 'increasing' : 'decreasing',
      });

      return predictions;
    } catch (error) {
      console.error('Predict invoice trends error:', error);
      return [];
    }
  },

  // Simple trend calculation (linear regression slope)
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = values.reduce((sum, _, i) => sum + i, 0);
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, i) => sum + i * val, 0);
    const xxSum = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return slope;
  },

  // Predict payment trends
  async predictPaymentTrends(ownerId, days = 30) {
    try {
      // Similar implementation to invoice trends
      // This would analyze payment patterns and predict future cash flow
      return [];
    } catch (error) {
      console.error('Predict payment trends error:', error);
      return [];
    }
  },
};

export = patternRecognitionService;
