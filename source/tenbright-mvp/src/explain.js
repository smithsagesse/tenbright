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
    const chain = new Set();
    for (let i = places - 1; i >= 0; i--) {
      const p = names[i], first = i === places - 1;
      let broke = false;
      const inChain = chain.has(p);
      if (inChain) {
        // the engine shows each 0 place it passed through as its own step: the place got 10, then gave 1 down
        say.push('Now the ' + p + '. We broke 1 ' + UNIT[names[i - 1]] + ' into 10 ' + p + '. Then 1 of those ' + p + ' went to the ' + names[i + 1] + '. So there are ' + count(da[i], p) + ' now.');
      }
      if (da[i] < db[i]) {
        const up = names[i - 1];
        if (!up) return null;
        if (da[i - 1] <= 0) {
          // across zeros: no ones to break above, so break the first place on the left that has something,
          // then pass one down through each 0 place
          let j = i - 1; while (j >= 0 && da[j] <= 0) j--;
          if (j < 0) return null;
          const had = da[i], zeros = names.slice(j + 1, i);
          da[j] -= 1; for (let z = j + 1; z < i; z++) { da[z] = 9; chain.add(names[z]); }
          da[i] += 10; lent.add(names[j]); broke = true;
          const down = [names[j]].concat(zeros);
          say.push('Look at the ' + p + '. Can we take ' + db[i] + ' away from ' + had + '? No, there are not enough ' + p + '. We need to break ' + 'a ' + UNIT[up] + ', but there are 0 ' + up + '.' + (zeros.length > 1 ? ' There are 0 ' + zeros.slice(0, -1).reverse().join(' and 0 ') + ' too.' : '') + ' So first break 1 ' + UNIT[names[j]] + ' into 10 ' + names[j + 1] + '. ' + down.slice(1).map((z, q) => 'Then break 1 ' + UNIT[z] + ' into 10 ' + (names[names.indexOf(z) + 1]) + '.').join(' ') + ' Now there are ' + count(da[i], p) + '. This is called regrouping.');
        } else {
          da[i - 1] -= 1; da[i] += 10; lent.add(up); broke = true;
          say.push('Look at the ' + p + '. Can we take ' + db[i] + ' away from ' + (da[i] - 10) + '? No, there are not enough ' + p + '. Break one ' + UNIT[up] + ' into 10 ' + p + '. Now there are ' + count(da[i - 1], up) + ' and ' + count(da[i], p) + '. This is called regrouping.');
        }
      }
      const sentence = da[i] + ' − ' + db[i] + ' = ' + (da[i] - db[i]);
      if (broke || inChain) say.push('Take away the ' + p + '. ' + sentence);
      else if (lent.has(p)) say.push('Now the ' + p + '. We used one ' + UNIT[p] + ', so there ' + (da[i] === 1 ? 'is ' : 'are ') + count(da[i], p) + ' now. ' + sentence);
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

  // ---------- Grade 3 ----------
  const between = (n, size) => { const lo = Math.floor(n / size) * size; return [lo, lo + size]; };
  const roundWords = (n, size, digit, place) => {
    const [lo, hi] = between(n, size), up = digit >= 5;
    if (digit === 5 && n % (size / 10) === 0) return 'The ' + place + ' digit is 5. ' + n + ' is exactly halfway. When a number is halfway, we round up. So ' + n + ' rounds to ' + hi + '.';
    return 'The ' + place + ' digit is ' + digit + '. That is ' + (up ? '5 or more' : 'less than 5') + ', so ' + n + ' is closer to ' + (up ? hi : lo) + '. So ' + n + ' rounds to ' + (up ? hi : lo) + '.';
  };
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const adds = (x, k) => Array(k).fill(x).join(' + ');
  const skip = (f, k) => Array.from({ length: k }, (_, i) => f * (i + 1)).join(', ');
  // one fact a × b told with an easier fact: f is the bigger number, x the other
  function factWords(a, b) {
    const f = Math.max(a, b), x = Math.min(a, b), c = a * b;
    const turn = a !== f ? a + ' × ' + b + ' is the same as ' + f + ' × ' + x + '. ' : '';
    if (f === x) {
      if (f > 5) return { s0: a + ' × ' + a + ' is a square fact. The array is a square. Split ' + a + ' into 5 and ' + (a - 5) + '.', s1: '5 × ' + a + ' = ' + 5 * a + '. ' + (a - 5) + ' × ' + a + ' = ' + (a - 5) * a + '. ' + 5 * a + ' + ' + (a - 5) * a + ' = ' + c };
      return { s0: a + ' × ' + a + ' is a square fact. The array is a square, ' + a + ' rows of ' + a + '.', s1: 'Add ' + a + ' once for each row. ' + adds(a, a) + ' = ' + c };
    }
    if (x === 2) return { s0: turn + 'Times 2 means double. Two groups of ' + f + ' is ' + f + ' and ' + f + ' again.', s1: 'Double ' + f + '. ' + f + ' + ' + f + ' = ' + c };
    if (f === 10) return { s0: turn + '10 groups of ' + x + ' make ' + x + ' tens.', s1: x + ' tens is ' + x + ' with a 0 after it. So ' + a + ' × ' + b + ' = ' + c };
    if (f > 5) return { s0: turn + 'Split ' + f + ' into 5 and ' + (f - 5) + '. Then ' + f + ' groups of ' + x + ' are 5 groups and ' + plural(f - 5, 'group', 'groups') + '.', s1: '5 × ' + x + ' = ' + 5 * x + '. ' + (f - 5) + ' × ' + x + ' = ' + (f - 5) * x + '. ' + 5 * x + ' + ' + (f - 5) * x + ' = ' + c };
    return { s0: turn + 'That is ' + f + ' groups of ' + x + '.', s1: 'Add ' + x + ' once for each group. ' + adds(x, f) + ' = ' + c };
  }
  const factCheck = (a, b) => (b ? 'Check: ' + a * b + ' ÷ ' + b + ' = ' + a + '.' : null);
  Object.assign(B, {
    PV13(it) {
      const n = Number((/^Round (\d+) to/.exec(it.prompt) || [])[1]), [lo, hi] = between(n, 10), d = n % 10;
      if (!n || it.steps.length !== 2) return null;
      return { meaning: ['Rounding finds the nearest ten.', 'A rounded number is easy to work with.'], say: [n + ' is between ' + lo + ' and ' + hi + '. Picture them on a number line.', roundWords(n, 10, d, 'ones')], check: 'Check: ' + n + ' is ' + (n - lo) + ' away from ' + lo + ' and ' + (hi - n) + ' away from ' + hi + '.' };
    },
    PV14(it) {
      const n = Number((/^Round (\d+) to/.exec(it.prompt) || [])[1]), [lo, hi] = between(n, 100), t = Math.floor(n / 10) % 10;
      if (!n || it.steps.length !== 2) return null;
      return { meaning: ['Rounding finds the nearest hundred.', 'The tens digit tells which hundred is closer.'], say: [n + ' is between ' + lo + ' and ' + hi + '. Picture them on a number line.', roundWords(n, 100, t, 'tens')], check: 'Check: ' + n + ' is ' + (n - lo) + ' away from ' + lo + ' and ' + (hi - n) + ' away from ' + hi + '.' };
    },
    AS16(it) {
      const m = /About how much is (\d+) \+ (\d+)\?/.exec(it.prompt), est = Number(it.answer);
      if (!m || it.steps.length !== 3) return null;
      const a = +m[1], b = +m[2], ra = between(a, 100)[(Math.floor(a / 10) % 10) >= 5 ? 1 : 0], rb = between(b, 100)[(Math.floor(b / 10) % 10) >= 5 ? 1 : 0];
      if (ra + rb !== est) return null;
      const why = (x, rx) => x + ' has ' + count(Math.floor(x / 10) % 10, 'tens') + ', so it rounds ' + (rx > x ? 'up' : 'down') + ' to ' + rx + '.';
      return { meaning: ['"About how much" asks for an estimate.', 'An estimate is a close answer that is quick to find.'], say: ['Round each number to the nearest hundred. ' + why(a, ra) + ' ' + why(b, rb), 'Now add the round numbers. ' + ra + ' + ' + rb + ' = ' + est, 'The exact answer is ' + (a + b) + '. That is close to ' + est + ', so the estimate makes sense.'], check: null };
    },
    MU03(it) {
      const g = it.a, s = it.b, c = Number(it.answer);
      if (it.steps.length !== 2) return null;
      return { meaning: ['The × sign means "groups of".'], say: ['Picture ' + g + ' groups. Each group has ' + s + '. We write it as ' + g + ' × ' + s + '.', 'Add ' + s + ' once for each group. ' + adds(s, g) + ' = ' + c], check: 'Check: count by ' + s + 's: ' + skip(s, g) + '.' };
    },
    MU04(it) {
      const f = it.b, x = it.a, c = Number(it.answer);
      if (it.steps.length !== 2) return null;
      return { meaning: ['Skip-counting by ' + f + 's means each jump adds ' + f + '.'], say: ['Start at 0. Jump by ' + f + ', ' + x + ' times. Say each number: ' + skip(f, x) + '.', x + ' jumps of ' + f + ' is the same as ' + x + ' × ' + f + '. ' + x + ' × ' + f + ' = ' + c], check: 'Check: ' + adds(f, x) + ' = ' + c + '.' };
    },
    MU05(it) {
      const m = /^(\d+) × (\d+) = (\d+)\. So/.exec(it.prompt), c = Number(it.answer);
      if (!m || it.steps.length !== 2) return null;
      const A = +m[1], Bn = +m[2];
      return { meaning: ['Turn-around facts use the same two numbers in a different order.'], say: [A + ' × ' + Bn + ' is ' + A + ' rows of ' + Bn + '. Turn the array on its side. Now it is ' + Bn + ' rows of ' + A + '. The dots are the same.', 'Turning does not change how many dots there are. So ' + Bn + ' × ' + A + ' = ' + c], check: 'Check: ' + A + ' × ' + Bn + ' and ' + Bn + ' × ' + A + ' are both ' + c + '.' };
    },
    MU06(it) {
      const m = /Skip-count by (\d+), (\d+) times/.exec(it.steps[0]), c = Number(it.answer);
      if (!m || it.steps.length !== 2) return null;
      const f = +m[1], x = +m[2];
      const tip = f === 10 ? 'Check: counting by 10s always lands on a number that ends in 0.' : f === 5 ? 'Check: counting by 5s always lands on a number that ends in 0 or 5.' : 'Check: counting by 2s always lands on an even number.';
      return { meaning: [it.a + ' × ' + it.b + ' means ' + it.a + ' groups of ' + it.b + '.', 'Facts with 2, 5 and 10 are quick to skip-count.'], say: ['Count by ' + f + 's. Hold up a finger for each jump. Stop at ' + plural(x, 'jump', 'jumps') + '.', 'Count: ' + skip(f, x) + '. The last number you say is the answer. So ' + it.a + ' × ' + it.b + ' is ' + c + '.'], check: tip };
    },
    MU07(it) {
      const { a, b } = it, c = Number(it.answer);
      if (it.steps.length !== 2) return null;
      let s0, check;
      if (a === 0) { s0 = '0 × ' + b + ' means 0 groups of ' + b + '. There are no groups at all.'; check = 'Check: any number times 0 is 0.'; }
      else if (b === 0) { s0 = a + ' × 0 means ' + a + ' groups of 0. Every group is empty.'; check = 'Check: any number times 0 is 0.'; }
      else if (a === 1) { s0 = '1 × ' + b + ' means 1 group of ' + b + '. One group of ' + b + ' is just ' + b + '.'; check = 'Check: any number times 1 stays the same.'; }
      else { s0 = a + ' × 1 means ' + a + ' groups of 1. That is ' + a + ' ones.'; check = 'Check: any number times 1 stays the same.'; }
      return { meaning: ['Times 0 and times 1 follow easy rules.'], say: [s0, (c === 0 ? 'Empty groups add up to nothing. So ' : 'So ') + a + ' × ' + b + ' = ' + c], check };
    },
    MU08(it) {
      const { a, b } = it, c = Number(it.answer), f = (b === 4 || b === 8) ? b : a, x = f === b ? a : b;
      if (it.steps.length !== 2 || (f !== 4 && f !== 8)) return null;
      const d = [x, 2 * x, 4 * x, 8 * x], times = f === 4 ? 2 : 3;
      const chain = d.slice(0, times).map((v) => v + ' + ' + v + ' = ' + 2 * v + '.').join(' ');
      return { meaning: ['Doubling means adding a number to itself.', 'Times ' + f + ' is doubling ' + (f === 4 ? 'two' : 'three') + ' times.'], say: [a + ' × ' + b + ' means ' + a + ' groups of ' + b + '. To times by ' + f + ', double ' + x + ', then double again' + (f === 8 ? ', and again.' : '.'), chain.replace(/\.$/, '') + '. So ' + a + ' × ' + b + ' = ' + c], check: factCheck(a, b) };
    },
    MU09(it) {
      const { a, b } = it, c = Number(it.answer), f = (b === 3 || b === 6) ? b : a, x = f === b ? a : b;
      if (it.steps.length !== 2 || (f !== 3 && f !== 6)) return null;
      const k = f === 3 ? 2 : 5;
      return { meaning: [f + ' is ' + k + ' and 1 more.', 'So ' + f + ' groups are ' + k + ' groups and 1 more group.'], say: [a + ' × ' + b + ' means ' + a + ' groups of ' + b + '. Start with the easier fact, ' + k + ' × ' + x + '.', k + ' × ' + x + ' = ' + k * x + '. Add one more group of ' + x + '. ' + k * x + ' + ' + x + ' = ' + c], check: factCheck(a, b) };
    },
    MU10(it) {
      const { a, b } = it, c = Number(it.answer), x = a === 9 ? b : a;
      if (it.steps.length !== 2) return null;
      return { meaning: ['Times 9 is close to times 10.', '10 groups take away 1 group leaves 9 groups.'], say: ['9 is one less than 10. Start with 10 groups of ' + x + '. 10 × ' + x + ' = ' + 10 * x + '.', 'We need only 9 groups, so take away one group of ' + x + '. ' + 10 * x + ' − ' + x + ' = ' + c], check: 'Check: the digits of ' + c + ' add up to 9.' };
    },
    MU11(it) {
      const { a, b } = it, c = Number(it.answer), x = a === 7 ? b : a;
      if (it.steps.length !== 3) return null;
      return { meaning: ['A hard fact can be split into two easy facts.'], say: ['7 is 5 and 2. So 7 groups of ' + x + ' are 5 groups and 2 groups.', 'Find 5 groups of ' + x + '. 5 × ' + x + ' = ' + 5 * x + '. Then find 2 groups. 2 × ' + x + ' = ' + 2 * x + '.', 'Put the two parts together. ' + 5 * x + ' + ' + 2 * x + ' = ' + c], check: factCheck(a, b) };
    },
    MU12(it) {
      const { a, b } = it;
      if (it.steps.length !== 2) return null;
      const w = factWords(a, b);
      return { meaning: [a + ' × ' + b + ' means ' + a + ' groups of ' + b + '.', 'We can use easier facts we know.'], say: [w.s0, w.s1], check: factCheck(a, b) };
    },
    MU13(it) {
      const g = it.b, p = it.a, x = Number(it.answer);
      if (it.steps.length !== 2) return null;
      return { meaning: [g + ' × ? = ' + p + ' asks: how many groups of ' + g + ' make ' + p + '?'], say: ['Count by ' + g + 's until you reach ' + p + ': ' + skip(g, x) + '.', 'Count how many numbers you said. That is how many groups. ' + g + ' × ' + x + ' = ' + p + ', so ? = ' + x], check: 'Check: ' + p + ' ÷ ' + g + ' = ' + x + '.' };
    },
    MU14(it) {
      const a = it.a, n = it.b, t = n / 10, c = Number(it.answer);
      if (it.steps.length !== 2 || n % 10) return null;
      return { meaning: ['A multiple of 10 is a number of tens, like 20, 30 or 40.'], say: [n + ' is ' + count(t, 'tens') + '. So ' + a + ' × ' + n + ' is ' + a + ' groups of ' + count(t, 'tens') + '.', 'First find ' + a + ' × ' + t + '. ' + a + ' × ' + t + ' = ' + a * t + '. So there are ' + a * t + ' tens. ' + a + ' × ' + n + ' = ' + c], check: 'Check: ' + a * t + ' tens is ' + a * t + ' with a 0 after it.' };
    },
    MU15(it) {
      const oe = /^Is (\d+) × (\d+) odd or even\?/.exec(it.prompt);
      if (oe && it.steps.length === 2) {
        const a = +oe[1], b = +oe[2], p = a * b, even = a % 2 === 0 || b % 2 === 0;
        return { meaning: ['Even numbers make pairs. Odd numbers leave one over.'], say: [even ? 'One of the numbers is even. Groups like that can always be put in pairs. So the answer is even.' : 'Both numbers are odd. An odd number of odd groups leaves one over. So the answer is odd.', 'Check with the fact. ' + a + ' × ' + b + ' = ' + p], check: 'Check: ' + p + ' ends in ' + (p % 10) + ', so it is ' + (even ? 'even' : 'odd') + '.' };
      }
      const m = /9 × (\d+) = (\d+)\. Add its digits/.exec(it.prompt);
      if (!m || it.steps.length !== 2) return null;
      const ds = m[2].split('');
      return { meaning: [m[2] + ' has two digits: ' + ds[0] + ' and ' + ds[1] + '.'], say: ['Add the two digits. ' + ds.join(' + ') + ' = ' + it.answer, 'Try another 9s fact. The digits add to 9 every time, up to 9 × 10.'], check: null };
    },
    MU16(it) {
      const { a, b } = it;
      if (it.steps.length !== 2) return null;
      const w = factWords(a, b);
      return { meaning: [a + ' × ' + b + ' means ' + a + ' groups of ' + b + '.', 'We can use easier facts we know.'], say: [w.s0, w.s1], check: factCheck(a, b) };
    },
    WP04(it) {
      const m = /^There are (\d+) \w+ with (\d+) /.exec(it.prompt), c = Number(it.answer);
      if (!m || it.steps.length !== 2) return null;
      const g = +m[1], s = +m[2];
      return { meaning: ['"In each" tells us every group has the same number.'], say: ['There are ' + g + ' groups. Each group has ' + s + '. Equal groups mean we can multiply.', g + ' groups of ' + s + ' is ' + g + ' × ' + s + '. ' + g + ' × ' + s + ' = ' + c], check: 'Check: ' + adds(s, g) + ' = ' + c + '.' };
    },
    WP05(it) {
      const m1 = lastEq(it.steps[0]), m2 = lastEq(it.steps[1]);
      if (!m1 || !m2 || it.steps.length !== 2) return null;
      const a = +m1[1], b = +m1[3], s = +m1[4], c = +m2[3], r = +m2[4];
      return { meaning: ['This story has two steps. Do them in order.'], say: ['First, ' + b + ' more come. Getting more means we add. ' + a + ' + ' + b + ' = ' + s + '.', 'Then ' + c + ' are given to a friend. Giving away means we take away. ' + s + ' − ' + c + ' = ' + r + '.'], check: 'Check: ' + r + ' + ' + c + ' = ' + s + ', and ' + s + ' − ' + b + ' = ' + a + '.' };
    },
    F301(it) {
      const fr = it.frac || (it.model && it.model.bars && [it.model.bars[0].n, it.model.bars[0].d]);
      if (!fr || it.steps.length !== 2) return null;
      const [n, d] = fr;
      const meaning = ['A fraction names part of a whole.', 'The whole is cut into equal parts.'];
      if (/\/\?$/.test(it.prompt)) return { meaning, say: ['The bottom number tells how many equal parts make the whole. Count all the parts.', 'There are ' + d + ' equal parts, so the bottom number is ' + d], check: 'Check: ' + n + ' of the ' + d + ' equal parts ' + (n === 1 ? 'is' : 'are') + ' shaded.' };
      return { meaning, say: ['Count all the equal parts. There are ' + d + '. That is the bottom number.', 'Now count the shaded parts. There ' + (n === 1 ? 'is ' : 'are ') + n + '. That is the top number.'], check: 'Check: ' + n + ' of the ' + d + ' equal parts ' + (n === 1 ? 'is' : 'are') + ' shaded.' };
    },
    F302(it) {
      const d = it.model && it.model.d, n = Number(it.answer);
      if (!d || it.steps.length !== 2) return null;
      return { meaning: ['The line from 0 to 1 is one whole.'], say: ['The whole is cut into ' + d + ' equal jumps. So each jump is 1/' + d + '.', 'Count the jumps from 0 to the arrow: ' + n + '. That is the top number.'], check: 'Check: ' + (d - n) + ' more ' + (d - n === 1 ? 'jump reaches' : 'jumps reach') + ' 1.' };
    }
  });
  ['AS13', 'AS14', 'AS15'].forEach((id) => { B[id] = column; });
  // ---------- Grade 4 ----------
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const unfmt = (s) => Number(String(s).replace(/,/g, ''));
  const PLACES6 = ['hundred thousands', 'ten thousands', 'thousands', 'hundreds', 'tens', 'ones'];
  const SIZE_PLACE = { 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten thousands', 100000: 'hundred thousands' };
  const placeOfValue = (v) => { const z = String(v).length - 1; return ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'][z]; };
  const eqOf = (s) => /(\d+) × (\d+) = (\d+)\.?$/.exec(s || '');
  Object.assign(B, {
    F401(it) {
      const m = /^What is the value of the (\d) in ([\d,]+)\?/.exec(it.prompt), place = (/is in the (.+) place/.exec(it.steps[0]) || [])[1];
      if (!m || !place || it.steps.length !== 2) return null;
      const d = +m[1], v = Number(it.answer), zeros = String(v).length - 1;
      return { meaning: ['Each place is worth 10 times the place to its right.'], say: ['Find the ' + d + ' in ' + m[2] + '. It is in the ' + place + ' place.', 'Each one in the ' + place + ' place is worth ' + fmt(v / d) + '. So multiply. ' + it.steps[1]], check: zeros ? 'Check: ' + fmt(v) + ' is ' + d + ' followed by ' + plural(zeros, 'zero', 'zeros') + '.' : null };
    },
    F402(it) {
      const last = it.steps[1] || '', m = /^([\d,]+) ([<>=]) ([\d,]+)$/.exec(last);
      if (!m || it.steps.length !== 2) return null;
      const A = unfmt(m[1]), Bn = unfmt(m[3]), sa = String(A), sb = String(Bn);
      let s0;
      if (sa.length !== sb.length) s0 = fmt(A) + ' has ' + sa.length + ' digits. ' + fmt(Bn) + ' has ' + sb.length + ' digits. More digits means a bigger number.';
      else {
        let k = 0; while (k < sa.length && sa[k] === sb[k]) k++;
        s0 = 'Both numbers have ' + sa.length + ' digits. So compare from the left, one place at a time.';
        if (k < sa.length) s0 += ' The first digits that are different are in the ' + PLACES6[6 - sa.length + k] + ' place: ' + sa[k] + ' and ' + sb[k] + '.';
      }
      const big = Math.max(A, Bn);
      const s1 = A === Bn ? 'Every digit is the same, so the numbers are equal. ' + last : fmt(big) + ' has the bigger digit there, so ' + fmt(big) + ' is greater. ' + last;
      return { meaning: ['We compare ' + fmt(A) + ' and ' + fmt(Bn) + '.', 'The open side of > or < faces the bigger number.'], say: [sa.length !== sb.length ? s0 : s0, s1], check: null };
    },
    F403(it) {
      const m = /^Round ([\d,]+) to the nearest ([\d,]+)\./.exec(it.prompt);
      if (!m || it.steps.length !== 2) return null;
      const n = unfmt(m[1]), size = unfmt(m[2]), lo = Math.floor(n / size) * size, hi = lo + size, ans = Number(it.answer), place = SIZE_PLACE[size];
      const next = Math.floor((n % size) / (size / 10)), half = n - lo === size / 2;
      if (!place) return null;
      const s1 = 'Look at the digit just after the ' + place + ' place. It is ' + next + '. ' + (half ? fmt(n) + ' is exactly halfway, and halfway rounds up.' : 'That is ' + (next >= 5 ? '5 or more, so round up.' : 'less than 5, so round down.')) + ' So ' + fmt(n) + ' rounds to ' + fmt(ans) + '.';
      return { meaning: ['Rounding finds the nearest ' + fmt(size) + '.', 'A rounded number is easy to work with.'], say: [fmt(n) + ' is between ' + fmt(lo) + ' and ' + fmt(hi) + '. Picture them on a number line.', s1], check: 'Check: ' + fmt(n) + ' is ' + fmt(n - lo) + ' away from ' + fmt(lo) + ' and ' + fmt(hi - n) + ' away from ' + fmt(hi) + '.' };
    },
    F404: column,
    F405(it) {
      const n = it.a, k = it.b, c = Number(it.answer), parts = [];
      for (let i = 0; i < it.steps.length; i++) {
        const m = eqOf(it.steps[i]);
        if (m && +m[2] === k && i < it.steps.length - (it.steps.length > 1 ? 1 : 0)) parts.push(+m[1]);
      }
      const single = it.steps.length === 1;
      if (single ? parts.length !== 1 : parts.length !== it.steps.length - 1) return null;
      const say = parts.map((p, i) => {
        const d = String(p)[0], place = placeOfValue(p), eq = p + ' × ' + k + ' = ' + p * k;
        if (place === 'ones') return 'Now the ones. ' + eq;
        return (i === 0 ? 'Start with the ' : 'Now the ') + place + '. The ' + d + ' in the ' + place + ' place means ' + p + '. ' + eq;
      });
      if (!single) say.push('Add the parts together. ' + parts.map((p) => p * k).join(' + ') + ' = ' + c);
      return { meaning: single ? [n + ' is ' + placePhrase(n) + '.', 'We multiply the ' + placeOfValue(n) + ' by ' + k + '.'] : ['We split ' + n + ' into its places: ' + parts.join(', ').replace(/, (\d+)$/, ' and $1') + '.', 'We multiply each part by ' + k + ', then add.'], say, check: 'Check: ' + c + ' ÷ ' + k + ' = ' + n + '.' };
    },
    F406(it) {
      const { a, b } = it, c = Number(it.answer), at = a - (a % 10), ao = a % 10, bt = b - (b % 10), bo = b % 10;
      if (it.steps.length !== 5 || !ao || !bo) return null;
      const kind = (x) => (x >= 10 ? 'tens' : 'ones');
      const pairs = [[at, bt], [at, bo], [ao, bt], [ao, bo]];
      const say = pairs.map(([x, y]) => kind(x)[0].toUpperCase() + kind(x).slice(1) + ' times ' + kind(y) + '. ' + x + ' × ' + y + ' = ' + x * y);
      say.push('Add all four parts. ' + pairs.map(([x, y]) => x * y).join(' + ') + ' = ' + c);
      return { meaning: ['Split both numbers into tens and ones. ' + a + ' is ' + at + ' and ' + ao + '. ' + b + ' is ' + bt + ' and ' + bo + '.', 'Multiply each part by each part, then add.'], say, check: 'Check: ' + c + ' ÷ ' + b + ' = ' + a + '.' };
    },
    F407(it) {
      const d = it.divrem, m = /One more group would be (\d+)/.exec(it.steps[0] || '');
      if (!d || !m || it.steps.length !== 3) return null;
      const [N, k, q, r] = d, askQ = /\? R/.test(it.prompt);
      return { meaning: [N + ' ÷ ' + k + ' asks: how many groups of ' + k + ' fit in ' + N + '?', 'Some may be left over. That part is the remainder, R.'], say: ['Find how many groups of ' + k + ' fit. ' + k + ' × ' + q + ' = ' + k * q + '. One more group would make ' + m[1] + '. That is more than ' + N + ', so it is too many.', 'Take away what the groups use. ' + N + ' − ' + k * q + ' = ' + r + '. That is what is left over.', 'So ' + N + ' ÷ ' + k + ' = ' + q + ' R ' + r + '. ' + (askQ ? 'The number of groups is ' + q + '.' : 'The remainder is ' + r + '.')], check: 'Check: ' + k + ' × ' + q + ' + ' + r + ' = ' + N + '.' };
    },
    F408(it) {
      const N = it.a, k = it.b, q = Number(it.answer), say = [], groups = [];
      for (let i = 0; i < it.steps.length - 1; i++) {
        const m = /^(\d+) × (\d+) = (\d+)\. (\d+) − (\d+) = (\d+)\.$/.exec(it.steps[i]);
        if (!m) return null;
        groups.push(+m[2]);
        say.push((i === 0 ? 'How many groups of ' + k + ' fit in ' + N + '? Start big. Try ' + m[2] + ' groups.' : 'Now share the ' + m[4] + ' that is left. Try ' + m[2] + ' groups.') + ' ' + k + ' × ' + m[2] + ' = ' + m[3] + '. Take that away. ' + m[4] + ' − ' + m[5] + ' = ' + m[6] + '.');
      }
      say.push(groups.length > 1 ? 'Add up all the groups. ' + groups.join(' + ') + ' = ' + q + '. So ' + N + ' ÷ ' + k + ' = ' + q : 'That is all of it. So ' + N + ' ÷ ' + k + ' = ' + q);
      return { meaning: [N + ' ÷ ' + k + ' asks: how many groups of ' + k + ' make ' + N + '?', 'Take away big groups first, then smaller ones.'], say, check: 'Check: ' + k + ' × ' + q + ' = ' + N + '.' };
    },
    F409(it) {
      if (it.factorOf) {
        const n = it.factorOf, f = Number(it.answer);
        if (it.steps.length !== 2) return null;
        return { meaning: ['Factors are numbers we multiply to make another number.'], say: ['A factor of ' + n + ' splits ' + n + ' into equal groups, with nothing left over.', 'Try each choice. ' + f + ' × ' + n / f + ' = ' + n + ', so ' + f + ' is a factor of ' + n + '.'], check: 'Check: ' + n + ' ÷ ' + f + ' = ' + n / f + ', with nothing left over.' };
      }
      const n = it.a, g = it.b, x = Number(it.answer);
      if (it.steps.length !== 2) return null;
      return { meaning: [n + ' = ' + g + ' × ? asks: how many groups of ' + g + ' make ' + n + '?'], say: ['Count by ' + g + 's until you reach ' + n + '. Or use a fact you know.', 'Count how many groups. ' + g + ' × ' + x + ' = ' + n + ', so ? = ' + x], check: 'Check: ' + n + ' ÷ ' + g + ' = ' + x + '.' };
    },
    F410(it) {
      const pc = /^Is (\d+) prime or composite\?/.exec(it.prompt);
      const meaning = ['A prime number has exactly two factors: 1 and itself.', 'A composite number has more factors.'];
      if (pc && it.steps.length === 2) {
        const n = +pc[1], m = eqOf(it.steps[0]);
        if (m) return { meaning, say: ['Look for a factor other than 1 and ' + n + '. ' + it.steps[0].replace(/\.$/, '') + '.', 'So ' + n + ' has more factors than 1 and itself. That makes it composite.'], check: null };
        return { meaning, say: ['Try 2, 3, 5 and 7. None of them split ' + n + ' into equal groups.', 'So ' + n + ' has only two factors, 1 and ' + n + '. That makes it prime.'], check: null };
      }
      const n = it.primeCheck, small = Number(it.answer);
      if (!n || it.steps.length !== 2) return null;
      const m = eqOf(it.steps[1].replace(/, so the smallest is \d+$/, ''));
      return { meaning: ['A factor bigger than 1 splits ' + n + ' into equal groups, with nothing left over.'], say: ['Try the small numbers in order: 2, then 3, then 5, then 7.', m ? small + ' is the first one that works. ' + m[0] + '. So the smallest is ' + small : 'None of them work, so ' + n + ' is prime. Its only factors are 1 and ' + n + '. So the smallest is ' + n], check: null };
    },
    F411(it) {
      if (it.steps.length !== 2) return null;
      const c = Number(it.answer);
      if (it.op === '×') {
        const k = it.a, u = it.b;
        return { meaning: ['"Times as many" compares two amounts.'], say: [k + ' times as many means the same amount ' + k + ' times. So ' + k + ' times as many as ' + u + ' is ' + k + ' groups of ' + u + '.', 'So multiply. ' + k + ' × ' + u + ' = ' + c], check: 'Check: ' + c + ' ÷ ' + k + ' = ' + u + '.' };
      }
      const N = it.a, k = it.b;
      return { meaning: ['"Times as many" compares two amounts.'], say: [N + ' is ' + k + ' times as many as the other amount. So ' + N + ' is ' + k + ' equal groups.', 'One group is the other amount. Share ' + N + ' into ' + k + ' equal groups. ' + N + ' ÷ ' + k + ' = ' + c], check: 'Check: ' + k + ' × ' + c + ' = ' + N + '.' };
    },
    F412(it) {
      const m = /^Rule: (add|multiply by) (\d+)\. ([\d, ]+), \?$/.exec(it.prompt), c = Number(it.answer);
      if (!m || it.steps.length !== 2) return null;
      const k = +m[2], seq = m[3].split(', ').map(Number), add = m[1] === 'add';
      const word = add ? ' and ' + k + ' more is ' : ' times ' + k + ' is ';
      return { meaning: ['A pattern follows a rule. The rule here is: ' + m[1] + ' ' + k + '.'], say: ['Check the rule. ' + seq[0] + word + seq[1] + '. ' + seq[1] + word + seq[2] + '. The rule works.', 'Use the rule on the last number. ' + seq[seq.length - 1] + (add ? ' + ' : ' × ') + k + ' = ' + c], check: null };
    },
    F413(it) {
      const m = /^(\d+)\/(\d+) = \?\/(\d+)$/.exec(it.prompt), c = Number(it.answer);
      if (!m || it.steps.length !== 2) return null;
      const n = +m[1], d = +m[2], D = +m[3], k = D / d;
      return { meaning: ['Equivalent fractions name the same amount.', 'Cut every piece into the same number of parts, and the amount stays the same.'], say: ['Look at the bottom numbers. ' + d + ' × ' + k + ' = ' + D + '. So each piece is cut into ' + k + ' smaller pieces.', 'Each old piece is now ' + k + ' pieces. So the top number grows ' + k + ' times too. ' + n + ' × ' + k + ' = ' + c], check: 'Check: ' + n + '/' + d + ' and ' + c + '/' + D + ' cover the same part of the bar.' };
    },
    F414(it) {
      const mm = /^Make the bottoms match: (\d+)\/(\d+) = \?\/(\d+)$/.exec(it.prompt);
      if (mm) return B.F413(Object.assign({}, it, { prompt: mm[1] + '/' + mm[2] + ' = ?/' + mm[3] }));
      const s0 = /^Use the same bottom number: (\d+)\/(\d+) = (\d+)\/(\d+) and (\d+)\/(\d+) = (\d+)\/(\d+)\.$/.exec(it.steps[0] || '');
      const s1 = /, so (.+)$/.exec(it.steps[1] || '');
      if (!s0 || !s1 || it.steps.length !== 2) return null;
      const A = +s0[3], Cc = +s0[7], L = s0[4];
      const cmp = A === Cc ? A + ' pieces and ' + Cc + ' pieces are the same.' : Math.max(A, Cc) + ' pieces are more than ' + Math.min(A, Cc) + ' pieces.';
      return { meaning: ['Fractions are easy to compare when the bottom numbers match.'], say: ['Make both bottom numbers ' + L + '. ' + it.steps[0].replace(/^Use the same bottom number: /, ''), 'Now the pieces are the same size. ' + cmp + ' So ' + s1[1] + '.'], check: null };
    },
    F415(it) {
      if (it.steps.length !== 2) return null;
      const fr = /^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = /.exec(it.prompt);
      if (!fr) return null;
      const a = +fr[1], d = +fr[2], op = fr[3], b = +fr[4], c = op === '+' ? a + b : a - b;
      const meaning = ['The bottom number tells the size of the pieces.', 'Here all the pieces are the same size.'];
      if (/\/\?$/.test(it.prompt)) return { meaning, say: ['The pieces are the same size, so the bottom number stays ' + d + '.', 'Add only the top numbers. ' + a + ' + ' + b + ' = ' + c + '. The bottom number is still ' + d + '.'], check: null };
      return { meaning, say: ['Both fractions have the same bottom number, ' + d + '. So the pieces are the same size. ' + (op === '+' ? 'Just count the pieces.' : 'Take away ' + b + ' of the pieces.'), (op === '+' ? 'Add the top numbers. ' : 'Take away the top numbers. ') + a + ' ' + op + ' ' + b + ' = ' + c], check: null };
    },
    F416(it) {
      if (it.steps.length !== 2) return null;
      const to = /^(\d+) (\d+)\/(\d+) = \?\/\d+$/.exec(it.prompt), back = /^(\d+)\/(\d+) = (\d+) \?\/\d+$/.exec(it.prompt), c = Number(it.answer);
      const meaning = ['A mixed number has wholes and a fraction.'];
      if (to) { const w = +to[1], n = +to[2], d = +to[3]; return { meaning, say: ['Each whole is cut into ' + d + ' pieces. ' + it.steps[0], 'Add the ' + n + ' extra ' + (n === 1 ? 'piece' : 'pieces') + '. ' + w * d + ' + ' + n + ' = ' + c], check: null }; }
      if (back) { const N = +back[1], d = +back[2], w = +back[3]; return { meaning, say: ['Each whole is ' + d + ' pieces. ' + it.steps[0], 'The pieces that are left make the fraction part. ' + N + ' − ' + w * d + ' = ' + c], check: null }; }
      return null;
    },
    F417(it) {
      const m = /^(\d+) × (\d+)\/(\d+) = \?\/\d+$/.exec(it.prompt), c = Number(it.answer);
      if (!m || it.steps.length !== 2) return null;
      const k = +m[1], n = +m[2], d = +m[3];
      return { meaning: [k + ' × ' + n + '/' + d + ' means ' + k + ' groups of ' + n + '/' + d + '.'], say: ['Each group has ' + n + ' ' + (n === 1 ? 'piece' : 'pieces') + '. ' + it.steps[0].replace(/^\d+ groups of [\d/]+\. /, ''), 'Count all the pieces in the ' + k + ' groups. ' + k + ' × ' + n + ' = ' + c], check: null };
    },
    F418(it) {
      if (it.steps.length !== 2) return null;
      const c = it.answer;
      let m = /^Write (\d+)\/10 as hundredths/.exec(it.prompt);
      if (m) { const t = +m[1]; return { meaning: ['Tenths and hundredths are pieces of one whole.'], say: ['Cut each tenth into 10 equal pieces. Each piece is a hundredth. So 1 tenth is 10 hundredths.', 'There ' + (t === 1 ? 'is 1 tenth' : 'are ' + t + ' tenths') + ', and each is 10 hundredths. ' + t + ' × 10 = ' + c], check: null }; }
      m = /^(\d+)\/10 \+ (\d+)\/100 = /.exec(it.prompt);
      if (m) return { meaning: ['To add, the pieces must be the same size.'], say: ['Change the tenths into hundredths first. ' + it.steps[0], 'Now the pieces are the same size. Add them. ' + it.steps[1]], check: null };
      m = /^Write (\d+)\/100 as a decimal\./.exec(it.prompt);
      if (m) { const n = +m[1]; return { meaning: ['Hundredths go two places after the decimal point.'], say: [n + ' hundredths has ' + (n < 10 ? 'no tenths and ' + n + ' hundredths.' : Math.floor(n / 10) + ' tenths and ' + (n % 10) + ' hundredths.'), (n < 10 ? 'The tenths place gets a 0. ' : 'Write the tenths, then the hundredths. ') + it.steps[1]], check: null }; }
      return null;
    },
    F419(it) {
      const m = /^Write both as hundredths: ([\d.]+) = ([\d.]+)\.$/.exec(it.steps[0] || '');
      if (!m || it.steps.length !== 2) return null;
      return { meaning: ['Decimals are easiest to compare with the same number of places.'], say: ['Give both numbers two digits after the point. A 0 at the end does not change the amount. ' + it.steps[0], 'Now compare them like whole numbers of hundredths. ' + it.steps[1]], check: null };
    }
  });

  // ---------- Grade 5 ----------
  const lastEqAny = (s) => /= ([\d.]+)\.?$/.exec(s || '');
  Object.assign(B, {
    F501(it) {
      if (it.steps.length !== 2) return null;
      const m0 = /^(Parentheses first|Multiply before adding): (.+)$/.exec(it.steps[0]);
      if (!m0) return null;
      const paren = m0[1] === 'Parentheses first';
      return { meaning: paren ? ['Parentheses show which part to do first.'] : ['With no parentheses, multiply before you add.'], say: [paren ? 'Work inside the parentheses first. ' + m0[2] : 'There are no parentheses here. Multiplying comes before adding. ' + m0[2], (paren ? 'Now finish the problem. ' : 'Now add. ') + it.steps[1]], check: null };
    },
    F502(it) {
      const m = /^([×÷]) ([\d,]+): every digit moves (\d) places? to the (left|right)\.$/.exec(it.steps[0] || '');
      if (!m || it.steps.length !== 2) return null;
      const k = +m[3], times = m[1] === '×', moves = plural(k, 'place', 'places');
      const s0 = (times ? 'Times ' + m[2] + ' makes each digit worth ' + m[2] + ' times as much.' : 'Dividing by ' + m[2] + ' makes each digit worth ' + { 10: 'one tenth', 100: 'one hundredth', '1,000': 'one thousandth' }[m[2]] + ' as much.') + ' So every digit moves ' + moves + ' to the ' + m[4] + '.';
      const s1 = (times ? (/\./.test(it.prompt) ? 'Write the digits in their new places. ' : 'Fill the empty places with zeros. ') : 'Some digits move past the decimal point. ') + it.steps[1];
      return { meaning: ['Each place is worth 10 times the place to its right.'], say: [s0, s1], check: null };
    },
    F503(it) {
      if (it.steps.length !== 2) return null;
      const meaning = ['The places after the decimal point are parts of one whole.'];
      const d = /^Which digit is in the (\w+) place of ([\d.]+)\?/.exec(it.prompt);
      if (d) return { meaning, say: ['Look after the decimal point. The first place is tenths. The next is hundredths. Then come thousandths.', 'In ' + d[2] + ', go to the ' + d[1] + ' place. ' + it.steps[1]], check: null };
      const v = /^What is the value of the (\d) in ([\d.]+)\?/.exec(it.prompt);
      if (!v) return null;
      return { meaning, say: ['Find the ' + v[1] + ' in ' + v[2] + '. ' + it.steps[0], 'Write that as a decimal. ' + it.steps[1]], check: null };
    },
    F504(it) {
      if (it.steps.length !== 2 || !/^Write both with three places: /.test(it.steps[0])) return null;
      return { meaning: ['Decimals are easiest to compare with the same number of places.'], say: ['Give both numbers three digits after the point. A 0 at the end does not change the amount. ' + it.steps[0], 'Now compare them like whole numbers of thousandths. ' + it.steps[1]], check: null };
    },
    F505(it) {
      const m = /^Round ([\d.]+) to the nearest (whole number|tenth|hundredth)\.$/.exec(it.prompt), n = /^The next digit is (\d), so it rounds to ([\d.]+)$/.exec(it.steps[1] || '');
      if (!m || !n || it.steps.length !== 2) return null;
      const place = { 'whole number': 'ones', tenth: 'tenths', hundredth: 'hundredths' }[m[2]], d = +n[1];
      const after = m[1].split('.')[1] || '', cut = { ones: 0, tenths: 1, hundredths: 2 }[place], rest = after.slice(cut + 1);
      const half = d === 5 && !/[1-9]/.test(rest);
      return { meaning: ['Rounding a decimal works like rounding a whole number.'], say: ['Round to the nearest ' + m[2] + '. ' + it.steps[0] + ' Picture them on a number line.', 'Look at the digit just after the ' + place + ' place. It is ' + d + '. ' + (half ? m[1] + ' is exactly halfway, and halfway rounds up.' : 'That is ' + (d >= 5 ? '5 or more, so round up.' : 'less than 5, so round down.')) + ' So it rounds to ' + n[2] + '.'], check: null };
    },
    F506(it) {
      const { a, b } = it, c = Number(it.answer), bo = b % 10, bt = b - bo;
      if (it.steps.length !== 3 || !bo) return null;
      return { meaning: ['Split ' + b + ' into ' + bt + ' and ' + bo + '.', 'Multiply ' + a + ' by each part, then add.'], say: ['Start with the ones. ' + it.steps[0], 'Now the tens. ' + bt + ' is ' + count(bt / 10, 'tens') + '. ' + it.steps[1], 'Add the two parts. ' + it.steps[2]], check: 'Check: ' + c + ' ÷ ' + b + ' = ' + a + '.' };
    },
    F507(it) { return B.F408(it); },
    F508(it) {
      const m = /^Line up the points: ([\d.]+) ([+−]) ([\d.]+)\.$/.exec(it.steps[0] || '');
      if (!m || it.steps.length !== 2) return null;
      const add = m[2] === '+';
      return { meaning: ['To add or take away decimals, line up the decimal points.'], say: ['Line up the decimal points, so tenths sit over tenths. Give both numbers two places: ' + m[1] + ' and ' + m[3] + '.', 'Now ' + (add ? 'add' : 'take away') + ' like whole numbers. Keep the point in line. ' + it.steps[1]], check: null };
    },
    F509(it) {
      const m = /^Multiply as whole numbers: (.+)$/.exec(it.steps[0] || '');
      if (!m || it.steps.length !== 2) return null;
      return { meaning: ['Multiply decimals like whole numbers. Then put the point back.'], say: ['Leave out the points for now. Multiply as whole numbers. ' + m[1], 'Now count the digits after the points in both numbers. ' + it.steps[1]], check: null };
    },
    F510(it) {
      if (it.steps.length !== 2) return null;
      const t = /^([\d.]+) is (\d+) tenths\. (.+)$/.exec(it.steps[0]);
      if (t) return { meaning: ['Dividing a decimal is like sharing tenths.'], say: ['Think of ' + t[1] + ' as tenths. ' + it.steps[0], 'Write the tenths as a decimal. ' + it.steps[1]], check: null };
      const f = /^How many ([\d.]+)s fit in 1\? (\d+)\.$/.exec(it.steps[0]), p = /^(\d+) ÷ ([\d.]+) = \?$/.exec(it.prompt);
      if (!f || !p) return null;
      return { meaning: [p[1] + ' ÷ ' + p[2] + ' asks: how many ' + p[2] + 's fit in ' + p[1] + '?'], say: [p[2] + ' is part of one whole. ' + it.steps[0], 'Each of the ' + p[1] + ' wholes holds ' + f[2] + ' of them. ' + it.steps[1]], check: null };
    },
    F511(it) {
      if (it.steps.length !== 2 || !/^Use /.test(it.steps[0])) return null;
      const add = it.op === '+';
      return { meaning: ['To add or take away fractions, the pieces must be the same size.'], say: ['The pieces are different sizes, so make them match first. ' + it.steps[0], 'Now the pieces are the same size. ' + (add ? 'Add' : 'Take away') + ' the top numbers. ' + it.steps[1]], check: null };
    },
    F512(it) {
      const fr = it.frac;
      if (!fr || it.steps.length !== 2) return null;
      const [a, b] = fr;
      const meaning = ['A fraction can show sharing. ' + a + ' ÷ ' + b + ' means ' + a + ' shared by ' + b + '.'];
      if (/^\d+ ÷ \d+ = /.test(it.prompt)) return { meaning, say: ['Share ' + plural(a, 'whole', 'wholes') + ' among ' + b + '. Cut each whole into ' + b + ' equal pieces.', 'Each share gets ' + plural(a, 'piece', 'pieces') + ' of size 1/' + b + '. ' + it.steps[1]], check: null };
      return { meaning, say: ['Share fairly. ' + it.steps[0], 'Count the pieces one friend gets. ' + it.steps[1]], check: null };
    },
    F513(it) {
      if (it.steps.length !== 2) return null;
      const of = /^(\d+)\/(\d+) of (\d+) = \?$/.exec(it.prompt);
      if (of) return { meaning: ['"Of" means times.', of[1] + '/' + of[2] + ' of ' + of[3] + ' means ' + of[1] + ' of ' + of[2] + ' equal parts of ' + of[3] + '.'], say: ['First find one part. ' + it.steps[0], 'We want ' + plural(+of[1], 'part', 'parts') + '. ' + it.steps[1]], check: null };
      const pr = /^(\d+)\/(\d+) × (\d+)\/(\d+) = /.exec(it.prompt);
      if (!pr) return null;
      return { meaning: [pr[1] + '/' + pr[2] + ' × ' + pr[3] + '/' + pr[4] + ' means ' + pr[1] + '/' + pr[2] + ' of ' + pr[3] + '/' + pr[4] + '.', 'Taking a part of a part makes smaller pieces.'], say: ['The pieces get smaller. ' + it.steps[0], 'Then count the pieces we take. ' + it.steps[1]], check: null };
    },
    F514(it) {
      if (it.steps.length !== 2) return null;
      const a = /^(\d+) ÷ 1\/(\d+) = \?$/.exec(it.prompt);
      if (a) return { meaning: [a[1] + ' ÷ 1/' + a[2] + ' asks: how many 1/' + a[2] + ' pieces fit in ' + a[1] + '?'], say: [it.steps[0], 'There ' + (a[1] === '1' ? 'is 1 whole' : 'are ' + a[1] + ' wholes') + ', and each holds ' + a[2] + ' pieces. ' + it.steps[1]], check: null };
      const b = /^1\/(\d+) ÷ (\d+) = 1\/\?$/.exec(it.prompt);
      if (!b) return null;
      return { meaning: ['Dividing a fraction by a whole number shares it into smaller pieces.'], say: [it.steps[0], 'Now each of the ' + b[1] + ' pieces in the whole is split into ' + b[2] + '. ' + it.steps[1]], check: null };
    },
    F515(it) {
      const m = /^A box is (\d+) cubes long, (\d+) cubes wide and (\d+) cubes tall\./.exec(it.prompt), v = Number(it.answer);
      if (!m || it.steps.length !== 2) return null;
      const [l, w, h] = [+m[1], +m[2], +m[3]];
      return { meaning: ['Volume is how many cubes fill a box.'], say: ['Look at the bottom layer. It has ' + l + ' cubes in each of ' + w + ' rows. ' + it.steps[0], 'There are ' + h + ' layers like that, one on top of another. ' + it.steps[1]], check: 'Check: ' + l + ' × ' + w + ' × ' + h + ' = ' + v + '.' };
    }
  });

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
