import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    // Supabase transaction pooler (port 6543) manages connection persistence
    // itself — setting min > 0 wastes slots. Direct connection (port 5432) benefits
    // from warm connections, so we keep min: 2 there.
    const isPooler = connectionString?.includes(':6543');

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      min: isPooler ? 0 : 2,           // pooler handles persistence; direct needs warmth
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
      keepAlive: !isPooler,            // keepAlive not useful in transaction mode
      keepAliveInitialDelayMillis: 10_000,
    });

    pool.on('error', (err) => console.error('DB pool error:', err));

    // Eagerly warm connections on direct connection only
    if (!isPooler) {
      Promise.all([pool.query('SELECT 1'), pool.query('SELECT 1')]).catch(() => {});
    }
  }
  return pool;
}

export const db = {
  query: (text, params) => getPool().query(text, params),
  connect: () => getPool().connect(),
  get pool() { return getPool(); },
};

export default db;
