// Refuses to sync a web build into the iOS project unless it is the store build and stays fully offline.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', '..', 'source', 'tenbright-mvp', 'dist-store');
const page = path.join(dir, 'index.html');
if (!fs.existsSync(page)) { console.error('No store build. Run: npm run build:web'); process.exit(1); }
const html = fs.readFileSync(page, 'utf8');
if (!/const STORE = true;/.test(html)) { console.error('dist-store/index.html is not a store build'); process.exit(1); }
const ext = html.replace(/<!--[\s\S]*?-->/g, '').match(/https?:\/\/(?!www\.w3\.org)[^\s"'<)]+/g);
if (ext) { console.error('External URL in store build: ' + ext.slice(0, 5).join(', ')); process.exit(1); }
if (/#selftest/.test(html)) { console.error('Self-test code found in store build'); process.exit(1); }
console.log('Store build OK: offline, no external URLs, no self-test code.');
