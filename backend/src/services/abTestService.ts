// @ts-nocheck

import ABTest from '@/models/appModels/ABTest';
import URLClick from '@/models/appModels/URLClick';
import mongoose from 'mongoose';
class ABTestService {
  /**
   * Assign user to test variant
   * @param {object} test - A/B test object
   * @param {string} userId - User ID or session ID
   * @returns {string} Assigned variant name
   */
  assignVariant(test, userId = null) {
    if (!test || test.status !== 'active') {
      return 'control';
    }

    // Use deterministic assignment based on user ID or random
    const seed = userId ? this.hashString(userId) : Math.random();
    const normalizedSeed = typeof seed === 'string' ? this.hashToNumber(seed) : seed;
    
    let cumulativeWeight = 0;
    const totalWeight = test.controlTrafficAllocation + 
      test.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);

    // Normalize weights to 0-1 range
    const controlWeight = test.controlTrafficAllocation / totalWeight;
    
    if (normalizedSeed < controlWeight) {
      return 'control';
    }

    cumulativeWeight = controlWeight;
    
    for (const variant of test.variants) {
      const variantWeight = variant.trafficAllocation / totalWeight;
      cumulativeWeight += variantWeight;
      
      if (normalizedSeed < cumulativeWeight) {
        return variant.name;
      }
    }

    return 'control'; // Fallback
  }

  /**
   * Hash string to number
   * @param {string} str - String to hash
   * @returns {number} Hash as number between 0 and 1
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Convert hash to number between 0 and 1
   * @param {number} hash - Hash number
   * @returns {number} Number between 0 and 1
   */
  hashToNumber(hash) {
    return (hash % 10000) / 10000;
  }

  /**
   * Calculate current test results
   * @param {object} test - A/B test object
   * @returns {Promise<object>} Current results
   */
  async calculateCurrentResults(test) {
    const startDate = test.startDate;
    const endDate = test.endDate || new Date();

    // Get all URLs involved in the test
    const urlIds = [test.controlUrl, ...test.variants.map(v => v.url)];

    const clickData = await URLClick.aggregate([
      {
        $match: {
          url: { $in: urlIds.map(id => new mongoose.Types.ObjectId(id)) },
          clickedAt: { $gte: startDate, $lte: endDate },
          isValidClick: true,
          isBot: false
        }
      },
      {
        $group: {
          _id: '$url',
          totalClicks: { $sum: 1 },
          uniqueClicks: { $sum: { $cond: ['$isUniqueClick', 1, 0] } },
          conversions: { $sum: { $cond: ['$isConversion', 1, 0] } }
        }
      }
    ]);

    // Map results by variant
    const results = {
      control: {
        urlId: test.controlUrl,
        clicks: 0,
        uniqueClicks: 0,
        conversions: 0,
        conversionRate: 0,
        trafficAllocation: test.controlTrafficAllocation
      }
    };

    // Initialize variant results
    test.variants.forEach(variant => {
      results[variant.name] = {
        urlId: variant.url,
        clicks: 0,
        uniqueClicks: 0,
        conversions: 0,
        conversionRate: 0,
        trafficAllocation: variant.trafficAllocation
      };
    });

    // Fill in actual data
    clickData.forEach(data => {
      const urlId = data._id.toString();
      
      if (urlId === test.controlUrl.toString()) {
        results.control.clicks = data.totalClicks;
        results.control.uniqueClicks = data.uniqueClicks;
        results.control.conversions = data.conversions;
        results.control.conversionRate = data.totalClicks > 0 ? 
          (data.conversions / data.totalClicks) * 100 : 0;
      } else {
        const variant = test.variants.find(v => v.url.toString() === urlId);
        if (variant && results[variant.name]) {
          results[variant.name].clicks = data.totalClicks;
          results[variant.name].uniqueClicks = data.uniqueClicks;
          results[variant.name].conversions = data.conversions;
          results[variant.name].conversionRate = data.totalClicks > 0 ? 
            (data.conversions / data.totalClicks) * 100 : 0;
        }
      }
    });

    return results;
  }

  /**
   * Calculate statistical significance
   * @param {object} test - A/B test object
   * @param {object} results - Test results
   * @returns {Promise<object>} Statistical significance
   */
  async calculateStatisticalSignificance(test, results) {
    const control = results.control;
    const significance = {};

    test.variants.forEach(variant => {
      const variantData = results[variant.name];
      
      if (!variantData || control.clicks === 0 || variantData.clicks === 0) {
        significance[variant.name] = {
          isSignificant: false,
          pValue: null,
          zScore: null,
          confidenceLevel: null,
          sampleSizeReached: false
        };
        return;
      }

      // Calculate Z-score for conversion rate difference
      const p1 = control.conversions / control.clicks;
      const p2 = variantData.conversions / variantData.clicks;
      const n1 = control.clicks;
      const n2 = variantData.clicks;

      if (n1 < test.minimumSampleSize || n2 < test.minimumSampleSize) {
        significance[variant.name] = {
          isSignificant: false,
          pValue: null,
          zScore: null,
          confidenceLevel: null,
          sampleSizeReached: false,
          remainingSampleSize: Math.max(
            test.minimumSampleSize - n1,
            test.minimumSampleSize - n2
          )
        };
        return;
      }

      // Pooled proportion
      const pPooled = (control.conversions + variantData.conversions) / (n1 + n2);
      
      // Standard error
      const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
      
      // Z-score
      const zScore = se > 0 ? (p2 - p1) / se : 0;
      
      // P-value (two-tailed test)
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
      
      // Check significance based on confidence level
      const alpha = (100 - test.confidenceLevel) / 100;
      const isSignificant = pValue < alpha;

      significance[variant.name] = {
        isSignificant,
        pValue,
        zScore,
        confidenceLevel: test.confidenceLevel,
        sampleSizeReached: true,
        lift: p1 > 0 ? ((p2 - p1) / p1) * 100 : 0
      };
    });

    return significance;
  }

  /**
   * Normal cumulative distribution function
   * @param {number} x - Value
   * @returns {number} CDF value
   */
  normalCDF(x) {
    // Approximation of the cumulative distribution function for standard normal distribution
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Determine test winner
   * @param {object} test - A/B test object
   * @param {object} results - Test results
   * @param {object} significance - Statistical significance
   * @returns {string} Winner variant name
   */
  determineWinner(test, results, significance) {
    const control = results.control;
    let winner = 'control';
    let bestConversionRate = control.conversionRate;

    // Check each variant
    test.variants.forEach(variant => {
      const variantData = results[variant.name];
      const variantSignificance = significance[variant.name];
      
      if (!variantData || !variantSignificance) return;

      // Variant must be statistically significant and have better conversion rate
      if (variantSignificance.isSignificant && 
          variantData.conversionRate > bestConversionRate) {
        winner = variant.name;
        bestConversionRate = variantData.conversionRate;
      }
    });

    return winner;
  }

  /**
   * Calculate performance metrics
   * @param {object} test - A/B test object
   * @param {object} options - Calculation options
   * @returns {Promise<object>} Performance metrics
   */
  async calculatePerformanceMetrics(test, options = {}) {
    const {
      metric = 'conversion_rate',
      startTime = test.startDate,
      endTime = test.endDate || new Date()
    } = options;

    const urlIds = [test.controlUrl, ...test.variants.map(v => v.url)];

    const aggregationPipeline = [
      {
        $match: {
          url: { $in: urlIds.map(id => new mongoose.Types.ObjectId(id)) },
          clickedAt: { $gte: startTime, $lte: endTime },
          isValidClick: true,
          isBot: false
        }
      }
    ];

    switch (metric) {
      case 'click_rate':
        aggregationPipeline.push({
          $group: {
            _id: {
              url: '$url',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } }
            },
            clicks: { $sum: 1 }
          }
        });
        break;

      case 'conversion_rate':
        aggregationPipeline.push({
          $group: {
            _id: {
              url: '$url',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } }
            },
            clicks: { $sum: 1 },
            conversions: { $sum: { $cond: ['$isConversion', 1, 0] } }
          }
        });
        break;

      case 'bounce_rate':
        aggregationPipeline.push({
          $group: {
            _id: {
              url: '$url',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } }
            },
            sessions: { $addToSet: '$sessionId' },
            bounces: { $sum: { $cond: ['$isBounce', 1, 0] } }
          }
        });
        break;

      default:
        aggregationPipeline.push({
          $group: {
            _id: {
              url: '$url',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } }
            },
            value: { $sum: 1 }
          }
        });
    }

    const performanceData = await URLClick.aggregate(aggregationPipeline);

    // Format data by variant
    const formattedData = {
      control: [],
      variants: {}
    };

    test.variants.forEach(variant => {
      formattedData.variants[variant.name] = [];
    });

    performanceData.forEach(data => {
      const urlId = data._id.url.toString();
      const date = data._id.date;
      
      const dataPoint = {
        date,
        ...data
      };

      if (urlId === test.controlUrl.toString()) {
        formattedData.control.push(dataPoint);
      } else {
        const variant = test.variants.find(v => v.url.toString() === urlId);
        if (variant && formattedData.variants[variant.name]) {
          formattedData.variants[variant.name].push(dataPoint);
        }
      }
    });

    return formattedData;
  }

  /**
   * Calculate final test results
   * @param {object} test - A/B test object
   * @returns {Promise<object>} Final results
   */
  async calculateFinalResults(test) {
    const results = await this.calculateCurrentResults(test);
    const significance = await this.calculateStatisticalSignificance(test, results);
    const winner = this.determineWinner(test, results, significance);

    return {
      results,
      significance,
      winner,
      calculatedAt: new Date(),
      testDuration: test.endDate ? 
        Math.round((test.endDate - test.startDate) / (1000 * 60 * 60 * 24)) : null
    };
  }

  /**
   * Split traffic between variants
   * @param {object} test - A/B test object
   * @param {number} totalTraffic - Total traffic amount
   * @returns {object} Traffic distribution
   */
  splitTraffic(test, totalTraffic) {
    const totalAllocation = test.controlTrafficAllocation + 
      test.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);

    const distribution = {
      control: Math.round((test.controlTrafficAllocation / totalAllocation) * totalTraffic)
    };

    test.variants.forEach(variant => {
      distribution[variant.name] = Math.round(
        (variant.trafficAllocation / totalAllocation) * totalTraffic
      );
    });

    return distribution;
  }

  /**
   * Track conversion event
   * @param {string} urlId - URL ID
   * @param {string} sessionId - Session ID
   * @param {object} conversionData - Conversion data
   * @returns {Promise<void>}
   */
  async trackConversion(urlId, sessionId, conversionData = {}) {
    await URLClick.updateMany(
      {
        url: urlId,
        sessionId,
        isValidClick: true
      },
      {
        $set: {
          isConversion: true,
          conversionValue: conversionData.value || 0,
          conversionType: conversionData.type || 'generic',
          convertedAt: new Date()
        }
      }
    );
  }

  /**
   * Get test recommendations
   * @param {object} test - A/B test object
   * @param {object} results - Test results
   * @param {object} significance - Statistical significance
   * @returns {object} Recommendations
   */
  getTestRecommendations(test, results, significance) {
    const recommendations = [];
    const warnings = [];

    // Check sample size
    const totalClicks = Object.values(results).reduce((sum, variant) => sum + variant.clicks, 0);
    if (totalClicks < test.minimumSampleSize * (test.variants.length + 1)) {
      warnings.push('Sample size may be too small for reliable results');
    }

    // Check test duration
    if (test.startDate) {
      const testDuration = (new Date() - test.startDate) / (1000 * 60 * 60 * 24);
      if (testDuration < 7) {
        warnings.push('Test should run for at least 7 days to account for weekly variations');
      }
    }

    // Check for significant results
    const significantVariants = test.variants.filter(variant => 
      significance[variant.name] && significance[variant.name].isSignificant
    );

    if (significantVariants.length === 0) {
      recommendations.push('Continue running the test or increase sample size');
    } else {
      const winner = this.determineWinner(test, results, significance);
      if (winner !== 'control') {
        recommendations.push(`Consider implementing variant "${winner}" as it shows significant improvement`);
      }
    }

    return {
      recommendations,
      warnings
    };
  }
}

export = new ABTestService();
