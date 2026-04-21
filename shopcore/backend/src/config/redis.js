const { Redis } = require('@upstash/redis');

let redis;

try {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  } else {
    // No-op fallback for local dev without Redis
    redis = null;
  }
} catch (err) {
  redis = null;
}

module.exports = redis;
