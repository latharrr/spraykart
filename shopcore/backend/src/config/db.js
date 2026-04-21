const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const logger = require('../utils/logger');
pool.on('connect', () => logger.info('✅ PostgreSQL connected'));
pool.on('error', (err) => logger.error('❌ DB error:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
