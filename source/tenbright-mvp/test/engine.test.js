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

// graph integrity: every prerequisite exists and appears earlier in the order or in another strand without cycles
E.SKILL_ORDER.forEach((id) => E.SKILLS[id].prereqs.forEach((p) => ok(E.SKILLS[p], id + ' has unknown prereq ' + p)));
E.SKILL_ORDER.forEach((id) => ok(!E.ancestors(id).has(id), 'cycle at ' + id));
ok(E.SKILL_ORDER.filter((id) => !E.SKILLS[id].strategy).length === 102, '102 core skills');

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
ok(per.join() === '14,31,24,19,15', 'grade split ' + per.join());
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
ok(gp.length === 5 && gp[1].grade === 2 && gp[1].total === 31 && gp[2].total === 24, 'grade progress');
const oldL = { skills: {} }; E.migrateLearner(oldL); ok(oldL.grade === null && oldL.focus === 'all', 'migration adds grade fields');

// grade-aware placement
const runPlacement = (grade, answer) => { const q = E.newPlacement(grade); let g2 = 0; while (!q.done && g2++ < 60) E.placementRecord(q, answer(q.current, q.answers.length)); return q; };
const g5strong = runPlacement('5', () => 1);
ok(g5strong.passed[0] === 'AS15' && g5strong.passed.includes('F511') && g5strong.items <= E.PLACEMENT_MAX_ITEMS, 'grade 5 strong starts high: ' + g5strong.passed.join());
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
ok([reader, regroup, found].every((w) => w.q.items <= E.PLACEMENT_MAX_ITEMS), 'follow-ups stay within 25 questions');
ok(regroup.q.passed.join() === walk('2', (s, p) => (p ? true : E.gradeOf(s) <= 2 && s !== 'AS07')).q.passed.join(), 'follow-up answers do not change the result');
// rest stops every 3 decided checks, never after the walk is done
ok(reader.rests.length >= 1 && reader.rests.every((d) => d % 3 === 0), 'rest stops: ' + reader.rests.join());
const rq = E.newPlacement('2'); [1, 1, 1, 1, 1, 1, 1, 1, 1].forEach((x) => E.placementRecord(rq, x));
ok(E.placementRestDue(rq) && E.placementStage(rq) === 2, 'rest due after 3 checks'); E.placementRested(rq); ok(!E.placementRestDue(rq), 'rest shown once');
// the walk is plain data, so it can be saved and resumed
const saved = JSON.parse(JSON.stringify(rq)); E.placementRecord(saved, true); ok(saved.current === rq.current && saved.items === rq.items + 1, 'walk resumes from saved data');
// gentle start: the parent said math feels hard, so the first check is an easier one
ok(E.newPlacement('3', { gentle: true }).current === 'C107' && E.newPlacement('3').current === 'PV04' && E.newPlacement('1', { gentle: true }).current === 'C107', 'gentle start');
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
