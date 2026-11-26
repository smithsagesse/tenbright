// Strategy library (Tenbright 2.0, Phase 6): every strategy has the 14 parts, sound references, true worked examples,
// honest evidence notes without outside links, and the trial methods are gated. Run: node test/strategies.test.js
const assert = require('assert');
const E = require('../src/engine.js');
const T = require('../src/strategies.js');
let checks = 0;
const ok = (c, msg) => { checks++; assert.ok(c, msg); };
const R = E.makeRng(606);
const PARTS = ['name', 'concept', 'skills', 'readiness', 'child', 'visual', 'procedure', 'why', 'when', 'whenNot', 'mistakes', 'evidence'];
// every "a op b op c = d" in a line is true, evaluated with × before + and −
function sentencesTrue(text, tag) {
  const flat = text.replace(/(\d),(?=\d{3})/g, '$1');
  const re = /(\d+(?:\.\d+)?)((?: [+−×] \d+(?:\.\d+)?)+) = (\d+(?:\.\d+)?)(?![\d.]*\d)/g; let m;
  while ((m = re.exec(flat))) {
    if (/[\d.\/]$/.test(flat.slice(Math.max(0, m.index - 1), m.index))) continue;
    const toks = (m[1] + m[2]).split(' ');
    // multiply first
    const terms = [Number(toks[0])], ops = [];
    for (let i = 1; i < toks.length; i += 2) { const op = toks[i], v = Number(toks[i + 1]); if (op === '×') terms[terms.length - 1] *= v; else { ops.push(op); terms.push(v); } }
    let v = terms[0]; ops.forEach((op, i) => { v = op === '+' ? v + terms[i + 1] : v - terms[i + 1]; });
    ok(Math.abs(v - Number(m[3])) < 1e-9, tag + ': false sentence "' + m[0] + '" in: ' + text);
  }
}
ok(T.LIST.length >= 20, 'the library has the strategies taught today and the trials');
ok(T.LIST.filter((s) => s.status === 'trial').map((s) => s.id).sort().join() === 'crosswise,mental-abacus,near-100,number-bonds', 'the four approved trial additions');
const ids = new Set();
T.LIST.forEach((s) => {
  ok(!ids.has(s.id), 'unique id ' + s.id); ids.add(s.id);
  PARTS.forEach((k) => ok(s[k] !== undefined && s[k] !== '' && !(Array.isArray(s[k]) && k !== 'mistakes' && !s[k].length), s.id + ': missing part ' + k));
  ok(['core', 'trial'].includes(s.status), s.id + ': status');
  s.skills.forEach((id) => ok(E.SKILLS[id], s.id + ': unknown skill ' + id));
  s.mistakes.forEach((m) => ok(E.MISCONCEPTIONS[m], s.id + ': unknown clue ' + m));
  const text = JSON.stringify(s);
  ok(!/https?:\/\//.test(text), s.id + ': no outside links (sources are named in words)');
  ok(!/\b(borrow\w*|carry|carrying|carried|hmm+|um+|IQ|brain training|guarantee)\b/i.test(text), s.id + ': banned word or claim');
  s.child.forEach((t) => ok((t.match(/[A-Za-z’']+/g) || []).length <= 16, s.id + ': child sentence too long: ' + t));
  // origin notes for Vedic methods are honest about their source
  if (/Vedic/.test(s.origin)) ok(/1965/.test(s.origin) && /not found in the ancient Vedas/.test(s.origin), s.id + ': Vedic history note');
  // practice, worked examples and the mastery test all come from the engine
  for (let i = 0; i < 400; i++) {
    const q = T.question(s.id, E, R);
    ok(q && /^\d+(\.\d+)?$|^[<>=]$|^\w/.test(q.answer) && q.steps && q.steps.length, s.id + ': question');
    ok(!/undefined|NaN|null/.test(q.prompt + q.steps.join(' ')), s.id + ': bad text');
    q.steps.forEach((st) => sentencesTrue(st, s.id));
    if (s.trial) {
      ok(q.steps[q.steps.length - 1].endsWith('= ' + q.answer), s.id + ': last step reaches the answer');
      if (s.trial === 'near100') { const [a, b] = q.prompt.match(/\d+/g).map(Number); ok(a >= 91 && b >= 91 && a * b === +q.answer, 'near 100'); }
      if (s.trial === 'crosswise') { const [a, b] = q.prompt.match(/\d+/g).map(Number); ok(a * b === +q.answer && a < 50 && b < 50, 'crosswise'); }
      if (s.trial === 'bond') ok(q.bond.whole - q.bond.part === +q.answer && +q.answer > 0, 'bond');
      if (s.trial === 'abacus') ok(+q.answer < 100, 'abacus stays within two rods');
    } else ok(s.skills.includes(q.skill), s.id + ': question from a linked skill');
  }
});
// search
ok(T.search('').length === T.LIST.length, 'empty search lists everything');
ok(T.search('vedic').every((s) => /vedic/i.test(s.origin)) && T.search('vedic').length >= 3, 'search by tradition');
ok(T.search('F406').some((s) => s.id === 'crosswise'), 'search by skill');
ok(T.search('zzzz').length === 0, 'no match');
// trials open only when a linked skill is lit
const L = E.newLearner('S');
ok(!T.open(T.byId['near-100'], L.skills), 'closed for a new child');
L.skills.F406.status = 'mastered';
ok(T.open(T.byId['near-100'], L.skills) && T.open(T.byId.crosswise, L.skills), 'open once a linked skill is lit');
ok(T.MASTERY_TEST.items === 4 && T.MASTERY_TEST.pass === 3, 'independent mastery test: 3 of 4');
console.log('Strategy library checks passed: ' + checks + ' across ' + T.LIST.length + ' strategies.');
