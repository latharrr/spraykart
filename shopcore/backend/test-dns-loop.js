const dns = require('dns');

// Force using Cloudflare DNS (bypasses slow Indian ISP DNS caches)
dns.setServers(['1.1.1.1', '8.8.8.8']);

const host = 'ep-old-thunder-ao09bxjm.c-2.ap-southeast-1.aws.neon.tech';

console.log(`Checking DNS via Cloudflare (1.1.1.1)...`);

let attempts = 0;
const check = () => {
  attempts++;
  process.stdout.write(`Attempt ${attempts}... `);
  
  dns.lookup(host, (err, address) => {
    if (err) {
      console.log('Not ready yet.');
      if (attempts < 10) setTimeout(check, 3000);
      else console.log('\n❌ DNS still not propagating. The URL might be slightly wrong or Neon is taking unusually long.');
    } else {
      console.log(`\n✅ FOUND IT! IP: ${address}`);
      console.log('\nDNS has propagated! You can now run:\nnode setup-db.js');
    }
  });
};

check();
