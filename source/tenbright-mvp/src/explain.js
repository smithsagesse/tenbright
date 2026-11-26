/* Tenbright explanations (Tenbright 2.0, Phase 3): turns a generated question into plain, child-sized words.
 *
 * explain(item) returns { meaning, say, check } or null:
 *   meaning  sentences that say what the numbers in the problem mean (shown before the steps)
 *   say      one entry per engine step (same count, same order), each saying what we do and why, in short
 *            sentences, ending with the same number sentence as the engine step, so pictures, Work it with Pip
 *            and the checks stay in step
 *   check    one sentence that checks the answer another way, or null
 * Every number here comes from the item the engine made; nothing is calculated that the engine did not already
 * decide, except place-value digits and the inverse sentence used for the check (both verified by the tests).
 * Writing rules: one idea per sentence, about 14 words at most, the action first and then its name,
 * "regroup" and "break a ten", never "borrow", no filler words.
 * Works in the browser (window.TBExplain) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  const UNIT = { ones: 'one', tens: 'ten', hundreds: 'hundred', thousands: 'thousand' };
  const PLACES = ['thousands', 'hundreds', 'tens', 'ones'];
  const NEXT_UP = { ones: 'tens', tens: 'hundreds', hundreds: 'thousands' };
  // "1 ten", "3 tens", "0 ones"
  const count = (n, place) => n + ' ' + (n === 1 ? UNIT[place] : place);
  const digitsOf = (n, places) => { const s = String(n).padStart(places, '0'); return s.split('').map(Number); };
  // 46 -> "4 tens and 6 ones"; 40 -> "4 tens"; 7 -> "7 ones"; 305 -> "3 hundreds and 5 ones"
  function placePhrase(n) {
    const d = digitsOf(n, String(n).length), names = PLACES.slice(4 - d.length);
    const parts = d.map((x, i) => (x ? count(x, names[i]) : null)).filter(Boolean);
    if (!parts.length) return '0';
    return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }
  const inverse = (op) => (op === '+' ? '−' : '+');

  // ---------- column adding and subtracting (engine addItem / subItem) ----------
  function columnAdd(it) {
    const { a, b } = it, places = it.model.places, da = digitsOf(a, places), db = digitsOf(b, places);
    const names = PLACES.slice(4 - places), say = [];
    let carry = 0, prev = null;
    for (let i = places - 1; i >= 0; i--) {
      const p = names[i], s = da[i] + db[i] + carry;
      const sentence = da[i] + ' + ' + db[i] + (carry ? ' + 1' : '') + ' = ' + s;
      if (i === places - 1) say.push('Start with the ' + p + '. Add ' + p + ' to ' + p + '. ' + sentence);
      else if (carry) say.push(prev.s + ' ' + prev.p + ' is 1 ' + UNIT[p] + ' and ' + count(prev.s - 10, prev.p) + '. Write ' + (prev.s - 10) + ' in the ' + prev.p + ' place. The new ' + UNIT[p] + ' moves to the ' + p + '. Now add the ' + p + ', with the new ' + UNIT[p] + '. ' + sentence);
      else say.push('Now the ' + p + '. ' + sentence);
      prev = { s, p };
      carry = s > 9 ? 1 : 0;
    }
    const top = names[0];
    say.push((carry ? prev.s + ' ' + top + ' is 1 ' + UNIT[NEXT_UP[top]] + ' and ' + count(prev.s - 10, top) + '. ' : '') + 'Put all the places together. ' + a + ' + ' + b + ' = ' + (a + b));
    return say;
  }
  function columnSub(it) {
    const { a, b } = it, places = it.model.places, da = digitsOf(a, places), db = digitsOf(b, places);
    const names = PLACES.slice(4 - places), say = [], lent = new Set();
    for (let i = places - 1; i >= 0; i--) {
      const p = names[i], first = i === places - 1;
      let broke = false;
      if (da[i] < db[i]) {
        const up = names[i - 1];
        if (!up || da[i - 1] <= 0) return null; // across a zero: explained in a later slice
        da[i - 1] -= 1; da[i] += 10; lent.add(up); broke = true;
        say.push('Look at the ' + p + '. Can we take ' + db[i] + ' away from ' + (da[i] - 10) + '? No, there are not enough ' + p + '. Break one ' + UNIT[up] + ' into 10 ' + p + '. Now there are ' + count(da[i - 1], up) + ' and ' + count(da[i], p) + '. This is called regrouping.');
      }
      const sentence = da[i] + ' − ' + db[i] + ' = ' + (da[i] - db[i]);
      if (broke) say.push('Take away the ' + p + '. ' + sentence);
      else if (lent.has(p)) say.push('Now the ' + p + '. We used one ' + UNIT[p] + ', so there are ' + count(da[i], p) + ' now. ' + sentence);
      else if (first) say.push('Start with the ' + p + '. Take ' + p + ' from ' + p + '. ' + sentence);
      else say.push('Now the ' + p + '. ' + sentence);
    }
    say.push('Put all the places together. ' + a + ' − ' + b + ' = ' + (a - b));
    return say;
  }
  function column(it) {
    if (!it.model || (it.model.type !== 'add' && it.model.type !== 'sub') || typeof it.a !== 'number' || typeof it.b !== 'number') return null;
    const say = it.model.type === 'add' ? columnAdd(it) : columnSub(it);
    if (!say) return null;
    const verb = it.op === '+' ? 'add' : 'subtract';
    return {
      meaning: [it.a + ' is ' + placePhrase(it.a) + '.', it.b + ' is ' + placePhrase(it.b) + '.', 'We ' + verb + ' one place at a time, starting with the ones.'],
      say,
      check: 'Check: ' + it.answer + ' ' + inverse(it.op) + ' ' + it.b + ' = ' + it.a + '.'
    };
  }

  // ---------- Grade 1 ----------
  const B = {
    C101(it) {
      const n = it.a, c = n + 1;
      let s0;
      if (n % 10 !== 9) s0 = 'One more than ' + n + ' is the next number when we count.';
      else if (n === 99) s0 = 'The ones are at 9. One more one makes 10 ones, and that makes a new ten. Now there are 10 tens. 10 tens make one hundred.';
      else if (n === 109) s0 = 'The ones are at 9. One more one makes 10 ones. 10 ones make a new ten.';
      else s0 = 'The ones are at 9. One more one makes 10 ones. 10 ones make a new ten. The ones start again at 0.';
      return { meaning: ['We want the number that comes after ' + n + '.', '"After" means one more.'], say: [s0, 'So we add 1. ' + n + ' + 1 = ' + c], check: 'Check: ' + c + ' − 1 = ' + n + ', so ' + c + ' comes right after ' + n + '.' };
    },
    C102(it) {
      const { a, b } = it, c = a + b, big = Math.max(a, b), small = Math.min(a, b);
      const s0 = a >= b ? 'Put ' + a + ' in your head. Then count on ' + b + ' more, one finger at a time.' : b + ' is bigger, so start at ' + b + '. Then count on ' + a + ' more, one finger at a time.';
      return { meaning: [a + ' + ' + b + ' means we start with ' + a + ' and get ' + b + ' more.'], say: [s0, 'The last number you say is the answer. ' + a + ' + ' + b + ' = ' + c], check: 'Check: ' + c + ' − ' + small + ' = ' + big + '.' };
    },
    C103(it) {
      const { a, b } = it, c = a - b;
      return { meaning: [a + ' − ' + b + ' means we have ' + a + ' and take ' + b + ' away.'], say: ['Start with ' + a + '. Cross out ' + b + ' of them.', 'Count the ones that are left. ' + a + ' − ' + b + ' = ' + c], check: 'Check: ' + c + ' + ' + b + ' = ' + a + '.' };
    },
    C104(it) {
      const x = it.b, c = 10 - x;
      return { meaning: ['We have ' + x + '. We want to make 10.', 'How many more do we need?'], say: ['A ten-frame has 10 boxes. ' + x + ' boxes are full. Count the empty boxes.', 'The empty boxes are what 10 still needs. 10 − ' + x + ' = ' + c], check: 'Check: ' + x + ' + ' + c + ' = 10.' };
    },
    C105(it) {
      const { a, b } = it, c = a + b, s = Math.min(a, b);
      if (a === b) return { meaning: [a + ' + ' + a + ' is a double: the same number two times.'], say: ['Doubles are like twins. Picture ' + a + ' and ' + a + ' more.', 'Put the twins together. ' + a + ' + ' + a + ' = ' + c], check: 'Check: ' + c + ' − ' + a + ' = ' + a + '.' };
      const big = Math.max(a, b);
      return { meaning: [a + ' + ' + b + ' is almost a double.', 'A double is the same number two times.'], say: [big + ' is close to ' + s + '. Start with the double you know. ' + s + ' + ' + s + ' = ' + 2 * s + '.', big + ' is one more than ' + s + '. So add one more. ' + 2 * s + ' + 1 = ' + c], check: 'Check: ' + c + ' − ' + b + ' = ' + a + '.' };
    },
    C106(it) {
      const m = /make 10: (\d+) \+ (\d+) = 10/.exec(it.steps[0] || ''), xs = (it.model && it.model.xs) || [];
      if (!m || xs.length !== 3) return null;
      const x = +m[1], y = +m[2], z = Number(it.answer) - 10, first = xs[0] + xs[1];
      return { meaning: ['We add three numbers: ' + xs.join(', ') + '.', 'We can add them in any order.'], say: ['Look for two numbers that make 10. ' + x + ' and ' + y + ' make 10. ' + x + ' + ' + y + ' = 10.', 'Now add the last number to 10. 10 + ' + z + ' = ' + it.answer], check: 'Check in order: ' + xs[0] + ' + ' + xs[1] + ' = ' + first + ', and ' + first + ' + ' + xs[2] + ' = ' + it.answer + '.' };
    },
    C107(it) {
      const t = it.a, x = it.b, c = t - x;
      return { meaning: [x + ' + ? = ' + t + ' asks: ' + x + ' and how many more make ' + t + '?'], say: ['Start at ' + x + '. Count on until you reach ' + t + '. Count how many numbers you said.', 'Taking ' + x + ' away from ' + t + ' gives the same answer. ' + t + ' − ' + x + ' = ' + c], check: 'Check: ' + x + ' + ' + c + ' = ' + t + '.' };
    },
    C108(it) {
      const m = it.model || {};
      const meaning = ['The = sign means both sides are worth the same amount.'];
      if (m.d !== '?') {
        const L = m.a + m.b, R = m.c + m.d;
        return { meaning: meaning.concat(['Let\'s work out each side.']), say: ['Work out the left side. ' + m.a + ' + ' + m.b + ' = ' + L + '.', 'Now the right side. ' + m.c + ' + ' + m.d + ' = ' + R + '.', L === R ? 'Both sides are ' + L + '. They are the same, so it is true.' : L + ' and ' + R + ' are not the same, so it is false.'], check: null };
      }
      const s = m.a + m.b, d = s - m.c;
      return { meaning, say: ['Work out the left side first. ' + m.a + ' + ' + m.b + ' = ' + s + '.', 'So the right side must make ' + s + ' too. What goes with ' + m.c + ' to make ' + s + '? ' + s + ' − ' + m.c + ' = ' + d], check: 'Check: ' + m.c + ' + ' + d + ' = ' + s + ', and ' + m.a + ' + ' + m.b + ' = ' + s + '.' };
    },
    C109(it) {
      const m = it.model, t = m.t, o = m.o, n = 10 * t + o;
      if (/^How many tens/.test(it.prompt)) {
        return { meaning: [n + ' has two digits. A digit is one of the numbers 0 to 9.'], say: ['The left digit tells how many tens. The right digit tells how many ones.', n + ' is ' + count(t, 'tens') + ' and ' + count(o, 'ones') + '. So there are ' + count(t, 'tens') + '.'], check: null };
      }
      return { meaning: ['A rod of beads is 1 ten. A loose bead is 1 one.'], say: [t + ' rods of ten make ' + 10 * t + '. ' + count(t, 'tens') + ' is ' + 10 * t + '.', 'Now add the loose ones. ' + 10 * t + ' + ' + o + ' = ' + n], check: 'Check: ' + n + ' has ' + t + ' in the tens place and ' + o + ' in the ones place.' };
    },
    C110(it) {
      const a = Number(it.model.a), b = Number(it.model.b), ta = Math.floor(a / 10), tb = Math.floor(b / 10);
      const last = it.steps[it.steps.length - 1];
      let s0 = 'Look at the tens first. ' + a + ' has ' + count(ta, 'tens') + '. ' + b + ' has ' + count(tb, 'tens') + '.';
      if (ta === tb) s0 += ' The tens are the same, so look at the ones.';
      let s1;
      if (a === b) s1 = 'The tens and the ones are the same, so the numbers are equal. ' + last;
      else { const big = Math.max(a, b); s1 = big + ' has more ' + (ta === tb ? 'ones' : 'tens') + ', so ' + big + ' is greater. ' + last; }
      return { meaning: ['We compare ' + a + ' and ' + b + '.', 'The open side of > or < faces the bigger number.'], say: [s0, s1], check: null };
    },
    C111(it) {
      const n = it.a, up = it.op === '+', c = Number(it.answer), t = Math.floor(n / 10), o = n % 10;
      return { meaning: ['10 ' + (up ? 'more' : 'less') + ' than ' + n + ' means ' + (up ? 'add' : 'take away') + ' one ten.'], say: [n + ' is ' + count(t, 'tens') + ' and ' + count(o, 'ones') + '. ' + (up ? 'Adding' : 'Taking away') + ' one ten changes only the tens. The ones stay ' + o + '.', n + ' ' + it.op + ' 10 = ' + c], check: 'Check: ' + c + ' ' + inverse(it.op) + ' 10 = ' + n + '.' };
    },
    C112: column,
    C113: column,
    C114(it) {
      const { a, b } = it, c = Number(it.answer), add = it.op === '+';
      return { meaning: ['First, picture the story in your head.'], say: [add ? 'Finding more makes the group bigger. So we add.' : 'Giving some away leaves fewer. So we subtract.', 'We start with ' + a + '. Then ' + b + (add ? ' more come.' : ' go away.') + ' ' + a + ' ' + it.op + ' ' + b + ' = ' + c], check: 'Check: ' + c + ' ' + inverse(it.op) + ' ' + b + ' = ' + a + '.' };
    }
  };
  function explain(item) {
    // Fix Pip's mistake questions show Pip's own wrong work, so they keep the engine's steps
    if (!item || !item.steps || item.format === 'mistake') return null;
    const f = B[item.skill];
    if (!f) return null;
    let x = null;
    try { x = f(item); } catch (e) { x = null; }
    if (!x || !x.say || x.say.length !== item.steps.length) return null;
    // safety net: a missing value never reaches a child; the engine's steps are used instead
    const all = [].concat(x.meaning || [], x.say, x.check ? [x.check] : []);
    if (all.some((t) => typeof t !== 'string' || /undefined|NaN|null|\[object/.test(t))) return null;
    return x;
  }
  const api = { explain, placePhrase, SKILLS: Object.keys(B) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TBExplain = api;
})(typeof window !== 'undefined' ? window : globalThis);
