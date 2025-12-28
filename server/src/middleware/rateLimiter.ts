// ============================================
// Rate Limiter Middleware
// ============================================

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../utils/redis';

const isDev = process.env.NODE_ENV !== 'production';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: isDev ? 1000 : parseInt(process.env.RATE_LIMIT_MAX || '100'), // More lenient in dev
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'sv:ratelimit:',
  }),
  skip: () => isDev, // Skip rate limiting in development
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Stricter rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10, // More lenient in dev
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'sv:ratelimit:auth:',
  }),
  skip: () => isDev, // Skip rate limiting in development
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
    },
  },
});

// Upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'sv:ratelimit:upload:',
  }),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many uploads, please try again later',
    },
  },
});

