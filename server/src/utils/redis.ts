// ============================================
// Redis Client Instance
// ============================================

import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

// Helper functions for caching
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(`sv:cache:${key}`);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.setex(`sv:cache:${key}`, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(`sv:cache:${key}`);
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(`sv:cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

