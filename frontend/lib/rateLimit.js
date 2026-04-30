import cache from './cache';

/**
 * Simple Redis-backed rate limiter helper.
 * Usage: await rateLimit({ prefix: 'login', id: ipOrEmail, limit: 5, windowSec: 900 })
 * Throws an error with code 'RATE_LIMIT_EXCEEDED' when limit is exceeded.
 */
export default async function rateLimit({ prefix = 'rl', id = 'global', limit = 5, windowSec = 900 }) {
  const key = `rl:${prefix}:${id}`;
  try {
    const attempts = await cache.incr(key);
    if (attempts === 1) await cache.expire(key, windowSec);
    if (attempts > limit) {
      const ttl = await cache.ttl(key);
      const err = new Error('Rate limit exceeded');
      err.code = 'RATE_LIMIT_EXCEEDED';
      err.retryAfter = ttl > 0 ? ttl : windowSec;
      throw err;
    }
    return { attempts };
  } catch (e) {
    // If cache fails, fail open (do not block legit traffic)
    if (e && e.code === 'RATE_LIMIT_EXCEEDED') throw e;
    return { attempts: 0 };
  }
}

export const rateLimitMiddleware = (opts) => async (request) => {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const id = `${ip}`;
  return rateLimit({ ...opts, id });
};
