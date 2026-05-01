import { Pool } from 'pg';
import logger from './logger';

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
    logger.error('[DB] Pool error:', err.message);
  });

  return pool;
}

function getPool() {
  if (!globalForDb._pgPool) {
    globalForDb._pgPool = createPool();
  }
  return globalForDb._pgPool;
}

globalForDb.__spraykartCloseDbPool = async () => {
  const activePool = globalForDb._pgPool;
  if (activePool) {
    await activePool.end();
    globalForDb._pgPool = null;
  }
};

export const db = {
  query: (text, params) => getPool().query(text, params),
  connect: () => getPool().connect(),
  get pool() { return getPool(); },
};

export default db;
