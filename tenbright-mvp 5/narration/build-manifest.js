// Builds narration/manifest.json: every clip Pip needs, with a stable id and the exact text.
// Fixed lines play whole; questions and steps are assembled from phrase pieces, names, objects and numbers.
const fs = require('fs'), path = require('path');
const E = require('../src/engine.js'), C = require('../src/content.js');
const app = fs.readFileSync(path.join(__dirname, '../src/app.html'), 'utf8');
const clips = new Map();
const add = (kind, text) => { text = String(text).trim(); if (!text) return; const id = kind + '_' + require('crypto').createHash('sha1').update(text).digest('hex').slice(0, 10); if (!clips.has(id)) clips.set(id, { id, kind, text }); };
// 1. lesson content
for (const k of E.SKILL_ORDER) for (const f of ['hook', 'teach', 'nudge', 'strategy', 'history']) { const v = C[k][f]; (Array.isArray(v) ? v : [v]).forEach((s) => typeof s === 'string' && add('line', s)); }
// 2. praise and fixed feedback / walkthrough lines from the app
const praise = app.slice(app.indexOf('const PRAISE = {'), app.indexOf('};', app.indexOf('const PRAISE = {')));
(praise.match(/'((?:[^'\\]|\\.)+)'/g) || []).filter((q) => q.length > 12).forEach((q) => add('line', q.slice(1, -1).replace(/\\'/g, "'")));
['Got it!', "Thanks! Let's keep exploring.", 'You fixed it.', 'Try again.', "Let's look at how it works together. The answer is", 'Let’s solve one together:', 'That’s how it works! Now it’s your turn.', 'Nice thinking!'].forEach((s) => add('line', s));
// 3. phrase pieces from generated questions and steps (numbers, names and objects become slots)
const W = '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)';
const names = ['Ava', 'Kofi', 'Mei', 'Diego', 'Amara', 'Liam', 'Priya', 'Noah', 'Zara', 'Mateo', 'Hana', 'Elijah', 'Sofia', 'Kai', 'Nia', 'Omar'];
const things = ['beads', 'stickers', 'shells', 'marbles', 'stamps', 'leaves', 'cards', 'acorns'];
const norm = (s) => String(s).replace(/(\d+)s\b/g, '$1').replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/\+/g, ' plus ').replace(/=\s*\?/g, ' equals what?').replace(/=/g, ' equals ').replace(/</g, ' is less than ').replace(/>/g, ' is greater than ').replace(/\s+/g, ' ').trim();
const slot = (s) => s.replace(new RegExp('\\b' + W + '(?:[ -]' + W + ')*\\b', 'gi'), '#').replace(/\d+/g, '#').replace(new RegExp('\\b(' + names.join('|') + ')\\b', 'g'), '#').replace(new RegExp('\\b(' + things.join('|') + ')\\b', 'g'), '#');
const rng = E.makeRng(11);
for (const sk of E.SKILL_ORDER) for (let i = 0; i < 4000; i++) { const it = E.generate(sk, rng); for (const s of [it.prompt, ...(it.steps || [])]) if (s) slot(norm(s)).split('#').map((p) => p.replace(/^[\s,.:]+|[\s,]+$/g, '')).filter((p) => /[a-z]/i.test(p)).forEach((p) => add('piece', p)); }
names.forEach((n) => add('name', n)); things.forEach((t) => add('thing', t));
// 4. numbers 0–99 whole, hundreds and thousand as joinable parts, each in a mid-sentence and an end-of-sentence reading
for (let n = 0; n < 100; n++) { add('num', E.numberName(n)); add('numEnd', E.numberName(n) + '.'); }
for (let h = 1; h <= 9; h++) add('num', E.numberName(h * 100));
[2, 3, 4, 5, 10, 100].forEach((n) => add('numPlural', { 2: 'twos', 3: 'threes', 4: 'fours', 5: 'fives', 10: 'tens', 100: 'hundreds' }[n]));
add('num', 'one thousand'); add('numEnd', 'one thousand.');
const list = [...clips.values()];
const chars = list.reduce((a, c) => a + c.text.length, 0);
const byKind = list.reduce((a, c) => ((a[c.kind] = (a[c.kind] || 0) + 1), a), {});
fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify({ voice: require('./voice.json'), clips: list.length, characters: chars, byKind, items: list }, null, 1));
console.log({ clips: list.length, characters: chars, byKind });
