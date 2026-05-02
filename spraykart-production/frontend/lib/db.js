import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    // Supabase transaction pooler (port 6543) — min: 0, no keepAlive
    // AWS RDS direct (port 5432) — min: 2, keepAlive on, SSL required
    const isPooler = connectionString?.includes(':6543');
    const isRDS = connectionString?.includes('rds.amazonaws.com');

    // RDS requires SSL with a valid cert; Supabase uses self-signed so we skip verification
    const sslConfig = isRDS
      ? { rejectUnauthorized: true }   // RDS: enforce SSL properly
      : { rejectUnauthorized: false }; // Supabase / local: allow self-signed

    pool = new Pool({
      connectionString,
      ssl: sslConfig,
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
