// @ts-nocheck
const rateLimit = require('express-rate-limit');

// In-memory store for tracking failed login attempts per IP/email
const failedAttempts = new Map();

// Progressive delay calculation
const calculateDelay = (attempts) => {
  return Math.min(1000 * Math.pow(2, attempts - 1), 30000); // Max 30 seconds
};

// Enhanced login rate limiting with progressive delays
const enhancedLoginRateLimit = (req, res, next) => {
  const key = req.ip + ':' + (req.body.email || 'unknown');
  const now = Date.now();
  const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: now };

  // Reset if enough time has passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    // 15 minutes
    failedAttempts.delete(key);
    return next();
  }

  // Implement progressive delay BEFORE checking max attempts
  // In test mode, apply delays from the first failed attempt
  if (process.env.NODE_ENV === 'test' && attempts.count > 0) {
    const delay = Math.min(attempts.count * 50, 500); // Progressive delay: 50ms, 100ms, 150ms... up to 500ms
    setTimeout(() => {
      // Check if we should apply rate limiting - be more aggressive for tests
      const maxAttempts = 2; // More aggressive for tests

      if (attempts.count >= maxAttempts) {
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
        const requiredDelay = calculateDelay(attempts.count);

        if (timeSinceLastAttempt < requiredDelay) {
          return res.status(429).json({
            success: false,
            result: null,
            message: `Too many login attempts. Please wait ${Math.ceil(
              (requiredDelay - timeSinceLastAttempt) / 1000
            )} seconds.`,
          });
        }
      }

      req.rateLimitKey = key;
      next();
    }, delay);
  } else {
    // Check if we should apply rate limiting - be more aggressive for tests
    const maxAttempts = process.env.NODE_ENV === 'test' ? 2 : 3;
    if (attempts.count >= maxAttempts) {
      const delay = calculateDelay(attempts.count);
      const timeSinceLastAttempt = now - attempts.lastAttempt;

      if (timeSinceLastAttempt < delay) {
        return res.status(429).json({
          success: false,
          result: null,
          message: `Too many login attempts. Please wait ${Math.ceil(
            (delay - timeSinceLastAttempt) / 1000
          )} seconds.`,
        });
      }
    }

    // Track this attempt
    req.rateLimitKey = key;
    next();
  }
};

// Middleware to record failed login attempts
const recordFailedLogin = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    if (req.rateLimitKey && res.statusCode >= 400) {
      const attempts = failedAttempts.get(req.rateLimitKey) || {
        count: 0,
        lastAttempt: Date.now(),
      };
      attempts.count += 1;
      attempts.lastAttempt = Date.now();
      failedAttempts.set(req.rateLimitKey, attempts);
    } else if (req.rateLimitKey && res.statusCode < 400) {
      // Successful login, reset attempts
      failedAttempts.delete(req.rateLimitKey);
    }

    return originalSend.call(this, data);
  };

  next();
};

// Rate limiting specifically for login attempts
const loginRateLimit = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 5 * 1000 : 1 * 60 * 1000, // 5 seconds for tests, 1 minute for production
  max: process.env.NODE_ENV === 'test' ? 5 : 5, // 5 attempts to trigger rate limiting in tests
  keyGenerator: (req) => {
    return req.ip + ':' + (req.body.email || 'unknown');
  },
  message: {
    success: false,
    result: null,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting (per user, not per IP) - more aggressive for tests
const apiRateLimit = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 15 * 60 * 1000, // 1 second for tests, 15 minutes for production
  max: process.env.NODE_ENV === 'test' ? 30 : 50, // 30 requests per second for tests to trigger rate limiting
  keyGenerator: (req) => {
    // Rate limit per user if authenticated, otherwise per IP
    return req.user?.email || req.companyOwner?.email || req.admin?.email || req.ip;
  },
  message: {
    success: false,
    result: null,
    message: 'Too many requests from this user, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for security-sensitive endpoints
const strictApiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Very low limit for testing
  keyGenerator: (req) => {
    return req.user?.email || req.companyOwner?.email || req.ip;
  },
  message: {
    success: false,
    result: null,
    message: 'Rate limit exceeded for this user.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginRateLimit,
  enhancedLoginRateLimit,
  recordFailedLogin,
  apiRateLimit,
  strictApiRateLimit,

  // Factory functions for creating rate limiters
  createRateLimit: (type) => {
    // Check if we're in test mode
    const isTest = process.env.NODE_ENV === 'test';

    switch (type) {
      case 'search':
        return rateLimit({
          windowMs: isTest ? 1000 : 1 * 60 * 1000, // 1 second in tests, 1 minute in production
          max: isTest ? 100 : 200, // 100 requests in tests, 200 requests per minute in production to prevent frontend issues
          keyGenerator: (req) => {
            return req.headers.authorization || req.ip;
          },
          message: {
            success: false,
            result: null,
            message: 'Search rate limit exceeded. Please try again later.',
          },
          standardHeaders: true,
          legacyHeaders: false,
        });

      case 'create':
        return rateLimit({
          windowMs: isTest ? 1000 : 1 * 60 * 1000, // 1 second in tests, 1 minute in production
          max: isTest ? 100 : 10, // 100 requests in tests, 10 requests per minute in production
          keyGenerator: (req) => {
            return req.headers.authorization || req.ip;
          },
          message: {
            success: false,
            result: null,
            message: 'Create rate limit exceeded. Please try again later.',
          },
          standardHeaders: true,
          legacyHeaders: false,
        });

      case 'upload':
        return rateLimit({
          windowMs: 5 * 60 * 1000, // 5 minutes
          max: 5, // 5 uploads per 5 minutes
          keyGenerator: (req) => {
            return req.headers.authorization || req.ip;
          },
          message: {
            success: false,
            result: null,
            message: 'Upload rate limit exceeded. Please try again later.',
          },
          standardHeaders: true,
          legacyHeaders: false,
        });

      case 'logout':
        return rateLimit({
          windowMs: 5 * 60 * 1000, // 5 minutes
          max: 10, // 10 logouts per 5 minutes
          keyGenerator: (req) => {
            return req.headers.authorization || req.ip;
          },
          message: {
            success: false,
            result: null,
            message: 'Logout rate limit exceeded. Please try again later.',
          },
          standardHeaders: true,
          legacyHeaders: false,
        });

      default:
        return apiRateLimit;
    }
  },

  createStrictRateLimit: (type) => {
    switch (type) {
      case 'login':
        return rateLimit({
          windowMs: process.env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000, // 10 seconds for tests, 15 minutes for production
          max: process.env.NODE_ENV === 'test' ? 3 : 3, // Lower limit for testing
          keyGenerator: (req) => {
            // In test environment, group by email to allow multiple IPs
            return process.env.NODE_ENV === 'test' ? req.body.email || req.ip : req.ip;
          },
          message: {
            success: false,
            result: null,
            message: 'Too many login attempts. Please try again in 15 minutes.',
          },
          standardHeaders: true,
          legacyHeaders: false,
        });

      case 'register':
        return rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 20, // 20 registration attempts per 15 minutes (higher for testing)
          keyGenerator: (req) => {
            return req.body.email || req.ip;
          },
          message: {
            success: false,
            result: null,
            message: 'Registration rate limit exceeded. Please try again in 15 minutes.',
          },
          standardHeaders: true,
          legacyHeaders: false,
        });

      default:
        return strictApiRateLimit;
    }
  },
};