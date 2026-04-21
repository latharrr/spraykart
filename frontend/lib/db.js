import { Pool } from 'pg';

// Global singleton — prevents pool recreation on every hot-reload in dev
const globalForDb = globalThis;

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  });
}

if (!globalForDb._pgPool) {
  globalForDb._pgPool = createPool();
  globalForDb._pgPool.on('error', (err) => console.error('DB pool error:', err));
}

export const db = {
  query: (text, params) => globalForDb._pgPool.query(text, params),
  connect: () => globalForDb._pgPool.connect(),
  get pool() { return globalForDb._pgPool; },
};

export default db;