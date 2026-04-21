/**
 * reset-and-verify.js
 * Definitive fix: resets ALL user passwords and verifies them.
 * Run: node reset-and-verify.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const USERS = [
  { email: 'admin@spraykart.in',   password: 'admin123',    role: 'admin'    },
  { email: 'ananya@example.com',   password: 'customer123', role: 'customer' },
  { email: 'rahul@example.com',    password: 'customer123', role: 'customer' },
];

(async () => {
  try {
    console.log('🔗 DATABASE_URL (masked):', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'));

    // 1. Show all current users
    const { rows: allUsers } = await pool.query(
      'SELECT id, email, role, LENGTH(password) as hash_len, LEFT(password,7) as hash_start FROM users ORDER BY role'
    );
    console.log('\n=== Current users in DB ===');
    if (!allUsers.length) {
      console.log('❌ NO USERS FOUND — seed data was never applied!');
    } else {
      allUsers.forEach(u =>
        console.log(`  [${u.role}] ${u.email}  hash_len=${u.hash_len}  starts_with=${u.hash_start}`)
      );
    }

    // 2. Reset passwords
    console.log('\n🔑 Resetting passwords...');
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 12);

      // Try update first
      const { rowCount } = await pool.query(
        'UPDATE users SET password=$1 WHERE email=$2',
        [hash, u.email]
      );

      if (rowCount === 0) {
        // Insert if not found
        await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
          [u.email.split('@')[0], u.email, hash, u.role]
        );
        console.log(`  ✅ INSERTED ${u.email}  →  password: ${u.password}`);
      } else {
        console.log(`  ✅ UPDATED  ${u.email}  →  password: ${u.password}`);
      }
    }

    // 3. Verify bcrypt.compare for each user
    console.log('\n🧪 Verification (bcrypt.compare)...');
    for (const u of USERS) {
      const { rows } = await pool.query('SELECT password FROM users WHERE email=$1', [u.email]);
      if (!rows.length) {
        console.log(`  ❌ ${u.email} — NOT FOUND after insert/update!`);
        continue;
      }
      const ok = await bcrypt.compare(u.password, rows[0].password);
      console.log(`  ${ok ? '✅' : '❌'} ${u.email} / ${u.password}  →  ${ok ? 'MATCH' : 'FAIL'}`);
    }

    console.log('\n🎉 Done! Login credentials:');
    console.log('   Admin:    admin@spraykart.in  / admin123');
    console.log('   Customer: ananya@example.com  / customer123');
    console.log('   Customer: rahul@example.com   / customer123');

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
      console.error('   → Cannot reach the database. Check DATABASE_URL in .env');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
