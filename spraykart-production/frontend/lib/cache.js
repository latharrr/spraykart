import { Redis } from '@upstash/redis';

let redis = null;

try {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }
} catch {
  redis = null;
}

export const cache = {
  get: async (key) => {
    if (!redis) return null;
    try {
      const val = await redis.get(key);
      return val ? (typeof val === 'string' ? JSON.parse(val) : val) : null;
    } catch { return null; }
  },

  set: async (key, value, ttlSeconds = 300) => {
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch { /* silent fail */ }
  },

  del: async (key) => {
    if (!redis) return;
    try { await redis.del(key); } catch { /* silent fail */ }
  },

  delPattern: async (pattern) => {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await Promise.all(keys.map((k) => redis.del(k)));
    } catch { /* silent fail */ }
  },
};

export default cache;
