// Points MONGO_URI at MongoDB running on this PC, keeps other .env settings, then tests it.
// Usage: node scripts/use-local-db.js
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
const uri = 'mongodb://127.0.0.1:27017/profiler';

const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
const kept = lines.filter((l) => l.trim() && !/^\s*MONGO_URI\s*=/.test(l));
fs.writeFileSync(envPath, ['MONGO_URI=' + uri, ...kept].join('\r\n') + '\r\n');
console.log('✔ MONGO_URI now points to MongoDB on this PC (' + uri + '). Testing...');

require('mongoose').connect(uri, { serverSelectionTimeoutMS: 8000 })
  .then(async (m) => { console.log('✅ Connected to local MongoDB. Now run: npm run dev'); await m.disconnect(); })
  .catch((e) => { console.log('❌', e.message.split('\n')[0]); console.log('→ Is MongoDB installed and running? Check: sc query MongoDB'); process.exit(1); });
