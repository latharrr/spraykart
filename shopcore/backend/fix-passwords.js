// Fix user passwords in Supabase — resets all seed user passwords
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

(async () => {
  try {
    console.log('🔑 Resetting seed user passwords...\n');

    const adminHash = await bcrypt.hash('admin123', 12);
    const userHash = await bcrypt.hash('password', 12);

    // Update admin
    await pool.query(
      `UPDATE users SET password = $1 WHERE email = 'admin@spraykart.in'`,
      [adminHash]
    );
    console.log('✅ admin@spraykart.in  → password: admin123');

    // Update test customers
    await pool.query(
      `UPDATE users SET password = $1 WHERE email IN ('ananya@example.com', 'rahul@example.com')`,
      [userHash]
    );
    console.log('✅ ananya@example.com  → password: password');
    console.log('✅ rahul@example.com   → password: password');

    // Verify by testing bcrypt compare
    const { rows } = await pool.query(`SELECT email, password FROM users WHERE email = 'admin@spraykart.in'`);
    const match = await bcrypt.compare('admin123', rows[0].password);
    console.log(`\n🧪 Verify admin login: ${match ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n🎉 Done! You can now log in at localhost:3000/login');
    console.log('   Admin:    admin@spraykart.in / admin123');
    console.log('   Customer: ananya@example.com / password');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
