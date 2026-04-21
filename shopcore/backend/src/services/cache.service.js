const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Get a cached value by key.
 * Returns null if Redis is unavailable or key doesn't exist.
 */
exports.get = async (key) => {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? (typeof val === 'string' ? JSON.parse(val) : val) : null;
  } catch (err) {
    logger.warn(`Cache GET failed for key "${key}": ${err.message}`);
    return null;
  }
};

/**
 * Set a cached value with TTL (seconds).
 * Silently fails if Redis is unavailable.
 */
exports.set = async (key, value, ttlSeconds = 300) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    logger.warn(`Cache SET failed for key "${key}": ${err.message}`);
  }
};

/**
 * Delete a specific cache key.
 */
exports.del = async (key) => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn(`Cache DEL failed for key "${key}": ${err.message}`);
  }
};

/**
 * Delete all keys matching a pattern (e.g., "products:*").
 * Uses SCAN to avoid blocking.
 */
exports.delPattern = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => redis.del(k)));
      logger.debug(`Cache: cleared ${keys.length} keys matching "${pattern}"`);
    }
  } catch (err) {
    logger.warn(`Cache delPattern failed for "${pattern}": ${err.message}`);
  }
};
