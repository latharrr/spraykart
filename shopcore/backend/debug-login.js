/**
 * debug-login.js — Run: node debug-login.js
 * Prints the stored hash and tests bcrypt.compare for common passwords.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    console.log('DATABASE_URL (masked):', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'));

    const { rows } = await pool.query(
      "SELECT id, email, role, LEFT(password, 10) as hash_prefix, LENGTH(password) as hash_len, password FROM users WHERE email = 'admin@spraykart.in'"
    );

    if (!rows.length) {
      console.error('❌ Admin user NOT found in database!');
      return;
    }

    const user = rows[0];
    console.log('\n=== DB Record ===');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Hash prefix:', user.hash_prefix);
    console.log('Hash length:', user.hash_len, '(should be 60)');
    console.log('Full hash:', user.password);

    console.log('\n=== bcrypt.compare tests ===');
    const passwords = ['admin123', 'password123', 'Admin123', 'admin@123'];
    for (const pw of passwords) {
      const ok = await bcrypt.compare(pw, user.password);
      console.log(`  "${pw}" → ${ok ? '✅ MATCH' : '❌ no match'}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
