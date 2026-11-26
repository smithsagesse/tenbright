const fs = require('fs');
const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const tpl = R('src/app.html');
const engine = R('src/engine.js');
const content = R('src/content.js');
const speech = R('src/speech.js');
const explain = R('src/explain.js');
const i18n = R('src/i18n.js') + '\n' + ['es', 'fr', 'ht', 'zh', 'ar'].map((l) => (fs.existsSync(path.join(__dirname, 'src/i18n', l + '.js')) ? R('src/i18n/' + l + '.js') : '')).join('\n');
const audioDir = path.join(__dirname, 'narration/audio');
const audioMap = fs.existsSync(path.join(audioDir, 'map.json')) ? fs.readFileSync(path.join(audioDir, 'map.json'), 'utf8').trim() : 'null';
if (/<\/script/i.test(engine + content + speech + explain + audioMap + i18n)) throw new Error('script close tag in source');
const face = (family, file, weight) => `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'src/fonts', file)).toString('base64')}) format("woff2");}`;
const fonts = '/* Nunito, Atkinson Hyperlegible and Cairo (Arabic), SIL Open Font License 1.1, embedded so no outside server is contacted */\n' + [
  face('Nunito', 'nunito-latin-600-normal.woff2', 600), face('Nunito', 'nunito-latin-700-normal.woff2', 700), face('Nunito', 'nunito-latin-800-normal.woff2', 800),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Cairo', 'cairo-arabic-400-normal.woff2', 400), face('Cairo', 'cairo-arabic-600-normal.woff2', 600), face('Cairo', 'cairo-arabic-700-normal.woff2', 700), face('Cairo', 'cairo-arabic-800-normal.woff2', 800)
].join('\n');
const full = tpl.replace('/*FONTS*/', () => fonts).replace('/*ENGINE*/', () => engine).replace('/*CONTENT*/', () => content).replace('/*SPEECH*/', () => speech).replace('/*EXPLAIN*/', () => explain).replace('/*I18N*/', () => i18n).replace('/*AUDIOMAP*/null', () => audioMap);
const release = full.replace(/\/\*SELFTEST-START\*\/[\s\S]*?\/\*SELFTEST-END\*\//, '');
if (/https?:\/\/(?!www\.w3\.org)/.test(release.replace(/<!--[\s\S]*?-->/g, ''))) {
  const m = release.match(/https?:\/\/(?!www\.w3\.org)[^\s"'<)]+/g); throw new Error('external URL in release build: ' + m.slice(0, 5).join(', '));
}
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), release);
fs.writeFileSync(path.join(__dirname, 'dist/test.html'), full);
// offline app: service worker, manifest and icons (used when the page is served from a website)
const version = require('crypto').createHash('sha1').update(release + audioMap).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(__dirname, 'dist/sw.js'), R('src/pwa/sw.js').replace('__VERSION__', version));
['manifest.webmanifest', 'icon-192.png', 'icon-512.png'].forEach((f) => fs.copyFileSync(path.join(__dirname, 'src/pwa', f), path.join(__dirname, 'dist', f)));
// artwork: copied next to the page (no outside image hosts)
fs.mkdirSync(path.join(__dirname, 'dist/art'), { recursive: true });
fs.readdirSync(path.join(__dirname, 'src/art')).filter((f) => /\.webp$/.test(f)).forEach((f) => fs.copyFileSync(path.join(__dirname, 'src/art', f), path.join(__dirname, 'dist/art', f)));
// Pip's recorded voice: copy the audio files next to the page
if (audioMap !== 'null') {
  fs.mkdirSync(path.join(__dirname, 'dist/audio'), { recursive: true });
  JSON.parse(audioMap).sprites.forEach((rel) => fs.copyFileSync(path.join(audioDir, path.basename(rel)), path.join(__dirname, 'dist', rel)));
}
console.log('Built dist/index.html (release)', release.length, 'bytes; dist/test.html (with self-test)');
