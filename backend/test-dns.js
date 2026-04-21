const dns = require('dns');

const host = 'ep-old-thunder-ao09bxjm.c-2.ap-southeast-1.aws.neon.tech';

console.log(`Resolving ${host}...`);
dns.lookup(host, (err, address, family) => {
  if (err) {
    console.error('Lookup failed:', err);
  } else {
    console.log('Address:', address);
    console.log('Family: IPv' + family);
  }
});

// Try the one without c-2 just in case
const host2 = 'ep-old-thunder-ao09bxjm.ap-southeast-1.aws.neon.tech';
console.log(`Resolving ${host2}...`);
dns.lookup(host2, (err, address, family) => {
  if (err) {
    console.error('Lookup failed:', err);
  } else {
    console.log('Address:', address);
    console.log('Family: IPv' + family);
  }
});
