// Fills in missing .env settings. Never prints existing values.
// Usage: node scripts/setup-env.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const envPath = path.join(__dirname, '..', '.env');
const required = ['MONGO_URI', 'HF_API_KEY', 'JWT_SECRET'];

const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
const env = {};
for (const line of lines) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m && m[2].trim()) env[m[1]] = m[2].trim();
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (a) => res(a.trim())));

(async () => {
  console.log('Already set: ' + (Object.keys(env).join(', ') || 'nothing'));
  for (const key of required) {
    if (env[key]) continue;
    if (key === 'JWT_SECRET') {
      env[key] = crypto.randomBytes(32).toString('hex');
      console.log('JWT_SECRET: generated automatically.');
      continue;
    }
    const hint = key === 'MONGO_URI'
      ? 'Paste your full MongoDB connection string (mongodb+srv://...)'
      : 'Paste your Hugging Face token (starts with hf_)';
    let v = '';
    while (!v) v = (await ask(`${hint}\n${key}= `)).replace(/^["']|["']$/g, '');
    if (key === 'MONGO_URI' && (!v.startsWith('mongodb') || v.includes('<'))) {
      console.log('⚠ That does not look complete (must start with mongodb and contain no < >). Saved anyway; fix it later if the database fails to connect.');
    }
    env[key] = v;
  }
  rl.close();
  const out = Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\r\n') + '\r\n';
  fs.writeFileSync(envPath, out);
  console.log('✔ .env saved with: ' + Object.keys(env).join(', '));
  console.log('Next: npm run dev');
})();
