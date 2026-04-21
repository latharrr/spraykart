// Setup Supabase database — creates tables and seeds data
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

(async () => {
  try {
    // Test connection
    const res = await pool.query('SELECT NOW() as time');
    console.log('✅ Connected to Supabase! Time:', res.rows[0].time);

    // Run schema
    console.log('\n📦 Creating tables...');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Schema applied!');

    // Run seed
    console.log('\n🌱 Seeding data...');
    const seed = fs.readFileSync(path.join(__dirname, '..', 'database', 'seed.sql'), 'utf8');
    await pool.query(seed);
    console.log('✅ Seed data inserted!');

    // Verify
    const users = await pool.query('SELECT id, name, email, role FROM users');
    console.log(`\n👤 Users (${users.rows.length}):`);
    users.rows.forEach(u => console.log(`   ${u.role.padEnd(8)} ${u.email}`));

    const products = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📦 Products: ${products.rows[0].count}`);

    console.log('\n🎉 Database ready! Go to localhost:3000/login');
    console.log('   Email: admin@spraykart.in');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
