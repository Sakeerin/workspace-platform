import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Redis Cache Service
 * 
 * Provides caching layer for:
 * - Frequently accessed data (pages, workspaces, users)
 * - Search results
 * - Session data
 * - Rate limiting counters
 */
export class CacheService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(env.redis.url, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis cache connected');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis cache error', { error: error.message });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis cache connection closed');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.client.del(...keys);
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incrby(key, by);
    } catch (error) {
      logger.error('Cache increment error', { key, error });
      return 0;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error', { key, error });
      return false;
    }
  }

  /**
   * Get or set with cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Cache clear error', { error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    if (!this.isConnected) {
      return { keys: 0, memory: '0B' };
    }

    try {
      const info = await this.client.info('memory');
      const keys = await this.client.dbsize();
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0B';

      return { keys, memory };
    } catch (error) {
      logger.error('Cache stats error', { error });
      return { keys: 0, memory: '0B' };
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
export default cacheService;

