const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const migrationPath = path.resolve(__dirname, '../database/migrations/008_fragrance_finder_submissions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(sql);
    process.stdout.write('Migration applied successfully.\n');
  } catch (err) {
    process.stderr.write(`Migration failed: ${err?.message || err}\n`);
  } finally {
    pool.end();
  }
}

run();
