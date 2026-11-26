// Explanations (Tenbright 2.0, Phase 3): every plain-words step must keep the engine's numbers and stay child-sized.
// Run: node test/explain.test.js
const assert = require('assert');
const E = require('../src/engine.js');
const X = require('../src/explain.js');
const R = E.makeRng(2026);
let checks = 0;
const ok = (c, msg) => { checks++; assert.ok(c, msg); };
// the same rule Work it with Pip uses to find a step's result
const guideAnswer = (s) => { const re = /= (\d[\d,]*(?:\.\d+)?)(?![\d,.]*\d)(?!\/| R)/g; let m, last = null; while ((m = re.exec(s))) last = m; return last ? last[1].replace(/,/g, '') : null; };
const NUM = '(\\d+(?:\\.\\d+)?)';
const ops = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b };
function sentencesTrue(text, tag) {
  const flat = text.replace(/(\d),(?=\d{3})/g, '$1');
  // chains such as "4 + 3 + 1 = 8" and single sentences "10 − 8 = 2"
  const re = new RegExp(NUM + '((?: [+−×] ' + NUM + ')+) = ' + NUM + '(?![\\d.]*\\d)', 'g'); let m;
  while ((m = re.exec(flat))) {
    const prev = flat.slice(Math.max(0, m.index - 2), m.index);
    if (/[\d.\/]$/.test(prev)) continue;
    const terms = (m[1] + m[2]).match(/[+−×] \d+(?:\.\d+)?|^\d+(?:\.\d+)?/g);
    let v = Number(terms[0]);
    terms.slice(1).forEach((t) => { v = ops[t[0]](v, Number(t.slice(2))); });
    ok(Math.abs(v - Number(m[m.length - 1])) < 1e-9, tag + ': false sentence "' + m[0] + '" in: ' + text);
  }
}
const words = (s) => (s.match(/[A-Za-z’']+/g) || []).length;
const BANNED = /\b(borrow\w*|carry|carrying|carried|hmm+|um+|uh+)\b/i;
const covered = X.SKILLS;
ok(covered.length >= 14, 'Grade 1 is covered');
for (const id of covered) {
  let made = 0;
  for (let i = 0; i < 2000; i++) {
    const it = E.generate(id, R);
    const x = X.explain(it);
    if (!x) continue;
    made++;
    const tag = id + ' "' + it.prompt + '"';
    ok(x.say.length === it.steps.length, tag + ': one plain step per engine step');
    x.say.forEach((s, k) => {
      ok(guideAnswer(s) === guideAnswer(it.steps[k]), tag + ' step ' + (k + 1) + ': same result as the engine step\n  engine: ' + it.steps[k] + '\n  plain:  ' + s);
    });
    if (it.op && /^\d/.test(it.answer)) ok(x.say[x.say.length - 1].includes(it.answer), tag + ': the last step reaches the answer');
    const all = [].concat(x.meaning || [], x.say, x.check ? [x.check] : []);
    all.forEach((t) => {
      ok(!/undefined|NaN|null|\[object/.test(t), tag + ': bad text: ' + t);
      ok(!BANNED.test(t), tag + ': banned word in: ' + t);
      sentencesTrue(t, tag);
      t.split(/(?<=[.!?])\s+/).forEach((sen) => ok(words(sen) <= 16, tag + ': sentence too long (' + words(sen) + ' words): ' + sen));
    });
  }
  // Grade 1 and the column skills always get plain words; a later slice may leave rare cases to the engine steps
  ok(made >= (E.gradeOf(id) <= 2 ? 2000 : 1900), id + ': plain words for ' + made + ' of 2000 questions');
}
// Fix Pip's mistake questions and any odd item fall back to the engine's steps, never to broken words
for (const id of covered) for (let i = 0; i < 300; i++) {
  const m = E.makeMistake(id, R); if (!m) break;
  ok(X.explain(m) === null, id + ': Fix Pip\'s mistake keeps the engine steps');
}
ok(X.explain({ skill: 'C101', steps: ['x', 'y'], format: 'number' }) === null, 'missing numbers fall back');
// place-value phrases
ok(X.placePhrase(46) === '4 tens and 6 ones' && X.placePhrase(40) === '4 tens' && X.placePhrase(7) === '7 ones' && X.placePhrase(305) === '3 hundreds and 5 ones' && X.placePhrase(589) === '5 hundreds, 8 tens and 9 ones' && X.placePhrase(11) === '1 ten and 1 one', 'place phrases');
// a skill without a builder falls back to the engine steps
ok(X.explain(E.generate('F515', R)) === null, 'no builder: engine steps are used');
console.log('Explanation checks passed: ' + checks + ' across ' + covered.length + ' skills.');
