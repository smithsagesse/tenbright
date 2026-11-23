const fs = require('fs');
const path = require('path');
// node build.js            -> dist/        (web preview, as before)
// node build.js --store    -> dist-store/  (App Store build: preview-only items hidden; refuses while launch blockers remain)
// node build.js --store --draft -> dist-store/ even with blockers (TestFlight / internal testing only)
const STORE = process.argv.includes('--store');
const DRAFT = process.argv.includes('--draft');
const OUT = path.join(__dirname, STORE ? 'dist-store' : 'dist');
const R = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const tpl = R('src/app.html');
const engine = R('src/engine.js');
const content = R('src/content.js');
const speech = R('src/speech.js');
const i18n = R('src/i18n.js') + '\n' + ['es', 'fr', 'ht', 'zh', 'ar'].map((l) => (fs.existsSync(path.join(__dirname, 'src/i18n', l + '.js')) ? R('src/i18n/' + l + '.js') : '')).join('\n');
const audioDir = path.join(__dirname, 'narration/audio');
const audioMap = fs.existsSync(path.join(audioDir, 'map.json')) ? fs.readFileSync(path.join(audioDir, 'map.json'), 'utf8').trim() : 'null';
if (/<\/script/i.test(engine + content + speech + audioMap + i18n)) throw new Error('script close tag in source');
const face = (family, file, weight) => `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'src/fonts', file)).toString('base64')}) format("woff2");}`;
const fonts = '/* Nunito, Atkinson Hyperlegible and Cairo (Arabic), SIL Open Font License 1.1, embedded so no outside server is contacted */\n' + [
  face('Nunito', 'nunito-latin-600-normal.woff2', 600), face('Nunito', 'nunito-latin-700-normal.woff2', 700), face('Nunito', 'nunito-latin-800-normal.woff2', 800),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Cairo', 'cairo-arabic-400-normal.woff2', 400), face('Cairo', 'cairo-arabic-600-normal.woff2', 600), face('Cairo', 'cairo-arabic-700-normal.woff2', 700), face('Cairo', 'cairo-arabic-800-normal.woff2', 800)
].join('\n');
const full = (STORE ? tpl.replace('/*STORE*/false', 'true') : tpl).replace('/*FONTS*/', () => fonts).replace('/*ENGINE*/', () => engine).replace('/*CONTENT*/', () => content).replace('/*SPEECH*/', () => speech).replace('/*I18N*/', () => i18n).replace('/*AUDIOMAP*/null', () => audioMap);
const release = full.replace(/\/\*SELFTEST-START\*\/[\s\S]*?\/\*SELFTEST-END\*\//, '');
if (/https?:\/\/(?!www\.w3\.org)/.test(release.replace(/<!--[\s\S]*?-->/g, ''))) {
  const m = release.match(/https?:\/\/(?!www\.w3\.org)[^\s"'<)]+/g); throw new Error('external URL in release build: ' + m.slice(0, 5).join(', '));
}
// App Store release gate: legal placeholders and preview wording must be gone before a final store build
if (STORE) {
  // scan the app template only (translation tables repeat the English text as keys); comments are ignored
  const text = tpl.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const blockers = [];
  const ph = text.match(/\[[^\]]*to be added before public launch\]/g) || [];
  [...new Set(ph)].forEach((m) => blockers.push('placeholder in privacy notice or terms: ' + m));
  const prev = (text.match(/[^.<>`'"]*\bpreview\b[^.<>`'"]*/gi) || []).filter((m) => !/look-preview|MVP preview|This preview keeps|demo clock|It exists only in this preview|Preview: \$\{|on-device agreement \(preview\)/i.test(m));
  [...new Set(prev.map((m) => m.trim()))].forEach((m) => blockers.push('"preview" wording still shown: ' + m.slice(0, 120)));
  if (blockers.length) {
    console.warn('App Store release blockers (' + blockers.length + '):\n  - ' + blockers.join('\n  - '));
    if (!DRAFT) throw new Error('store build refused: fix the blockers above, or add --draft for a TestFlight-only build');
    console.warn('--draft: building anyway. Do NOT submit this build for App Store review.');
  }
}
const D = (...p) => path.join(OUT, ...p);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(D('index.html'), release);
fs.writeFileSync(D('test.html'), full);
// offline app: service worker, manifest and icons (used when the page is served from a website)
const version = require('crypto').createHash('sha1').update(release + audioMap).digest('hex').slice(0, 10);
fs.writeFileSync(D('sw.js'), R('src/pwa/sw.js').replace('__VERSION__', version));
['manifest.webmanifest', 'icon-192.png', 'icon-512.png'].forEach((f) => fs.copyFileSync(path.join(__dirname, 'src/pwa', f), D(f)));
// artwork: copied next to the page (no outside image hosts)
fs.mkdirSync(D('art'), { recursive: true });
fs.readdirSync(path.join(__dirname, 'src/art')).filter((f) => /\.webp$/.test(f)).forEach((f) => fs.copyFileSync(path.join(__dirname, 'src/art', f), D('art', f)));
// Pip's recorded voice: copy the audio files next to the page
if (audioMap !== 'null') {
  fs.mkdirSync(D('audio'), { recursive: true });
  JSON.parse(audioMap).sprites.forEach((rel) => fs.copyFileSync(path.join(audioDir, path.basename(rel)), D(rel)));
}
console.log('Built ' + path.relative(__dirname, OUT) + '/index.html (' + (STORE ? 'store' : 'release') + ')', release.length, 'bytes; ' + path.relative(__dirname, OUT) + '/test.html (with self-test)');
