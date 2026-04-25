import Redis from 'ioredis';

// ─── Tiny in-process LRU (max 100 keys, TTL-aware) for dev / no-Redis envs ────
const lru = new Map(); // key → { value, expiresAt }

const LOCAL = {
  get: (key) => {
    const entry = lru.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { lru.delete(key); return null; }
    return entry.value;
  },
  set: (key, value, ttl = 300) => {
    // Cap at 100 entries to avoid unbounded memory growth
    if (lru.size >= 100) lru.delete(lru.keys().next().value);
    lru.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  },
  del: (key) => lru.delete(key),
  delPattern: (pattern) => {
    const prefix = pattern.replace('*', '');
    for (const k of lru.keys()) {
      if (k.startsWith(prefix)) lru.delete(k);
    }
  },
};

let redis = null;

try {
  // Use native Redis connection URL for production
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
  } 
} catch {
  redis = null;
}

export const cache = {
  get: async (key) => {
    // 1. Check in-process LRU first (0ms)
    const local = LOCAL.get(key);
    if (local !== null) return local;

    // 2. Fall back to Redis
    if (!redis) return null;
    try {
      const val = await redis.get(key);
      if (val == null) return null;
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      // Warm the LRU so subsequent requests skip Redis entirely
      LOCAL.set(key, parsed, 60);
      return parsed;
    } catch { return null; }
  },

  set: async (key, value, ttlSeconds = 300) => {
    LOCAL.set(key, value, Math.min(ttlSeconds, 60)); // LRU holds ≤ 60s
    if (!redis) return;
    try {
      // ioredis syntax for expiration
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch { /* silent */ }
  },

  del: async (key) => {
    LOCAL.del(key);
    if (!redis) return;
    try { await redis.del(key); } catch { /* silent */ }
  },

  delPattern: async (pattern) => {
    LOCAL.delPattern(pattern);
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await Promise.all(keys.map((k) => redis.del(k)));
    } catch { /* silent */ }
  },

  incr: async (key) => {
    if (!redis) {
      // Local fallback
      const current = LOCAL.get(key) || 0;
      LOCAL.set(key, current + 1, 300);
      return current + 1;
    }
    try {
      return await redis.incr(key);
    } catch { return 1; }
  },

  expire: async (key, ttlSeconds) => {
    if (!redis) {
      const current = LOCAL.get(key);
      if (current !== null) LOCAL.set(key, current, ttlSeconds);
      return;
    }
    try {
      await redis.expire(key, ttlSeconds);
    } catch { /* silent */ }
  },
};

export default cache;
