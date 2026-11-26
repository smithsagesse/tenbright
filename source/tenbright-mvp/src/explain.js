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
  // ---------- Grade 2 ----------
  const lastEq = (s) => /(\d+) ([+−×÷-]) (\d+) = (\d+)\.?$/.exec(s || '');
  const placeOf = (s) => ((/(hundreds|tens|ones)/.exec(s || '') || [])[1]);
  Object.assign(B, {
    PV01(it) {
      const t = it.model.t, o = it.model.o, n = Number(it.answer);
      if (it.steps.length !== 3 || o < 10) return null;
      return { meaning: ['We have ' + count(t, 'tens') + ' and ' + count(o, 'ones') + '.', '10 ones can make 1 ten.'], say: ['Look at the ones. There are ' + o + '. Ring 10 of them. 10 ones make 1 ten. ' + count(o - 10, 'ones') + (o - 10 === 1 ? ' is' : ' are') + ' left.', 'Put the new ten with the other tens. Now there are ' + count(t + 1, 'tens') + ' and ' + count(o - 10, 'ones') + '.', count(t + 1, 'tens') + ' and ' + count(o - 10, 'ones') + ' make ' + n + '.'], check: 'Check: ' + 10 * t + ' + ' + o + ' = ' + n + '.' };
    },
    PV02(it) {
      const h = it.model.h, t = it.model.t, n = Number(it.answer);
      if (it.steps.length !== 3 || t < 10) return null;
      return { meaning: ['We have ' + count(h, 'hundreds') + ' and ' + count(t, 'tens') + '.', '10 tens can make 1 hundred.'], say: ['Look at the tens. There are ' + t + '. Ring 10 of them. 10 tens make 1 hundred. ' + count(t - 10, 'tens') + (t - 10 === 1 ? ' is' : ' are') + ' left.', 'Put the new hundred with the other hundreds. Now there are ' + count(h + 1, 'hundreds') + ' and ' + count(t - 10, 'tens') + '.', count(h + 1, 'hundreds') + ' and ' + count(t - 10, 'tens') + ' make ' + n + '.'], check: 'Check: ' + 100 * h + ' + ' + 10 * t + ' = ' + n + '.' };
    },
    PV03(it) {
      const n = Number(it.answer), h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
      if (it.format === 'build') return { meaning: ['On the soroban, a top bead is worth 5. Each bottom bead is worth 1.'], say: [n + ' is ' + count(h, 'hundreds') + ', ' + count(t, 'tens') + ' and ' + count(o, 'ones') + '. Show ' + h + ' on the hundreds rod, ' + t + ' on the tens rod and ' + o + ' on the ones rod.'], check: null };
      if (it.steps.length !== 4) return null;
      return { meaning: ['A flat square is 1 hundred. A long rod is 1 ten. A small cube is 1 one.'], say: ['Count the flat squares. ' + count(h, 'hundreds') + ' is ' + 100 * h + '.', 'Count the long rods. ' + count(t, 'tens') + ' is ' + 10 * t + '.', 'Count the small cubes. ' + count(o, 'ones') + ' is ' + o + '.', 'Put them together: ' + 100 * h + ', ' + 10 * t + ' and ' + o + ' make ' + n + '.'], check: 'Check: ' + n + ' is ' + placePhrase(n) + '.' };
    },
    PV04(it) {
      const n = it.highlight && it.highlight.n, place = placeOf(it.steps[0]), d = (/The (\d) is in/.exec(it.steps[0]) || [])[1];
      if (!n || !place || d === undefined) return null;
      return { meaning: ['The place of a digit tells how much it is worth.'], say: ['Look at where the ' + d + ' sits in ' + n + '. It is in the ' + place + ' place.', 'So the ' + d + ' is worth ' + count(+d, place) + '. That is ' + it.answer + '.'], check: 'Check: ' + n + ' is ' + placePhrase(n) + '.' };
    },
    PV05(it) {
      const n = Number(it.answer), h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
      const parts = it.prompt.replace(/ = \?$/, '').split(' + ').map(Number);
      if (parts.some((x) => !Number.isFinite(x)) || it.steps.length !== 2) return null;
      return { meaning: ['Each part is one place: hundreds, tens or ones.'], say: [parts.map((x) => x + ' is ' + placePhrase(x) + '.').join(' ') + (t === 0 ? ' There are no tens.' : ''), 'Write one digit for each place: ' + h + ', ' + t + ', ' + o + '. That makes ' + n + '.'], check: 'Check: ' + n + ' is ' + placePhrase(n) + '.' };
    },
    PV06(it) {
      const w = (/^Type the number: (.+)\.$/.exec(it.prompt) || [])[1], n = Number(it.answer);
      if (!w) return null;
      const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
      return { meaning: ['A number name tells how many hundreds, tens and ones.'], say: ['"' + w + '" means ' + count(h, 'hundreds') + ', ' + count(t, 'tens') + ' and ' + count(o, 'ones') + '.' + (t === 0 ? ' There are no tens, so the tens place gets a 0.' : ''), 'Write the digits in order: ' + h + ', ' + t + ', ' + o + '. That is ' + n + '.'], check: null };
    },
    PV07(it) {
      const m = lastEq(it.steps[1]), s = /Each jump adds (\d+)/.exec(it.steps[0]);
      if (!m || !s) return null;
      return { meaning: ['Counting by ' + s[1] + 's means each number is ' + s[1] + ' more than the one before.'], say: ['Look at the pattern. Each jump adds ' + s[1] + '.', 'So add ' + s[1] + ' to the last number. ' + m[1] + ' + ' + m[3] + ' = ' + m[4]], check: 'Check: ' + m[4] + ' − ' + m[1] + ' = ' + m[3] + '.' };
    },
    PV08(it) {
      const n = Number(it.answer), h = Math.floor(n / 100), o = n % 10;
      if (!/no tens/.test(it.steps[0])) return null;
      return { meaning: ['Each place gets one digit: hundreds, tens and ones.'], say: ['There are ' + count(h, 'hundreds') + ' and ' + count(o, 'ones') + '. There are no tens. So the tens place holds a 0.', 'Write ' + h + ', then 0, then ' + o + '. That is ' + n + '.'], check: 'Check: without the 0, it would say ' + h + o + ', a different number.' };
    },
    PV09(it) {
      const m = it.model, n = 100 * m.h + 10 * m.t + m.o, all = 10 * m.h + m.t;
      if (!/Each hundred/.test(it.steps[1] || '')) return null;
      return { meaning: ['A hundred is the same as 10 tens.'], say: [n + ' has ' + count(m.h, 'hundreds') + ' and ' + count(m.t, 'tens') + '.', 'Each hundred is 10 tens. ' + count(m.h, 'hundreds') + ' is ' + 10 * m.h + ' tens. With ' + count(m.t, 'tens') + ' more, that makes ' + all + ' tens.'], check: 'Check: ' + all + ' tens is ' + 10 * all + ', and ' + 10 * all + ' + ' + m.o + ' = ' + n + '.' };
    },
    PV10(it) {
      const a = Number(it.model.a), b = Number(it.model.b), last = it.steps[it.steps.length - 1];
      const da = digitsOf(a, 3), db = digitsOf(b, 3), names = ['hundreds', 'tens', 'ones'];
      let s0 = 'Look at the hundreds first. ' + a + ' has ' + count(da[0], 'hundreds') + '. ' + b + ' has ' + count(db[0], 'hundreds') + '.';
      let k = 0;
      if (da[0] === db[0]) { k = 1; s0 += ' They are the same, so look at the tens. ' + a + ' has ' + count(da[1], 'tens') + '. ' + b + ' has ' + count(db[1], 'tens') + '.'; }
      if (k === 1 && da[1] === db[1]) { k = 2; s0 += ' The tens are the same too, so look at the ones.'; }
      const s1 = a === b ? 'Every place is the same, so the numbers are equal. ' + last : Math.max(a, b) + ' has more ' + names[k] + ', so ' + Math.max(a, b) + ' is greater. ' + last;
      return { meaning: ['We compare ' + a + ' and ' + b + '.', 'The open side of > or < faces the bigger number.'], say: [s0, s1], check: null };
    },
    PV11(it) {
      const m = it.model, k = m.arrowAt, c = Number(it.answer);
      if (it.steps.length !== 3 || typeof k !== 'number') return null;
      return { meaning: ['A number line shows numbers in order, with equal jumps.'], say: ['The line starts at ' + m.from + '. Each jump is ' + m.step + '.', 'Count the jumps to the arrow. There are ' + k + '. ' + k + ' jumps of ' + m.step + ' is ' + k * m.step + '.', 'Start at ' + m.from + ' and add the jumps. ' + m.from + ' + ' + k * m.step + ' = ' + c], check: 'Check: count by ' + m.step + 's from ' + m.from + ' and land on ' + c + '.' };
    },
    PV12(it) {
      const n = it.a, step = it.b, up = it.op === '+', c = Number(it.answer), place = placeOf(it.steps[0]);
      if (!place || it.steps.length !== 2) return null;
      return { meaning: [step + ' ' + (up ? 'more' : 'less') + ' than ' + n + ' means ' + (up ? 'add' : 'take away') + ' one ' + UNIT[place] + '.'], say: [n + ' is ' + placePhrase(n) + '. ' + (up ? 'Adding' : 'Taking away') + ' one ' + UNIT[place] + ' changes only the ' + place + ' digit.', 'The ' + place + ' digit goes ' + (up ? 'up' : 'down') + ' by 1. The other digits stay the same. That makes ' + c + '.'], check: 'Check: ' + c + ' ' + (up ? '−' : '+') + ' ' + step + ' = ' + n + '.' };
    },
    AS01(it) {
      const { a, b } = it, c = Number(it.answer), add = it.op === '+';
      const s0 = add ? (a >= b ? 'Put ' + a + ' in your head. Count on ' + b + ' more, one at a time.' : b + ' is bigger, so start at ' + b + '. Count on ' + a + ' more, one at a time.') : 'Put ' + a + ' in your head. Count back ' + b + ', one at a time.';
      return { meaning: [add ? 'Adding means getting more.' : 'Taking away means some go away.'], say: [s0, 'The number you stop on is the answer. ' + a + ' ' + it.op + ' ' + b + ' = ' + c], check: 'Check: ' + c + ' ' + inverse(it.op) + ' ' + b + ' = ' + a + '.' };
    },
    AS02(it) {
      const m = /Take (\d+) from the (\d+) to make 10/.exec(it.steps[0]), c = Number(it.answer);
      if (!m) return null;
      const k = +m[1], src = +m[2], big = it.a === src ? it.b : it.a;
      return { meaning: ['Making a ten first makes adding easier.'], say: [big + ' needs ' + k + ' more to make 10. Take ' + k + ' from the ' + src + '. Now ' + big + ' becomes 10, and ' + src + ' becomes ' + (src - k) + '.', 'Now add 10 and ' + (src - k) + '. 10 + ' + (src - k) + ' = ' + c], check: 'Check: ' + c + ' − ' + src + ' = ' + big + '.' };
    },
    AS03(it) {
      const c = Number(it.answer), m = lastEq(it.steps[1]);
      if (!m) return null;
      const s = +m[1], x = +m[3];
      if (/^If /.test(it.prompt)) return { meaning: ['Adding and taking away are a family. They use the same three numbers.'], say: ['Adding and taking away undo each other. ' + x + ' and ' + c + ' make ' + s + '.', 'So we take ' + x + ' away from ' + s + '. ' + s + ' − ' + x + ' = ' + c], check: 'Check: ' + x + ' + ' + c + ' = ' + s + '.' };
      return { meaning: [x + ' + ? = ' + s + ' asks: what goes with ' + x + ' to make ' + s + '?'], say: ['We know the whole, ' + s + ', and one part, ' + x + '. The other part is missing.', 'Taking away finds the missing part. ' + s + ' − ' + x + ' = ' + c], check: 'Check: ' + x + ' + ' + c + ' = ' + s + '.' };
    },
    AS08(it) {
      const xs = (it.model && it.model.xs) || [], c = Number(it.answer);
      if (xs.length < 3 || it.steps.length !== 3) return null;
      const ones = xs.map((x) => x % 10), tens = xs.map((x) => Math.floor(x / 10));
      const so = ones.reduce((p, q) => p + q, 0), st = tens.reduce((p, q) => p + q, 0);
      return { meaning: ['We add ' + xs.length + ' numbers.', 'Add all the ones first, then all the tens.'], say: ['Add all the ones first. ' + ones.join(' + ') + ' = ' + so, 'Now add all the tens. ' + tens.join(' + ') + ' = ' + st + '. That is ' + st + ' tens, or ' + 10 * st + '.', 'The ' + so + ' ones are ' + placePhrase(so) + '. Put them with the tens. ' + 10 * st + ' + ' + so + ' = ' + c], check: null };
    },
    AS09(it) {
      const c = Number(it.answer);
      const mk = /Make (\d+) a friendly number: \d+ \+ (\d+) = (\d+)/.exec(it.steps[0] || '');
      if (mk && it.steps.length === 3) {
        const x = +mk[1], k = +mk[2], f = +mk[3], y = it.a === x ? it.b : it.a;
        return { meaning: ['A friendly number ends in 0. Friendly numbers are easy to add.'], say: [x + ' is close to ' + f + '. Give it ' + k + ' to make the friendly number ' + f + '. ' + x + ' + ' + k + ' = ' + f + '.', 'That ' + k + ' comes from ' + y + '. Now it is ' + (y - k) + '.', 'Add the new numbers. ' + f + ' + ' + (y - k) + ' = ' + c], check: 'The total stays the same, because we only moved ' + k + ' from one number to the other.' };
      }
      const g = /Give (\d+) from (\d+) to (\d+)/.exec(it.steps[0] || '');
      if (!g || it.steps.length !== 2) return null;
      const k = +g[1], y = +g[2], x = +g[3];
      return { meaning: ['A friendly number ends in 0. Friendly numbers are easy to add.'], say: [x + ' is close to ' + (x + k) + '. Give ' + k + ' from ' + y + ' to ' + x + '.', 'Now ' + x + ' + ' + k + ' = ' + (x + k) + ' and ' + y + ' − ' + k + ' = ' + (y - k) + '.'], check: 'The total stays the same, because we only moved ' + k + ' from one number to the other.' };
    },
    AS10(it) {
      const hops = (it.model && it.model.hops) || [], c = Number(it.answer);
      if (hops.length < 3 || it.steps.length !== hops.length) return null;
      const sizes = hops.slice(1).map((h, i) => h - hops[i]);
      const say = sizes.map((d, i) => (i === 0 ? 'Start at ' + hops[0] + '. Hop to the next ten, ' + hops[1] + '. That hop is ' + d + '.' : 'Then hop from ' + hops[i] + ' to ' + hops[i + 1] + '. That hop is ' + d + '.'));
      say.push('Add up the hops. ' + sizes.join(' + ') + ' = ' + c);
      return { meaning: ['How far apart are ' + hops[0] + ' and ' + hops[hops.length - 1] + '? Count up from the smaller number.'], say, check: 'Check: ' + hops[hops.length - 1] + ' − ' + hops[0] + ' = ' + c + '.' };
    },
    AS17(it) {
      const m = it.model;
      const ones = /the ones make (\d+)/.exec(it.prompt);
      if (/break a ten/.test(it.prompt) && it.steps.length === 1) {
        const ao = m.a % 10, bo = m.b % 10;
        return { meaning: ['10 ones are worth the same as 1 ten.'], say: ['There are ' + count(ao, 'ones') + ' on top. We need to take away ' + bo + '. That is not enough ones, so we trade 1 ten for 10 ones.'], check: null };
      }
      if (!ones) return null;
      const s = +ones[1];
      if (/Why do we write/.test(it.prompt) && it.steps.length === 2) return { meaning: ['10 ones are worth the same as 1 ten.'], say: ['Ten ones are worth the same as one ten.', 'So ' + s + ' ones = 1 ten and ' + count(s - 10, 'ones') + '. The 1 ten goes in the tens place.'], check: null };
      if (it.steps.length === 2) return { meaning: ['10 ones are worth the same as 1 ten.'], say: [s + ' ones is 1 ten and ' + count(s - 10, 'ones') + '.', 'The 1 ten moves over to the tens place.'], check: null };
      return null;
    },
    MU01(it) {
      const n = it.model.n, c = Number(it.answer);
      if (it.steps.length === 1) return { meaning: ['Put the dots in pairs, two by two.'], say: [/left over/.test(it.steps[0]) ? 'Make pairs of dots. One dot has no partner. So ' + n + ' is odd.' : 'Make pairs of dots. Every dot has a partner. So ' + n + ' is even.'], check: null };
      if (it.steps.length !== 2 || !Number.isFinite(c)) return null;
      return { meaning: ['A pair is 2 children together.'], say: [n + ' is even, so everyone can have a partner.', 'Split ' + n + ' into groups of 2. ' + n + ' ÷ 2 = ' + c], check: 'Check: ' + c + ' + ' + c + ' = ' + n + '.' };
    },
    MU02(it) {
      const r = it.model.rows, k = it.model.cols, c = Number(it.answer);
      if (it.steps.length !== 1) return null;
      return { meaning: ['An array has equal rows.'], say: ['There are ' + r + ' rows. Each row has ' + k + ' dots. Add ' + k + ' once for each row. ' + Array(r).fill(k).join(' + ') + ' = ' + c], check: 'Check: count the dots one by one. There are ' + c + '.' };
    },
    WP01(it) {
      const m = lastEq(it.steps[1]);
      if (!m || it.steps.length !== 2) return null;
      const a = +m[1], b = +m[3], c = +m[4], op = m[2];
      let s0;
      if (/^The whole is/.test(it.steps[0])) s0 = 'At the end there are ' + a + '. At the start there were ' + b + '. The missing part is how many were found.';
      else if (op === '+') s0 = 'The story starts with ' + a + '. Then ' + b + ' more are found. Finding more means we add.';
      else s0 = 'The story starts with ' + a + '. Then ' + b + ' are given away. Giving away means we take away.';
      return { meaning: ['Picture the story as a bar: the whole and its parts.'], say: [s0, (op === '+' ? 'Add them. ' : 'Take away. ') + a + ' ' + op + ' ' + b + ' = ' + c], check: 'Check: ' + c + ' ' + inverse(op) + ' ' + b + ' = ' + a + '.' };
    },
    WP02(it) {
      const m = lastEq(it.steps[1]);
      if (!m || it.steps.length !== 2) return null;
      const a = +m[1], b = +m[3], c = +m[4];
      if (m[2] === '+') return { meaning: ['Two parts make a whole.'], say: ['There are two parts: ' + a + ' and ' + b + '. The parts together make the whole.', 'So we add the parts. ' + a + ' + ' + b + ' = ' + c], check: 'Check: ' + c + ' − ' + b + ' = ' + a + '.' };
      return { meaning: ['Two parts make a whole.'], say: ['The whole is ' + a + '. One part is ' + b + '. The other part is missing.', 'Take the part we know away from the whole. ' + a + ' − ' + b + ' = ' + c], check: 'Check: ' + b + ' + ' + c + ' = ' + a + '.' };
    },
    WP03(it) {
      const m = lastEq(it.steps[1]);
      if (!m || it.steps.length !== 2) return null;
      const big = +m[1], small = +m[3], c = +m[4];
      return { meaning: ['"How many more" asks how much bigger one amount is than the other.'], say: ['Picture two bars, ' + big + ' and ' + small + '. The extra piece on the longer bar is the difference.', 'Take the smaller amount from the bigger one. ' + big + ' − ' + small + ' = ' + c], check: 'Check: ' + small + ' + ' + c + ' = ' + big + '.' };
    },
    T3(it) {
      const base = it.model.base, n = it.model.n, c = Number(it.answer), places = String(base).length - 1;
      const d = digitsOf(n, places);
      if (it.steps.length !== places + 1 || d[places - 1] === 0) return null;
      const say = d.map((x, i) => (i === places - 1 ? 'The last digit is ' + x + '. Take it from 10. 10 − ' + x + ' = ' + (10 - x) : (i === 0 ? 'The first digit is ' : 'The next digit is ') + x + '. Take it from 9. 9 − ' + x + ' = ' + (9 - x)));
      say.push('Put the answers in order. So ' + base + ' − ' + n + ' = ' + c);
      return { meaning: [base + ' is ' + (base - 1) + ' and 1 more.', 'Taking away from 9s never needs a regroup. That makes this trick quick.'], say, check: 'Check: ' + c + ' + ' + n + ' = ' + base + '.' };
    }
  });
  ['AS04', 'AS05', 'AS06', 'AS07', 'AS11', 'AS12'].forEach((id) => { B[id] = column; });

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
