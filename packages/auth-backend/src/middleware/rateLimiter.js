/**
 * Rate limiting middleware
 * Protects against brute force and DDoS attacks
 * @module middleware/rateLimiter
 */

import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

/**
 * General rate limiter for all routes
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (optional)
  skipSuccessfulRequests: false,
  // Custom key generator (optional - defaults to IP)
  keyGenerator: (req) => {
    return req.ip;
  },
});

/**
 * Strict rate limiter for authentication routes (login, register)
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.loginMax || 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req) => {
    // Use email if provided, otherwise fall back to IP
    return req.body.email || req.ip;
  },
});

/**
 * Password reset rate limiter
 * Prevents abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },
});

/**
 * Email verification rate limiter
 * Prevents spam of verification emails
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: {
    success: false,
    message: 'Too many verification email requests, please try again after 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.email || req.body.email || req.ip;
  },
});

/**
 * Creates a custom rate limiter with specified options
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests
 * @param {string} options.message - Error message
 * @param {Function} options.keyGenerator - Custom key generator function
 * @returns {Function} Express rate limiter middleware
 */
export function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests, please try again later.',
      });
    },
  });
}

/**
 * Sliding window rate limiter using Redis (optional)
 * Requires Redis connection
 * @param {Object} redisClient - Redis client instance
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
export function createRedisRateLimiter(redisClient, options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;

  return async (req, res, next) => {
    try {
      const key = `rate-limit:${options.keyGenerator ? options.keyGenerator(req) : req.ip}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries
      await redisClient.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const count = await redisClient.zcard(key);

      if (count >= max) {
        return res.status(429).json({
          success: false,
          message: options.message || 'Too many requests, please try again later.',
        });
      }

      // Add current request
      await redisClient.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiry on the key
      await redisClient.expire(key, Math.ceil(windowMs / 1000));

      next();
    } catch (error) {
      // If Redis fails, log error and continue (fail open)
      console.error('Redis rate limiter error:', error);
      next();
    }
  };
}
