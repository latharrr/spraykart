import { Pool } from 'pg';

// ─── Global singleton prevents pool recreation on every hot-reload in dev ──────
const globalForDb = globalThis;

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },

    // ── Pool sizing ──────────────────────────────────────────────────────────
    max: 10,               // max concurrent connections (Supabase free = 15 limit)
    min: 2,                // keep 2 warm — eliminates cold-start latency on first req
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,

    // ── Query safety ─────────────────────────────────────────────────────────
    statement_timeout: 10_000,
    query_timeout: 10_000,

    // ── Keep TCP alive — prevents Supabase from dropping idle connections ────
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
  });

  return pool;
}

if (!globalForDb._pgPool) {
  globalForDb._pgPool = createPool();

  // ── Eagerly warm 2 connections so the first request is instant ─────────────
  if (process.env.DATABASE_URL) {
    Promise.all([
      globalForDb._pgPool.query('SELECT 1').catch(() => {}),
      globalForDb._pgPool.query('SELECT 1').catch(() => {}),
    ]);
  }
}

export const db = {
  query: (text, params) => globalForDb._pgPool.query(text, params),
  connect: () => globalForDb._pgPool.connect(),
  get pool() { return globalForDb._pgPool; },
};

export default db;
