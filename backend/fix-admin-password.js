/**
 * fix-admin-password.js
 * Run once: node fix-admin-password.js
 * Sets admin@spraykart.in password to "admin123" with a fresh bcrypt hash.
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
    const hash = await bcrypt.hash('admin123', 12);
    console.log('Generated hash:', hash);

    const { rowCount } = await pool.query(
      "UPDATE users SET password = $1 WHERE email = 'admin@spraykart.in'",
      [hash]
    );

    if (rowCount === 0) {
      console.log('⚠️  Admin user not found — inserting...');
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@spraykart.in', $1, 'admin')",
        [hash]
      );
      console.log('✅ Admin user created.');
    } else {
      console.log(`✅ Admin password updated (${rowCount} row).`);
    }

    // Also fix customer seed passwords to "password123"
    const customerHash = await bcrypt.hash('password123', 12);
    const { rowCount: cRows } = await pool.query(
      "UPDATE users SET password = $1 WHERE email IN ('ananya@example.com', 'rahul@example.com')",
      [customerHash]
    );
    console.log(`✅ Updated ${cRows} customer password(s).`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
