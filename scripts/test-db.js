// Diagnoses the MongoDB connection. Never prints the password.
// Usage: node scripts/test-db.js
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || '';
try {
  const u = new URL(uri.replace(/^mongodb(\+srv)?:\/\/([^@]+)@([^/?]+)/, (m, s, cred, hosts) => `mongodb${s || ''}://${cred}@${hosts.split(',')[0]}`));
  const hosts = (uri.match(/@([^/?]+)/) || [])[1] || '';
  console.log('Format     :', uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb (standard)');
  console.log('Username   :', decodeURIComponent(u.username));
  console.log('Password   :', u.password ? `set (${decodeURIComponent(u.password).length} chars)` : 'MISSING');
  console.log('Hosts      :', hosts.split(',').length, '→', hosts.split(',').map((h) => h.replace(/:\d+$/, '')).join(', '));
  console.log('Database   :', u.pathname.replace('/', '') || '(none)');
  console.log('replicaSet :', u.searchParams.get('replicaSet') || '(none)');
  console.log('Times "@" appears:', (uri.match(/@/g) || []).length, '(should be 1)');
} catch (e) {
  console.log('Could not parse MONGO_URI:', e.message);
}

mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  .then(() => { console.log('\n✅ Connected'); return mongoose.disconnect(); })
  .catch((err) => {
    console.log('\n❌', err.name + ':', err.message.split('\n')[0]);
    const servers = err.reason && err.reason.servers;
    if (servers) for (const [host, d] of servers) console.log('  ', host, '→', d.error ? d.error.message : d.type);
    process.exit(1);
  });
