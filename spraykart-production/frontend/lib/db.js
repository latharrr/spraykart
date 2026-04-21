import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on('error', (err) => console.error('DB pool error:', err));
  }
  return pool;
}

export const db = {
  query: (text, params) => getPool().query(text, params),
  connect: () => getPool().connect(),
  get pool() { return getPool(); },
};

export default db;
