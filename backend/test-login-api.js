/**
 * test-login-api.js — Run: node test-login-api.js
 * Tests the login endpoint directly via HTTP (no frontend/proxy involved).
 */
require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 5000;
const body = JSON.stringify({ email: 'admin@spraykart.in', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log(`Testing POST http://localhost:${PORT}/api/auth/login`);
console.log('Body:', body);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('\n=== Response ===');
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    try {
      console.log('Body:', JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log('Body (raw):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.error('   → Is the backend server running on port', PORT, '?');
});

req.write(body);
req.end();
