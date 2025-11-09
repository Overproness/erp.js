const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

// Create MongoDB store for rate limiting
const mongoStore = new MongoStore({
  uri: process.env.DATABASE,
  collectionName: 'aiRateLimits',
  expireTimeMs: 15 * 60 * 1000, // 15 minutes
  errorHandler: (err) => {
    console.error('MongoStore error:', err);
  }
});

const getUserId = (req) => req.companyOwner?._id || req.user?._id || 'unknown';
const getUserPlan = (req) => req.companyOwner?.plan || 'free';

const chatRateLimit = rateLimit({
  store: mongoStore,
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    const plan = getUserPlan(req);
    switch (plan) {
      case 'premium': return 200;
      case 'pro': return 100;
      default: return 50;
    }
  },
  keyGenerator: (req) => `chat:${getUserId(req)}:${req.params.assistantId}`,
  message: {
    success: false,
    result: null,
    message: 'Too many chat requests. Please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const analysisRateLimit = rateLimit({
  store: mongoStore,
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    const plan = getUserPlan(req);
    switch (plan) {
      case 'premium': return 100;
      case 'pro': return 50;
      default: return 20;
    }
  },
  keyGenerator: (req) => `analysis:${getUserId(req)}:${req.params.assistantId}`,
  message: {
    success: false,
    result: null,
    message: 'Too many analysis requests. Please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const suggestionRateLimit = rateLimit({
  store: mongoStore,
  windowMs: 60 * 60 * 1000,
  max: (req) => {
    const plan = getUserPlan(req);
    switch (plan) {
      case 'premium': return 50;
      case 'pro': return 30;
      default: return 10;
    }
  },
  keyGenerator: (req) => `suggestions:${getUserId(req)}:${req.params.assistantId}`,
  message: {
    success: false,
    result: null,
    message: 'Too many suggestion requests. Please try again later.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const predictionRateLimit = rateLimit({
  store: mongoStore,
  windowMs: 60 * 60 * 1000,
  max: (req) => {
    const plan = getUserPlan(req);
    switch (plan) {
      case 'premium': return 30;
      case 'pro': return 20;
      default: return 5;
    }
  },
  keyGenerator: (req) => `predictions:${getUserId(req)}:${req.params.assistantId}`,
  message: {
    success: false,
    result: null,
    message: 'Too many prediction requests. Please try again later.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

console.log('rateLimitAi loaded');

const wrapRateLimiter = (rateLimiter) => {
  return (req, res, next) => {
    console.log(`→ Applying rate limiter for: ${req.originalUrl}`);
    try {
      rateLimiter(req, res, (err) => {
        if (err) {
          console.error('Rate limiter error:', err);
          return res.status(500).json({
            success: false,
            result: null,
            message: 'Internal server error during rate limiting',
          });
        }
        console.log(`✓ Rate limit passed: ${req.originalUrl}`);
        next();
      });
    } catch (e) {
      console.error('Unexpected rate limiter failure:', e);
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Rate limiter crashed unexpectedly',
      });
    }
  };
};

const rateLimitAi = () => {
  const middleware = (req, res, next) => {
    const path = req.route?.path || req.originalUrl || '';
    console.log('rateLimitAi invoked for path:', path);

    if (path.includes('/chat')) {
      return wrapRateLimiter(chatRateLimit)(req, res, next);
    } else if (path.includes('/analyze')) {
      return wrapRateLimiter(analysisRateLimit)(req, res, next);
    } else if (path.includes('/suggest')) {
      return wrapRateLimiter(suggestionRateLimit)(req, res, next);
    } else if (path.includes('/predict')) {
      return wrapRateLimiter(predictionRateLimit)(req, res, next);
    }

    console.log('Unknown path fallback — defaulting to chatRateLimit');
    return wrapRateLimiter(chatRateLimit)(req, res, next);
  };

  console.log('Returning middleware from rateLimitAi()');
  return middleware;
};

module.exports = {
  rateLimitAi,
  chatRateLimit,
  analysisRateLimit,
  suggestionRateLimit,
  predictionRateLimit
};
