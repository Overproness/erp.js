class PatternRecognitionService {
  constructor() {
    this.patterns = new Map();
    this.confidence = new Map();
  }

  async analyzePatterns(data, type = 'general') {
    try {
      switch (type) {
        case 'invoice':
          return this.analyzeInvoicePatterns(data);
        case 'customer':
          return this.analyzeCustomerPatterns(data);
        case 'workflow':
          return this.analyzeWorkflowPatterns(data);
        case 'document':
          return this.analyzeDocumentPatterns(data);
        default:
          return this.analyzeGenericPatterns(data);
      }
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return { patterns: [], insights: [], confidence: 0 };
    }
  }

  async analyzeInvoicePatterns(invoices) {
    const patterns = [];
    const insights = [];

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return { patterns, insights, confidence: 0 };
    }

    // Payment timing patterns
    const paymentTiming = this.analyzePaymentTiming(invoices);
    if (paymentTiming) {
      patterns.push(paymentTiming);
      insights.push({
        type: 'payment_timing',
        description: 'Average payment received within ' + paymentTiming.averageDays + ' days',
        confidence: paymentTiming.confidence,
      });
    }

    // Amount patterns
    const amountPatterns = this.analyzeAmountPatterns(invoices);
    patterns.push(...amountPatterns.patterns);
    insights.push(...amountPatterns.insights);

    // Client patterns
    const clientPatterns = this.analyzeClientPatterns(invoices);
    patterns.push(...clientPatterns.patterns);
    insights.push(...clientPatterns.insights);

    // Seasonal patterns
    const seasonalPatterns = this.analyzeSeasonalPatterns(invoices);
    patterns.push(...seasonalPatterns.patterns);
    insights.push(...seasonalPatterns.insights);

    return {
      patterns,
      insights,
      confidence: this.calculateOverallConfidence(patterns),
    };
  }

  analyzePaymentTiming(invoices) {
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');
    if (paidInvoices.length < 3) return null;

    const paymentDelays = paidInvoices
      .map(inv => {
        const dueDate = new Date(inv.expiredDate);
        const paidDate = inv.payment?.[0]?.date ? new Date(inv.payment[0].date) : null;
        return paidDate ? Math.floor((paidDate - dueDate) / (1000 * 60 * 60 * 24)) : null;
      })
      .filter(delay => delay !== null);

    if (paymentDelays.length === 0) return null;

    const avgDelay = paymentDelays.reduce((sum, delay) => sum + delay, 0) / paymentDelays.length;
    const stdDev = Math.sqrt(
      paymentDelays.reduce((sum, delay) => sum + Math.pow(delay - avgDelay, 2), 0) / paymentDelays.length
    );

    return {
      type: 'payment_timing',
      averageDays: Math.round(avgDelay),
      standardDeviation: Math.round(stdDev),
      confidence: Math.min(0.9, paymentDelays.length / 10),
      pattern: avgDelay > 0 ? 'late_payment' : 'early_payment',
    };
  }

  analyzeAmountPatterns(invoices) {
    const patterns = [];
    const insights = [];

    // Amount distribution analysis
    const amounts = invoices.map(inv => inv.total).filter(amount => amount > 0);
    if (amounts.length === 0) return { patterns, insights };

    const sortedAmounts = amounts.sort((a, b) => a - b);
    const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
    const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

    // Detect amount clustering
    const clusters = this.detectAmountClusters(amounts);
    if (clusters.length > 1) {
      patterns.push({
        type: 'amount_clustering',
        clusters,
        confidence: 0.8,
      });
      insights.push({
        type: 'amount_patterns',
        description: `Invoices tend to cluster around ${clusters.length} different amount ranges`,
        confidence: 0.8,
      });
    }

    // High-value invoice pattern
    const highValueThreshold = average * 2;
    const highValueInvoices = amounts.filter(amt => amt > highValueThreshold);
    if (highValueInvoices.length > 0) {
      patterns.push({
        type: 'high_value_invoices',
        threshold: highValueThreshold,
        count: highValueInvoices.length,
        percentage: (highValueInvoices.length / amounts.length) * 100,
        confidence: 0.7,
      });
    }

    return { patterns, insights };
  }

  analyzeCustomerPatterns(customers) {
    const patterns = [];
    const insights = [];

    if (!Array.isArray(customers) || customers.length === 0) {
      return { patterns, insights };
    }

    // Segment distribution
    const segments = {};
    customers.forEach(customer => {
      const segment = customer.customerValue?.segment || 'unknown';
      segments[segment] = (segments[segment] || 0) + 1;
    });

    if (Object.keys(segments).length > 1) {
      patterns.push({
        type: 'customer_segmentation',
        distribution: segments,
        confidence: 0.9,
      });
    }

    // Purchase frequency patterns
    const frequencyPatterns = this.analyzePurchaseFrequency(customers);
    patterns.push(...frequencyPatterns.patterns);
    insights.push(...frequencyPatterns.insights);

    return { patterns, insights };
  }

  analyzeWorkflowPatterns(workflows) {
    const patterns = [];
    const insights = [];

    if (!Array.isArray(workflows) || workflows.length === 0) {
      return { patterns, insights };
    }

    // Execution frequency patterns
    const executionFrequency = workflows.map(wf => wf.executed || 0);
    const avgExecutions = executionFrequency.reduce((sum, freq) => sum + freq, 0) / executionFrequency.length;

    if (avgExecutions > 0) {
      patterns.push({
        type: 'workflow_usage',
        averageExecutions: avgExecutions,
        mostUsed: workflows.reduce((max, wf) => (wf.executed || 0) > (max.executed || 0) ? wf : max),
        confidence: 0.8,
      });
    }

    return { patterns, insights };
  }

  analyzeDocumentPatterns(documents) {
    const patterns = [];
    const insights = [];

    if (!Array.isArray(documents) || documents.length === 0) {
      return { patterns, insights };
    }

    // Document type distribution
    const typeDistribution = {};
    documents.forEach(doc => {
      const type = doc.documentType || 'unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    patterns.push({
      type: 'document_type_distribution',
      distribution: typeDistribution,
      confidence: 0.9,
    });

    // File size patterns
    const fileSizes = documents.map(doc => doc.fileSize).filter(size => size > 0);
    if (fileSizes.length > 0) {
      const avgSize = fileSizes.reduce((sum, size) => sum + size, 0) / fileSizes.length;
      patterns.push({
        type: 'file_size_pattern',
        averageSize: avgSize,
        sizeRange: {
          min: Math.min(...fileSizes),
          max: Math.max(...fileSizes),
        },
        confidence: 0.7,
      });
    }

    return { patterns, insights };
  }

  analyzeGenericPatterns(data) {
    const patterns = [];
    const insights = [];

    if (!Array.isArray(data) || data.length === 0) {
      return { patterns, insights, confidence: 0 };
    }

    // Temporal patterns
    const temporalPattern = this.analyzeTemporalPatterns(data);
    if (temporalPattern) {
      patterns.push(temporalPattern);
    }

    // Growth patterns
    const growthPattern = this.analyzeGrowthPatterns(data);
    if (growthPattern) {
      patterns.push(growthPattern);
    }

    return {
      patterns,
      insights,
      confidence: this.calculateOverallConfidence(patterns),
    };
  }

  detectAmountClusters(amounts, numClusters = 3) {
    // Simple k-means clustering for amounts
    const sortedAmounts = amounts.sort((a, b) => a - b);
    const min = sortedAmounts[0];
    const max = sortedAmounts[sortedAmounts.length - 1];
    const step = (max - min) / numClusters;

    const clusters = [];
    for (let i = 0; i < numClusters; i++) {
      const rangeStart = min + (step * i);
      const rangeEnd = min + (step * (i + 1));
      const clusterAmounts = amounts.filter(amt => amt >= rangeStart && amt < rangeEnd);
      
      if (clusterAmounts.length > 0) {
        clusters.push({
          range: { start: rangeStart, end: rangeEnd },
          count: clusterAmounts.length,
          average: clusterAmounts.reduce((sum, amt) => sum + amt, 0) / clusterAmounts.length,
        });
      }
    }

    return clusters;
  }

  analyzePurchaseFrequency(customers) {
    const patterns = [];
    const insights = [];

    const frequencies = customers
      .map(customer => customer.behavior?.purchaseFrequency)
      .filter(freq => freq);

    if (frequencies.length > 0) {
      const frequencyDistribution = {};
      frequencies.forEach(freq => {
        frequencyDistribution[freq] = (frequencyDistribution[freq] || 0) + 1;
      });

      patterns.push({
        type: 'purchase_frequency',
        distribution: frequencyDistribution,
        confidence: 0.8,
      });

      const mostCommon = Object.entries(frequencyDistribution)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostCommon) {
        insights.push({
          type: 'purchase_behavior',
          description: `Most customers have ${mostCommon[0]} purchase frequency`,
          confidence: 0.8,
        });
      }
    }

    return { patterns, insights };
  }

  analyzeTemporalPatterns(data) {
    const dates = data
      .map(item => item.created || item.date)
      .filter(date => date)
      .map(date => new Date(date));

    if (dates.length < 3) return null;

    // Analyze day of week patterns
    const dayOfWeek = {};
    dates.forEach(date => {
      const day = date.getDay();
      dayOfWeek[day] = (dayOfWeek[day] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayOfWeek)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      type: 'temporal_pattern',
      dayOfWeekDistribution: dayOfWeek,
      mostActiveDay: parseInt(mostActiveDay[0]),
      confidence: 0.7,
    };
  }

  analyzeGrowthPatterns(data) {
    if (data.length < 3) return null;

    const sortedData = data
      .filter(item => item.created || item.date)
      .sort((a, b) => new Date(a.created || a.date) - new Date(b.created || b.date));

    if (sortedData.length < 3) return null;

    // Calculate month-over-month growth
    const monthlyData = {};
    sortedData.forEach(item => {
      const date = new Date(item.created || item.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) return null;

    const growthRates = [];
    for (let i = 1; i < months.length; i++) {
      const prev = monthlyData[months[i-1]];
      const curr = monthlyData[months[i]];
      const growthRate = ((curr - prev) / prev) * 100;
      growthRates.push(growthRate);
    }

    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

    return {
      type: 'growth_pattern',
      monthlyData,
      averageGrowthRate: avgGrowthRate,
      trend: avgGrowthRate > 0 ? 'growing' : avgGrowthRate < 0 ? 'declining' : 'stable',
      confidence: 0.8,
    };
  }

  calculateOverallConfidence(patterns) {
    if (patterns.length === 0) return 0;
    const totalConfidence = patterns.reduce((sum, pattern) => sum + (pattern.confidence || 0), 0);
    return totalConfidence / patterns.length;
  }

  analyzeSeasonalPatterns(data) {
    const patterns = [];
    const insights = [];

    const dates = data
      .map(item => item.created || item.date)
      .filter(date => date)
      .map(date => new Date(date));

    if (dates.length < 12) return { patterns, insights }; // Need at least a year of data

    // Analyze monthly distribution
    const monthlyDistribution = {};
    dates.forEach(date => {
      const month = date.getMonth();
      monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
    });

    // Find peak and low seasons
    const monthEntries = Object.entries(monthlyDistribution)
      .map(([month, count]) => ({ month: parseInt(month), count }))
      .sort((a, b) => b.count - a.count);

    if (monthEntries.length > 0) {
      const peakMonth = monthEntries[0];
      const lowMonth = monthEntries[monthEntries.length - 1];

      patterns.push({
        type: 'seasonal_pattern',
        monthlyDistribution,
        peakMonth: peakMonth.month,
        lowMonth: lowMonth.month,
        seasonality: (peakMonth.count - lowMonth.count) / lowMonth.count,
        confidence: 0.8,
      });

      insights.push({
        type: 'seasonality',
        description: `Peak activity in ${this.getMonthName(peakMonth.month)}, lowest in ${this.getMonthName(lowMonth.month)}`,
        confidence: 0.8,
      });
    }

    return { patterns, insights };
  }

  getMonthName(monthIndex) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  }
}

module.exports = new PatternRecognitionService();
