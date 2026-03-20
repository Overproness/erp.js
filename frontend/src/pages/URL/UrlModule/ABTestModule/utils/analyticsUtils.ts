// Analytics Utility Functions

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Calculates the statistical significance between two variants in an A/B test
 * @param {Object} variantA - First variant data
 * @param {Object} variantB - Second variant data
 * @param {number} variantA.visitors - Number of visitors for variant A
 * @param {number} variantA.conversions - Number of conversions for variant A
 * @param {number} variantB.visitors - Number of visitors for variant B
 * @param {number} variantB.conversions - Number of conversions for variant B
 * @param {number} confidenceLevel - Confidence level (default: 0.95)
 * @returns {Object} Statistical significance results
 */
export const calculateStatisticalSignificance = (variantA, variantB, confidenceLevel = 0.95) => {
  // Validation
  if (!variantA || !variantB || 
      !variantA.visitors || !variantB.visitors ||
      variantA.visitors <= 0 || variantB.visitors <= 0) {
    return {
      isSignificant: false,
      confidenceLevel: 0,
      pValue: 1,
      message: 'Insufficient data'
    };
  }

  // Calculate conversion rates
  const conversionRateA = variantA.conversions / variantA.visitors;
  const conversionRateB = variantB.conversions / variantB.visitors;

  // Calculate standard errors
  const seA = Math.sqrt((conversionRateA * (1 - conversionRateA)) / variantA.visitors);
  const seB = Math.sqrt((conversionRateB * (1 - conversionRateB)) / variantB.visitors);
  const seDiff = Math.sqrt(seA * seA + seB * seB);

  // Calculate z-score
  const zScore = Math.abs((conversionRateA - conversionRateB) / seDiff);

  // Calculate p-value (simplified approach)
  const pValue = 1 - normalCDF(zScore);

  // Determine if result is significant
  const isSignificant = pValue < (1 - confidenceLevel);
  const improvementPercent = ((conversionRateB - conversionRateA) / conversionRateA) * 100;

  // Generate human-readable message
  let message = '';
  if (isSignificant) {
    const betterVariant = conversionRateB > conversionRateA ? 'B' : 'A';
    message = `Variant ${betterVariant} is better with ${(confidenceLevel * 100).toFixed(1)}% confidence`;
    if (betterVariant === 'B') {
      message += ` (${Math.abs(improvementPercent).toFixed(2)}% improvement)`;
    } else {
      message += ` (${Math.abs(improvementPercent).toFixed(2)}% worse)`;
    }
  } else {
    message = 'No statistically significant difference';
  }

  return {
    isSignificant,
    confidenceLevel: confidenceLevel,
    pValue,
    zScore,
    conversionRateA,
    conversionRateB,
    improvementPercent,
    message
  };
};

/**
 * Normal cumulative distribution function
 */
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) {
    prob = 1 - prob;
  }
  return prob;
}

export default {
  calculateStatisticalSignificance
};