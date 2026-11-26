// Verification pipeline for the MVP slice (Phase 2, section 3): run with `node test/engine.test.js`
const assert = require('assert');
const E = require('../src/engine.js');

let checks = 0;
const ok = (cond, msg) => { checks++; assert.ok(cond, msg); };

const N = 5000;
for (const id of E.SKILL_ORDER) {
  const rng = E.makeRng(1234 + id.length * 97 + id.charCodeAt(0));
  const formats = new Set();
  for (let i = 0; i < N; i++) {
    const it = E.generate(id, rng);
    formats.add(it.format);
    const tag = id + ' #' + i + ' ' + JSON.stringify({ a: it.a, b: it.b, p: it.prompt });

    // 1. answer recomputed independently
    if (it.op === '+' && !it.list) ok(Number(it.answer) === it.a + it.b, 'sum ' + tag);
    if (it.op === '−') ok(Number(it.answer) === it.a - it.b, 'difference ' + tag);
    if (it.op === '×') ok(Number(it.answer) === it.a * it.b, 'product ' + tag);
    if (it.op === '÷') ok(Number(it.answer) * it.b === it.a, 'quotient ' + tag);
    if (it.list) ok(Number(it.answer) === it.list.reduce((s, x) => s + x, 0), 'list sum ' + tag);
    if (id === 'PV10') ok(/[0-9]/.test(it.answer) ? Number(it.answer) === Math.max(it.a, it.b) : it.answer === (it.a > it.b ? '>' : it.a < it.b ? '<' : '='), 'compare ' + tag);
    if (id === 'PV03' && it.model.type === 'blocks') ok(Number(it.answer) === 100 * it.model.h + 10 * it.model.t + it.model.o, 'blocks ' + tag);
    if (id === 'PV03' && it.format === 'build') ok(Number(it.answer) === it.target, 'build ' + tag);
    if (id === 'PV12') ok(Number(it.answer) === (it.op === '+' ? it.a + it.b : it.a - it.b), 'pv12 ' + tag);
    if (id === 'PV04') {
      const d = E.digits(it.highlight.n, 3)[it.highlight.pos];
      ok(Number(it.answer) === d * [100, 10, 1][it.highlight.pos] && d !== 0, 'pv04 ' + tag);
    }

    // 2. constraints: the item tests its skill
    const ones = (x) => x % 10, tens = (x) => Math.floor(x / 10) % 10;
    if (id === 'AS04') ok(ones(it.a) + ones(it.b) <= 9 && it.a + it.b <= 99, 'AS04 no regroup ' + tag);
    if (id === 'AS05') ok(ones(it.a) + ones(it.b) >= 10 && it.a + it.b <= 99, 'AS05 regroup ' + tag);
    if (id === 'AS06') ok(ones(it.a) >= ones(it.b) && it.a > it.b, 'AS06 no regroup ' + tag);
    if (id === 'AS07') ok(ones(it.a) < ones(it.b) && it.a - it.b >= 10, 'AS07 regroup ' + tag);
    if (id === 'AS11') ok(it.a + it.b <= 999 && (ones(it.a) + ones(it.b) >= 10 || tens(it.a) + tens(it.b) >= 10), 'AS11 ' + tag);
    if (id === 'AS12') ok(it.a - it.b >= 100 && (ones(it.a) < ones(it.b) || tens(it.a) < tens(it.b)), 'AS12 ' + tag);
    if (id === 'T3') ok(it.b % 10 !== 0 && it.b < it.a, 'T3 ' + tag);
    if (id === 'AS13') ok(tens(it.a) === 0 && ones(it.a) < ones(it.b), 'AS13 across zero ' + tag);
    if (id === 'AS02') ok(it.a + it.b > 10 && it.a >= 6, 'AS02 crosses ten ' + tag);
    if (id === 'AS01') ok(Number(it.answer) <= 20, 'AS01 within 20 ' + tag);
    if (id === 'PV13') { const n = Number(it.prompt.match(/Round (\d+)/)[1]); ok(Math.abs(Number(it.answer) - n) <= 5 && Number(it.answer) % 10 === 0, 'PV13 ' + tag); }
    if (id === 'PV14') { const n = Number(it.prompt.match(/Round (\d+)/)[1]); ok(Math.abs(Number(it.answer) - n) <= 50 && Number(it.answer) % 100 === 0, 'PV14 ' + tag); }
    if (id === 'PV06') ok(it.prompt.indexOf(E.numberName(Number(it.answer))) > 0, 'PV06 name ' + tag);
    if (/^WP/.test(id) || id === 'AS16' || id === 'AS10') ok(Number(it.answer) >= 0 && /^\d+$/.test(it.answer) || it.format === 'choice', 'WP numeric ' + tag);
    if (typeof it.a === 'number' && it.op) ok(Number(it.answer) >= 0, 'non-negative ' + tag);

    // 3. distractors and predictions
    Object.entries(it.predicted).forEach(([k, v]) => {
      ok(v !== it.answer, 'prediction equals answer ' + k + ' ' + tag);
      ok(E.MISCONCEPTIONS[k], 'unknown misconception ' + k);
      const r = E.check(it, v);
      ok(!r.correct && r.misconception !== null, 'prediction not detected ' + k + ' ' + tag);
    });
    if (it.format === 'choice') {
      ok(it.choices.includes(it.answer), 'choice missing answer ' + tag);
      ok(new Set(it.choices).size === it.choices.length, 'duplicate choices ' + tag);
      ok(it.choices.length >= (it.textChoices ? 2 : 3), 'too few choices ' + tag);
    }

    // 4. worked steps end at the answer (where steps state a result)
    if (it.op) ok(it.steps[it.steps.length - 1].endsWith(it.answer), 'steps end ' + tag);

    // 5. checker
    ok(E.check(it, it.answer).correct, 'checker rejects answer ' + tag);
  }
  ok(formats.size >= 2, id + ' has only ' + [...formats].join(','));
}

// misconception examples from the Phase 2 library
const sub = (a, b, s) => E.generate; // placeholder to keep linter quiet
const ex1 = { answer: '26', predicted: { M01: '34', M02: '36' } };
assert.strictEqual(E.check(ex1, '34').misconception, 'M01');
assert.strictEqual(E.check(ex1, '36').misconception, 'M02');

// BKT behaviour
let p = 0.1;
for (let i = 0; i < 12; i++) { const q = E.bktUpdate(p, true, 'number', 0); ok(q > p, 'bkt rises'); p = q; }
ok(p > 0.95, 'bkt reaches threshold after 12 correct');
ok(E.bktUpdate(0.5, false, 'number', 0) < 0.5, 'bkt falls on error');
ok(E.bktUpdate(0.5, true, 'choice', 0) < E.bktUpdate(0.5, true, 'number', 0), 'guessable formats count less');

// mastery gate, retention, unlocks, misconception confirmation
const L = E.newLearner('Test', 2019, 'start');
ok(L.skills.C101.status === 'learning' && L.skills.C102.status === 'learning' && L.skills.PV01.status === 'locked' && L.skills.AS01.status === 'locked', 'initial unlocks are the Grade 1 entry skills');
L.skills.PV01.learned = true; L.skills.PV01.status = 'learning';
const now = Date.UTC(2026, 10, 3);
for (let i = 0; i < 9; i++) E.recordAttempt(L.skills, 'PV01', { format: i % 2 ? 'number' : 'choice' }, { correct: true, misconception: null }, 0, now);
ok(L.skills.PV01.status === 'practiced', 'not mastered before 10 items');
for (let i = 0; i < 4; i++) E.recordAttempt(L.skills, 'PV01', { format: 'number' }, { correct: true, misconception: null }, 0, now);
// Phase 4: right answers alone are not enough; PV01 has no story or missing-step questions, so one right reason is needed
ok(L.skills.PV01.status === 'practiced' && E.evidenceMissing(L.skills.PV01, 'PV01').join() === 'reason', 'not mastered without a reason');
E.recordWhy(L.skills, 'PV01', true);
E.recordAttempt(L.skills, 'PV01', { format: 'number' }, { correct: true, misconception: null }, 0, now);
ok(L.skills.PV01.status === 'mastered', 'mastered after gate met');
ok(L.skills.PV02.status === 'learning', 'PV02 unlocked');
ok(!E.dueCheck(L.skills.PV01, now + 6 * E.DAY), 'no check before day 7');
ok(E.dueCheck(L.skills.PV01, now + 7 * E.DAY), 'check due at day 7');
[true, true, true, false].forEach((c) => E.recordCheckItem(L.skills, 'PV01', c, now + 7 * E.DAY));
ok(L.skills.PV01.status === 'mastered', '3/4 passes the 7-day check');
[true, true, true, true].forEach((c) => E.recordCheckItem(L.skills, 'PV01', c, now + 30 * E.DAY));
ok(L.skills.PV01.status === 'certified', 'certified at 30 days');
[false, false, true, false].forEach((c) => E.recordCheckItem(L.skills, 'PV01', c, now + 90 * E.DAY));
ok(L.skills.PV01.status === 'practiced', 'missed 90-day check returns to practiced, not locked');

const L2 = E.newLearner('Test2', 2019, 'start');
L2.skills.PV01.learned = true;
E.recordAttempt(L2.skills, 'PV01', { format: 'number' }, { correct: false, misconception: 'M09' }, 0, now);
ok(!L2.skills.PV01.activeMis, 'one match is only possible');
E.recordAttempt(L2.skills, 'PV01', { format: 'number' }, { correct: false, misconception: 'M09' }, 0, now);
ok(L2.skills.PV01.activeMis === 'M09', 'two matches confirm');
ok(E.nextActivity(L2.skills, now).kind === 'remediate', 'remediation comes first');
for (let i = 0; i < 3; i++) E.recordAttempt(L2.skills, 'PV01', { format: 'number' }, { correct: true, misconception: null }, 0, now);
ok(!L2.skills.PV01.activeMis, 'three correct clears it');

// ---------- Phase 4: new kinds of evidence and explanation variants ----------
{
  const R4 = E.makeRng(404);
  let stories = 0, fills = 0;
  for (const id of E.SKILL_ORDER) {
    const can = E.canOffer(id);
    for (let i = 0; i < 400; i++) {
      const t = E.makeTransfer(id, R4);
      if (t) {
        stories++;
        ok(can.transfer, id + ': a story was made but the skill is not marked as having stories');
        ok(t.kind === 'transfer' && t.format === 'number' && t.story, id + ': story item shape');
        // the story asks the same math: the numbers in it and the answer agree
        const n = (t.prompt.match(/\d+/g) || []).map(Number), c = Number(t.answer);
        const okMath = (t.op === '+' && n[0] + n[1] === c) || (t.op === '−' && n[0] - n[1] === c) || (t.op === '×' && n[0] * n[1] === c) || (t.op === '÷' && n[0] === n[1] * c);
        ok(okMath, id + ': story math does not match the answer: ' + t.prompt + ' = ' + t.answer);
        ok(!/ 1 (bags|boxes|baskets|rows)\b/.test(t.prompt), id + ': one group in a story: ' + t.prompt);
        ok(E.check(t, t.answer).correct, id + ': story answer checks');
      }
      const f = E.makeStepFill(id, R4);
      if (f) {
        fills++;
        ok(can.stepfill, id + ': a missing step was made but the skill is not marked as having them');
        const m = E.stepResult(f.steps[f.blank.step]);
        ok(m && m[1].replace(/,/g, '') === f.answer && f.blank.step < f.steps.length - 1, id + ': the blank is the result of a middle step');
        ok(f.answer !== f.base.answer, id + ': the missing step is not the final answer');
        ok(f.steps[f.blank.step].slice(f.blank.at, f.blank.at + f.blank.len).replace(/,/g, '') === f.answer, id + ': blank position');
        ok(E.check(f, f.answer).correct && !E.check(f, String(Number(f.answer) + 1)).correct, id + ': missing step checks');
      }
    }
  }
  ok(stories > 10000 && fills > 8000, 'stories and missing steps are made for many skills: ' + stories + ', ' + fills);
  // a skill with stories and missing steps needs two kinds of evidence beyond right answers
  const A = E.newLearner('A');
  ok(E.canOffer('AS05').transfer && E.canOffer('AS05').stepfill, 'AS05 has stories and missing steps');
  Object.assign(A.skills.AS05, { learned: true, status: 'learning' });
  for (let i = 0; i < 12; i++) E.recordAttempt(A.skills, 'AS05', { format: i % 2 ? 'number' : 'choice' }, { correct: true, misconception: null }, 0, now);
  ok(A.skills.AS05.status !== 'mastered' && E.evidenceMissing(A.skills.AS05, 'AS05').length === 3, 'no mastery on plain answers only');
  E.recordAttempt(A.skills, 'AS05', { format: 'number', kind: 'transfer' }, { correct: true, misconception: null }, 2, now);
  ok(!E.evidence(A.skills.AS05).transfer, 'a story answered with a big hint is not evidence');
  E.recordAttempt(A.skills, 'AS05', { format: 'number', kind: 'transfer' }, { correct: true, misconception: null }, 0, now);
  ok(A.skills.AS05.status !== 'mastered', 'one kind is not enough');
  E.recordAttempt(A.skills, 'AS05', { format: 'stepfill', kind: 'stepfill' }, { correct: true, misconception: null }, 0, now);
  ok(A.skills.AS05.status === 'mastered' && E.evidenceMissing(A.skills.AS05, 'AS05').length === 0, 'two kinds of evidence complete mastery');
  ok(E.masteryMet(A.skills.AS05, 'AS05') && E.evidence(A.skills.AS05).independent >= 10, 'stories and missing steps do not count as plain answers');
  // explanation variants: a miss after an explanation brings a different one; what works is kept
  const X = { attempts: [] };
  ok(E.explainPick(X) === 'steps', 'steps first');
  E.explainShown(X, 'steps'); E.explainOutcome(X, false);
  const second = E.explainPick(X);
  ok(second !== 'steps', 'a miss after the steps brings a different explanation: ' + second);
  E.explainShown(X, second); E.explainOutcome(X, false);
  const third = E.explainPick(X);
  ok(third !== second && third !== 'steps', 'then the third kind: ' + third);
  E.explainShown(X, third); E.explainOutcome(X, true);
  ok(E.explainPick(X) === third, 'the one that worked is used next');
  E.explainShown(X, third); E.explainOutcome(X, true);
  ok(E.explainBest(X) === third, 'and it is reported as what helps');
  ok(!X.explain.pending, 'outcome clears the pending explanation');
  const Y = E.newLearner('Y'); Y.skills.C102.learned = true;
  E.explainShown(Y.skills.C102, 'picture');
  E.recordAttempt(Y.skills, 'C102', { format: 'number' }, { correct: true, misconception: null }, 0, now);
  ok(Y.skills.C102.explain.tried.picture[1] === 1, 'the next answer after an explanation records whether it helped');
}

// ---------- Phase 5: games ----------
{
  const R5 = E.makeRng(505);
  ok(E.GAME_ROUNDS === 5 && Object.keys(E.GAMES).join() === 'bridge,pizza,detective', 'three games');
  const fresh = E.newLearner('G');
  Object.keys(E.GAMES).forEach((g) => ok(E.gameLevel(fresh.skills, g) === 0, g + ' is closed for a new child'));
  Object.keys(E.GAMES).forEach((g) => {
    E.GAMES[g].levels.forEach((ids, i) => {
      ids.forEach((id) => ok(E.SKILLS[id], g + ': unknown skill ' + id));
      const L = E.newLearner('G'); L.skills[ids[0]].status = 'mastered';
      ok(E.gameLevel(L.skills, g) === i + 1, g + ': lighting ' + ids[0] + ' opens level ' + (i + 1));
      L.skills[ids[0]].status = 'practiced';
      ok(E.gameLevel(L.skills, g) === 0, g + ': a skill that is not lit opens nothing');
      for (let k = 0; k < 3000; k++) {
        const rd = E.gameRound(g, i + 1, R5);
        ok(rd.game === g && rd.level === i + 1 && /^\d+$/.test(rd.answer), g + ': round shape');
        ok(!/undefined|NaN|null/.test(rd.prompt + rd.how), g + ': bad text ' + rd.prompt);
        // every number sentence in the "how" line is true
        const m = /(\d+) ([+−×]) (\d+) = (\d+)/.exec(rd.how);
        if (m) ok({ '+': +m[1] + +m[3], '−': m[1] - m[3], '×': m[1] * m[3] }[m[2]] === +m[4], g + ': false sentence ' + rd.how);
        if (g === 'bridge') ok(rd.total - rd.have === +rd.answer && rd.choices.includes(rd.answer) && new Set(rd.choices).size === rd.choices.length && rd.choices.length === 3 && rd.choices.every((c) => +c > 0), 'bridge round: ' + JSON.stringify(rd));
        if (g === 'pizza') { const want = rd.order.reduce((a, [n, d]) => a + n * rd.slices / d, 0); ok(want === +rd.answer && +rd.answer >= 1 && +rd.answer < rd.slices && rd.slices <= 12, 'pizza round: ' + JSON.stringify(rd)); }
        if (g === 'detective') {
          if (rd.seq) { const s2 = rd.seq.map((x) => (x === '?' ? +rd.answer : +x)); ok(rd.seq.filter((x) => x === '?').length === 1 && rd.seq[0] !== '?', 'one hidden number, never the first'); ok(rd.kind === 'add' ? s2.every((x, j) => !j || x - s2[j - 1] === s2[1] - s2[0]) : s2.every((x, j) => !j || x / s2[j - 1] === s2[1] / s2[0]), 'pattern rule: ' + rd.seq.join(',')); }
          else { const c = rd.clue.replace('?', rd.answer).split(' '); ok(c[1] === '+' ? +c[0] + +c[2] === +c[4] : +c[0] * +c[2] === +c[4], 'detective sentence: ' + rd.clue + ' = ' + rd.answer); }
          if (i === 0) ok(rd.kind === 'add', 'level 1 detective uses adding patterns only');
        }
      }
    });
  });
}

// graph integrity: every prerequisite exists and appears earlier in the order or in another strand without cycles
E.SKILL_ORDER.forEach((id) => E.SKILLS[id].prereqs.forEach((p) => ok(E.SKILLS[p], id + ' has unknown prereq ' + p)));
E.SKILL_ORDER.forEach((id) => ok(!E.ancestors(id).has(id), 'cycle at ' + id));
ok(E.SKILL_ORDER.filter((id) => !E.SKILLS[id].strategy).length === 125, '125 core skills (102 + 8 money and time + 7 measurement and geometry + 8 money math)');
// every clue code is defined once: a repeated key in an object literal silently replaces the earlier one
{
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/engine.js'), 'utf8');
  const block = (start, end) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));
  const keysIn = (txt) => (txt.match(/^ {4}([A-Z][A-Z0-9]{1,4}):/gm) || []).map((k) => k.trim().slice(0, -1));
  const dupes = (ks) => ks.filter((k, i) => ks.indexOf(k) !== i);
  const misKeys = keysIn(block('const MISCONCEPTIONS = {', '\n  };')), didKeys = keysIn(block('const PIP_DID = {', '\n  };'));
  ok(misKeys.length > 50 && !dupes(misKeys).length, 'clue codes defined once: ' + dupes(misKeys).join());
  ok(didKeys.length > 50 && !dupes(didKeys).length, 'Pip mistake lines defined once: ' + dupes(didKeys).join());
  ok(E.MISCONCEPTIONS.MF1.name === 'Adds to top and bottom' && /money/.test(E.MISCONCEPTIONS.MW1.clue), 'fraction and money clues keep their own codes');
  ok(/top and bottom/.test(E.PIP_DID.MF1) && /money/.test(E.PIP_DID.MW1), 'and their own Pip lines');
}
// every clue code a question or adventure predicts is defined (a typo or a renamed code would silently give no clue)
{
  const RC = E.makeRng(77), used = new Set();
  for (const id of E.SKILL_ORDER) for (let i = 0; i < 400; i++) Object.keys(E.generate(id, RC).predicted || {}).forEach((k) => used.add(k));
  for (const id of Object.keys(E.ADVENTURES)) for (let i = 0; i < 300; i++) E.adventure(id, RC).steps.forEach((st) => Object.keys(st.predicted || {}).forEach((k) => used.add(k)));
  const unknown = [...used].filter((k) => !E.MISCONCEPTIONS[k]);
  ok(used.size > 50 && !unknown.length, 'predicted clue codes are defined: ' + unknown.join());
}
// Money & Wealth Adventures, step 1: five money skills and the lemonade adventure; every number sentence is true
{
  const RF = E.makeRng(909);
  // a + b − c = d style sentences, left to right (× and ÷ only appear alone)
  // a + b − c = d style sentences, whole numbers or decimals; × binds tighter than + and −
  const trueSentences = (text, tag) => { const re = /(?<![\d.])(\d+(?:\.\d+)?)((?: [+−×÷] \d+(?:\.\d+)?)+) = (\d+(?:\.\d+)?)(?![\d.]*\d)/g; let m; while ((m = re.exec(text))) { const t = (m[1] + m[2]).split(' '); const terms = [+t[0]], ops = []; for (let i = 1; i < t.length; i += 2) { const x = +t[i + 1]; if (t[i] === '×') terms[terms.length - 1] *= x; else if (t[i] === '÷') terms[terms.length - 1] /= x; else { ops.push(t[i]); terms.push(x); } } let v = terms[0]; ops.forEach((o, i) => { v = o === '+' ? v + terms[i + 1] : v - terms[i + 1]; }); ok(Math.abs(v - +m[3]) < 1e-9, tag + ': false sentence ' + m[0]); } };
  ['FN01', 'FN02', 'FN04', 'FN05', 'FN07'].forEach((id) => ok(E.SKILLS[id].region === 'market', id + ' in the Money Market'));
  for (let i = 0; i < 4000; i++) {
    for (const id of ['FN01', 'FN02', 'FN04', 'FN05', 'FN07']) {
      const it = E.generate(id, RF);
      it.steps.forEach((st) => trueSentences(st, id));
      ok(/^\d+$/.test(it.answer) && +it.answer > 0, id + ' whole-dollar answer: ' + it.answer);
      ok(it.steps.some((st) => new RegExp('= ' + it.answer + '(?!\\d)').test(st)), id + ' a step reaches the answer');
      Object.values(it.predicted).forEach((w) => ok(w !== it.answer, id + ' clue differs from the answer'));
      ok(!/undefined|NaN/.test(it.prompt + it.steps.join(' ')), id + ' text');
    }
    const a = E.adventure('lemonade', RF);
    ok(a.steps.length === 5 && a.steps[4].idea && a.steps[4].answer === 'Revenue', 'lemonade has 4 calculations and an idea check');
    const [s1, s2, s3, s4] = a.steps;
    ok(+s3.answer === +s1.answer - +s2.answer && +s4.answer < +s3.answer && +s4.answer > 0, 'profit is revenue minus costs, then less after the sign');
    a.steps.forEach((st) => { trueSentences(st.how, 'lemonade'); if (!st.idea) ok(E.SKILLS[st.skill] && new RegExp('= ' + st.answer + '$').test(st.how), 'lemonade step ends with its answer: ' + st.how); });
    ok(s4.predicted.MW2 === s3.answer && s3.predicted.MW1 === s1.answer, 'money-idea clues: forgot a cost, revenue as profit');
  }
  // all ten adventures: each step an engine question with a true worked sentence ending in its answer; the idea check last
  const ids = Object.keys(E.ADVENTURES);
  ok(ids.length === 20, 'twenty adventures');
  ids.forEach((id) => {
    const A = E.ADVENTURES[id];
    A.needs.concat(A.skills).forEach((s) => ok(E.SKILLS[s], id + ': unknown skill ' + s));
    ok(A.name && A.idea && A.real && A.home, id + ': name, idea, real-life line and home activity');
    for (let i = 0; i < 2000; i++) {
      const a = E.adventure(id, RF), last = a.steps[a.steps.length - 1];
      ok(a.intro && /pretend/.test(a.intro), id + ': the intro says the money is pretend');
      ok(a.steps.length >= 4 && last.idea && last.choices.includes(last.answer) && a.steps.filter((x) => x.idea).length === 1, id + ': one idea check, last');
      a.steps.forEach((st) => {
        ok(Array.isArray(st.story) && st.story.every((x) => x.length === 2 && x[1] !== undefined && !/NaN|undefined/.test(String(x[1]))), id + ': story strip');
        ok(!/undefined|NaN/.test(st.prompt + st.how), id + ': text');
        trueSentences(st.how, id);
        if (st.idea) return;
        ok(E.SKILLS[st.skill] && A.skills.includes(st.skill), id + ': step skill listed: ' + st.skill);
        if (st.choices) { ok(st.choices.includes(st.answer), id + ': choice step answer is a choice'); return; }
        ok(/^\d+(\.\d+)?$/.test(st.answer) && +st.answer > 0, id + ': positive answer ' + st.answer);
        // the worked step ends with the answer (a number sentence, or the rounded number, or the week)
        const nums = (st.how.match(/\d+(?:\.\d+)?/g) || []).map(Number);
        ok(nums.length && Math.abs(nums[nums.length - 1] - +st.answer) < 1e-9, id + ': worked step ends with the answer: ' + st.how);
        if (/\./.test(st.answer)) ok(st.decimal, id + ': decimal steps get the decimal key');
        Object.values(st.predicted).forEach((w) => ok(w !== st.answer, id + ': clue differs from the answer'));
        if (st.coins) ok(st.coins.reduce((x, y) => x + y, 0) === +st.answer || id === 'jar', id + ': coins');
      });
    }
  });
  // grade fit: piggy stays within 10, the toy shelf within 20, the market stall under 100
  for (let i = 0; i < 2000; i++) {
    E.adventure('piggy', RF).steps.forEach((st) => (st.how.match(/\d+/g) || []).forEach((x) => ok(+x <= 10, 'piggy within 10: ' + st.how)));
    E.adventure('shelf', RF).steps.forEach((st) => (st.how.match(/\d+/g) || []).forEach((x) => ok(+x <= 20, 'shelf within 20: ' + st.how)));
    E.adventure('stall', RF).steps.forEach((st) => (st.how.match(/\d+/g) || []).forEach((x) => ok(+x < 100, 'stall under 100: ' + st.how)));
  }
  // explainers for the three adventures that have them: 5 frames, true number sentences, honest closing line
  ['lemonade', 'growth', 'company'].forEach((id) => { ok(E.ADVENTURES[id].explainer, id + ' has an explainer'); for (let i = 0; i < 500; i++) { const fr = E.adventureExplainer(id, RF); ok(fr.length === 5 && fr.every((f) => f.say && f.pic && f.pic.type), id + ' explainer frames'); fr.forEach((f) => { trueSentences(f.say, id + ' explainer'); ok(!/undefined|NaN/.test(f.say), id + ' explainer text'); (f.pic.bars || []).forEach((b) => ok(b[1] > 0, id + ' bar')); }); } });
  ok(/not a promise/.test(E.adventureExplainer('company', RF)[4].say) && /can change/.test(E.adventureExplainer('growth', RF)[4].say), 'explainers say gains are not promised');
  // investing stories open only when a parent turns them on
  const LI = E.newLearner('I', 2015, 'pv', '5');
  LI.skills.FN05.status = 'mastered'; LI.skills.FN07.status = 'mastered';
  ok(!E.adventureOpen(LI.skills, 'company') && !E.adventureOpen(LI.skills, 'growth'), 'investing stories are off by default');
  ok(E.adventureOpen(LI.skills, 'company', { investing: true }) && E.adventureOpen(LI.skills, 'growth', { investing: true }), 'and open with the parent switch');
  const LF = E.newLearner('M', 2016, 'pv', '3');
  ok(!E.adventureOpen(LF.skills, 'lemonade'), 'the adventure waits for its math');
  LF.skills.FN02.status = 'mastered';
  ok(E.adventureOpen(LF.skills, 'lemonade'), 'it opens when revenue, cost and profit is lit');
}
// Phase 7: measurement and geometry
{
  const R8 = E.makeRng(808);
  ['MS01', 'MS02', 'MS03', 'MS04', 'GE01', 'GE02', 'GE03'].forEach((id) => ok(['workshop', 'shapes'].includes(E.SKILLS[id].region), id + ' region'));
  for (let i = 0; i < 4000; i++) {
    const a = E.generate('MS01', R8), m = a.model;
    ok(m.type === 'ruler' && m.end <= m.max && Number(a.answer) === m.end - m.start && m.end > m.start, 'MS01 length is end minus start');
    if (m.start) ok(a.predicted.MM1 === String(m.end), 'MS01 reading the end is the clue');
    const b = E.generate('MS02', R8);
    ok(Number(b.answer) === b.model.a - b.model.b && Number(b.answer) > 0, 'MS02 difference');
    const c = E.generate('MS03', R8), cm = c.model;
    ok(Number(c.answer) === (cm.unknownH ? cm.h : 2 * (cm.w + cm.h)), 'MS03 perimeter or missing side');
    const d = E.generate('MS04', R8);
    ok(Number(d.answer) === d.model.w * d.model.h, 'MS04 area is length times width');
    Object.values(d.predicted).forEach((w) => ok(w !== d.answer, 'MS04 clue differs from the answer'));
    const g = E.generate('GE01', R8);
    if (g.format === 'choice' && g.textChoices) ok(g.choices.length === 4 && g.choices.includes(g.answer) && ['triangle', 'quadrilateral', 'pentagon', 'hexagon'][g.model.n - 3] === g.answer, 'GE01 name matches the sides');
    const h = E.generate('GE02', R8);
    ok(Number(h.answer) + h.model.a === h.model.total && Number(h.answer) > 0, 'GE02 angles add to the whole');
    const k = E.generate('GE03', R8);
    ok(Number(k.answer) === (/across/.test(k.prompt) ? k.model.x : k.model.y) && k.model.x !== k.model.y, 'GE03 across or up');
  }
  const L8 = E.newLearner('G');
  ok(L8.skills.MS01.status === 'locked' && L8.skills.GE01.status === 'locked', 'measurement and shapes wait for counting');
  L8.skills.C101.status = 'mastered'; E.refreshUnlocks(L8.skills);
  ok(L8.skills.MS01.status === 'learning' && L8.skills.GE01.status === 'learning', 'they open after counting to 120');
}
// Phase 7: money and time
{
  const R7 = E.makeRng(707), clock = /^(\d{1,2}):(\d{2})$/;
  ['MY01', 'MY02', 'MY03', 'MY04', 'TM01', 'TM02', 'TM03', 'TM04'].forEach((id) => ok(['market', 'clock'].includes(E.SKILLS[id].region), id + ' region'));
  for (let i = 0; i < 4000; i++) {
    for (const id of ['TM01', 'TM02', 'TM03']) {
      const it = E.generate(id, R7), m = it.model;
      ok(m.type === 'clock' && m.h >= 1 && m.h <= 12 && m.m >= 0 && m.m <= 59, id + ' clock model');
      if (id === 'TM01') ok(m.m === 0 || m.m === 30, 'TM01 hour or half hour');
      if (id === 'TM02') ok(m.m % 5 === 0, 'TM02 to 5 minutes');
      if (/^What time/.test(it.prompt)) {
        ok(clock.test(it.answer) && it.answer === m.h + ':' + String(m.m).padStart(2, '0'), id + ' answer matches the clock');
        ok(it.choices.includes(it.answer) && new Set(it.choices).size === it.choices.length && it.choices.every((c) => clock.test(c)), id + ' choices');
        Object.values(it.predicted).forEach((w) => ok(w !== it.answer && it.choices.includes(w), id + ' clue answer is a real wrong choice'));
      } else ok(it.answer === String(m.m), id + ' minutes past the hour');
    }
    const c = E.generate('MY02', R7);
    ok(c.model.coins.reduce((a, x) => a + x, 0) === Number(c.answer) && Number(c.answer) <= 99, 'MY02 coins add up');
    const ch = E.generate('MY04', R7);
    const price = Number(ch.prompt.match(/costs (\d+) cents/)[1]);
    ok(Number(ch.answer) === 100 - price && price % 5 === 0, 'MY04 change from a dollar');
    const tm = E.generate('TM04', R7), mm = tm.model;
    ok((mm.eh * 60 + mm.em) - (mm.h * 60 + mm.m) === Number(tm.answer) && mm.eh <= 12, 'TM04 minutes between the times');
    if (tm.predicted.MT4) ok(tm.predicted.MT4 !== tm.answer, 'TM04 hundreds clue differs');
    ok(tm.steps[tm.steps.length - 1].endsWith('= ' + tm.answer) && !/ 0 more minutes/.test(tm.steps.join(' ')), 'TM04 steps reach the answer: ' + tm.steps.join(' | '));
    tm.steps.forEach((st) => { const q = st.match(/(\d+) ([+−×]) (\d+) = (\d+)$/); if (q) { const x = +q[1], y = +q[3], v = q[2] === '+' ? x + y : q[2] === '−' ? x - y : x * y; ok(v === +q[4], 'TM04 true step: ' + st); } });
  }
  // a new child's money and time skills open with their prerequisites
  const L7 = E.newLearner('T');
  ok(L7.skills.TM01.status === 'locked', 'TM01 waits for counting');
  L7.skills.C101.status = 'mastered'; E.refreshUnlocks(L7.skills);
  ok(L7.skills.TM01.status === 'learning', 'TM01 opens after counting to 120');
  // older saved children gain the new skills without losing anything
  const old = E.newLearner('O'); delete old.skills.MY01; delete old.skills.TM04;
  E.migrateLearner(old);
  ok(old.skills.MY01 && old.skills.TM04, 'migration adds money and time skills');
}

// placement: strong child passes the early anchors, fails at AS07 and loses its dependants
const ps = E.newPlacement();
const script = { PV04: [1, 1, 1], PV10: [1, 1, 0, 1], AS05: [1, 1, 1], AS07: [0, 0], MU03: [1, 1, 1], MU12: [0, 1, 0] };
let guard = 0;
while (!ps.done && guard++ < 40) { const a = ps.current; const seq = script[a]; const k = ps.answers.length; E.placementRecord(ps, seq ? seq[k] : 0); }
ok(ps.passed.join() === 'PV04,PV10,AS05,MU03', 'placement passes ' + ps.passed.join());
ok(ps.failed.includes('AS07') && !ps.failed.includes('AS12') && !ps.failed.includes('AS15'), 'AS12 and AS15 skipped after AS07 fails');
ok(ps.items <= E.PLACEMENT_MAX_ITEMS, 'placement capped');
const L3 = E.newLearner('Test3', 2018, 'start');
E.applyPlacement(L3, ps.passed, now);
ok(L3.skills.PV01.status === 'placed' && L3.skills.AS02.status === 'placed' && L3.skills.MU02.status === 'placed', 'placed with ancestors');
ok(L3.skills.AS07.status === 'learning' || L3.skills.AS07.status === 'locked', 'AS07 not placed');
// migration keeps old progress and adds new skills
const old = { skills: { PV03: Object.assign(E.newLearner('x').skills.PV03, { status: 'mastered' }) } };
E.migrateLearner(old);
ok(old.skills.PV03.status === 'mastered' && old.skills.WP05 && old.skills.PV01.status === 'placed' && old.skills.C109.status === 'placed' && old.skills.C102.status === 'learning', 'migration credits skills underneath');
ok(E.numberName(406) === 'four hundred six' && E.numberName(570) === 'five hundred seventy' && E.numberName(13) === 'thirteen' && E.numberName(999) === 'nine hundred ninety-nine', 'number names');

// grade levels: every skill has grade 2 or 3; a grade focus picks on-grade work first, never locks anything
const per = [1, 2, 3, 4, 5].map((g) => E.SKILL_ORDER.filter((id) => E.gradeOf(id) === g).length);
ok(E.SKILL_ORDER.every((id) => [1, 2, 3, 4, 5].includes(E.gradeOf(id))), 'every skill has a grade 1-5');
ok(per.join() === '15,38,30,24,19', 'grade split (with money, time, measurement, geometry and money math) ' + per.join());
ok(E.defaultFocus('1') === 1 && E.defaultFocus('2') === 2 && E.defaultFocus('3') === 3 && E.defaultFocus('5') === 5 && E.defaultFocus('other') === 'all', 'default focus');
const LG = E.newLearner('G', 2017, 'pv', '3');
ok(LG.grade === '3' && LG.focus === 3, 'grade stored with default focus');
ok(E.newLearner('G2', 2017, 'pv', 'bogus').grade === null, 'unknown grade rejected');
// fresh learner, Grade 3 focus: nothing grade 3 is open yet, so Pip picks an earlier skill that unlocks grade 3
const fresh = E.newLearner('F', 2017, 'pv', '3');
const naF = E.nextActivity(fresh.skills, now, 3);
ok(E.gradeOf(naF.skill) < 3 && /opens the Grade 3/.test(naF.reason), 'bridge to grade 3: ' + naF.skill);
// once grade 3 skills are open, focus 3 picks one of them while focus 2 still picks grade 2
const mid = E.newLearner('M', 2017, 'pv', '3');
E.applyPlacement(mid, ['PV04', 'PV10', 'AS05', 'MU03'], now);
mid.skills.PV13.status = 'learning'; mid.skills.PV13.checks = [];
E.SKILL_ORDER.forEach((id) => { mid.skills[id].checks = []; });
const n3 = E.nextActivity(mid.skills, now, 3), n2 = E.nextActivity(mid.skills, now, 2), nAll = E.nextActivity(mid.skills, now, 'all');
ok(E.gradeOf(n3.skill) === 3, 'focus 3 picks grade 3: ' + n3.skill);
ok(E.gradeOf(n2.skill) === 2, 'focus 2 picks grade 2: ' + n2.skill);
ok(nAll.skill, 'all still works');
// remediation still comes first whatever the focus
mid.skills.PV01.activeMis = 'M09';
ok(E.nextActivity(mid.skills, now, 3).kind === 'remediate', 'remediation beats grade focus');
const gp = E.gradeProgress(mid.skills);
ok(gp.length === 5 && gp[1].grade === 2 && gp[1].total === 38 && gp[2].total === 30, 'grade progress (with money, time, measurement, geometry and money math)');
const oldL = { skills: {} }; E.migrateLearner(oldL); ok(oldL.grade === null && oldL.focus === 'all', 'migration adds grade fields');

// grade-aware placement
const runPlacement = (grade, answer) => { const q = E.newPlacement(grade); let g2 = 0; while (!q.done && g2++ < 60) E.placementRecord(q, answer(q.current, q.answers.length)); return q; };
const g5strong = runPlacement('5', () => 1);
ok(g5strong.passed[0] === 'AS15' && g5strong.passed.includes('F508') && g5strong.passed.includes('GE03') && g5strong.items <= E.PLACEMENT_MAX_ITEMS, 'grade 5 strong starts high and also checks the strands: ' + g5strong.passed.join());
// a strand spot check: exactly 2 questions; 2 of 2 counts as known
{ const sp = E.newPlacement('2'); sp.queue = ['MY02']; sp.current = 'MY02'; sp.passed = ['PV04']; E.placementRecord(sp, true); ok(E.placementRecord(sp, true) === 'pass' && sp.items === 2, 'strand spot check passes in 2');
  const sq = E.newPlacement('2'); sq.queue = ['MS01']; sq.current = 'MS01'; sq.passed = ['PV04']; E.placementRecord(sq, true); ok(E.placementRecord(sq, false) === 'fail' && sq.items === 2 && !sq.probe, '1 of 2 means practice it, with no follow-up'); }
const g5weak = runPlacement('5', (a) => (E.gradeOf(a) <= 2 ? 1 : 0));
ok(g5weak.failed[0] === 'AS15' && g5weak.passed.includes('PV04'), 'grade 5 child who misses the first anchor drops down: ' + g5weak.passed.join());
const g1 = runPlacement('1', () => 0);
ok(g1.passed.length === 0 && g1.items <= 12, 'grade 1 child who misses the Grade 1 anchors stops early: ' + g1.items + ' items');

// ---------- Discovery Adventure (Tenbright 2.0, Phase 2) ----------
const walk = (grade, answer, opts) => {
  const q = E.newPlacement(grade, opts); let g = 0; const rests = []; const asked = [];
  while (!q.done && g++ < 80) {
    const nx = E.placementNext(q); const right = !!answer(nx.skill, nx.probe); asked.push((nx.probe ? '?' : '') + nx.skill);
    if (nx.probe) E.placementProbeRecord(q, right); else E.placementRecord(q, right, { format: g % 2 ? 'number' : 'choice', response: right ? '7' : '99', answer: '7' });
    if (E.placementRestDue(q)) { rests.push(q.decided); E.placementRested(q); }
  }
  return { q, rests, asked };
};
// every walk checks a story problem
ok(['1', '2', '3', '4', '5', 'other'].every((g) => E.placementPlan(g).queue.some((a) => E.STORY_ANCHORS.includes(a))), 'every walk includes a story check');
// slips: one away, ten away, a hundred away, swapped digits; not exact, not far off
ok(E.isSlip('78', '79') && E.isSlip('78', '88') && E.isSlip('178', '78') && E.isSlip('78', '87') && !E.isSlip('78', '78') && !E.isSlip('78', '35') && !E.isSlip('3/4', '4/3'), 'slip detection');
// a child who misses only stories: a reading follow-up, then a "reading" finding
const reader = walk('2', (s) => !E.STORY_ANCHORS.includes(s));
ok(reader.asked.includes('?AS05') && reader.q.failed.includes('WP02'), 'story miss gets a no-story follow-up: ' + reader.asked.join(' '));
ok(E.discoverySummary(reader.q).notes.some((n) => n.skill === 'WP02' && n.kind === 'reading'), 'reading finding');
// regrouping is the new step: AS07 missed, the skill underneath (AS06) right
const regroup = walk('2', (s) => E.gradeOf(s) <= 2 && s !== 'AS07');
const rn = E.discoverySummary(regroup.q).notes.find((n) => n.skill === 'AS07');
ok(rn && rn.kind === 'newStep' && rn.probeSkill === 'AS06', 'new step finding: ' + JSON.stringify(rn));
// a missed foundation: the skill underneath also missed
const found = walk('2', () => false);
ok(E.discoverySummary(found.q).notes.some((n) => n.kind === 'foundation'), 'foundation finding');
// a known mistake pattern explains the miss, so no follow-up is asked for it
const pq = E.newPlacement('2');
E.placementRecord(pq, false, { misconception: 'M07', response: '8', answer: '800' }); E.placementRecord(pq, false, { misconception: 'M07', response: '8', answer: '800' });
ok(!pq.probe && E.discoverySummary(pq).notes[0].kind === 'pattern' && E.discoverySummary(pq).notes[0].misconception === 'M07', 'pattern finding, no follow-up');
// follow-ups never change pass or fail, count toward the limit, and come before the next check
ok([reader, regroup, found].every((w) => w.q.items <= E.PLACEMENT_MAX_ITEMS), 'follow-ups stay within the question limit');
ok(regroup.q.passed.join() === walk('2', (s, p) => (p ? true : E.gradeOf(s) <= 2 && s !== 'AS07')).q.passed.join(), 'follow-up answers do not change the result');
// rest stops every 3 decided checks, never after the walk is done
ok(reader.rests.length >= 1 && reader.rests.every((d) => d % 3 === 0), 'rest stops: ' + reader.rests.join());
const rq = E.newPlacement('2'); [1, 1, 1, 1, 1, 1, 1, 1, 1].forEach((x) => E.placementRecord(rq, x));
ok(E.placementRestDue(rq) && E.placementStage(rq) === 2, 'rest due after 3 checks'); E.placementRested(rq); ok(!E.placementRestDue(rq), 'rest shown once');
// the walk is plain data, so it can be saved and resumed
const saved = JSON.parse(JSON.stringify(rq)); E.placementRecord(saved, true); ok(saved.current === rq.current && saved.items === rq.items + 1, 'walk resumes from saved data');
// gentle start: the parent said math feels hard, so the first check is an easier one
ok(E.newPlacement('3', { gentle: true }).current === 'C107' && E.newPlacement('3').current === 'PV04' && E.newPlacement('1', { gentle: true }).current === 'C107', 'gentle start');
// Phase 7 strands in the walk: two grade-matched checks (money or time, measuring or shapes), asked within the question limit
['1', '2', '3', '4', '5', 'other'].forEach((g) => {
  const sa = E.strandAnchors(g);
  ok(sa.length === 2 && sa.every((id) => ['market', 'clock', 'workshop', 'shapes'].includes(E.SKILLS[id].region)), g + ': two strand checks');
  ok(['market', 'clock'].includes(E.SKILLS[sa[0]].region) || ['market', 'clock'].includes(E.SKILLS[sa[1]].region), g + ': one money or time check');
  ok(sa.some((id) => ['workshop', 'shapes'].includes(E.SKILLS[id].region)), g + ': one measuring or shapes check');
  if (g !== 'other') ok(sa.every((id) => Math.abs(E.gradeOf(id) - Number(g)) <= 2), g + ': strand checks near the school grade: ' + sa.join());
  // a strong child and a middling child both get both strand checks, inside the limit
  for (const ans of [() => true, (k) => k !== 1]) {
    const q = E.newPlacement(g); let i = 0;
    while (!q.done && i++ < 80) { const nx = E.placementNext(q); if (nx.probe) E.placementProbeRecord(q, true); else E.placementRecord(q, ans(q.answers.length)); }
    const decided = q.passed.concat(q.failed);
    ok(sa.every((id) => decided.includes(id)) && q.items <= E.PLACEMENT_MAX_ITEMS, g + ': both strands decided: ' + decided.join());
  }
});
// the 29-question limit leaves room for both strands without dropping a core check: these were the checks pushed out at 25
{ const full = (g, f) => { const q = E.newPlacement(g); let i = 0; while (!q.done && i++ < 90) { const nx = E.placementNext(q); if (nx.probe) E.placementProbeRecord(q, true); else E.placementRecord(q, f(q.answers.length)); } return q.passed.concat(q.failed); };
  ok(E.PLACEMENT_MAX_ITEMS === 29, 'walk limit 29');
  [['2', 'MU03', 'AS12'], ['3', 'MU03', 'AS12'], ['4', 'F508', 'F413'], ['5', 'F511', 'F418']].forEach(([g, strongLast, midLast]) => {
    const st = full(g, () => true), md = full(g, (k) => k !== 1);
    ok(st.includes(strongLast) && E.strandAnchors(g).every((x) => st.includes(x)), g + ': strong walk keeps ' + strongLast + ' and both strands: ' + st.join());
    ok(md.includes(midLast) && E.strandAnchors(g).every((x) => md.includes(x)), g + ': middling walk keeps ' + midLast + ' and both strands: ' + md.join());
  }); }
// strands are held back: the core number checks come first
const sw = walk('2', () => true);
ok(sw.asked.indexOf('MY02') > sw.asked.indexOf('AS12') && sw.asked.indexOf('MS01') > sw.asked.indexOf('AS12'), 'core checks first: ' + sw.asked.join(' '));
// a child who passes nothing is not asked the strands
const none1 = walk('1', () => false);
ok(!none1.asked.some((x) => ['TM01', 'GE01'].includes(x.replace('?', ''))) || none1.q.passed.length > 0, 'no strand checks after passing nothing: ' + none1.asked.join(' '));
// a passed strand check credits only its own strand
const LS = E.newLearner('S', 2017, 'pv', '4');
E.applyPlacement(LS, ['MY04'], now);
ok(['MY01', 'MY02', 'MY03', 'MY04'].every((id) => LS.skills[id].status === 'placed'), 'money strand placed');
ok(LS.skills.AS10.status !== 'placed' && LS.skills.AS07.status !== 'placed' && LS.skills.PV07.status !== 'placed', 'coins do not vouch for subtraction or skip-counting');
// a walk saved before this change (no strand checks in its queue) still resumes and finishes
const oldWalk = JSON.parse(JSON.stringify(E.newPlacement('2'))); oldWalk.queue = oldWalk.queue.filter((a) => !E.strandAnchors('2').includes(a));
let og = 0; while (!oldWalk.done && og++ < 60) E.placementRecord(oldWalk, true); ok(oldWalk.done && oldWalk.items <= E.PLACEMENT_MAX_ITEMS, 'old saved walk finishes');
// the old two-argument call still works
const old2 = E.newPlacement(); E.placementRecord(old2, true); ok(old2.items === 1, 'two-argument record');

// understanding states from the evidence
const stOf = (attempts, extra) => Object.assign(E.newLearner('U').skills.AS07, { status: 'practiced', attempts }, extra || {});
const at = (n, right, hint) => Array.from({ length: n }, (_, i) => ({ correct: i < right, hint: hint || 0, format: 'number' }));
ok(E.understanding(stOf([])) === 'needsCheck' && E.understanding(Object.assign(E.newLearner('U').skills.F515)) === 'notStarted', 'no evidence');
ok(E.understanding(stOf(at(10, 10))) === 'understands', 'understands');
ok(E.understanding(stOf(at(10, 7))) === 'partly', 'partly');
ok(E.understanding(stOf(at(10, 2))) === 'notYet', 'not yet');
ok(E.understanding(stOf(at(2, 0).concat(at(5, 5, 3)))) === 'withHelp', 'with help');
ok(E.understanding(stOf(at(10, 10), { why: { right: 0, total: 3 } })) === 'cantExplainYet', 'right but not explained yet');
ok(E.understanding(stOf([], { status: 'placed' })) === 'understands', 'shown in the walk');
const W = E.newLearner('W'); E.recordWhy(W.skills, 'AS07', true); E.recordWhy(W.skills, 'AS07', false); ok(W.skills.AS07.why.right === 1 && W.skills.AS07.why.total === 2, 'why tally');
ok(E.UNDERSTANDING.length === 7, 'seven states');
const Lg5 = E.newLearner('P', 2015, 'times', '5'); E.applyPlacement(Lg5, g5strong.passed, now);
ok(Lg5.skills.C101.status === 'placed' && Lg5.skills.F404.status === 'placed', 'placement credits every grade underneath');
// decimals: answers with or without trailing zeros, leading zeros or commas
const dItem = { answer: '0.5', predicted: {} };
ok(E.check(dItem, '.5').correct && E.check(dItem, '0.50').correct && !E.check(dItem, '5').correct, 'decimal answers');
ok(E.check({ answer: '37800', predicted: {} }, '37,800').correct, 'commas allowed');
// exact recomputation for the added skills that are not plain a op b
const R = E.makeRng(99);
for (let i = 0; i < 4000; i++) {
  for (const id of ['F401', 'F403', 'F407', 'F409', 'F410', 'F414', 'F419', 'F501', 'F502', 'F503', 'F504', 'F505', 'F508', 'F509', 'F510', 'F512', 'F301', 'F302', 'C110', 'F402', 'C108']) {
    const it = E.generate(id, R), A = it.answer;
    if (id === 'F401') { const n = Number(it.prompt.match(/in ([\d,]+)\?/)[1].replace(/,/g, '')), d = Number(it.prompt.match(/of the (\d)/)[1]); ok(String(n).split('').some((c, k, arr) => Number(c) === d && d * Math.pow(10, arr.length - 1 - k) === Number(A)), 'F401 ' + it.prompt); }
    if (id === 'F403') ok(Number(A) % it.base === 0 && Math.abs(Number(A) - it.n) <= it.base / 2 && (Math.abs(Number(A) - it.n) < it.base / 2 || Number(A) > it.n), 'F403 ' + it.prompt);
    if (id === 'F407') { const [a, b, q, rem] = it.divrem; ok(b * q + rem === a && rem < b && rem > 0, 'F407 ' + it.prompt); ok(Number(A) === (/\? R/.test(it.prompt) ? q : rem), 'F407 ans ' + it.prompt); }
    if (id === 'F409') { if (it.factorOf) { ok(it.factorOf % Number(A) === 0 && it.choices.filter((c) => it.factorOf % Number(c) === 0).length === 1, 'F409 ' + it.prompt); } }
    if (id === 'F410') { const n = Number(it.prompt.match(/(\d+)/)[1]); let f = 0; for (let k = 2; k < n; k++) if (n % k === 0) { f = k; break; } if (it.textChoices) ok(A === (f ? 'Composite' : 'Prime'), 'F410 ' + n); else ok(Number(A) === (f || n), 'F410 small ' + n); }
    if (it.signs) { const val = (s2) => (s2.includes('/') ? Number(s2.split('/')[0]) / Number(s2.split('/')[1]) : Number(s2.replace(/,/g, ''))); const x = val(it.a), y = val(it.b); ok(A === (x > y ? '>' : x < y ? '<' : '='), 'sign ' + id + ' ' + it.a + ' ' + it.b); }
    if (it.expr) ok(Number(A) === Function('return ' + it.expr)(), 'expr ' + it.expr);
    if (it.decVal) ok(Math.abs(Number(A) - it.decVal[0] / Math.pow(10, it.decVal[1])) < 1e-9, 'decVal ' + id + ' ' + it.prompt);
    if (it.dop) { const [x, y, op] = it.dop; ok(Math.abs(Number(A) * 100 - (op === '+' ? x + y : x - y)) < 1e-6, 'dop ' + it.prompt); const nums = it.prompt.match(/[\d.]+/g).map(Number); ok(Math.abs(Number(A) - (op === '+' ? nums[0] + nums[1] : nums[0] - nums[1])) < 1e-9, 'F508 prompt ' + it.prompt); }
    if (it.dmul) { const nums = it.prompt.match(/[\d.]+/g).map(Number); ok(Math.abs(Number(A) - nums[0] * nums[1]) < 1e-9, 'F509 ' + it.prompt); }
    if (it.ddiv) { const nums = it.prompt.match(/[\d.]+/g).map(Number); ok(Math.abs(Number(A) - nums[0] / nums[1]) < 1e-9, 'F510 ' + it.prompt); }
    if (id === 'F502') { const m = it.prompt.match(/([\d.]+) ([×÷]) ([\d,]+)/); const x = Number(m[1]), p2 = Number(m[3].replace(/,/g, '')); ok(Math.abs(Number(A) - (m[2] === '×' ? x * p2 : x / p2)) < 1e-9, 'F502 ' + it.prompt); }
    if (id === 'F503' && it.digitOf) { const [s2, p2] = it.digitOf; ok(Number(A) === Number(s2.split('.')[1][p2]), 'F503 ' + it.prompt); }
    if (id === 'F505') { const x = Number(it.prompt.match(/Round ([\d.]+)/)[1]), to = /whole/.test(it.prompt) ? 0 : /tenth/.test(it.prompt) ? 1 : 2; ok(Math.abs(Number(A) - Math.round(x * Math.pow(10, to) + 1e-9) / Math.pow(10, to)) < 1e-9, 'F505 ' + it.prompt); }
    if (it.frac && (id === 'F301' || id === 'F302' || id === 'F512')) ok(Number(A) === (/\?\//.test(it.prompt) ? it.frac[0] : it.frac[1]), 'frac ' + it.prompt);
    if (id === 'C108' && it.textChoices) { const n2 = it.prompt.match(/\d+/g).map(Number); ok(A === (n2[0] + n2[1] === n2[2] + n2[3] ? 'True' : 'False'), 'C108 ' + it.prompt); }
  }
}
// Fix Pip's mistake: the wrong answer really is the misconception's answer, the right reason is among the options
const RM = E.makeRng(321); let mistakeSkills = 0;
for (const id of E.SKILL_ORDER) {
  let any = false;
  for (let i = 0; i < 300; i++) {
    const m = E.makeMistake(id, RM); if (!m) break; any = true;
    ok(m.wrong !== m.answer && !E.check(m.base, m.wrong).correct && E.check(m.base, m.wrong).misconception === m.mis, 'mistake is the predicted misconception ' + id);
    ok(E.check(m.base, m.answer).correct, 'mistake answer correct ' + id);
    ok(m.options.length === 3 && m.options.filter((o) => o.k === m.mis).length === 1 && new Set(m.options.map((o) => o.k)).size === 3, 'mistake options ' + id);
    ok(m.prompt.includes(m.wrong), 'mistake shows Pip answer ' + id);
  }
  if (any) mistakeSkills++;
}
ok(mistakeSkills >= 90, 'Pip mistakes available for ' + mistakeSkills + ' skills');
// Lantern Line items sit inside the line and score exactly
const RL = E.makeRng(77);
for (const g of [1, 2, 3, 4, 5]) for (let i = 0; i < 2000; i++) {
  const li = E.lineItem(g, RL);
  ok(li.target > li.lo && li.target < li.hi, 'line target inside ' + JSON.stringify(li));
  ok(Math.abs(Number(eval(li.label.replace('/', '/'))) - li.target) < 1e-9, 'line label matches ' + li.label);
  ok(E.linePAE(li, li.target) === 0 && Math.abs(E.linePAE(li, li.hi) - (li.hi - li.target) / (li.hi - li.lo)) < 1e-12, 'PAE');
}
console.log('All checks passed: ' + checks + ' assertions across ' + E.SKILL_ORDER.length + ' skills × ' + N + ' generated items.');
