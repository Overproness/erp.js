export interface SentimentResult {
  score: number; // -1.0 to 1.0
  category: 'positive' | 'neutral' | 'negative';
  keywords: string[];
}

export interface ReviewResponseContext {
  authorName: string;
  rating: number;
  comment: string;
  businessName?: string;
  supportEmail?: string;
  platform?: string;
}

/**
 * SentimentAutoResponseService
 *
 * Provides intelligent sentiment evaluation and automated AI review response drafting.
 */
export class SentimentAutoResponseService {
  private static positiveWords = new Set([
    'excellent', 'great', 'love', 'amazing', 'perfect', 'awesome', 'good', 'friendly',
    'helpful', 'fast', 'quick', 'recommend', 'recommended', 'best', 'wonderful', 'professional', 'clean',
    'smooth', 'delighted', 'fantastic', 'pleased', 'quality', 'superb', 'exceptional',
    'outstanding', 'brilliant', 'support', 'happy', 'pleasure', 'top', 'favorite', 'efficient'
  ]);

  private static negativeWords = new Set([
    'terrible', 'horrible', 'worst', 'bad', 'poor', 'slow', 'rude', 'disappointed',
    'unhappy', 'broken', 'waste', 'never', 'fail', 'hate', 'delay', 'awful',
    'useless', 'unhelpful', 'unresponsive', 'overpriced', 'scam', 'unacceptable'
  ]);

  /**
   * Evaluates text sentiment category and score
   */
  public static analyzeSentiment(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
      return { score: 0, category: 'neutral', keywords: [] };
    }

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/);

    let posCount = 0;
    let negCount = 0;
    const matchedKeywords: string[] = [];

    for (const word of words) {
      if (this.positiveWords.has(word)) {
        posCount++;
        matchedKeywords.push(word);
      } else if (this.negativeWords.has(word)) {
        negCount++;
        matchedKeywords.push(word);
      }
    }

    const total = posCount + negCount;
    let score = 0;
    if (total > 0) {
      score = Number(((posCount - negCount) / total).toFixed(2));
    }

    let category: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (score >= 0.2) {
      category = 'positive';
    } else if (score <= -0.2) {
      category = 'negative';
    }

    return {
      score,
      category,
      keywords: Array.from(new Set(matchedKeywords)).slice(0, 8),
    };
  }

  /**
   * Generates a context-aware, professional response draft based on rating and sentiment
   */
  public static generateResponseDraft(context: ReviewResponseContext): string {
    const { authorName, rating, comment, businessName = 'our team', supportEmail = 'support@example.com' } = context;
    const firstName = authorName ? authorName.split(' ')[0] : 'there';
    const sentiment = this.analyzeSentiment(comment);

    if (rating >= 5 || (rating === 4 && sentiment.category === 'positive')) {
      return (
        `Hi ${firstName}, thank you so much for the 5-star review! ` +
        `We are thrilled to hear that you had an exceptional experience with ${businessName}. ` +
        `Your kind feedback motivates us every day, and we look forward to welcoming you back soon!`
      );
    }

    if (rating === 4 || (rating === 3 && sentiment.category !== 'negative')) {
      return (
        `Hi ${firstName}, thank you for taking the time to share your feedback with ${businessName}. ` +
        `We truly appreciate your positive rating and are always looking for ways to improve our service. ` +
        `If there is anything specific we can do to make your next experience a full 5 stars, please let us know at ${supportEmail}.`
      );
    }

    if (rating === 3) {
      return (
        `Hello ${firstName}, thank you for your honest feedback. ` +
        `At ${businessName}, we aim to provide every customer with a flawless experience, and we are sorry to hear that we met only some of your expectations. ` +
        `Please reach out to us directly at ${supportEmail} so we can understand what occurred and make things right for you.`
      );
    }

    // Negative (1 or 2 stars)
    return (
      `Dear ${firstName}, we sincerely apologize for your experience with ${businessName}. ` +
      `What you described does not reflect the standard of quality and service we hold ourselves to. ` +
      `We would appreciate the opportunity to make this right immediately. ` +
      `Please contact our management directly at ${supportEmail} or through our support line so we can investigate and resolve this with you.`
    );
  }
}
