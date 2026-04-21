import { Redis } from '@upstash/redis';

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
      await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
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
};

export default cache;
