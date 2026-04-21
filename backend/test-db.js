require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

pool.query('SELECT NOW() as time')
  .then(res => {
    console.log('✅ CONNECTED! Time:', res.rows[0].time);
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Failed:', err.message);
    process.exit(1);
  });
