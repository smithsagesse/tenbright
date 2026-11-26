// Builds the rows of the translation review workbook from the source: every translated pattern, a real English example,
// where it appears, and the five drafts. Run from source/tenbright-mvp: node <this> > rows.json
const fs = require('fs');
const I = require(process.cwd() + '/src/i18n.js');
global.TBi18n = I;
for (const l of ['es', 'fr', 'ht', 'zh', 'ar']) eval(fs.readFileSync('src/i18n/' + l + '.js', 'utf8'));
const E = require(process.cwd() + '/src/engine.js');
const C = require(process.cwd() + '/src/content.js');
const X = require(process.cwd() + '/src/explain.js');
const keys = Object.keys(I.DICT.es);
for (const l of ['fr', 'ht', 'zh', 'ar']) {
  const k2 = Object.keys(I.DICT[l]);
  if (k2.length !== keys.length || k2.some((k) => !(k in I.DICT.es))) throw new Error('key sets differ: ' + l);
}
const ex = {}, where = {};
// a source string: try it whole and sentence by sentence; the first source to reach a key names where it appears
function feed(s, cat) {
  if (typeof s !== 'string' || !s.trim()) return;
  const parts = [s].concat(I.splitSentences(s));
  for (const p of parts) {
    const t = p.trim(); if (!t) continue;
    const variants = [t, t.replace(/^A clue! /, ''), t.replace(/[.:]$/, '')];
    for (const v of variants) {
      const k = I.patternOf(v).key;
      if (k in I.DICT.es) { if (!ex[k]) ex[k] = v; if (!where[k]) where[k] = cat; }
    }
  }
}
// 1. skills, clue patterns, Pip's mistakes
E.SKILL_ORDER.forEach((id) => { feed(E.SKILLS[id].name, 'skill name'); feed(E.SKILLS[id].name.toLowerCase(), 'skill name'); });
Object.values(E.MISCONCEPTIONS).forEach((m) => { feed(m.name, 'parent: mistake name'); feed(m.parent, 'parent: mistake pattern'); feed(m.clue, 'clue'); });
Object.values(E.PIP_DID).forEach((s) => feed(s, "Pip's mistake"));
// 2. lessons
Object.values(C).forEach((c) => { feed(c.hook, 'lesson'); (c.teach || []).forEach((t) => feed(t, 'lesson')); feed(c.nudge, 'hint'); feed(c.strategy, 'strategy'); feed(c.home, 'parent: home activity'); });
// 3. generated questions, worked steps, plain-words explanations, new question kinds, games
const R = E.makeRng(4242);
for (const id of E.SKILL_ORDER) {
  for (let i = 0; i < 400; i++) {
    let it; try { it = E.generate(id, R); } catch (e) { continue; }
    feed(it.prompt, 'question');
    (it.steps || []).forEach((s) => feed(s, 'worked step'));
    if (it.textChoices) (it.choices || []).forEach((c) => feed(String(c), 'answer choice'));
    try { const x = X.explain(it); if (x) { (x.meaning || []).concat(x.say || [], x.check ? [x.check] : []).forEach((s) => feed(s, 'lesson (plain words)')); } } catch (e) { /* a skill without a builder */ }
    if (i < 40) { try { const tr = E.makeTransfer(id, R); if (tr) { feed(tr.prompt, 'question'); } } catch (e) {} try { const sf = E.makeStepFill(id, R); if (sf) { feed(sf.prompt, 'question'); (sf.steps || []).forEach((s) => feed(s, 'worked step')); } } catch (e) {} }
    if (i < 20) { try { const mk = E.makeMistake(id, R); if (mk) { feed(mk.prompt, "Pip's mistake"); (mk.steps || []).forEach((s) => feed(s, "Pip's mistake")); } } catch (e) {} }
  }
}
Object.entries(E.GAMES).map(([id, g]) => Object.assign({ id }, g)).forEach((g) => { feed(g.name, 'game'); feed(g.what, 'game'); for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 200; i++) { try { const r = E.gameRound(g.id, lv, R); if (r) { feed(r.prompt, 'game'); feed(r.clue, 'game'); feed(r.how, 'game'); (r.choices || []).forEach((c) => feed(String(c), 'game')); (r.steps || []).forEach((s) => feed(s, 'game')); } } catch (e) {} } });
try { const ST = require(process.cwd() + '/src/strategies.js'); ST.LIST.forEach((x) => { feed(x.name, 'strategy library'); }); } catch (e) { process.stderr.write('strategies: ' + e.message + '\n'); }
// 4. the app's own words (interface, parent pages, screen-reader labels, privacy notice)
const app = fs.readFileSync('src/app.html', 'utf8');
const lits = [];
app.replace(/'((?:[^'\\\n]|\\.){2,400})'/g, (m, a) => { lits.push(a.replace(/\\'/g, "'")); return m; });
app.replace(/`((?:[^`\\]|\\.){2,4000})`/g, (m, a) => { a.split(/\$\{[^}]*\}|<[^>]*>/).forEach((x) => lits.push(x)); return m; });
app.replace(/>([^<>{}$`]{2,600})</g, (m, a) => { lits.push(a); return m; });
app.replace(/aria-label="([^"$]{2,300})"/g, (m, a) => { lits.push('\u0001' + a); return m; });
lits.forEach((s) => s[0] === '\u0001' ? feed(s.slice(1), 'screen-reader label') : feed(s.replace(/\s+/g, ' ').trim(), 'interface'));
// keys no source reached: make an example by filling the slots
const SAMPLE = { N: ['12', '5', '30', '4', '7', '2'], W: ['twelve'], P: ['Ava'], T: ['beads'], Q: ['?'], C: ['2.NBT.B.5'], S: ['…'] };
const rows = keys.map((k, i) => {
  let e = ex[k];
  if (!e) { const used = {}; e = k.replace(/\{([NWPTQCS])(\d?)\}/g, (m, t, d) => { const arr = SAMPLE[t]; const j = d ? Number(d) - 1 : (used[t] = (used[t] || 0) + 1) - 1; return arr[j % arr.length]; }); }
  return { n: i + 1, key: k, example: e, where: where[k] || null, found: !!ex[k], es: I.DICT.es[k], fr: I.DICT.fr[k], ht: I.DICT.ht[k], zh: I.DICT.zh[k], ar: I.DICT.ar[k] };
});
process.stdout.write(JSON.stringify(rows));
process.stderr.write('keys ' + keys.length + ', with a real example ' + rows.filter((r) => r.found).length + ', with a source category ' + rows.filter((r) => r.where).length + '\n');
