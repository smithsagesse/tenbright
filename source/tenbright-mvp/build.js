const fs = require('fs');
const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const tpl = R('src/app.html');
const engine = R('src/engine.js');
const content = R('src/content.js');
const speech = R('src/speech.js');
const explain = R('src/explain.js');
const strategies = R('src/strategies.js');
const i18n = R('src/i18n.js') + '\n' + ['es', 'fr', 'ht', 'zh', 'ar'].map((l) => (fs.existsSync(path.join(__dirname, 'src/i18n', l + '.js')) ? R('src/i18n/' + l + '.js') : '')).join('\n');
const audioDir = path.join(__dirname, 'narration/audio');
const audioMap = fs.existsSync(path.join(audioDir, 'map.json')) ? fs.readFileSync(path.join(audioDir, 'map.json'), 'utf8').trim() : 'null';
// Zuri's voice (Kokoro af_heart): her own clips, recorded by narration/record.py --speaker zuri
const zuriDir = path.join(__dirname, 'narration/audio-zuri');
const zuriMap = fs.existsSync(path.join(zuriDir, 'map.json')) ? fs.readFileSync(path.join(zuriDir, 'map.json'), 'utf8').trim() : 'null';
if (/<\/script/i.test(engine + content + speech + explain + audioMap + zuriMap + i18n)) throw new Error('script close tag in source');
const face = (family, file, weight) => `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'src/fonts', file)).toString('base64')}) format("woff2");}`;
const fonts = '/* Nunito, Atkinson Hyperlegible and Cairo (Arabic), SIL Open Font License 1.1, embedded so no outside server is contacted */\n' + [
  face('Nunito', 'nunito-latin-600-normal.woff2', 600), face('Nunito', 'nunito-latin-700-normal.woff2', 700), face('Nunito', 'nunito-latin-800-normal.woff2', 800),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Cairo', 'cairo-arabic-400-normal.woff2', 400), face('Cairo', 'cairo-arabic-600-normal.woff2', 600), face('Cairo', 'cairo-arabic-700-normal.woff2', 700), face('Cairo', 'cairo-arabic-800-normal.woff2', 800)
].join('\n');
const full = tpl.replace('/*FONTS*/', () => fonts).replace('/*ENGINE*/', () => engine).replace('/*CONTENT*/', () => content).replace('/*SPEECH*/', () => speech).replace('/*EXPLAIN*/', () => explain).replace('/*STRATEGIES*/', () => strategies).replace('/*I18N*/', () => i18n).replace('/*AUDIOMAP*/null', () => audioMap).replace('/*AUDIOMAP_ZURI*/null', () => zuriMap);
const release = full.replace(/\/\*SELFTEST-START\*\/[\s\S]*?\/\*SELFTEST-END\*\//, '');
if (/https?:\/\/(?!www\.w3\.org)/.test(release.replace(/<!--[\s\S]*?-->/g, ''))) {
  const m = release.match(/https?:\/\/(?!www\.w3\.org)[^\s"'<)]+/g); throw new Error('external URL in release build: ' + m.slice(0, 5).join(', '));
}
// Safari before 16.4 (iPhone 6s/7, iPad Air 2, iPad mini 4 on iOS 15) cannot parse regex lookbehind: one would blank the app
if (/\(\?<[=!]/.test(release)) throw new Error('regex lookbehind in release build (breaks Safari before 16.4)');
// the page must stand on its own (standards mode, phone viewport, browser-enforced no-outside-connections policy)
if (!/^<!doctype html>/i.test(release) || !/name="viewport"/.test(release) || !/Content-Security-Policy/.test(release)) throw new Error('release page is missing its doctype, viewport or security policy');
// test hooks must never ship to families (compliance finding F11)
if (/__tb[A-Z]|SELFTEST/.test(release)) throw new Error('test hook in release build: ' + release.match(/__tb[A-Z]\w*|SELFTEST\w*/)[0]);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), release);
fs.writeFileSync(path.join(__dirname, 'dist/test.html'), full);
// offline app: service worker, manifest and icons (used when the page is served from a website)
const version = require('crypto').createHash('sha1').update(release + audioMap + zuriMap).digest('hex').slice(0, 10);
// story-object pictures (art/obj/*.svg) are cached for offline use with the rest of the artwork
const OBJ_FILES = fs.readdirSync(path.join(__dirname, 'src/art/obj')).filter((f) => /\.svg$/.test(f)).sort();
OBJ_FILES.forEach((f) => { const t = fs.readFileSync(path.join(__dirname, 'src/art/obj', f), 'utf8'); if (/https?:\/\/(?!www\.w3\.org\/)/.test(t) || /<script|href="(?!#)/i.test(t)) throw new Error('art/obj/' + f + ' has a link or script'); });
fs.writeFileSync(path.join(__dirname, 'dist/sw.js'), R('src/pwa/sw.js').replace('__VERSION__', version).replace("'./art/coin-quarter.webp']", "'./art/coin-quarter.webp'" + OBJ_FILES.map((f) => ", './art/obj/" + f + "'").join('') + ']'));
['manifest.webmanifest', 'icon-192.png', 'icon-512.png'].forEach((f) => fs.copyFileSync(path.join(__dirname, 'src/pwa', f), path.join(__dirname, 'dist', f)));
// artwork: copied next to the page (no outside image hosts)
fs.mkdirSync(path.join(__dirname, 'dist/art'), { recursive: true });
fs.readdirSync(path.join(__dirname, 'src/art')).filter((f) => /\.webp$/.test(f)).forEach((f) => fs.copyFileSync(path.join(__dirname, 'src/art', f), path.join(__dirname, 'dist/art', f)));
fs.rmSync(path.join(__dirname, 'dist/art/obj'), { recursive: true, force: true }); fs.cpSync(path.join(__dirname, 'src/art/obj'), path.join(__dirname, 'dist/art/obj'), { recursive: true });
// Pip's recorded voice: copy the audio files next to the page
if (audioMap !== 'null') {
  fs.mkdirSync(path.join(__dirname, 'dist/audio'), { recursive: true });
  JSON.parse(audioMap).sprites.forEach((rel) => fs.copyFileSync(path.join(audioDir, path.basename(rel)), path.join(__dirname, 'dist', rel)));
  if (zuriMap !== 'null') JSON.parse(zuriMap).sprites.forEach((rel) => fs.copyFileSync(path.join(zuriDir, path.basename(rel)), path.join(__dirname, 'dist', rel)));
  // remove voice files left over from an earlier build
  const keep = new Set(JSON.parse(audioMap).sprites.concat(zuriMap !== 'null' ? JSON.parse(zuriMap).sprites : []).map((rel) => path.basename(rel)));
  fs.readdirSync(path.join(__dirname, 'dist/audio')).filter((f) => !keep.has(f)).forEach((f) => fs.unlinkSync(path.join(__dirname, 'dist/audio', f)));
}
console.log('Built dist/index.html (release)', release.length, 'bytes; dist/test.html (with self-test)');
