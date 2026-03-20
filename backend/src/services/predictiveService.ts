// @ts-nocheck
const { Invoice, Client, Quote, Payment } = require('../models');

/**
 * Predictive Service
 * Uses statistical methods for forecasting and trend analysis
 */

/**
 * Linear regression for simple trend prediction
 */
function linearRegression(data) {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  data.forEach((point, index) => {
    const x = index;
    const y = point.value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Moving average calculation
 */
function movingAverage(data, window = 7) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((sum, point) => sum + point.value, 0) / slice.length;
    result.push({ date: data[i].date, value: avg });
  }
  return result;
}

/**
 * Exponential smoothing
 */
function exponentialSmoothing(data, alpha = 0.3) {
  if (data.length === 0) return [];

  const result = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i].value + (1 - alpha) * result[i - 1].value;
    result.push({ date: data[i].date, value: smoothed });
  }

  return result;
}

/**
 * Calculate confidence intervals
 */
function calculateConfidenceInterval(data, confidence = 0.95) {
  const n = data.length;
  if (n === 0) return { lower: 0, upper: 0 };

  const mean = data.reduce((sum, point) => sum + point.value, 0) / n;
  const variance = data.reduce((sum, point) => sum + Math.pow(point.value - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Z-score for 95% confidence
  const zScore = confidence === 0.95 ? 1.96 : 2.576;
  const margin = zScore * (stdDev / Math.sqrt(n));

  return {
    lower: mean - margin,
    upper: mean + margin,
    mean,
  };
}

/**
 * Predict future values
 */
async function predict(ownerId, metric, period = 30) {
  try {
    // Get historical data
    const historicalData = await getHistoricalData(ownerId, metric);

    if (historicalData.length === 0) {
      return {
        success: false,
        message: 'Insufficient historical data for prediction',
      };
    }

    // Apply linear regression
    const regression = linearRegression(historicalData);

    // Generate predictions
    const predictions = [];
    const lastIndex = historicalData.length - 1;

    for (let i = 1; i <= period; i++) {
      const futureIndex = lastIndex + i;
      const predictedValue = regression.slope * futureIndex + regression.intercept;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);

      predictions.push({
        date: futureDate,
        value: Math.max(0, predictedValue), // Ensure non-negative
        type: 'predicted',
      });
    }

    // Calculate trend
    const trend =
      regression.slope > 0 ? 'increasing' : regression.slope < 0 ? 'decreasing' : 'stable';

    // Calculate moving average for smoothed historical view
    const smoothedHistorical = movingAverage(historicalData, 7);

    // Calculate confidence interval
    const confidence = calculateConfidenceInterval(historicalData);

    return {
      success: true,
      data: {
        metric,
        historical: historicalData,
        smoothed: smoothedHistorical,
        predictions,
        trend,
        confidence,
        accuracy: calculateAccuracy(historicalData, regression),
      },
    };
  } catch (error) {
    console.error('Error in prediction:', error);
    throw error;
  }
}

/**
 * Get historical data for a specific metric
 */
async function getHistoricalData(ownerId, metric) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // Last 90 days

  let data = [];

  switch (metric.toLowerCase()) {
    case 'revenue':
      data = await Invoice.aggregate([
        {
          $match: {
            owner: ownerId,
            removed: false,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      break;

    case 'customers':
      data = await Client.aggregate([
        {
          $match: {
            owner: ownerId,
            removed: false,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      break;

    case 'invoices':
      data = await Invoice.aggregate([
        {
          $match: {
            owner: ownerId,
            removed: false,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      break;

    case 'payments':
      data = await Payment.aggregate([
        {
          $match: {
            owner: ownerId,
            removed: false,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      break;

    default:
      throw new Error('Invalid metric type');
  }

  return data.map((item) => ({
    date: new Date(item._id),
    value: item.value,
  }));
}

/**
 * Calculate prediction accuracy using R-squared
 */
function calculateAccuracy(data, regression) {
  if (data.length === 0) return 0;

  const mean = data.reduce((sum, point) => sum + point.value, 0) / data.length;

  let ssRes = 0; // Sum of squares of residuals
  let ssTot = 0; // Total sum of squares

  data.forEach((point, index) => {
    const predicted = regression.slope * index + regression.intercept;
    ssRes += Math.pow(point.value - predicted, 2);
    ssTot += Math.pow(point.value - mean, 2);
  });

  const rSquared = 1 - ssRes / ssTot;
  return Math.max(0, Math.min(1, rSquared)); // Clamp between 0 and 1
}

/**
 * Detect anomalies in data
 */
function detectAnomalies(data, threshold = 2) {
  if (data.length === 0) return [];

  const values = data.map((d) => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = [];
  data.forEach((point, index) => {
    const zScore = Math.abs((point.value - mean) / stdDev);
    if (zScore > threshold) {
      anomalies.push({
        index,
        date: point.date,
        value: point.value,
        zScore,
        deviation: point.value - mean,
      });
    }
  });

  return anomalies;
}

/**
 * Get seasonal patterns
 */
function analyzeSeasonality(data) {
  if (data.length < 14) {
    return { hasSeasonality: false, pattern: null };
  }

  // Group by day of week
  const dayGroups = {};
  data.forEach((point) => {
    const day = new Date(point.date).getDay();
    if (!dayGroups[day]) dayGroups[day] = [];
    dayGroups[day].push(point.value);
  });

  // Calculate average for each day
  const dayAverages = {};
  Object.keys(dayGroups).forEach((day) => {
    const values = dayGroups[day];
    dayAverages[day] = values.reduce((sum, val) => sum + val, 0) / values.length;
  });

  // Check if there's significant variation
  const allAvg = Object.values(dayAverages).reduce((sum, val) => sum + val, 0) / 7;
  const hasSeasonality = Object.values(dayAverages).some(
    (avg) => Math.abs(avg - allAvg) / allAvg > 0.2 // 20% variation threshold
  );

  return {
    hasSeasonality,
    pattern: dayAverages,
    peakDay: Object.keys(dayAverages).reduce((a, b) => (dayAverages[a] > dayAverages[b] ? a : b)),
    lowDay: Object.keys(dayAverages).reduce((a, b) => (dayAverages[a] < dayAverages[b] ? a : b)),
  };
}

module.exports = {
  predict,
  getHistoricalData,
  linearRegression,
  movingAverage,
  exponentialSmoothing,
  calculateConfidenceInterval,
  detectAnomalies,
  analyzeSeasonality,
};
