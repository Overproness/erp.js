/**
 * Lead Scoring Service
 * Calculates lead scores based on various customer attributes
 */

class LeadScoringService {
  constructor() {
    // Scoring weights (total should be 100)
    this.weights = {
      demographic: 20,
      behavioral: 25,
      engagement: 25,
      value: 20,
      interest: 10,
    };
  }

  /**
   * Calculate total lead score for a customer (sync version)
   * @param {Object} customer - Customer object
   * @returns {Object} Score breakdown and total
   */
  calculateScore(customer) {
    const scoreBreakdown = {
      demographicScore: this.calculateDemographicScore(customer),
      behavioralScore: this.calculateBehavioralScore(customer),
      engagementScore: this.calculateEngagementScore(customer),
      valueScore: this.calculateValueScore(customer),
      interestScore: this.calculateInterestScore(customer),
    };

    const totalScore = Math.round(
      scoreBreakdown.demographicScore * (this.weights.demographic / 100) +
        scoreBreakdown.behavioralScore * (this.weights.behavioral / 100) +
        scoreBreakdown.engagementScore * (this.weights.engagement / 100) +
        scoreBreakdown.valueScore * (this.weights.value / 100) +
        scoreBreakdown.interestScore * (this.weights.interest / 100)
    );

    const scoringFactors = this.getScoringFactors(customer, scoreBreakdown);

    return {
      totalScore: Math.min(totalScore, 100),
      scoreBreakdown,
      scoringFactors,
      lastCalculated: new Date(),
    };
  }

  /**
   * Calculate total lead score for a customer (async version with Interaction data)
   * @param {Object} customer - Customer object
   * @param {String} clientId - Customer ID for fetching interactions
   * @returns {Promise<Object>} Score breakdown and total
   */
  async calculateScoreAsync(customer, clientId) {
    const scoreBreakdown = {
      demographicScore: this.calculateDemographicScore(customer),
      behavioralScore: this.calculateBehavioralScore(customer),
      engagementScore: await this.calculateEngagementScoreAsync(clientId),
      valueScore: this.calculateValueScore(customer),
      interestScore: this.calculateInterestScore(customer),
    };

    const totalScore = Math.round(
      scoreBreakdown.demographicScore * (this.weights.demographic / 100) +
        scoreBreakdown.behavioralScore * (this.weights.behavioral / 100) +
        scoreBreakdown.engagementScore * (this.weights.engagement / 100) +
        scoreBreakdown.valueScore * (this.weights.value / 100) +
        scoreBreakdown.interestScore * (this.weights.interest / 100)
    );

    const scoringFactors = this.getScoringFactors(customer, scoreBreakdown);

    return {
      totalScore: Math.min(totalScore, 100),
      scoreBreakdown,
      scoringFactors,
      lastCalculated: new Date(),
    };
  }

  /**
   * Calculate demographic score (0-100)
   * Based on age, income, location, occupation
   */
  calculateDemographicScore(customer) {
    let score = 0;
    const demographics = customer.demographics || {};

    // Age scoring (0-25 points)
    if (demographics.age) {
      if (demographics.age >= 25 && demographics.age <= 65) {
        score += 25;
      } else if (demographics.age >= 18 && demographics.age <= 75) {
        score += 15;
      } else {
        score += 5;
      }
    }

    // Income scoring (0-35 points)
    if (demographics.income) {
      if (demographics.income >= 100000) {
        score += 35;
      } else if (demographics.income >= 60000) {
        score += 25;
      } else if (demographics.income >= 30000) {
        score += 15;
      } else {
        score += 5;
      }
    }

    // Location scoring (0-20 points) - Has location info
    if (demographics.location) {
      score += 20;
    }

    // Occupation scoring (0-20 points) - Professional/business related
    if (demographics.occupation) {
      const professionalOccupations = [
        'manager',
        'director',
        'executive',
        'owner',
        'ceo',
        'cfo',
        'cto',
        'engineer',
        'developer',
        'consultant',
      ];
      const occupation = demographics.occupation.toLowerCase();
      const isProfessional = professionalOccupations.some((prof) => occupation.includes(prof));
      score += isProfessional ? 20 : 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate behavioral score (0-100)
   * Based on purchase frequency, payment methods, visit patterns
   */
  calculateBehavioralScore(customer) {
    let score = 0;
    const behavior = customer.behavior || {};

    // Purchase frequency (0-40 points)
    if (behavior.purchaseFrequency) {
      const frequency = behavior.purchaseFrequency.toLowerCase();
      if (frequency.includes('weekly')) {
        score += 40;
      } else if (frequency.includes('monthly')) {
        score += 30;
      } else if (frequency.includes('quarterly')) {
        score += 20;
      } else if (frequency.includes('yearly')) {
        score += 10;
      }
    }

    // Visit frequency (0-30 points)
    if (behavior.visitFrequency) {
      if (behavior.visitFrequency >= 10) {
        score += 30;
      } else if (behavior.visitFrequency >= 5) {
        score += 20;
      } else if (behavior.visitFrequency >= 2) {
        score += 10;
      } else if (behavior.visitFrequency >= 1) {
        score += 5;
      }
    }

    // Recent purchase (0-20 points)
    if (behavior.lastPurchaseDate) {
      const daysSinceLastPurchase =
        (new Date() - new Date(behavior.lastPurchaseDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPurchase <= 30) {
        score += 20;
      } else if (daysSinceLastPurchase <= 90) {
        score += 15;
      } else if (daysSinceLastPurchase <= 180) {
        score += 10;
      } else if (daysSinceLastPurchase <= 365) {
        score += 5;
      }
    }

    // Preferred products (0-10 points)
    if (behavior.preferredProducts && behavior.preferredProducts.length > 0) {
      score += Math.min(behavior.preferredProducts.length * 2, 10);
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score (0-100)
   * Based on touchpoints and interactions
   * This is a sync calculation - for async with Interaction data, use calculateEngagementScoreAsync
   */
  calculateEngagementScore(customer) {
    let score = 0;
    const touchpoints = customer.touchpoints || [];

    // Number of touchpoints (0-40 points)
    if (touchpoints.length > 0) {
      score += Math.min(touchpoints.length * 4, 40);
    }

    // Recent touchpoints (0-30 points)
    const recentTouchpoints = touchpoints.filter((tp) => {
      const daysSince = (new Date() - new Date(tp.date)) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    if (recentTouchpoints.length > 0) {
      score += Math.min(recentTouchpoints.length * 10, 30);
    }

    // Multi-channel engagement (0-20 points)
    const uniqueChannels = new Set(touchpoints.map((tp) => tp.channel));
    score += Math.min(uniqueChannels.size * 5, 20);

    // Quality touchpoints (0-10 points) - meetings, purchases
    const qualityTouchpoints = touchpoints.filter(
      (tp) => tp.type === 'purchase' || tp.type === 'meeting'
    );
    if (qualityTouchpoints.length > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score using Interaction data (async version)
   * @param {String} clientId - Customer ID
   * @returns {Promise<Number>} Engagement score (0-100)
   */
  async calculateEngagementScoreAsync(clientId) {
    try {
      const mongoose = require('mongoose');
      const Interaction = mongoose.model('Interaction');

      const interactions = await Interaction.find({
        client: clientId,
        removed: false,
      })
        .sort({ interactionDate: -1 })
        .limit(100);

      let score = 0;

      // Number of interactions (0-40 points)
      const interactionCount = interactions.length;
      score += Math.min(interactionCount * 4, 40);

      // Recent interactions in last 30 days (0-30 points)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentInteractions = interactions.filter(
        (int) => new Date(int.interactionDate) >= thirtyDaysAgo
      );
      score += Math.min(recentInteractions.length * 6, 30);

      // Multi-channel engagement (0-20 points)
      const uniqueChannels = new Set(interactions.map((int) => int.channel));
      score += Math.min(uniqueChannels.size * 4, 20);

      // Quality interactions (0-10 points) - meetings, purchases, demo requests
      const qualityInteractions = interactions.filter(
        (int) =>
          int.type === 'purchase' ||
          int.type === 'meeting' ||
          int.type === 'demo_request' ||
          int.type === 'quote_request'
      );
      if (qualityInteractions.length > 0) {
        score += 10;
      }

      return Math.min(Math.round(score), 100);
    } catch (error) {
      console.error('Error calculating async engagement score:', error);
      return 0;
    }
  }

  /**
   * Calculate value score (0-100)
   * Based on lifetime value, total purchases, loyalty
   */
  calculateValueScore(customer) {
    let score = 0;
    const customerValue = customer.customerValue || {};

    // Lifetime value (0-50 points)
    if (customerValue.lifetimeValue) {
      if (customerValue.lifetimeValue >= 50000) {
        score += 50;
      } else if (customerValue.lifetimeValue >= 20000) {
        score += 40;
      } else if (customerValue.lifetimeValue >= 10000) {
        score += 30;
      } else if (customerValue.lifetimeValue >= 5000) {
        score += 20;
      } else if (customerValue.lifetimeValue >= 1000) {
        score += 10;
      }
    }

    // Total purchases (0-20 points)
    if (customerValue.totalPurchases) {
      score += Math.min(customerValue.totalPurchases * 2, 20);
    }

    // Average order value (0-15 points)
    if (customerValue.averageOrderValue) {
      if (customerValue.averageOrderValue >= 1000) {
        score += 15;
      } else if (customerValue.averageOrderValue >= 500) {
        score += 10;
      } else if (customerValue.averageOrderValue >= 100) {
        score += 5;
      }
    }

    // Loyalty points (0-15 points)
    if (customerValue.loyaltyPoints) {
      score += Math.min(customerValue.loyaltyPoints / 100, 15);
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate interest score (0-100)
   * Based on recent activity and interaction quality
   */
  calculateInterestScore(customer) {
    let score = 0;
    const touchpoints = customer.touchpoints || [];

    // Recent inquiries (0-50 points)
    const recentInquiries = touchpoints.filter((tp) => {
      const daysSince = (new Date() - new Date(tp.date)) / (1000 * 60 * 60 * 24);
      return daysSince <= 30 && tp.type === 'inquiry';
    });
    score += Math.min(recentInquiries.length * 25, 50);

    // Follow-ups (0-30 points)
    const followUps = touchpoints.filter((tp) => tp.type === 'follow_up');
    score += Math.min(followUps.length * 10, 30);

    // Positive outcomes (0-20 points)
    const positiveOutcomes = touchpoints.filter(
      (tp) =>
        tp.outcome &&
        (tp.outcome.toLowerCase().includes('interested') ||
          tp.outcome.toLowerCase().includes('positive') ||
          tp.outcome.toLowerCase().includes('scheduled'))
    );
    if (positiveOutcomes.length > 0) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Get detailed scoring factors
   */
  getScoringFactors(customer) {
    const factors = [];

    // Demographics factors
    if (customer.demographics?.income >= 100000) {
      factors.push({
        factor: 'High income bracket',
        points: 35,
        weight: this.weights.demographic,
      });
    }
    if (customer.demographics?.age >= 25 && customer.demographics?.age <= 65) {
      factors.push({
        factor: 'Target age demographic',
        points: 25,
        weight: this.weights.demographic,
      });
    }

    // Behavioral factors
    if (customer.behavior?.visitFrequency >= 10) {
      factors.push({ factor: 'Frequent visitor', points: 30, weight: this.weights.behavioral });
    }
    if (customer.behavior?.purchaseFrequency?.toLowerCase().includes('weekly')) {
      factors.push({ factor: 'Weekly purchaser', points: 40, weight: this.weights.behavioral });
    }

    // Engagement factors
    if (customer.touchpoints?.length >= 5) {
      factors.push({
        factor: 'High engagement level',
        points: 20,
        weight: this.weights.engagement,
      });
    }

    // Value factors
    if (customer.customerValue?.lifetimeValue >= 50000) {
      factors.push({
        factor: 'High lifetime value',
        points: 50,
        weight: this.weights.value,
      });
    }

    return factors;
  }

  /**
   * Determine qualification status based on score
   */
  determineQualificationStatus(totalScore, currentStatus = 'unqualified') {
    // Don't downgrade customers
    if (currentStatus === 'customer') {
      return {
        status: 'customer',
        temperature: totalScore >= 80 ? 'hot' : totalScore >= 60 ? 'warm' : 'cold',
      };
    }

    let status = 'unqualified';
    let temperature = 'cold';

    if (totalScore >= 70) {
      status = 'sales_qualified';
      temperature = 'hot';
    } else if (totalScore >= 50) {
      status = 'marketing_qualified';
      temperature = 'warm';
    } else if (totalScore >= 30) {
      status = 'marketing_qualified';
      temperature = 'cold';
    }

    // If already qualified at a higher level, don't downgrade
    const statusHierarchy = [
      'unqualified',
      'marketing_qualified',
      'sales_qualified',
      'opportunity',
      'customer',
    ];
    const currentLevel = statusHierarchy.indexOf(currentStatus);
    const newLevel = statusHierarchy.indexOf(status);

    if (currentLevel > newLevel) {
      return { status: currentStatus, temperature };
    }

    return { status, temperature };
  }
}

module.exports = new LeadScoringService();
