import { Pool } from 'pg';

// ─── Global singleton prevents pool recreation on every hot-reload in dev ──────
const globalForDb = globalThis;

function createPool() {
  const isLocal = process.env.DATABASE_URL?.includes('127.0.0.1') || process.env.DATABASE_URL?.includes('localhost');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },

    // ── Transaction mode pooler settings (port 6543) ─────────────────────────
    // min:0 — let the pooler manage persistent connections, not pg itself
    max: 5,
    min: 0,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,

    // ── Query safety ─────────────────────────────────────────────────────────
    query_timeout: 10_000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
  });

  return pool;
}

let pool;

function getPool() {
  if (process.env.NODE_ENV === 'development') {
    if (!globalForDb._pgPool) {
      globalForDb._pgPool = createPool();
    }
    return globalForDb._pgPool;
  }
  
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export const db = {
  query: (text, params) => getPool().query(text, params),
  connect: () => getPool().connect(),
  get pool() { return getPool(); },
};

export default db;