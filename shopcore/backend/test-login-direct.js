/**
 * test-login-direct.js
 * Tests the login endpoint directly via HTTP — no browser, no proxy.
 * Run: node test-login-direct.js
 * Backend must be running on port 5000.
 */
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  const tests = [
    { label: 'Admin login',    path: '/api/auth/login', body: { email: 'admin@spraykart.in', password: 'admin123' } },
    { label: 'Customer login', path: '/api/auth/login', body: { email: 'ananya@example.com', password: 'customer123' } },
    { label: 'Wrong password', path: '/api/auth/login', body: { email: 'admin@spraykart.in',  password: 'wrongpass' } },
  ];

  for (const t of tests) {
    console.log(`\n━━━ ${t.label} ━━━`);
    try {
      const { status, body } = await post(t.path, t.body);
      const ok = status >= 200 && status < 300;
      console.log(`  Status: ${status} ${ok ? '✅' : '❌'}`);
      if (ok) {
        console.log(`  User:   ${body.user?.email} [${body.user?.role}]`);
      } else {
        console.log(`  Error:  ${body.error || JSON.stringify(body)}`);
      }
    } catch (err) {
      console.log(`  ❌ NETWORK ERROR: ${err.message}`);
      console.log('     → Is the backend running? Try: node server.js');
    }
  }

  console.log('\n');
})();
