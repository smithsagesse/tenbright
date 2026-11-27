/* Tenbright math engine, MVP slice v0.1
 * The single source of math truth: every item, answer, worked step and
 * predicted wrong answer is computed here. No language model is involved.
 * Works in the browser (window.TBEngine) and in Node (module.exports).
 */
(function (root) {
  'use strict';

  // ---------- seeded random ----------
  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    const next = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
    return {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)]
    };
  }

  const digits = (n, places) => {
    const out = [];
    for (let i = 0; i < places; i++) { out.unshift(n % 10); n = Math.floor(n / 10); }
    return out; // most significant first
  };

  // ---------- misconception library (Phase 2, section 2, plus MVP additions) ----------
  const MISCONCEPTIONS = {
    M01: { name: 'Smaller-from-larger', parent: 'Takes the smaller digit from the larger one in each column instead of regrouping.', clue: 'A clue! Look at the ones. Are there enough on top to take the bottom ones away? If not, break a ten.' },
    M02: { name: 'Regroups but keeps the ten', parent: 'Breaks a ten into ones but forgets that one fewer ten is left.', clue: 'A clue! You broke one ten into ones. So there is one less ten now. How many tens are left?' },
    M04: { name: 'Zero minus a number', parent: 'Writes the bottom digit when the top digit is zero, instead of regrouping across the zero.', clue: 'A clue! We cannot take a number away from 0. Break one from the next place. If that place is 0 too, break a hundred first.' },
    M05: { name: 'No column limit', parent: 'Writes a two-digit column sum in one place instead of making a ten.', clue: 'A clue! One place can hold only 9. Make a ten from 10 of them and move it over.' },
    M06: { name: 'Lost the new ten', parent: 'Makes a ten from the ones but forgets to add it to the tens.', clue: 'A clue! You made a new ten from the ones. Add it to the tens too.' },
    M07: { name: 'Face value', parent: 'Reads a digit as its face value instead of its place value (the 7 in 372 as 7, not 70).', clue: 'A clue! Look at the place the digit is in. The place tells what it is worth.' },
    M08: { name: 'Dropped placeholder zero', parent: 'Leaves out a zero that holds an empty place (writes 35 for 305).', clue: 'A clue! Is any place empty? Write a 0 to hold its spot.' },
    M09: { name: 'Labels stuck together', parent: 'Writes place-value parts side by side (3 hundreds 4 tens 2 ones as 300402) instead of combining them.', clue: 'A clue! Write one digit for each place. Then read it as one number.' },
    M11: { name: 'Rounds by cutting off', parent: 'Rounds by dropping the last digit instead of choosing the closer ten or hundred.', clue: 'A clue! Rounding finds the closer ten or hundred. Which one is closer on the number line?' },
    M12: { name: 'Counts the starting number', parent: 'Counts the starting number when counting on, so the answer comes out one short.', clue: 'A clue! Start counting on the next number.' },
    M13: { name: 'Wrong order in subtraction', parent: 'Subtracts in the wrong direction in a word problem.', clue: 'A clue! Which amount is bigger? Start there.' },
    M14: { name: 'Keyword trap', parent: 'Picks the operation from a word like "more" instead of from the story.', clue: 'A clue! Draw the story first. Is a part missing, or the whole?' },
    M15: { name: 'Times as plus', parent: 'Adds the two numbers instead of multiplying (4 × 3 = 7).', clue: 'A clue! Times means equal groups. Count every group.' },
    M16: { name: 'Zero and one rules mixed up', parent: 'Treats × 0 as keeping the number, or × 1 as making 1.', clue: 'A clue! Groups with nothing in them make how many?' },
    M18: { name: 'Neighbor fact', parent: 'Gives the answer to a nearby fact, one group short or one group extra.', clue: 'A clue! Count the groups again. Start from a fact you know.' },
    MC1: { name: 'Complement from 10 in every place', parent: 'Takes every digit from 10 when subtracting from 100, so the tens come out one too big.', clue: 'A clue! Take each digit from 9. Only the last digit comes from 10.' },
    MN1: { name: 'Ticks counted as ones', parent: 'Counts each tick on a number line as 1 even when the ticks jump by 10.', clue: 'A clue! How much is each jump on this line?' },
    MN3: { name: 'Forgot to take one group away', parent: 'Uses × 10 for × 9 but forgets to subtract one group.', clue: 'A clue! 9 groups is 10 groups take away one group.' },
    MN4: { name: 'Subtracts to find a missing factor', parent: 'Subtracts or adds to find a missing factor instead of thinking about equal groups.', clue: 'A clue! How many groups of that number make the total?' },
    MN5: { name: 'Lost the zero', parent: 'Multiplies by a multiple of ten but drops the zero (4 × 60 = 24).', clue: 'A clue! The answer is a number of tens. A number of tens ends in 0.' },
    MN6: { name: 'Stopped after one step', parent: 'Does the first step of a two-step problem and stops.', clue: 'A clue! The story has two parts. Did you do both?' },
    // Grade 1
    MP1: { name: 'Adds in a missing-part problem', parent: 'Adds the numbers shown instead of finding the missing part (7 + ? = 10 answered 17).', clue: 'A clue! The total is already there. Which part is missing?' },
    ME1: { name: 'Equals means "the answer is"', parent: 'Reads = as "write the answer next" instead of "is the same amount as" (6 + 2 = 5 + ? answered 8).', clue: 'A clue! = means both sides are the same amount.' },
    M1T: { name: 'Changed the ones, not the tens', parent: 'Changes the ones digit when adding or taking away tens (34 + 10 answered 35).', clue: 'A clue! 10 is one ten. Which digit counts the tens?' },
    // Grade 3 to 5 fractions
    MF11: { name: 'Counted the other parts', parent: 'Counts the parts that are not shaded when naming a fraction.', clue: 'A clue! Count only the shaded parts for the top number.' },
    MF12: { name: 'Counted tick marks, not jumps', parent: 'Counts the tick marks on a number line, including 0, instead of the equal jumps.', clue: 'A clue! Count the jumps from 0, not the marks.' },
    MF1: { name: 'Adds to top and bottom', parent: 'Adds the same number to the top and bottom of a fraction to make an equivalent one (2/3 = 11/12).', clue: 'A clue! The bottom was multiplied. Do the same to the top.' },
    MF2: { name: 'Bigger bottom, bigger fraction', parent: 'Thinks a fraction with a bigger denominator is bigger (1/8 > 1/4).', clue: 'A clue! More pieces in the whole means each piece is smaller.' },
    MF3: { name: 'Adds the bottoms too', parent: 'Adds the denominators when adding fractions (1/5 + 2/5 = 3/10).', clue: 'A clue! The pieces stay the same size. Only count them.' },
    MF4: { name: 'Whole number added to the top', parent: 'Turns a mixed number into a fraction by adding the whole number to the top (2 1/4 = 3/4).', clue: 'A clue! Each whole is cut into pieces. How many pieces are in all the wholes?' },
    MF6: { name: 'Mixed tenths and hundredths', parent: 'Adds tenths and hundredths without changing tenths into hundredths first.', clue: 'A clue! 1 tenth is 10 hundredths. Change the tenths first.' },
    MF7: { name: 'Added tops without a common bottom', parent: 'Adds the numerators of fractions with different denominators without renaming them first.', clue: 'A clue! The pieces are different sizes. Make them the same size first.' },
    MF8: { name: 'Divided the other way', parent: 'Divides the larger number by the smaller one in a sharing problem (3 shared by 4 written as 4/3).', clue: 'A clue! Each person gets less than one whole. What goes on top?' },
    MF9: { name: 'Multiplied across the wrong way', parent: 'Multiplies the top of one fraction by the bottom of the other.', clue: 'A clue! Multiply top by top and bottom by bottom.' },
    MF10: { name: 'Made the pieces bigger', parent: 'Divides the denominator when dividing a unit fraction by a whole number, making pieces bigger instead of smaller.', clue: 'A clue! Sharing a piece makes smaller pieces. Does the bottom number grow?' },
    // decimals
    MD1: { name: 'Hundredths as tenths', parent: 'Writes a number of hundredths below 10 as tenths (7/100 written as 0.7).', clue: 'A clue! Hundredths need two places after the point.' },
    MD2: { name: 'Longer decimal is bigger', parent: 'Thinks the decimal with more digits is bigger (0.38 > 0.4).', clue: 'A clue! Compare tenths first, like comparing hundreds first.' },
    MD3: { name: 'Added zeros to a decimal', parent: 'Multiplies a decimal by 10, 100 or 1,000 by writing zeros at the end instead of moving the digits.', clue: 'A clue! Times 10, 100 or 1,000 moves every digit to the left. Move the digits, not just add zeros.' },
    MD4: { name: 'Tenths and hundredths swapped', parent: 'Mixes up the tenths and hundredths places.', clue: 'A clue! The first place after the point is tenths, the next is hundredths.' },
    MD5: { name: 'Lined up the last digits', parent: 'Lines up the last digits instead of the decimal points when adding or subtracting decimals.', clue: 'A clue! Line up the decimal points first.' },
    MD6: { name: 'Decimal point in the wrong place', parent: 'Multiplies or divides correctly but puts the decimal point in the wrong place.', clue: 'A clue! Count the decimal places. Does the size of the answer make sense?' },
    MD7: { name: 'Dividing always makes smaller', parent: 'Thinks dividing always makes a number smaller, so multiplies when dividing by a fraction or decimal under 1.', clue: 'A clue! How many of those small pieces fit in one whole?' },
    // grade 4 and 5 operations
    MX1: { name: 'Products written side by side', parent: 'Multiplies each digit but writes the products side by side instead of adding them with their place values.', clue: 'A clue! Each part has a place value. Add the parts together.' },
    MX2: { name: 'Only tens by tens and ones by ones', parent: 'Multiplies tens by tens and ones by ones but skips the two cross parts (23 × 45 = 815).', clue: 'A clue! The rectangle has four parts. Did you find all four?' },
    MR1: { name: 'Remainder too big', parent: 'Leaves a remainder as big as the divisor, so one more group would still fit.', clue: 'A clue! Could one more group fit in what is left?' },
    MY1: { name: 'Counted coins, not their value', parent: 'Counts how many coins there are instead of adding what each coin is worth.', clue: 'A clue! Each coin has its own value. Add the cents, not the coins.' },
    MY2: { name: 'Change digit by digit', parent: 'Finds change from a dollar by taking each digit from 10 instead of counting up to 100 cents.', clue: 'A clue! A dollar is 100 cents. Count up from the price to 100.' },
    MT1: { name: 'Clock hands swapped', parent: 'Reads the long hand as the hour and the short hand as the minutes.', clue: 'A clue! The short hand shows the hour. The long hand shows the minutes.' },
    MT2: { name: 'Next hour', parent: 'Reads the hour as the number the short hand is moving toward, not the one it has passed.', clue: 'A clue! The hour is the number the short hand has just passed.' },
    MT3: { name: 'Clock number as minutes', parent: 'Reads the number the long hand points to as the minutes, instead of counting by 5s.', clue: 'A clue! Each number on the clock is 5 more minutes. Count by 5s.' },
    MT4: { name: 'Time as hundreds', parent: 'Subtracts times like whole numbers, as if an hour had 100 minutes.', clue: 'A clue! An hour has 60 minutes, not 100. Count on to the next hour first.' },
    MM1: { name: 'Read the end, not the length', parent: 'Reads the number at the end of an object on a ruler instead of counting the units from where it starts.', clue: 'A clue! It does not start at 0. Count the units from the start to the end.' },
    MM2: { name: 'Only two sides', parent: 'Adds only the two given sides of a rectangle instead of all four for the perimeter.', clue: 'A clue! The perimeter goes all the way around. A rectangle has 4 sides.' },
    MM3: { name: 'Area and perimeter mixed', parent: 'Finds the distance around when the question asks for the squares inside, or the other way around.', clue: 'A clue! Area counts the squares inside. Perimeter is the distance around the edge.' },
    MG1: { name: 'Right angle as 100', parent: 'Treats a right angle as 100 degrees instead of 90.', clue: 'A clue! A right angle is 90 degrees, not 100.' },
    MG2: { name: 'Up before across', parent: 'Reads how far up a point is before how far across on a grid.', clue: 'A clue! Go across first, then up.' },
    MW1: { name: 'Revenue as profit', parent: 'Gives all the money that came in when the question asks for the profit left after costs.', clue: 'A clue! That is all the money in. What is left after costs?' },
    MW2: { name: 'Forgot a cost', parent: 'Takes away one cost but not another one in the story.', clue: 'A clue! Look again. Is there another cost?' },
    MW3: { name: 'Added the costs', parent: 'Adds the costs to the money that came in instead of taking them away.', clue: 'A clue! Costs are money going out. Take them away.' },
    MW4: { name: 'Growth added once', parent: 'Adds the first year\u2019s growth again instead of growing the new, bigger amount.', clue: 'A clue! This year the tenth is of the new amount.' },
    MW6: { name: 'Price, not the change', parent: 'Gives a price from the line when the question asks how much it changed.', clue: 'A clue! The question asks how much it changed. Take one price from the other.' },
    MW7: { name: 'Price, not the week', parent: 'Gives the highest price when the question asks which week.', clue: 'A clue! The question asks which week. Look below the highest point.' },
    MW5: { name: 'Whole instead of part', parent: 'Gives the whole company\u2019s profit to one owner instead of the owner\u2019s share of it.', clue: 'A clue! You own only some of the shares. Find your part.' },
    MO1: { name: 'Left to right only', parent: 'Works from left to right and ignores parentheses or the order of operations.', clue: 'A clue! Parentheses first, then times, then plus and minus.' }
  };

  // ---------- the 52-skill competency map (Phase 2, section 1) plus the T3 strategy ----------
  const S = (name, region, prereqs, ccss, extra) => Object.assign({ name, region, prereqs, ccss }, extra || {});
  // Grade 1 (added): number sense and facts that the Grade 2 skills build on
  const SKILLS_G1 = {
    C101: S('Count to 120', 'meadows', [], '1.NBT.A.1'),
    C102: S('Add within 10', 'river', [], '1.OA.C.6'),
    C103: S('Subtract within 10', 'river', ['C102'], '1.OA.C.6'),
    C104: S('Pairs that make 10', 'river', ['C102'], '1.OA.C.6'),
    C105: S('Doubles and near doubles', 'river', ['C102'], '1.OA.C.6'),
    C106: S('Add three numbers', 'river', ['C104'], '1.OA.B.3'),
    C107: S('Find the missing number', 'river', ['C104', 'C103'], '1.OA.D.8'),
    C108: S('What the equal sign means', 'village', ['C107'], '1.OA.D.7'),
    C109: S('Tens and ones', 'meadows', ['C101'], '1.NBT.B.2'),
    C110: S('Compare 2-digit numbers', 'meadows', ['C109'], '1.NBT.B.3'),
    C111: S('10 more and 10 less', 'meadows', ['C109'], '1.NBT.C.5'),
    C112: S('Add tens and ones to a 2-digit number', 'river', ['C109', 'C102'], '1.NBT.C.4'),
    C113: S('Subtract multiples of 10', 'river', ['C111'], '1.NBT.C.6'),
    C114: S('Story problems within 20', 'bridge', ['C102', 'C103'], '1.OA.A.1')
  };
  const SKILLS_CORE = {
    PV01: S('10 ones make 1 ten', 'meadows', [], '2.NBT.A.1a'),
    PV02: S('10 tens make 1 hundred', 'meadows', ['PV01'], '2.NBT.A.1b'),
    PV03: S('Read and build 3-digit numbers', 'meadows', ['PV02'], '2.NBT.A.1'),
    PV04: S('Value of a digit by its place', 'meadows', ['PV03'], '2.NBT.A.1'),
    PV05: S('Expanded form', 'meadows', ['PV04'], '2.NBT.A.3'),
    PV06: S('Number names to 1,000', 'meadows', ['PV03'], '2.NBT.A.3'),
    PV07: S('Count and skip-count by 5, 10, 100', 'meadows', ['PV03'], '2.NBT.A.2'),
    PV08: S('Zero as a placeholder', 'meadows', ['PV04'], '2.NBT.A.1'),
    PV09: S('Flexible tens and ones', 'meadows', ['PV05'], '2.NBT.A.1'),
    PV10: S('Compare 3-digit numbers', 'meadows', ['PV04'], '2.NBT.A.4'),
    PV11: S('Numbers on a number line', 'meadows', ['PV07'], '2.MD.B.6'),
    PV12: S('Add or subtract 10 or 100', 'meadows', ['PV04', 'PV07'], '2.NBT.B.8'),
    PV13: S('Round to the nearest 10', 'meadows', ['PV11'], '3.NBT.A.1'),
    PV14: S('Round to the nearest 100', 'meadows', ['PV13'], '3.NBT.A.1'),
    AS01: S('Add and subtract within 20', 'river', [], '2.OA.B.2'),
    AS02: S('Make-ten strategy', 'river', ['AS01'], '2.OA.B.2'),
    AS03: S('Fact families', 'river', ['AS01'], '2.OA.B.2'),
    AS04: S('Add 2-digit numbers, no regrouping', 'river', ['PV04', 'AS01'], '2.NBT.B.5'),
    AS05: S('Add 2-digit numbers by making a ten', 'river', ['AS04', 'PV01', 'AS02'], '2.NBT.B.5'),
    AS06: S('Subtract 2-digit numbers, no regrouping', 'river', ['PV04', 'AS03'], '2.NBT.B.5'),
    AS07: S('Subtract 2-digit numbers by breaking a ten', 'river', ['AS06', 'PV09'], '2.NBT.B.5'),
    AS08: S('Add up to four 2-digit numbers', 'river', ['AS05'], '2.NBT.B.6'),
    AS09: S('Compensation: use a friendly number', 'river', ['AS05'], '2.NBT.B.9'),
    AS10: S('Count up to find a difference', 'river', ['AS07', 'PV11'], '2.NBT.B.9'),
    AS11: S('Add 3-digit numbers with regrouping', 'river', ['AS05', 'PV02'], '2.NBT.B.7'),
    AS12: S('Subtract 3-digit numbers with regrouping', 'river', ['AS07', 'PV09'], '2.NBT.B.7'),
    AS13: S('Subtract across zeros', 'river', ['AS12', 'PV08'], '3.NBT.A.2'),
    AS14: S('Standard algorithm for addition', 'river', ['AS11'], '3.NBT.A.2'),
    AS15: S('Standard algorithm for subtraction', 'river', ['AS12', 'AS13'], '3.NBT.A.2'),
    AS16: S('Estimate and check', 'river', ['PV13', 'PV14', 'AS14'], '3.OA.D.8'),
    AS17: S('Explain why a strategy works', 'river', ['AS09', 'AS14'], '2.NBT.B.9'),
    MU01: S('Odd and even by pairing', 'orchard', ['AS01'], '2.OA.C.3'),
    MU02: S('Arrays as repeated addition', 'orchard', ['AS08'], '2.OA.C.4'),
    MU03: S('Multiply as equal groups', 'orchard', ['MU02'], '3.OA.A.1'),
    MU04: S('Skip-count to multiply', 'orchard', ['MU03', 'PV07'], '3.OA.A.1'),
    MU05: S('Turn-around facts', 'orchard', ['MU03'], '3.OA.B.5'),
    MU06: S('Facts with 2, 5 and 10', 'orchard', ['MU04'], '3.OA.C.7'),
    MU07: S('Facts with 0 and 1', 'orchard', ['MU03'], '3.OA.B.5'),
    MU08: S('Doubling: facts with 4 and 8', 'orchard', ['MU06'], '3.OA.B.5'),
    MU09: S('Facts with 3 and 6', 'orchard', ['MU06', 'MU08'], '3.OA.C.7'),
    MU10: S('Facts with 9: ten groups take away one', 'orchard', ['MU06'], '3.OA.B.5'),
    MU11: S('Facts with 7: split into 5 and 2', 'orchard', ['MU06'], '3.OA.B.5'),
    MU12: S('Square facts and the rest', 'orchard', ['MU09', 'MU10', 'MU11'], '3.OA.C.7'),
    MU13: S('Find the missing factor', 'orchard', ['MU12'], '3.OA.A.4'),
    MU14: S('Multiply by multiples of 10', 'orchard', ['MU06', 'PV04'], '3.NBT.A.3'),
    MU15: S('Patterns in the times table', 'orchard', ['MU12'], '3.OA.D.9'),
    MU16: S('All facts to 10 × 10', 'orchard', ['MU12'], '3.OA.C.7'),
    WP01: S('Join and separate stories', 'bridge', ['AS04', 'AS06'], '2.OA.A.1'),
    WP02: S('Part-part-whole stories', 'bridge', ['AS03'], '2.OA.A.1'),
    WP03: S('Compare stories', 'bridge', ['AS10'], '2.OA.A.1'),
    WP04: S('Equal-groups stories', 'bridge', ['MU03'], '3.OA.A.3'),
    WP05: S('Two-step stories', 'bridge', ['WP01', 'WP02', 'WP03'], '3.OA.D.8'),
    T3:   S('All from 9 and the last from 10', 'village', ['AS07'], '2.NBT.B.9', { strategy: true })
  };
  // Grade 3 fractions (added so Grade 4 fractions have their foundation)
  const SKILLS_G3F = {
    F301: S('Fractions of a whole', 'falls', ['MU03'], '3.NF.A.1'),
    F302: S('Fractions on a number line', 'falls', ['F301'], '3.NF.A.2')
  };
  // Grade 4 (added)
  const SKILLS_G4 = {
    F401: S('Place value to a million', 'meadows', ['PV04', 'PV12'], '4.NBT.A.2'),
    F402: S('Compare big numbers', 'meadows', ['F401', 'PV10'], '4.NBT.A.2'),
    F403: S('Round big numbers', 'meadows', ['F401', 'PV14'], '4.NBT.A.3'),
    F404: S('Add and subtract big numbers', 'river', ['AS14', 'AS15', 'F401'], '4.NBT.B.4'),
    F405: S('Multiply by a 1-digit number', 'orchard', ['MU14', 'MU16'], '4.NBT.B.5'),
    F406: S('Multiply 2-digit by 2-digit', 'orchard', ['F405'], '4.NBT.B.5'),
    F407: S('Divide with remainders', 'orchard', ['MU13'], '4.NBT.B.6'),
    F408: S('Divide by a 1-digit number', 'orchard', ['F407', 'F405'], '4.NBT.B.6'),
    F409: S('Factors and multiples', 'orchard', ['MU13'], '4.OA.B.4'),
    F410: S('Prime or composite', 'orchard', ['F409'], '4.OA.B.4'),
    F411: S('Times as many', 'bridge', ['MU16', 'WP04'], '4.OA.A.2'),
    F412: S('Number patterns', 'village', ['MU04', 'AS14'], '4.OA.C.5'),
    F413: S('Equivalent fractions', 'falls', ['F302', 'MU16'], '4.NF.A.1'),
    F414: S('Compare fractions', 'falls', ['F413'], '4.NF.A.2'),
    F415: S('Add and subtract fractions', 'falls', ['F302'], '4.NF.B.3'),
    F416: S('Mixed numbers', 'falls', ['F415', 'MU16'], '4.NF.B.3'),
    F417: S('Fraction times a whole number', 'falls', ['F415', 'MU16'], '4.NF.B.4'),
    F418: S('Tenths, hundredths and decimals', 'docks', ['F413', 'PV04'], '4.NF.C.6'),
    F419: S('Compare decimals', 'docks', ['F418'], '4.NF.C.7')
  };
  // Grade 5 (added)
  const SKILLS_G5 = {
    F501: S('Expressions with parentheses', 'village', ['MU16', 'AS14'], '5.OA.A.1'),
    F502: S('Multiply and divide by 10, 100, 1,000', 'meadows', ['F401', 'F418'], '5.NBT.A.2'),
    F503: S('Decimals to thousandths', 'docks', ['F418'], '5.NBT.A.3'),
    F504: S('Compare decimals to thousandths', 'docks', ['F503', 'F419'], '5.NBT.A.3'),
    F505: S('Round decimals', 'docks', ['F503', 'F403'], '5.NBT.A.4'),
    F506: S('Multiply multi-digit numbers', 'orchard', ['F406'], '5.NBT.B.5'),
    F507: S('Divide by a 2-digit number', 'orchard', ['F408', 'F506'], '5.NBT.B.6'),
    F508: S('Add and subtract decimals', 'docks', ['F503', 'F404'], '5.NBT.B.7'),
    F509: S('Multiply decimals', 'docks', ['F508', 'F502'], '5.NBT.B.7'),
    F510: S('Divide decimals', 'docks', ['F509'], '5.NBT.B.7'),
    F511: S('Add and subtract unlike fractions', 'falls', ['F414', 'F415'], '5.NF.A.1'),
    F512: S('Fractions as division', 'falls', ['F416', 'F407'], '5.NF.B.3'),
    F513: S('Multiply fractions', 'falls', ['F417', 'F413'], '5.NF.B.4'),
    F514: S('Divide with unit fractions', 'falls', ['F513', 'F512'], '5.NF.B.7'),
    F515: S('Volume of a box', 'orchard', ['F406'], '5.MD.C.5')
  };
  // Grade 1 skills lead into the Grade 2 map
  [['PV01', 'C109'], ['AS01', 'C105'], ['AS01', 'C107'], ['PV10', 'C110'], ['PV12', 'C111'], ['AS04', 'C112'], ['AS06', 'C113'], ['WP01', 'C114']].forEach(([id, pre]) => SKILLS_CORE[id].prereqs.push(pre));
  // Tenbright 2.0 Phase 7: money (coins as math objects, never a reward) and time
  const SKILLS_P7 = {
    MY01: S('Coin values', 'market', ['C104'], '2.MD.C.8'),
    MY02: S('Count coins', 'market', ['MY01', 'PV07'], '2.MD.C.8'),
    MY03: S('Money stories', 'market', ['MY02', 'AS05'], '2.MD.C.8'),
    MY04: S('Make change from a dollar', 'market', ['MY03', 'AS10'], '4.MD.A.2'),
    TM01: S('Hour and half hour', 'clock', ['C101'], '1.MD.B.3'),
    TM02: S('Time to 5 minutes', 'clock', ['TM01', 'PV07'], '2.MD.C.7'),
    TM03: S('Time to the minute', 'clock', ['TM02'], '3.MD.A.1'),
    TM04: S('How much time passed', 'clock', ['TM03', 'AS10'], '3.MD.A.1'),
    // measurement and geometry
    MS01: S('Measure with a ruler', 'workshop', ['C101'], '2.MD.A.1'),
    MS02: S('Compare lengths', 'workshop', ['MS01', 'AS10'], '2.MD.A.4'),
    MS03: S('Perimeter', 'workshop', ['MS01', 'AS05'], '3.MD.D.8'),
    MS04: S('Area of a rectangle', 'workshop', ['MS03', 'MU03'], '3.MD.C.7'),
    GE01: S('Name shapes by their sides', 'shapes', ['C101'], '2.G.A.1'),
    GE02: S('Angles that fit together', 'shapes', ['GE01', 'AS10'], '4.MD.C.7'),
    GE03: S('Points on a grid', 'shapes', ['GE01', 'PV07'], '5.G.A.2'),
    // Money & Wealth Adventures (owner approved Nov 26, 2026): the math of money, with pretend money only
    FN01: S('Price times quantity', 'market', ['MU06', 'MY03'], '3.OA.A.3'),
    FN02: S('Revenue, cost and profit', 'market', ['FN01', 'WP05'], '3.OA.D.8'),
    FN04: S('Saving plan: weeks to a goal', 'market', ['FN01', 'F408'], '4.OA.A.3'),
    FN03: S('Dollars and cents', 'market', ['F418', 'MY04'], '4.MD.A.2'),
    FN05: S('Share of a company', 'market', ['F417'], '4.NF.B.4'),
    FN06: S('Unit price', 'market', ['FN03', 'F510'], '5.NBT.B.7'),
    FN07: S('Growth year by year', 'market', ['F513', 'F404'], '5.NF.B.4'),
    FN08: S('Read a price line', 'market', ['GE03', 'F508'], '5.G.A.2')
  };
  const SKILLS = Object.assign({}, SKILLS_G1, SKILLS_CORE, SKILLS_G3F, SKILLS_G4, SKILLS_G5, SKILLS_P7);
  const SKILL_ORDER = Object.keys(SKILLS);

  // ---------- item generators ----------
  // Each returns { skill, format, prompt, a, b, op, answer, choices?, predicted:{Mxx:'answer'}, steps:[], model }
  function addPredictions(a, b, places) {
    const da = digits(a, places), db = digits(b, places);
    // M05: each column sum written whole, no carrying
    let m05 = '';
    for (let i = 0; i < places; i++) m05 += String(da[i] + db[i]);
    m05 = String(parseInt(m05, 10));
    // M06: carry ignored, each column mod 10
    let m06 = '';
    for (let i = 0; i < places; i++) m06 += String((da[i] + db[i]) % 10);
    m06 = String(parseInt(m06, 10));
    return { M05: m05, M06: m06 };
  }
  function subPredictions(a, b, places) {
    const da = digits(a, places), db = digits(b, places);
    // M01: |top - bottom| per column
    let m01 = '';
    for (let i = 0; i < places; i++) m01 += String(Math.abs(da[i] - db[i]));
    m01 = String(parseInt(m01, 10));
    // M02: regroups (adds 10 to a short column) but never decrements the next column
    let m02 = '';
    for (let i = 0; i < places; i++) {
      const top = da[i] < db[i] ? da[i] + 10 : da[i];
      m02 += String(top - db[i]);
    }
    m02 = String(parseInt(m02, 10));
    return { M01: m01, M02: m02 };
  }

  const GEN = {
    PV03(r) {
      const h = r.int(1, 9), t = r.pick([0, r.int(1, 9), r.int(1, 9)]), o = r.int(0, 9);
      const n = 100 * h + 10 * t + o;
      const fmt = r.pick(['count', 'build']);
      const predicted = {};
      if (t === 0) predicted.M08 = String(10 * h + o);
      if (fmt === 'build') {
        return { skill: 'PV03', format: 'build', prompt: 'Show ' + n + ' on the soroban.', target: n, answer: String(n), predicted, steps: [h + ' hundreds, ' + t + ' tens, ' + o + ' ones'], model: { type: 'soroban', value: 0 } };
      }
      return { skill: 'PV03', format: 'number', prompt: 'What number do the blocks show?', answer: String(n), predicted, steps: [h + ' hundreds is ' + 100 * h, t + ' tens is ' + 10 * t, o + ' ones is ' + o, 'Together: ' + n], model: { type: 'blocks', h, t, o } };
    },
    PV04(r) {
      let n, pos;
      do { n = r.int(101, 999); pos = r.int(0, 2); } while (digits(n, 3)[pos] === 0);
      const d = digits(n, 3)[pos];
      const value = d * [100, 10, 1][pos];
      const placeName = ['hundreds', 'tens', 'ones'][pos];
      const predicted = {};
      if (pos < 2) predicted.M07 = String(d);
      return { skill: 'PV04', format: 'number', prompt: 'What is the value of the ' + d + ' in ' + n + '?', highlight: { n, pos }, answer: String(value), predicted, steps: ['The ' + d + ' is in the ' + placeName + ' place.', d + ' ' + placeName + ' is ' + value + '.'], model: { type: 'blocks', h: digits(n, 3)[0], t: digits(n, 3)[1], o: digits(n, 3)[2] } };
    },
    PV10(r) {
      let a = r.int(100, 999), b = r.int(100, 999);
      const kind = r.int(0, 4);
      if (kind === 0) b = a; // equal case sometimes
      if (kind === 1) { b = digits(a, 3)[0] * 100 + r.int(0, 99); } // same hundreds
      const ans = a > b ? '>' : a < b ? '<' : '=';
      if (a !== b && r.next() < 0.4) {
        const big = Math.max(a, b), small = Math.min(a, b);
        return { skill: 'PV10', format: 'number', prompt: 'Type the greater number: ' + a + ' or ' + b + '?', a, b, answer: String(big), predicted: {}, steps: ['Compare hundreds first, then tens, then ones.', big + ' > ' + small], model: { type: 'compare', a, b } };
      }
      return { skill: 'PV10', format: 'choice', prompt: 'Which sign makes it true?', a, b, answer: ans, choices: ['<', '=', '>'], predicted: {}, steps: ['Compare hundreds first, then tens, then ones.', a + ' ' + ans + ' ' + b], model: { type: 'compare', a, b } };
    },
    PV12(r) {
      const step = r.pick([10, 100]);
      const op = r.pick(['+', '-']);
      let n;
      if (op === '+') n = r.int(100, 999 - step); else n = r.int(100 + step, 999);
      const answer = op === '+' ? n + step : n - step;
      const predicted = { M07: String(op === '+' ? n + step / 10 : n - step / 10) };
      return { skill: 'PV12', format: 'number', prompt: (op === '+' ? step + ' more than ' : step + ' less than ') + n + ' is?', a: n, b: step, op, answer: String(answer), predicted, steps: ['Only the ' + (step === 10 ? 'tens' : 'hundreds') + ' digit changes.', String(answer)], model: { type: 'blocks', h: digits(n, 3)[0], t: digits(n, 3)[1], o: digits(n, 3)[2] } };
    },
    AS04(r) {
      let a, b;
      do { a = r.int(10, 89); b = r.int(10, 89); } while ((a % 10) + (b % 10) > 9 || a + b > 99);
      return addItem('AS04', a, b, 2);
    },
    AS05(r) {
      let a, b;
      do { a = r.int(11, 89); b = r.int(11, 89); } while ((a % 10) + (b % 10) < 10 || a + b > 99);
      return addItem('AS05', a, b, 2);
    },
    AS06(r) {
      let a, b;
      do { a = r.int(20, 99); b = r.int(10, a - 1); } while ((a % 10) < (b % 10));
      return subItem('AS06', a, b, 2);
    },
    AS07(r) {
      let a, b;
      do { a = r.int(21, 99); b = r.int(11, a - 1); } while ((a % 10) >= (b % 10) || a - b < 10);
      return subItem('AS07', a, b, 2);
    },
    AS11(r) {
      let a, b;
      do { a = r.int(101, 899); b = r.int(101, 899); } while (a + b > 999 || ((a % 10) + (b % 10) < 10 && (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 10));
      return addItem('AS11', a, b, 3);
    },
    AS12(r) {
      let a, b;
      do { a = r.int(200, 999); b = r.int(101, a - 1); } while (!((a % 10) < (b % 10) || (Math.floor(a / 10) % 10) < (Math.floor(b / 10) % 10)) || a - b < 100 || hasZeroBorrow(a, b));
      return subItem('AS12', a, b, 3);
    },
    MU03(r) {
      let g, s;
      do { g = r.int(2, 5); s = r.int(2, 5); } while (g === 2 && s === 2);
      return { skill: 'MU03', format: 'number', prompt: g + ' groups of ' + s + '. How many in all?', a: g, b: s, op: '×', answer: String(g * s), predicted: { M15: String(g + s) }, steps: [g + ' × ' + s + ' means ' + g + ' groups of ' + s + '.', Array(g).fill(s).join(' + ') + ' = ' + g * s], model: { type: 'groups', g, s } };
    },
    MU06(r) {
      const f = r.pick([2, 5, 10]), x = r.int(1, 10);
      const [a, b] = r.next() < 0.5 ? [x, f] : [f, x];
      const predicted = {};
      if (a + b !== a * b) predicted.M15 = String(a + b);
      return { skill: 'MU06', format: 'number', prompt: a + ' × ' + b + ' = ?', a, b, op: '×', answer: String(a * b), predicted, steps: ['Skip-count by ' + f + ', ' + x + ' times.', String(a * b)], model: { type: 'array', rows: a, cols: b } };
    },
    T3(r) {
      const base = r.pick([100, 100, 1000]);
      let n;
      do { n = r.int(base === 100 ? 11 : 101, base - 1); } while (n % 10 === 0);
      const places = base === 100 ? 2 : 3;
      const d = digits(n, places);
      const correct = base - n;
      const wrong = d.map((x) => 10 - x).join('');
      const predicted = {};
      if (wrong !== String(correct)) predicted.MC1 = String(parseInt(wrong, 10));
      const work = d.map((x, i) => (i < places - 1 ? '9 − ' + x + ' = ' + (9 - x) : '10 − ' + x + ' = ' + (10 - x)));
      return { skill: 'T3', format: 'number', prompt: base + ' − ' + n + ' = ?', a: base, b: n, op: '−', answer: String(correct), predicted, steps: work.concat(['So ' + base + ' − ' + n + ' = ' + correct]), model: { type: 'complement', base, n } };
    }
  };

  // ---------- generators for the rest of the 52-skill map ----------
  const NAMES = ['Ava', 'Kofi', 'Mei', 'Diego', 'Amara', 'Liam', 'Priya', 'Noah', 'Zara', 'Mateo', 'Hana', 'Elijah', 'Sofia', 'Kai', 'Nia', 'Omar'];
  const THINGS = ['beads', 'stickers', 'shells', 'marbles', 'stamps', 'leaves', 'cards', 'acorns'];
  // the picture for each story object (src/art/obj/<key>.svg): the owner's rule, Nov 27, 2026 – show what is being learned
  const OBJ = { beads: 'bead', stickers: 'sticker', shells: 'shell', marbles: 'marble', stamps: 'stamp', leaves: 'leaf', cards: 'card', acorns: 'acorn',
    pizzas: 'pizza', pies: 'pie', 'loaves of bread': 'bread', melons: 'melon', pencil: 'pencil', sticker: 'sticker', ruler: 'ruler', marker: 'marker',
    book: 'book', 'toy car': 'toy-car', juice: 'juice', kite: 'kite', melon: 'melon', notebook: 'notebook', ball: 'ball', game: 'game', 'bike bell': 'bike-bell',
    'book set': 'book-set', pencils: 'pencil', stickers2: 'sticker', erasers: 'eraser', ribbon: 'ribbon', crayon: 'crayon', bags: 'bag', boxes: 'box', baskets: 'basket' };
  // the fewest coins and bills for an amount (cents / whole dollars), largest first
  const coinsFor = (c) => { const out = []; [25, 10, 5, 1].forEach((v) => { while (c >= v) { out.push(v); c -= v; } }); return out; };
  const billsFor = (d) => { const out = []; [20, 10, 5, 1].forEach((v) => { while (d >= v) { out.push(v); d -= v; } }); return out; };
  const blocksOf = (n) => ({ type: 'blocks', h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 });
  const num = (skill, prompt, answer, predicted, steps, model, extra) => {
    const p = {};
    Object.keys(predicted || {}).forEach((k) => { if (predicted[k] === null || predicted[k] === undefined) return; const v = normalize(String(predicted[k])); if (v !== String(answer) && !Object.values(p).includes(v)) p[k] = v; });
    return Object.assign({ skill, format: 'number', prompt, answer: String(answer), predicted: p, steps, model }, extra || {});
  };
  const textChoice = (skill, prompt, answer, wrong, steps, model, r) => {
    const choices = [answer].concat(wrong);
    for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
    return { skill, format: 'choice', textChoices: true, prompt, answer, choices, predicted: {}, steps, model };
  };
  const NAMES_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const NAMES_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function numberName(n) {
    const h = Math.floor(n / 100), rest = n % 100;
    const parts = [];
    if (h) parts.push(NAMES_ONES[h] + ' hundred');
    if (rest) parts.push(rest < 20 ? NAMES_ONES[rest] : NAMES_TENS[Math.floor(rest / 10)] + (rest % 10 ? '-' + NAMES_ONES[rest % 10] : ''));
    return parts.join(' ') || 'zero';
  }
  const roundTo = (n, b) => Math.floor((n + b / 2) / b) * b;

  Object.assign(GEN, {
    PV01(r) {
      const t = r.int(1, 8), o = r.int(10, 19);
      const n = 10 * t + o;
      return num('PV01', t + ' tens and ' + o + ' ones. How many in all?', n, { M09: String(t) + String(o) }, [o + ' ones make 1 ten and ' + (o - 10) + ' ones.', 'That is ' + (t + 1) + ' tens and ' + (o - 10) + ' ones.', 'Together: ' + n], { type: 'blocks', h: 0, t, o }, { a: t, b: o });
    },
    PV02(r) {
      const h = r.int(1, 7), t = r.int(10, 19);
      const n = 100 * h + 10 * t;
      return num('PV02', h + ' hundreds and ' + t + ' tens. What number is that?', n, { M09: String(h) + String(t) }, [t + ' tens make 1 hundred and ' + (t - 10) + ' tens.', 'That is ' + (h + 1) + ' hundreds and ' + (t - 10) + ' tens.', 'Together: ' + n], { type: 'blocks', h, t, o: 0 });
    },
    PV05(r) {
      const h = r.int(1, 9), t = r.pick([0, r.int(1, 9), r.int(1, 9)]), o = r.int(1, 9);
      const n = 100 * h + 10 * t + o;
      const parts = [100 * h].concat(t ? [10 * t] : []).concat([o]);
      return num('PV05', parts.join(' + ') + ' = ?', n, { M08: t === 0 ? String(10 * h + o) : null, M09: parts.join('') }, ['Hundreds: ' + h + ', tens: ' + t + ', ones: ' + o, String(n)], blocksOf(n));
    },
    PV06(r) {
      const h = r.int(1, 9), t = r.pick([0, r.int(1, 9)]), o = r.int(0, 9);
      const n = 100 * h + 10 * t + o;
      return num('PV06', 'Type the number: ' + numberName(n) + '.', n, { M08: t === 0 && o ? String(10 * h + o) : null, M09: String(100 * h) + (n % 100 ? String(n % 100) : '') }, [numberName(n) + ' is ' + h + ' hundreds, ' + t + ' tens, ' + o + ' ones.', String(n)], blocksOf(n));
    },
    PV07(r) {
      const step = r.pick([5, 10, 100]);
      let start;
      if (step === 100) start = r.int(1, 5) * 100 + r.pick([0, r.int(1, 99)]);
      else if (step === 10) start = r.int(10, 90) * 10 + r.int(0, 9);
      else start = r.int(10, 150) * 5;
      const seq = [start, start + step, start + 2 * step];
      const ans = start + 3 * step;
      return num('PV07', 'Count by ' + step + 's: ' + seq.join(', ') + ', ?', ans, { MN1: String(seq[2] + 1) }, ['Each jump adds ' + step + '.', seq[2] + ' + ' + step + ' = ' + ans], { type: 'numberline', from: start, step, marks: 4, arrowAt: null });
    },
    PV08(r) {
      const h = r.int(1, 9), o = r.int(1, 9);
      const n = 100 * h + o;
      return num('PV08', h + ' hundreds and ' + o + ' ones. What number is that?', n, { M08: String(10 * h + o), M09: String(100 * h) + String(o) }, ['There are no tens, so the tens place holds a zero.', String(n)], { type: 'blocks', h, t: 0, o });
    },
    PV09(r) {
      const n = r.int(120, 989);
      const t = Math.floor(n / 10), o = n % 10;
      return num('PV09', n + ' is how many tens and ' + o + ' ones?', t, { M07: String(t % 10) }, [n + ' has ' + Math.floor(n / 100) + ' hundreds and ' + (t % 10) + ' tens.', 'Each hundred is 10 tens, so that is ' + t + ' tens.'], blocksOf(n));
    },
    PV11(r) {
      const step = r.pick([10, 10, 100]);
      const from = step === 10 ? r.int(1, 8) * 100 : 0;
      const k = r.int(1, 9);
      const ans = from + k * step;
      return num('PV11', 'What number is at the arrow?', ans, { MN1: String(from + k) }, ['The line starts at ' + from + ' and each jump is ' + step + '.', k + ' jumps of ' + step + ' is ' + k * step + '.', from + ' + ' + k * step + ' = ' + ans], { type: 'numberline', from, step, marks: 11, arrowAt: k });
    },
    PV13(r) {
      let n;
      do { n = r.int(11, 989); } while (n % 10 === 0);
      const ans = roundTo(n, 10);
      return num('PV13', 'Round ' + n + ' to the nearest 10.', ans, { M11: String(Math.floor(n / 10) * 10) }, ['It is between ' + Math.floor(n / 10) * 10 + ' and ' + (Math.floor(n / 10) * 10 + 10) + '.', 'The ones digit is ' + (n % 10) + ', so it is closer to ' + ans + '.'], { type: 'numberline', from: Math.floor(n / 10) * 10, step: 1, marks: 11, arrowAt: n % 10 });
    },
    PV14(r) {
      let n;
      do { n = r.int(110, 989); } while (n % 100 === 0 || n % 100 === 50 && r.next() < 0.7);
      const ans = roundTo(n, 100);
      return num('PV14', 'Round ' + n + ' to the nearest 100.', ans, { M11: String(Math.floor(n / 100) * 100) }, ['It is between ' + Math.floor(n / 100) * 100 + ' and ' + (Math.floor(n / 100) * 100 + 100) + '.', 'Look at the tens: ' + (Math.floor(n / 10) % 10) + '. So it is closer to ' + ans + '.'], { type: 'numberline', from: Math.floor(n / 100) * 100, step: 10, marks: 11, arrowAt: (n % 100) / 10 });
    },
    AS01(r) {
      if (r.next() < 0.5) {
        const a = r.int(2, 12), b = r.int(2, 20 - a);
        return num('AS01', a + ' + ' + b + ' = ?', a + b, { M12: String(a + b - 1) }, ['Start at ' + a + ' and count on ' + b + '.', a + ' + ' + b + ' = ' + (a + b)], { type: 'tenframe', a, b }, { a, b, op: '+' });
      }
      const a = r.int(8, 20), b = r.int(2, a - 1);
      return num('AS01', a + ' − ' + b + ' = ?', a - b, { M12: String(a - b + 1) }, ['Start at ' + a + ' and count back ' + b + '.', a + ' − ' + b + ' = ' + (a - b)], { type: 'tenframe', a, b: 0 }, { a, b, op: '−' });
    },
    AS02(r) {
      const a = r.int(6, 9), b = r.int(11 - a, 9);
      const need = 10 - a;
      return num('AS02', a + ' + ' + b + ' = ?', a + b, { M12: String(a + b - 1) }, ['Take ' + need + ' from the ' + b + ' to make 10.', '10 + ' + (b - need) + ' = ' + (a + b)], { type: 'tenframe', a, b }, { a, b, op: '+' });
    },
    AS03(r) {
      const a = r.int(3, 9), b = r.int(3, 9), c = a + b;
      const k = r.int(0, 2);
      if (k === 0) return num('AS03', 'If ' + a + ' + ' + b + ' = ' + c + ', then ' + c + ' − ' + b + ' = ?', a, { M14: String(c + b) }, ['Adding and subtracting undo each other.', c + ' − ' + b + ' = ' + a], { type: 'bar', whole: c, parts: [a, b], unknown: 0 }, { a: c, b, op: '−' });
      if (k === 1) return num('AS03', 'If ' + a + ' + ' + b + ' = ' + c + ', then ' + c + ' − ' + a + ' = ?', b, { M14: String(c + a) }, ['Adding and subtracting undo each other.', c + ' − ' + a + ' = ' + b], { type: 'bar', whole: c, parts: [a, b], unknown: 1 }, { a: c, b: a, op: '−' });
      return num('AS03', a + ' + ? = ' + c, b, { M14: String(a + c) }, ['What do you add to ' + a + ' to make ' + c + '?', c + ' − ' + a + ' = ' + b], { type: 'bar', whole: c, parts: [a, b], unknown: 1 });
    },
    AS08(r) {
      const n = r.pick([3, 3, 4]);
      let xs, sum;
      do { xs = Array.from({ length: n }, () => r.int(11, 39)); sum = xs.reduce((s, x) => s + x, 0); } while (sum > 140 || xs.reduce((s, x) => s + x % 10, 0) < 10);
      const onesSum = xs.reduce((s, x) => s + x % 10, 0), tensSum = xs.reduce((s, x) => s + Math.floor(x / 10), 0);
      const noCarry = (tensSum % 10) * 10 + (onesSum % 10) + (tensSum >= 10 ? 100 : 0);
      return num('AS08', xs.join(' + ') + ' = ?', sum, { M06: String(noCarry), M05: String(tensSum) + String(onesSum) }, ['Ones: ' + xs.map((x) => x % 10).join(' + ') + ' = ' + onesSum, 'Tens: ' + xs.map((x) => Math.floor(x / 10)).join(' + ') + ' = ' + tensSum + ' tens', tensSum * 10 + ' + ' + onesSum + ' = ' + sum], { type: 'addlist', xs }, { op: '+', list: xs });
    },
    AS09(r) {
      let a, b;
      do { a = r.int(1, 8) * 10 + r.pick([8, 9]); b = r.int(11, 79); } while (a + b > 99 || (a % 10) + (b % 10) < 10);
      const up = 10 - (a % 10);
      if (r.next() < 0.45) {
        return textChoice('AS09', a + ' + ' + b + ' is the same as which?', (a + up) + ' + ' + (b - up), [(a + up) + ' + ' + (b + up), (a - (a % 10)) + ' + ' + b, (a + up) + ' + ' + b], ['Give ' + up + ' from ' + b + ' to ' + a + '.', a + ' + ' + up + ' = ' + (a + up) + ' and ' + b + ' − ' + up + ' = ' + (b - up) + '.'], { type: 'numberline', from: a - (a % 10), step: 1, marks: 11, arrowAt: a % 10 }, r);
      }
      const it = addItem('AS09', a, b, 2);
      it.steps = ['Make ' + a + ' a friendly number: ' + a + ' + ' + up + ' = ' + (a + up) + '.', 'Take ' + up + ' from ' + b + ': ' + (b - up) + '.', (a + up) + ' + ' + (b - up) + ' = ' + (a + b)];
      return it;
    },
    AS10(r) {
      let a, b;
      do { b = r.int(31, 95); a = r.int(12, b - 11); } while ((b % 10) >= (a % 10));
      const it = subItem('AS10', b, a, 2);
      const toTen = 10 - (a % 10), nextTen = a + toTen;
      it.prompt = 'How far is it from ' + a + ' to ' + b + '?';
      it.steps = ['Hop from ' + a + ' to ' + nextTen + ': ' + toTen + '.', 'Hop from ' + nextTen + ' to ' + b + ': ' + (b - nextTen) + '.', toTen + ' + ' + (b - nextTen) + ' = ' + (b - a)];
      it.model = { type: 'numberline', from: Math.floor(a / 10) * 10, step: 10, marks: Math.ceil(b / 10) - Math.floor(a / 10) + 1, arrowAt: null, hops: [a, nextTen, b] };
      it.predicted.M14 = String(a + b);
      return it;
    },
    AS13(r) {
      let a, b;
      do {
        const h = r.int(2, 9);
        a = r.next() < 0.6 ? h * 100 : h * 100 + r.int(1, 9);
        b = r.int(101, a - 1);
      } while (a - b < 10 || (b % 10) <= (a % 10) || (Math.floor(b / 10) % 10) === 0);
      const it = subItem('AS13', a, b, 3);
      const da = digits(a, 3), db = digits(b, 3);
      let m04 = '';
      for (let i = 0; i < 3; i++) m04 += String(da[i] === 0 ? db[i] : Math.abs(da[i] - db[i]));
      const v = String(parseInt(m04, 10));
      if (v !== it.answer && !Object.values(it.predicted).includes(v)) it.predicted.M04 = v;
      return it;
    },
    AS14(r) {
      let a, b;
      do { a = r.int(100, 899); b = r.int(10, 899); } while (a + b > 999);
      return addItem('AS14', a, b, 3);
    },
    AS15(r) {
      let a, b;
      do { a = r.int(200, 999); b = r.int(10, a - 10); } while (a - b < 10);
      const it = subItem('AS15', a, b, 3);
      return it;
    },
    AS16(r) {
      let a, b;
      do { a = r.int(110, 790); b = r.int(110, 790); } while (a + b > 999 || a % 100 === 50 || b % 100 === 50);
      const est = roundTo(a, 100) + roundTo(b, 100);
      return num('AS16', 'Round each number to the nearest 100, then add. About how much is ' + a + ' + ' + b + '?', est, { M11: String(Math.floor(a / 100) * 100 + Math.floor(b / 100) * 100) }, [a + ' rounds to ' + roundTo(a, 100) + '. ' + b + ' rounds to ' + roundTo(b, 100) + '.', roundTo(a, 100) + ' + ' + roundTo(b, 100) + ' = ' + est, 'The exact answer, ' + (a + b) + ', is close to ' + est + ', so it makes sense.'], { type: 'compare', a, b });
    },
    AS17(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        let a, b;
        do { a = r.int(11, 79); b = r.int(11, 79); } while ((a % 10) + (b % 10) < 10 || a + b > 99);
        const s = (a % 10) + (b % 10);
        return textChoice('AS17', 'In ' + a + ' + ' + b + ', the ones make ' + s + '. Why do we write a 1 in the tens?', 'Because ' + s + ' ones is 1 ten and ' + (s - 10) + ' ones', ['Because we always write a 1 there', 'Because ' + s + ' has a 1 at the front', 'Because the tens are bigger'], ['Ten ones are the same amount as one ten.', s + ' ones = 1 ten and ' + (s - 10) + ' ones.'], { type: 'add', a, b, places: 2 }, r);
      }
      if (k === 1) {
        let a, b;
        do { a = r.int(31, 99); b = r.int(11, a - 10); } while ((a % 10) >= (b % 10));
        return textChoice('AS17', 'In ' + a + ' − ' + b + ', why do we break a ten?', 'Because ' + (a % 10) + ' ones is not enough to take ' + (b % 10) + ' away', ['Because subtracting always needs it', 'Because ' + a + ' is bigger than ' + b, 'Because the answer must be even'], ['We need more ones, so we trade 1 ten for 10 ones.'], { type: 'sub', a, b, places: 2 }, r);
      }
      let a, b;
      do { a = r.int(31, 79); b = r.int(11, 49); } while ((a % 10) + (b % 10) < 10 || a + b > 99);
      const s = (a % 10) + (b % 10);
      return num('AS17', 'In ' + a + ' + ' + b + ', the ones make ' + s + '. How many tens move to the tens place?', 1, { M05: String(s) }, [s + ' ones is 1 ten and ' + (s - 10) + ' ones.', 'The 1 ten moves to the tens place.'], { type: 'add', a, b, places: 2 });
    },
    MU01(r) {
      const n = r.int(6, 30);
      if (r.next() < 0.5 && n % 2 === 0) return num('MU01', n + ' children make pairs. How many pairs?', n / 2, { M15: String(n * 2) }, [n + ' is even: everyone has a partner.', n + ' ÷ 2 = ' + n / 2], { type: 'pairs', n });
      return textChoice('MU01', 'Is ' + n + ' odd or even?', n % 2 === 0 ? 'even' : 'odd', [n % 2 === 0 ? 'odd' : 'even'], [n % 2 === 0 ? 'Every dot has a partner, so it is even.' : 'One dot is left over, so it is odd.'], { type: 'pairs', n }, r);
    },
    MU02(r) {
      let rows, cols;
      do { rows = r.int(2, 5); cols = r.int(2, 6); } while (rows === 2 && cols === 2);
      return num('MU02', rows + ' rows of ' + cols + '. How many dots?', rows * cols, { M15: String(rows + cols) }, [Array(rows).fill(cols).join(' + ') + ' = ' + rows * cols], { type: 'array', rows, cols }, { a: rows, b: cols, op: '×' });
    },
    MU04(r) {
      const f = r.pick([2, 3, 4, 5, 10]), x = r.int(2, 9);
      const seq = Array.from({ length: x }, (_, i) => f * (i + 1));
      return num('MU04', 'Skip-count by ' + f + ', ' + x + ' times. Where do you land?', f * x, { M15: String(f + x), M18: String(f * (x - 1)) }, ['Count: ' + seq.join(', '), x + ' × ' + f + ' = ' + f * x], { type: 'numberline', from: 0, step: f, marks: x + 1, arrowAt: null, hops: seq }, { a: x, b: f, op: '×' });
    },
    MU05(r) {
      let a, b;
      do { a = r.int(2, 9); b = r.int(2, 9); } while (a === b || (a === 2 && b === 2));
      return num('MU05', a + ' × ' + b + ' = ' + a * b + '. So ' + b + ' × ' + a + ' = ?', a * b, { M15: String(a + b) }, ['Turn the array on its side: same dots.', b + ' × ' + a + ' = ' + a * b], { type: 'array', rows: b, cols: a }, { a: b, b: a, op: '×' });
    },
    MU07(r) {
      const z = r.pick([0, 1]), x = r.int(2, 10);
      const [a, b] = r.next() < 0.5 ? [x, z] : [z, x];
      return num('MU07', a + ' × ' + b + ' = ?', a * b, { M16: String(z === 0 ? x : 1), M15: String(a + b) }, [z === 0 ? 'Groups with nothing in them make 0.' : 'One group of ' + x + ' is ' + x + '.', a + ' × ' + b + ' = ' + a * b], z === 0 ? { type: 'groups', g: Math.max(a, 1), s: 0 } : { type: 'groups', g: a, s: b }, { a, b, op: '×' });
    },
    MU08(r) { return factItem('MU08', r.pick([4, 8]), r.int(2, 10), r); },
    MU09(r) { return factItem('MU09', r.pick([3, 6]), r.int(2, 10), r); },
    MU10(r) {
      const it = factItem('MU10', 9, r.int(2, 10), r);
      const x = it.a === 9 ? it.b : it.a;
      if (String(10 * x) !== it.answer) it.predicted.MN3 = String(10 * x);
      it.steps = ['10 × ' + x + ' = ' + 10 * x + '.', 'Take away one group of ' + x + ': ' + 10 * x + ' − ' + x + ' = ' + 9 * x];
      return it;
    },
    MU11(r) {
      const it = factItem('MU11', 7, r.int(2, 10), r);
      const x = it.a === 7 ? it.b : it.a;
      it.steps = ['Split 7 into 5 and 2.', '5 × ' + x + ' = ' + 5 * x + ' and 2 × ' + x + ' = ' + 2 * x + '.', 5 * x + ' + ' + 2 * x + ' = ' + 7 * x];
      return it;
    },
    MU12(r) {
      const a = r.int(3, 9), b = r.next() < 0.3 ? a : r.int(3, 9);
      return factItem('MU12', a, b, r, true);
    },
    MU13(r) {
      const a = r.int(2, 9), x = r.int(2, 9);
      const p = a * x;
      return num('MU13', a + ' × ? = ' + p, x, { MN4: String(p - a) }, ['How many groups of ' + a + ' make ' + p + '?', a + ' × ' + x + ' = ' + p + ', so ? = ' + x], { type: 'array', rows: x, cols: a }, { a: p, b: a, op: '÷' });
    },
    MU14(r) {
      const a = r.int(2, 9), t = r.int(2, 9);
      return num('MU14', a + ' × ' + t * 10 + ' = ?', a * t * 10, { MN5: String(a * t), M15: String(a + t * 10) }, [t * 10 + ' is ' + t + ' tens.', a + ' × ' + t + ' tens = ' + a * t + ' tens = ' + a * t * 10], { type: 'blocks', h: 0, t: Math.min(t, 9), o: 0 }, { a, b: t * 10, op: '×' });
    },
    MU15(r) {
      const a = r.int(2, 9), b = r.int(2, 9);
      if (r.next() < 0.5) {
        const p = a * b;
        return textChoice('MU15', 'Is ' + a + ' × ' + b + ' odd or even?', p % 2 === 0 ? 'even' : 'odd', [p % 2 === 0 ? 'odd' : 'even'], [a % 2 === 0 || b % 2 === 0 ? 'Times an even number is always even.' : 'Odd times odd is odd.', a + ' × ' + b + ' = ' + p], { type: 'array', rows: a, cols: b }, r);
      }
      const x = r.int(2, 10), p = 9 * x;
      const ds = String(p).split('').reduce((s, d) => s + Number(d), 0);
      return num('MU15', 'In the 9s table, 9 × ' + x + ' = ' + p + '. Add its digits. What do you get?', ds, {}, [String(p).split('').join(' + ') + ' = ' + ds, 'The digits of 9s facts up to 9 × 10 add to 9.'], { type: 'array', rows: Math.min(x, 9), cols: 9 });
    },
    MU16(r) { return factItem('MU16', r.int(2, 10), r.int(2, 10), r, true); },
    WP01(r) {
      const name = r.pick(NAMES), thing = r.pick(THINGS);
      const start = r.int(15, 60), change = r.int(8, 35);
      const k = r.int(0, 2);
      if (k === 0) return num('WP01', name + ' had ' + start + ' ' + thing + '. ' + name + ' found ' + change + ' more. How many ' + thing + ' now?', start + change, { M14: String(Math.abs(start - change)) }, ['Start ' + start + ', add ' + change + '.', start + ' + ' + change + ' = ' + (start + change)], { type: 'bar', obj: OBJ[thing], whole: start + change, parts: [start, change], unknown: -1 });
      if (k === 1) { const s2 = start + change; return num('WP01', name + ' had ' + s2 + ' ' + thing + ' and gave away ' + change + '. How many are left?', start, { M14: String(s2 + change) }, ['Start ' + s2 + ', take away ' + change + '.', s2 + ' − ' + change + ' = ' + start], { type: 'bar', obj: OBJ[thing], whole: s2, parts: [start, change], unknown: 0 }); }
      const end = start + change;
      return num('WP01', name + ' had ' + start + ' ' + thing + ', then found some more. Now there are ' + end + '. How many more did ' + name + ' find?', change, { M14: String(start + end) }, ['The whole is ' + end + ' and one part is ' + start + '.', end + ' − ' + start + ' = ' + change], { type: 'bar', obj: OBJ[thing], whole: end, parts: [start, change], unknown: 1 });
    },
    WP02(r) {
      const thing = r.pick(THINGS);
      const p1 = r.int(12, 60), p2 = r.int(12, 39);
      if (r.next() < 0.5) return num('WP02', 'A box has ' + p1 + ' red ' + thing + ' and ' + p2 + ' blue ' + thing + '. How many in all?', p1 + p2, { M14: String(Math.abs(p1 - p2)) }, ['Both parts make the whole.', p1 + ' + ' + p2 + ' = ' + (p1 + p2)], { type: 'bar', obj: OBJ[thing], whole: p1 + p2, parts: [p1, p2], unknown: -1 });
      return num('WP02', 'There are ' + (p1 + p2) + ' ' + thing + '. ' + p1 + ' are red and the rest are blue. How many are blue?', p2, { M14: String(p1 + p2 + p1) }, ['The whole is ' + (p1 + p2) + '. One part is ' + p1 + '.', (p1 + p2) + ' − ' + p1 + ' = ' + p2], { type: 'bar', obj: OBJ[thing], whole: p1 + p2, parts: [p1, p2], unknown: 1 });
    },
    WP03(r) {
      const n1 = r.pick(NAMES); let n2; do { n2 = r.pick(NAMES); } while (n2 === n1);
      const thing = r.pick(THINGS);
      const small = r.int(12, 50), diff = r.int(6, 30), big = small + diff;
      return num('WP03', n1 + ' has ' + big + ' ' + thing + '. ' + n2 + ' has ' + small + '. How many more does ' + n1 + ' have?', diff, { M14: String(big + small) }, ['Compare: find the difference.', big + ' − ' + small + ' = ' + diff], { type: 'compareBar', obj: OBJ[thing], big, small });
    },
    WP04(r) {
      const g = r.int(2, 9), s = r.int(2, 9);
      const box = r.pick(['bags', 'boxes', 'baskets', 'rows']);
      const thing = r.pick(THINGS);
      return num('WP04', 'There are ' + g + ' ' + box + ' with ' + s + ' ' + thing + ' in each. How many ' + thing + ' in all?', g * s, { M15: String(g + s) }, [g + ' groups of ' + s + '.', g + ' × ' + s + ' = ' + g * s], { type: 'groups', obj: OBJ[thing], g, s });
    },
    WP05(r) {
      const name = r.pick(NAMES), thing = r.pick(THINGS);
      const a = r.int(20, 60), b = r.int(10, 30), c = r.int(5, Math.min(a + b - 5, 40));
      return num('WP05', name + ' had ' + a + ' ' + thing + ', got ' + b + ' more, then gave ' + c + ' to a friend. How many now?', a + b - c, { MN6: String(a + b) }, ['Step 1: ' + a + ' + ' + b + ' = ' + (a + b) + '.', 'Step 2: ' + (a + b) + ' − ' + c + ' = ' + (a + b - c) + '.'], { type: 'bar', obj: OBJ[thing], whole: a + b, parts: [a, b], unknown: -1 });
    }
  });

  // money written with two decimal places (cents), from a whole number of cents
  const money = (cents) => Math.floor(cents / 100) + '.' + String(cents % 100).padStart(2, '0');
  // four weekly prices in whole dollars, with at least one rise and one fall, all different
  function priceWeeks(r) {
    let p;
    do { p = Array.from({ length: 4 }, () => r.int(3, 12)); } while (new Set(p).size < 4 || ![0, 1, 2].some((i) => p[i + 1] > p[i]) || ![0, 1, 2].some((i) => p[i + 1] < p[i]));
    return p;
  }
  const SHAPES = [{ n: 3, name: 'triangle' }, { n: 4, name: 'quadrilateral' }, { n: 5, name: 'pentagon' }, { n: 6, name: 'hexagon' }];
  const COINS = [{ v: 1, one: 'penny', many: 'pennies' }, { v: 5, one: 'nickel', many: 'nickels' }, { v: 10, one: 'dime', many: 'dimes' }, { v: 25, one: 'quarter', many: 'quarters' }];
  // read a clock: the short hand gives the hour it has passed, the long hand the minutes (5 for each number)
  function clockItem(skill, h, m, r) {
    const t = (hh, mm) => hh + ':' + String(mm).padStart(2, '0'), ans = t(h, m);
    const num5 = Math.floor(m / 5), extra = m % 5;
    const wrong = {};
    const swapped = num5 === 0 ? null : t(num5, h === 12 ? 0 : h * 5); // MT1
    const nextH = m >= 30 ? t(h === 12 ? 1 : h + 1, m) : null; // MT2
    const asNum = m % 5 === 0 && num5 > 0 && num5 < 10 ? t(h, num5) : null; // MT3
    if (swapped && swapped !== ans) wrong.MT1 = swapped;
    if (nextH && nextH !== ans) wrong.MT2 = nextH;
    if (asNum && asNum !== ans && !Object.values(wrong).includes(asNum)) wrong.MT3 = asNum;
    const pool = Object.values(wrong);
    for (let k = 0; pool.length < 3 && k < 20; k++) { const x = t(r.int(1, 12), skill === 'TM01' ? r.pick([0, 30]) : skill === 'TM02' ? r.int(0, 11) * 5 : r.int(0, 59)); if (x !== ans && !pool.includes(x)) pool.push(x); }
    const choices = [ans].concat(pool.slice(0, 3));
    for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
    const steps = ['The short hand shows the hour. It has passed ' + h + ', so the hour is ' + h + '.'];
    if (m === 0) steps.push('The long hand points straight up at 12. That means 0 minutes, o’clock.');
    else if (m === 30) steps.push('The long hand points down at 6. That is half past, 30 minutes.');
    else if (extra === 0) steps.push('The long hand points to ' + num5 + '. Count by 5s, once for each number. ' + num5 + ' × 5 = ' + m);
    else steps.push('The long hand is ' + extra + (extra === 1 ? ' mark' : ' marks') + ' past ' + (num5 || 12) + '. Count by 5s to ' + (num5 || 12) + ', then by 1s. ' + 5 * num5 + ' + ' + extra + ' = ' + m);
    // a typed answer too: how many minutes past the hour
    if (m > 0 && r.next() < 0.4) {
      steps.push('So it is ' + m + (m === 1 ? ' minute' : ' minutes') + ' past ' + h + '.');
      const p = {}; if (m % 5 === 0 && num5 > 0 && num5 !== m) p.MT3 = String(num5);
      return { skill, format: 'number', prompt: 'How many minutes past ' + h + ' is it?', answer: String(m), predicted: p, steps, model: { type: 'clock', h, m } };
    }
    steps.push('So the time is ' + ans + '.');
    return { skill, format: 'choice', textChoices: true, prompt: 'What time does the clock show?', answer: ans, choices, predicted: wrong, steps, model: { type: 'clock', h, m } };
  }
  function factItem(skill, f, x, r, any) {
    const [a, b] = any || r.next() < 0.5 ? [x, f] : [f, x];
    const predicted = { M15: String(a + b), M18: String(a * (b - 1)) };
    return num(skill, a + ' × ' + b + ' = ?', a * b, predicted, [a + ' groups of ' + b + '.', a + ' × ' + b + ' = ' + a * b], { type: 'array', rows: a, cols: b }, { a, b, op: '×' });
  }

  function hasZeroBorrow(a, b) {
    // keep AS12 free of subtract-across-zero cases (that is AS13, not in this slice)
    const da = digits(a, 3), db = digits(b, 3);
    return da[1] === 0 && da[2] < db[2];
  }

  function addItem(skill, a, b, places) {
    const da = digits(a, places), db = digits(b, places);
    const steps = [];
    let carry = 0;
    const names = ['thousands', 'hundreds', 'tens', 'ones'].slice(4 - places);
    for (let i = places - 1; i >= 0; i--) {
      const s = da[i] + db[i] + carry;
      steps.push(names[i] + ': ' + da[i] + ' + ' + db[i] + (carry ? ' + 1' : '') + ' = ' + s + (s > 9 ? ', make a ten' : ''));
      carry = s > 9 ? 1 : 0;
    }
    steps.push(a + ' + ' + b + ' = ' + (a + b));
    const predicted = addPredictions(a, b, places);
    Object.keys(predicted).forEach((k) => { if (predicted[k] === String(a + b)) delete predicted[k]; });
    return { skill, format: 'number', prompt: a + ' + ' + b + ' = ?', a, b, op: '+', answer: String(a + b), predicted, steps, model: { type: 'add', a, b, places } };
  }

  function subItem(skill, a, b, places) {
    const da = digits(a, places).slice(), db = digits(b, places);
    const names = ['thousands', 'hundreds', 'tens', 'ones'].slice(4 - places);
    const steps = [];
    for (let i = places - 1; i >= 0; i--) {
      if (da[i] < db[i]) {
        da[i - 1] -= 1; da[i] += 10;
        steps.push('Break a ' + names[i - 1].replace(/s$/, '') + ': ' + names[i] + ' become ' + da[i]);
      }
      steps.push(names[i] + ': ' + da[i] + ' − ' + db[i] + ' = ' + (da[i] - db[i]));
    }
    steps.push(a + ' − ' + b + ' = ' + (a - b));
    const predicted = subPredictions(a, b, places);
    Object.keys(predicted).forEach((k) => { if (predicted[k] === String(a - b)) delete predicted[k]; });
    return { skill, format: 'number', prompt: a + ' − ' + b + ' = ?', a, b, op: '−', answer: String(a - b), predicted, steps, model: { type: 'sub', a, b, places } };
  }

  // ---------- helpers for the added grades ----------
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  // decimals are kept as whole numbers of 10^-dp so every answer is exact
  const dec = (int, dp) => {
    if (!dp) return String(int);
    let s = String(Math.abs(int)).padStart(dp + 1, '0');
    s = s.slice(0, -dp) + '.' + s.slice(-dp);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return (int < 0 ? '-' : '') + s;
  };
  const decPad = (int, dp) => { const s = String(int).padStart(dp + 1, '0'); return dp ? s.slice(0, -dp) + '.' + s.slice(-dp) : s; };
  const dpOf = (str) => (String(str).split('.')[1] || '').length;
  const FRAC_NAMES = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'], 10: ['tenth', 'tenths'], 12: ['twelfth', 'twelfths'], 100: ['hundredth', 'hundredths'] };
  const fracName = (d, n) => (FRAC_NAMES[d] ? FRAC_NAMES[d][n === 1 ? 0 : 1] : d + 'ths');
  const signOf = (x, y) => (x > y ? '>' : x < y ? '<' : '=');
  const signItem = (skill, aStr, bStr, ans, predicted, steps, model, extra) => {
    const p = {};
    Object.keys(predicted || {}).forEach((k) => { if (predicted[k] && predicted[k] !== ans) p[k] = predicted[k]; });
    return Object.assign({ skill, format: 'choice', signs: true, prompt: 'Which sign makes it true?', a: aStr, b: bStr, answer: ans, choices: ['<', '=', '>'], predicted: p, steps, model }, extra || {});
  };
  const PLACES6 = ['hundred thousands', 'ten thousands', 'thousands', 'hundreds', 'tens', 'ones'];
  const nameOf = (r) => r.pick(NAMES), thingOf = (r) => r.pick(THINGS);

  Object.assign(GEN, {
    // ===== Grade 1 =====
    C101(r) {
      const n = r.next() < 0.5 ? r.int(1, 11) * 10 - 1 : r.int(9, 118);
      const predicted = n % 10 === 9 && n >= 19 ? { M09: String(Math.floor(n / 10)) + '10' } : {};
      return num('C101', 'What number comes after ' + n + '?', n + 1, predicted, [n % 10 === 9 ? 'After 9 ones comes a new ten.' : 'Count one more.', n + ' + 1 = ' + (n + 1)], { type: 'numberline', from: n - 3, step: 1, marks: 6, arrowAt: 4, hide: 4 }, { a: n, b: 1, op: '+' });
    },
    C102(r) {
      const a = r.int(1, 8), b = r.int(1, 10 - a);
      return num('C102', a + ' + ' + b + ' = ?', a + b, { M12: a + b - 1 > 0 ? a + b - 1 : null }, ['Start at ' + a + ' and count on ' + b + '.', a + ' + ' + b + ' = ' + (a + b)], { type: 'tenframe', a, b }, { a, b, op: '+' });
    },
    C103(r) {
      const a = r.int(3, 10), b = r.int(1, a - 1);
      return num('C103', a + ' − ' + b + ' = ?', a - b, { M12: a - b + 1, M15: a + b }, ['Start with ' + a + ' and take away ' + b + '.', a + ' − ' + b + ' = ' + (a - b)], { type: 'tenframe', a, b: 0, remove: b }, { a, b, op: '−' });
    },
    C104(r) {
      const a = r.int(1, 9);
      return num('C104', a + ' + ? = 10', 10 - a, { MP1: 10 + a }, ['What do you add to ' + a + ' to make 10? Count the empty boxes.', '10 − ' + a + ' = ' + (10 - a)], { type: 'tenframe', a, b: 0 }, { a: 10, b: a, op: '−' });
    },
    C105(r) {
      const a = r.int(2, 9), near = r.next() < 0.5;
      const b = near ? a + 1 : a;
      const steps = near ? [a + ' + ' + a + ' = ' + 2 * a + '.', b + ' is one more than ' + a + ', so ' + 2 * a + ' + 1 = ' + (a + b)] : ['Double ' + a + '.', a + ' + ' + a + ' = ' + 2 * a];
      return num('C105', a + ' + ' + b + ' = ?', a + b, { M18: near ? 2 * a : null, M12: a + b - 1 }, steps, { type: 'tenframe', a, b }, { a, b, op: '+' });
    },
    C106(r) {
      const x = r.int(1, 9), y = 10 - x, z = r.int(1, 9);
      const list = r.next() < 0.5 ? [x, z, y] : [x, y, z];
      return num('C106', list.join(' + ') + ' = ?', 10 + z, { M12: 9 + z }, ['Find two numbers that make 10: ' + x + ' + ' + y + ' = 10.', '10 + ' + z + ' = ' + (10 + z)], { type: 'addlist', xs: list }, { list, op: '+' });
    },
    C107(r) {
      const a = r.int(2, 12), c = r.int(a + 2, Math.min(20, a + 9));
      return num('C107', a + ' + ? = ' + c, c - a, { MP1: a + c }, ['Count on from ' + a + ' to ' + c + '.', c + ' − ' + a + ' = ' + (c - a)], { type: 'bar', whole: c, parts: [a, c - a], unknown: 1 }, { a: c, b: a, op: '−' });
    },
    C108(r) {
      const a = r.int(2, 9), b = r.int(1, 9), c = r.int(1, Math.min(9, a + b - 1));
      if (r.next() < 0.5) {
        const same = r.next() < 0.5;
        const d = same ? a + b - c : a + b - c + r.pick([-1, 1]);
        if (d < 0) return GEN.C108(r);
        const steps = [a + ' + ' + b + ' = ' + (a + b) + '.', c + ' + ' + d + ' = ' + (c + d) + '.', same ? 'Both sides are ' + (a + b) + ', so it is true.' : (a + b) + ' and ' + (c + d) + ' are not the same, so it is false.'];
        return textChoice('C108', 'Is ' + a + ' + ' + b + ' = ' + c + ' + ' + d + ' true or false?', same ? 'True' : 'False', [same ? 'False' : 'True'], steps, { type: 'pairsum', a, b, c, d }, r);
      }
      return num('C108', a + ' + ' + b + ' = ' + c + ' + ?', a + b - c, { ME1: a + b }, [a + ' + ' + b + ' = ' + (a + b) + '. Both sides must be ' + (a + b) + '.', (a + b) + ' − ' + c + ' = ' + (a + b - c)], { type: 'pairsum', a, b, c, d: '?' }, { a: a + b, b: c, op: '−' });
    },
    C109(r) {
      const t = r.int(1, 9), o = r.int(0, 9), n = 10 * t + o;
      if (r.next() < 0.5) return num('C109', 'How many tens are in ' + n + '?', t, { M07: o !== t ? o : null }, ['The left digit counts the tens.', n + ' is ' + t + ' tens and ' + o + ' ones, so there are ' + t], { type: 'blocks', h: 0, t, o });
      return num('C109', t + ' tens and ' + o + ' ones. What number is that?', n, { M09: o ? null : String(t) }, [t + ' tens is ' + 10 * t + '.', 10 * t + ' + ' + o + ' = ' + n], { type: 'blocks', h: 0, t, o }, { a: 10 * t, b: o, op: '+' });
    },
    C110(r) {
      let a = r.int(10, 99), b = r.int(10, 99);
      if (r.next() < 0.4) b = Math.floor(a / 10) * 10 + r.int(0, 9);
      if (r.next() < 0.15) b = a;
      if (a !== b && r.next() < 0.4) {
        const big = Math.max(a, b), small = Math.min(a, b);
        return num('C110', 'Type the greater number: ' + a + ' or ' + b + '?', big, {}, ['Compare the tens first, then the ones.', big + ' > ' + small], { type: 'compare2', a, b }, { a, b });
      }
      return signItem('C110', String(a), String(b), signOf(a, b), {}, ['Compare the tens first, then the ones.', a + ' ' + signOf(a, b) + ' ' + b], { type: 'compare2', a, b });
    },
    C111(r) {
      const up = r.next() < 0.5, n = up ? r.int(10, 89) : r.int(20, 99), ans = up ? n + 10 : n - 10;
      return num('C111', (up ? '10 more than ' : '10 less than ') + n + ' is?', ans, { M1T: up ? n + 1 : n - 1 }, ['Only the tens digit changes.', n + (up ? ' + ' : ' − ') + '10 = ' + ans], { type: 'blocks', h: 0, t: Math.floor(n / 10), o: n % 10 }, { a: n, b: 10, op: up ? '+' : '−' });
    },
    C112(r) {
      if (r.next() < 0.5) {
        const n = r.int(11, 79), k = r.int(1, Math.floor((99 - n) / 10));
        const it = addItem('C112', n, 10 * k, 2);
        it.predicted.M1T = String(n + k);
        return it;
      }
      const n = r.int(11, 89), o = r.int(1, 9 - (n % 10) || 1);
      if ((n % 10) + o > 9) return GEN.C112(r);
      return addItem('C112', n, o, 2);
    },
    C113(r) {
      const a = 10 * r.int(2, 9), b = 10 * r.int(1, a / 10 - 1);
      const it = subItem('C113', a, b, 2);
      it.predicted.M1T = String(a - b / 10);
      return it;
    },
    C114(r) {
      const who = nameOf(r), thing = thingOf(r);
      if (r.next() < 0.5) {
        const a = r.int(3, 12), b = r.int(2, 20 - a);
        return num('C114', who + ' has ' + a + ' ' + thing + ' and finds ' + b + ' more. How many ' + thing + ' now?', a + b, { M14: a > b ? a - b : null }, ['Finding more makes the group bigger: add.', a + ' + ' + b + ' = ' + (a + b)], { type: 'bar', obj: OBJ[thing], whole: a + b, parts: [a, b], unknown: -1 }, { a, b, op: '+' });
      }
      const a = r.int(8, 20), b = r.int(2, a - 2);
      return num('C114', who + ' has ' + a + ' ' + thing + ' and gives away ' + b + '. How many are left?', a - b, { M14: a + b }, ['Giving some away leaves fewer: subtract.', a + ' − ' + b + ' = ' + (a - b)], { type: 'bar', obj: OBJ[thing], whole: a, parts: [b, a - b], unknown: 1 }, { a, b, op: '−' });
    },

    // ===== Grade 3 fractions =====
    F301(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8]), n = r.int(1, d - 1);
      if (r.next() < 0.6) return num('F301', 'The bar has ' + d + ' equal parts. ' + n + (n === 1 ? ' is' : ' are') + ' shaded. What fraction is shaded? ?/' + d, n, { MF11: d - n }, ['The bottom number is how many equal parts: ' + d + '.', 'The top number is how many are shaded: ' + n], { type: 'fracbar', bars: [{ n, d }] }, { frac: [n, d] });
      return num('F301', 'What fraction is shaded? ' + n + '/?', d, { MF11: d - n }, ['Count all the equal parts in the whole.', 'There are ' + d + ' equal parts, so the bottom number is ' + d], { type: 'fracbar', bars: [{ n, d }] }, { frac: [n, d] });
    },
    F302(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8]), n = r.int(1, d - 1);
      return num('F302', 'The line from 0 to 1 is cut into ' + d + ' equal jumps. What fraction is at the arrow? ?/' + d, n, { MF12: n + 1 }, ['Each jump is 1/' + d + '.', 'Count the jumps from 0 to the arrow: ' + n], { type: 'fracline', d, at: n }, { frac: [n, d] });
    },

    // ===== Grade 4 =====
    F401(r) {
      const n = r.int(10000, 999999), places = String(n).length, ds = String(n).split('').map(Number);
      let pos; do { pos = r.int(0, places - 1); } while (ds[pos] === 0);
      const d = ds[pos], placeName = PLACES6[6 - places + pos], value = d * Math.pow(10, places - 1 - pos);
      return num('F401', 'What is the value of the ' + d + ' in ' + fmt(n) + '?', value, { M07: d }, ['The ' + d + ' is in the ' + placeName + ' place.', d + ' × ' + fmt(Math.pow(10, places - 1 - pos)) + ' = ' + fmt(value)], { type: 'pvbig', n, pos }, { big: true });
    },
    F402(r) {
      let a = r.int(10000, 999999), b;
      const k = r.int(0, 3);
      if (k === 0) b = a + r.pick([-1, 1]) * r.int(1, 99);
      else if (k === 1) b = a + r.pick([-1, 1]) * r.int(1, 9) * 1000;
      else if (k === 2) b = Number(String(a).slice(0, -1)); // fewer digits
      else b = r.int(10000, 999999);
      if (b < 1000) b = a + 10;
      if (a !== b && r.next() < 0.4) {
        const big = Math.max(a, b), small = Math.min(a, b);
        return num('F402', 'Type the greater number: ' + fmt(a) + ' or ' + fmt(b) + '?', big, {}, ['More digits means a bigger number. Same number of digits? Compare from the left.', fmt(big) + ' > ' + fmt(small)], { type: 'pvbig2', a, b }, { a, b, big: true });
      }
      return signItem('F402', fmt(a), fmt(b), signOf(a, b), {}, ['More digits means a bigger number. Same number of digits? Compare from the left.', fmt(a) + ' ' + signOf(a, b) + ' ' + fmt(b)], { type: 'pvbig2', a, b }, { na: a, nb: b });
    },
    F403(r) {
      const base = r.pick([1000, 10000]), n = base === 1000 ? r.int(1001, 99999) : r.int(10001, 999999);
      if (n % base === 0) return GEN.F403(r);
      const lo = Math.floor(n / base) * base, hi = lo + base, ans = roundTo(n, base), next = Math.floor((n % base) / (base / 10));
      return num('F403', 'Round ' + fmt(n) + ' to the nearest ' + fmt(base) + '.', ans, { M11: lo !== ans ? lo : null }, ['It is between ' + fmt(lo) + ' and ' + fmt(hi) + '.', 'The next digit is ' + next + ', so it rounds to ' + fmt(ans)], { type: 'numberline', from: lo, step: base / 10, marks: 11, arrowAt: (n - lo) / (base / 10) }, { big: true, n, base });
    },
    F404(r) {
      if (r.next() < 0.5) {
        let a, b; do { a = r.int(1000, 8999); b = r.int(1000, 9999 - a); } while ((a % 10) + (b % 10) < 10 && (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 10);
        return addItem('F404', a, b, 4);
      }
      let a, b; do { a = r.int(2000, 9999); b = r.int(1000, a - 100); } while (a % 10 >= b % 10 && Math.floor(a / 10) % 10 >= Math.floor(b / 10) % 10);
      return subItem('F404', a, b, 4);
    },
    F405(r) {
      const a = r.int(12, 999), b = r.int(3, 9);
      const parts = []; let rest = a, pv = 1;
      while (rest) { const d = rest % 10; if (d) parts.unshift(d * pv); rest = Math.floor(rest / 10); pv *= 10; }
      const prods = parts.map((p) => p * b);
      const steps = parts.map((p, i) => p + ' × ' + b + ' = ' + prods[i]).concat([prods.join(' + ') + ' = ' + a * b]);
      if (parts.length === 1) steps.pop();
      const side = String(a).split('').map((d) => String(Number(d) * b)).join('');
      return num('F405', a + ' × ' + b + ' = ?', a * b, { MX1: side, M15: a + b }, steps, { type: 'area', rows: [b], cols: parts }, { a, b, op: '×' });
    },
    F406(r) {
      const a = r.int(12, 99), b = r.int(12, 99);
      if (a % 10 === 0 || b % 10 === 0) return GEN.F406(r);
      const at = a - (a % 10), ao = a % 10, bt = b - (b % 10), bo = b % 10;
      const p = [at * bt, at * bo, ao * bt, ao * bo];
      const steps = [at + ' × ' + bt + ' = ' + p[0], at + ' × ' + bo + ' = ' + p[1], ao + ' × ' + bt + ' = ' + p[2], ao + ' × ' + bo + ' = ' + p[3], p.join(' + ') + ' = ' + a * b];
      return num('F406', a + ' × ' + b + ' = ?', a * b, { MX2: p[0] + p[3] }, steps, { type: 'area', rows: [at, ao], cols: [bt, bo] }, { a, b, op: '×' });
    },
    F407(r) {
      const b = r.int(3, 9), q = r.int(3, 12), rem = r.int(1, b - 1), a = b * q + rem;
      const steps = [b + ' × ' + q + ' = ' + b * q + '. One more group would be ' + b * (q + 1) + ', too many.', a + ' − ' + b * q + ' = ' + rem + ' left over.'];
      if (r.next() < 0.5) return num('F407', a + ' ÷ ' + b + ' = ? R ' + rem, q, { M18: q + 1 }, steps.concat(['So ' + a + ' ÷ ' + b + ' = ' + q + ' R ' + rem + ', and the quotient is ' + q]), { type: 'divgroups', groups: q, each: b, left: rem }, { divrem: [a, b, q, rem] });
      return num('F407', a + ' ÷ ' + b + ' = ' + q + ' R ?', rem, { MR1: rem + b <= a - b * (q - 1) ? rem + b : null }, steps.concat(['So ' + a + ' ÷ ' + b + ' = ' + q + ' R ' + rem]), { type: 'divgroups', groups: q, each: b, left: rem }, { divrem: [a, b, q, rem] });
    },
    F408(r) {
      const b = r.int(2, 9), q = r.int(12, Math.floor(999 / b)), a = b * q;
      const parts = []; let rest = q, pv = 1;
      while (rest) { const d = rest % 10; if (d) parts.unshift(d * pv); rest = Math.floor(rest / 10); pv *= 10; }
      let left = a; const steps = [];
      parts.forEach((p) => { steps.push(b + ' × ' + p + ' = ' + b * p + '. ' + left + ' − ' + b * p + ' = ' + (left - b * p) + '.'); left -= b * p; });
      steps.push((parts.length > 1 ? parts.join(' + ') + ' = ' + q + '. ' : '') + 'So ' + a + ' ÷ ' + b + ' = ' + q);
      const zeroMid = String(q).length === 3 && String(q)[1] === '0';
      return num('F408', a + ' ÷ ' + b + ' = ?', q, { M08: zeroMid ? String(q).replace('0', '') : null }, steps, { type: 'paper' }, { a, b, op: '÷' });
    },
    F409(r) {
      const n = r.pick([12, 15, 16, 18, 20, 21, 24, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 54, 56, 60, 63, 64, 72]);
      const fs = []; for (let f = 2; f < n; f++) if (n % f === 0) fs.push(f);
      const f = r.pick(fs);
      if (r.next() < 0.5) return num('F409', n + ' = ' + f + ' × ?', n / f, { MN4: n - f }, ['How many groups of ' + f + ' make ' + n + '?', f + ' × ' + n / f + ' = ' + n + ', so ? = ' + n / f], { type: 'paper' }, { a: n, b: f, op: '÷' });
      const wrong = []; for (let w = 2; w < n && wrong.length < 12; w++) if (n % w) wrong.push(w);
      const pickW = []; while (pickW.length < 3) { const w = r.pick(wrong); if (!pickW.includes(w)) pickW.push(w); }
      const choices = [f].concat(pickW).map(String);
      for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
      return { skill: 'F409', format: 'choice', prompt: 'Which number is a factor of ' + n + '?', answer: String(f), choices, predicted: {}, steps: ['A factor divides ' + n + ' with nothing left over.', f + ' × ' + n / f + ' = ' + n + ', so ' + f + ' is a factor of ' + n + '.'], model: { type: 'paper' }, factorOf: n };
    },
    F410(r) {
      const n = r.int(4, 60);
      let f = 0; for (let k = 2; k * k <= n; k++) if (n % k === 0) { f = k; break; }
      const prime = !f;
      if (r.next() < 0.5) {
        const steps = prime ? ['Try 2, 3, 5 and 7. None of them divide ' + n + '.', n + ' has only two factors, 1 and ' + n + ', so it is prime.'] : [f + ' × ' + n / f + ' = ' + n + '.', n + ' has more factors than 1 and itself, so it is composite.'];
        return textChoice('F410', 'Is ' + n + ' prime or composite?', prime ? 'Prime' : 'Composite', [prime ? 'Composite' : 'Prime'], steps, { type: 'paper' }, r);
      }
      const small = prime ? n : f;
      return num('F410', 'What is the smallest factor of ' + n + ' that is bigger than 1?', small, {}, ['Try 2, then 3, then 5, then 7.', prime ? 'Nothing smaller works, so the smallest is ' + n : f + ' × ' + n / f + ' = ' + n + ', so the smallest is ' + f], { type: 'paper' }, { primeCheck: n });
    },
    F411(r) {
      const A = nameOf(r); let B = nameOf(r); while (B === A) B = nameOf(r);
      const thing = thingOf(r), a = r.int(3, 12), k = r.int(2, 9);
      if (r.next() < 0.6) return num('F411', A + ' has ' + a + ' ' + thing + '. ' + B + ' has ' + k + ' times as many. How many does ' + B + ' have?', a * k, { M15: a + k }, [k + ' times as many means ' + k + ' groups of ' + a + '.', k + ' × ' + a + ' = ' + a * k], { type: 'timesbar', obj: OBJ[thing], unit: a, k }, { a: k, b: a, op: '×' });
      return num('F411', B + ' has ' + a * k + ' ' + thing + '. That is ' + k + ' times as many as ' + A + '. How many does ' + A + ' have?', a, { M15: a * k - k }, [a * k + ' is ' + k + ' equal groups. Find one group.', a * k + ' ÷ ' + k + ' = ' + a], { type: 'timesbar', obj: OBJ[thing], unit: '?', k, total: a * k }, { a: a * k, b: k, op: '÷' });
    },
    F412(r) {
      if (r.next() < 0.7) {
        const s0 = r.int(1, 30), d = r.int(2, 12), seq = [0, 1, 2, 3].map((i) => s0 + i * d), last = seq[3];
        return num('F412', 'Rule: add ' + d + '. ' + seq.join(', ') + ', ?', last + d, { M12: last + d - 1 }, ['Each number is ' + d + ' more than the one before.', last + ' + ' + d + ' = ' + (last + d)], { type: 'paper' }, { a: last, b: d, op: '+' });
      }
      const s0 = r.int(1, 5), m = r.pick([2, 3]), seq = [0, 1, 2, 3].map((i) => s0 * Math.pow(m, i)), last = seq[3];
      return num('F412', 'Rule: multiply by ' + m + '. ' + seq.join(', ') + ', ?', last * m, { M15: last + m }, ['Each number is ' + m + ' times the one before.', last + ' × ' + m + ' = ' + last * m], { type: 'paper' }, { a: last, b: m, op: '×' });
    },
    F413(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8, 10]), n = r.int(1, d - 1), k = r.int(2, 5);
      if (gcd(n, d) !== 1) return GEN.F413(r);
      return num('F413', n + '/' + d + ' = ?/' + d * k, n * k, { MF1: n + d * k - d }, [d + ' × ' + k + ' = ' + d * k + ', so the pieces are cut into ' + k + ' and the top is multiplied by ' + k + ' too.', n + ' × ' + k + ' = ' + n * k], { type: 'fracbar', bars: [{ n, d }, { n: n * k, d: d * k, ask: true }] }, { a: n, b: k, op: '×' });
    },
    F414(r) {
      const pairs = [[2, 3], [2, 4], [3, 4], [2, 5], [4, 5], [3, 6], [4, 8], [2, 6], [5, 10], [3, 5], [4, 6], [6, 8]];
      const [b, d] = r.pick(pairs), a = r.int(1, b - 1), c = r.int(1, d - 1), L = lcm(b, d);
      if (gcd(a, b) !== 1 || gcd(c, d) !== 1) return GEN.F414(r);
      const A = a * L / b, Cc = c * L / d, ans = signOf(A, Cc);
      if (r.next() < 0.35) return num('F414', 'Make the bottoms match: ' + a + '/' + b + ' = ?/' + L, A, { MF1: a + L - b }, [b + ' × ' + L / b + ' = ' + L + '.', a + ' × ' + L / b + ' = ' + A], { type: 'fracbar', bars: [{ n: a, d: b }, { n: A, d: L, ask: true }] }, { a, b: L / b, op: '×' });
      const wrong = signOf(b, d) === '=' ? null : (b > d ? '>' : '<'); // "bigger bottom is bigger"
      return signItem('F414', a + '/' + b, c + '/' + d, ans, { MF2: a === c ? wrong : null }, ['Use the same bottom number: ' + a + '/' + b + ' = ' + A + '/' + L + ' and ' + c + '/' + d + ' = ' + Cc + '/' + L + '.', A + '/' + L + ' ' + ans + ' ' + Cc + '/' + L + ', so ' + a + '/' + b + ' ' + ans + ' ' + c + '/' + d], { type: 'fracbar', bars: [{ n: a, d: b }, { n: c, d }] }, { fa: [a, b], fb: [c, d] });
    },
    F415(r) {
      const d = r.int(3, 12), add = r.next() < 0.5;
      if (add) {
        const a = r.int(1, d - 2), b = r.int(1, d - 1 - a);
        if (r.next() < 0.35) return num('F415', a + '/' + d + ' + ' + b + '/' + d + ' = ' + (a + b) + '/?', d, { MF3: 2 * d }, ['The pieces are the same size, so the bottom number stays ' + d + '.', 'Only the pieces are counted: ' + a + ' + ' + b + ' = ' + (a + b) + ', and the bottom is still ' + d], { type: 'fracbar', bars: [{ n: a, d }, { n: b, d }, { n: a + b, d }] }, { frac: [a + b, d] });
        return num('F415', a + '/' + d + ' + ' + b + '/' + d + ' = ?/' + d, a + b, {}, ['Same-size pieces: count them.', a + ' + ' + b + ' = ' + (a + b)], { type: 'fracbar', bars: [{ n: a, d }, { n: b, d }, { n: a + b, d, ask: true }] }, { a, b, op: '+' });
      }
      const a = r.int(2, d - 1), b = r.int(1, a - 1);
      return num('F415', a + '/' + d + ' − ' + b + '/' + d + ' = ?/' + d, a - b, { M15: a + b <= 99 ? a + b : null }, ['Same-size pieces: take away ' + b + ' of them.', a + ' − ' + b + ' = ' + (a - b)], { type: 'fracbar', bars: [{ n: a, d, take: b }] }, { a, b, op: '−' });
    },
    F416(r) {
      const w = r.int(1, 5), d = r.pick([2, 3, 4, 5, 6, 8]), n = r.int(1, d - 1);
      if (r.next() < 0.6) return num('F416', w + ' ' + n + '/' + d + ' = ?/' + d, w * d + n, { MF4: w + n }, [w + ' whole' + (w > 1 ? 's are ' : ' is ') + w + ' × ' + d + ' = ' + w * d + ' ' + fracName(d, 2) + '.', w * d + ' + ' + n + ' = ' + (w * d + n)], { type: 'fracbar', bars: Array.from({ length: w }, () => ({ n: d, d })).concat([{ n, d }]) }, { a: w * d, b: n, op: '+' });
      return num('F416', (w * d + n) + '/' + d + ' = ' + w + ' ?/' + d, n, { MF4: w * d + n - w }, [d + ' × ' + w + ' = ' + w * d + ' makes ' + w + ' whole' + (w > 1 ? 's' : '') + '.', (w * d + n) + ' − ' + w * d + ' = ' + n], { type: 'fracbar', bars: Array.from({ length: w }, () => ({ n: d, d })).concat([{ n, d }]) }, { a: w * d + n, b: w * d, op: '−' });
    },
    F417(r) {
      const k = r.int(2, 6), d = r.int(3, 10), n = r.int(1, d - 1);
      return num('F417', k + ' × ' + n + '/' + d + ' = ?/' + d, k * n, { M15: k + n }, [k + ' groups of ' + n + '/' + d + '. The pieces stay ' + fracName(d, 2) + '.', k + ' × ' + n + ' = ' + k * n], { type: 'fracbar', bars: Array.from({ length: Math.min(k, 6) }, () => ({ n, d })) }, { a: k, b: n, op: '×' });
    },
    F418(r) {
      const v = r.int(0, 2);
      if (v === 0) { const t = r.int(1, 9); return num('F418', 'Write ' + t + '/10 as hundredths: ?/100', 10 * t, { MD4: t }, ['1 tenth is 10 hundredths.', t + ' × 10 = ' + 10 * t], { type: 'decgrid', hundredths: 10 * t }, { a: t, b: 10, op: '×' }); }
      if (v === 1) { const t = r.int(1, 8), h = r.int(1, 9); return num('F418', t + '/10 + ' + h + '/100 = ?/100', 10 * t + h, { MF6: t + h }, [t + '/10 = ' + 10 * t + '/100.', 10 * t + ' + ' + h + ' = ' + (10 * t + h)], { type: 'decgrid', hundredths: 10 * t + h }, { a: 10 * t, b: h, op: '+' }); }
      const n = r.int(1, 99), ans = dec(n, 2);
      return num('F418', 'Write ' + n + '/100 as a decimal.', ans, { MD1: n < 10 ? '0.' + n : null }, [n + ' hundredths: the last digit goes in the hundredths place, two places after the point.', n + '/100 = ' + ans], { type: 'decgrid', hundredths: n }, { decimal: true, decVal: [n, 2] });
    },
    F419(r) {
      const x = r.int(1, 9), y = r.int(10, 99); // x tenths vs y hundredths
      const A = 10 * x, B = y, ans = signOf(A, B);
      const aS = dec(x, 1), bS = dec(y, 2);
      if (A === B) return GEN.F419(r);
      const longer = signOf(y, x) === '>' ? '<' : '>'; // "more digits is bigger": 0.4 vs 0.38 → <
      if (r.next() < 0.4) {
        const big = A > B ? aS : bS;
        return num('F419', 'Type the greater number: ' + aS + ' or ' + bS + '?', big, { MD2: A > B && y > x ? bS : null }, ['Write both as hundredths: ' + aS + ' = ' + decPad(A, 2) + '.', (A > B ? decPad(A, 2) + ' > ' + bS : bS + ' > ' + decPad(A, 2)) + ', so the greater number is ' + big], { type: 'decgrid2', a: A, b: B }, { decimal: true, decVal: [Math.max(A, B), 2] });
      }
      return signItem('F419', aS, bS, ans, { MD2: y > x ? longer : null }, ['Write both as hundredths: ' + aS + ' = ' + decPad(A, 2) + '.', decPad(A, 2) + ' ' + ans + ' ' + bS + ', so ' + aS + ' ' + ans + ' ' + bS], { type: 'decgrid2', a: A, b: B }, { na: A, nb: B });
    },

    // ===== Grade 5 =====
    F501(r) {
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 6), v = r.int(0, 3);
      if (v === 0) return num('F501', '(' + a + ' + ' + b + ') × ' + c + ' = ?', (a + b) * c, { MO1: a + b * c }, ['Parentheses first: ' + a + ' + ' + b + ' = ' + (a + b) + '.', (a + b) + ' × ' + c + ' = ' + (a + b) * c], { type: 'paper' }, { expr: '(' + a + '+' + b + ')*' + c });
      if (v === 1) return num('F501', c + ' × (' + a + ' + ' + b + ') = ?', c * (a + b), { MO1: c * a + b }, ['Parentheses first: ' + a + ' + ' + b + ' = ' + (a + b) + '.', c + ' × ' + (a + b) + ' = ' + c * (a + b)], { type: 'paper' }, { expr: c + '*(' + a + '+' + b + ')' });
      if (v === 2) { const big = a + b + c; return num('F501', big + ' − (' + a + ' + ' + b + ') = ?', c, { MO1: big - a + b }, ['Parentheses first: ' + a + ' + ' + b + ' = ' + (a + b) + '.', big + ' − ' + (a + b) + ' = ' + c], { type: 'paper' }, { expr: big + '-(' + a + '+' + b + ')' }); }
      return num('F501', a + ' + ' + b + ' × ' + c + ' = ?', a + b * c, { MO1: (a + b) * c }, ['Multiply before adding: ' + b + ' × ' + c + ' = ' + b * c + '.', a + ' + ' + b * c + ' = ' + (a + b * c)], { type: 'paper' }, { expr: a + '+' + b + '*' + c });
    },
    F502(r) {
      const k = r.int(1, 3), pow = Math.pow(10, k), v = r.int(0, 2);
      if (v === 0) { const n = r.int(2, 99); return num('F502', n + ' × ' + fmt(pow) + ' = ?', n * pow, { MD6: n * pow / 10 >= 1 ? n * pow / 10 : null }, ['× ' + fmt(pow) + ': every digit moves ' + k + ' place' + (k > 1 ? 's' : '') + ' to the left.', n + ' × ' + pow + ' = ' + n * pow], { type: 'paper' }, { a: n, b: pow, op: '×' }); }
      if (v === 1) {
        const dp = r.int(1, 2), X = r.int(11, 999), xs = dec(X, dp);
        if (xs.indexOf('.') < 0) return GEN.F502(r);
        const ansInt = X * pow, ans = dec(ansInt, dp);
        return num('F502', xs + ' × ' + fmt(pow) + ' = ?', ans, { MD3: decPad(X, dp) + '0'.repeat(k), MD6: dec(ansInt, dp + 1) }, ['× ' + fmt(pow) + ': every digit moves ' + k + ' place' + (k > 1 ? 's' : '') + ' to the left.', xs + ' × ' + fmt(pow) + ' = ' + ans], { type: 'paper' }, { decimal: true, decVal: [ansInt, dp] });
      }
      const n = r.int(2, 999), ans = dec(n, k);
      if (n % pow === 0) return GEN.F502(r);
      return num('F502', n + ' ÷ ' + fmt(pow) + ' = ?', ans, { MD6: dec(n, k > 1 ? k - 1 : k + 1) }, ['÷ ' + fmt(pow) + ': every digit moves ' + k + ' place' + (k > 1 ? 's' : '') + ' to the right.', n + ' ÷ ' + fmt(pow) + ' = ' + ans], { type: 'paper' }, { decimal: true, decVal: [n, k] });
    },
    F503(r) {
      const X = r.int(1001, 9999); // value in thousandths, 1.001 to 9.999
      const s = dec(X, 3);
      if (dpOf(s) < 3) return GEN.F503(r);
      const ds = String(X).padStart(4, '0').split('').map(Number); // [ones, tenths, hundredths, thousandths]
      const names = ['tenths', 'hundredths', 'thousandths'];
      if (r.next() < 0.5) {
        const p = r.int(0, 2);
        const other = ds[p === 0 ? 2 : 1];
        return num('F503', 'Which digit is in the ' + names[p] + ' place of ' + s + '?', ds[p + 1], { MD4: other !== ds[p + 1] && p < 2 ? other : null }, ['After the point: tenths, then hundredths, then thousandths.', 'The ' + names[p] + ' digit is ' + ds[p + 1]], { type: 'pvdec', s, pos: p }, { digitOf: [s, p] });
      }
      let p; do { p = r.int(0, 2); } while (ds[p + 1] === 0);
      const val = dec(ds[p + 1], p + 1);
      return num('F503', 'What is the value of the ' + ds[p + 1] + ' in ' + s + '?', val, { M07: ds[p + 1] }, ['The ' + ds[p + 1] + ' is in the ' + names[p] + ' place.', ds[p + 1] + ' ' + fracName([10, 100, 1000][p], ds[p + 1]).replace('1000ths', 'thousandths') + ' = ' + val], { type: 'pvdec', s, pos: p }, { decimal: true, decVal: [ds[p + 1], p + 1] });
    },
    F504(r) {
      const A = r.int(1, 999), B = r.int(1, 999); // thousandths
      const aDp = r.pick([1, 2, 3]), bDp = 3;
      const Av = aDp === 1 ? Math.round(A / 100) * 100 : aDp === 2 ? Math.round(A / 10) * 10 : A;
      if (Av === 0 || Av === B || Av >= 1000) return GEN.F504(r);
      const aS = dec(Av, 3), bS = dec(B, 3), ans = signOf(Av, B);
      const lenA = dpOf(aS), lenB = dpOf(bS);
      const naive = lenA === lenB ? null : (lenA > lenB ? '>' : '<');
      if (r.next() < 0.4) {
        const big = Av > B ? aS : bS, other = Av > B ? bS : aS;
        return num('F504', 'Type the greater number: ' + aS + ' or ' + bS + '?', big, { MD2: dpOf(other) > dpOf(big) ? other : null }, ['Write both with three places: ' + decPad(Av, 3) + ' and ' + decPad(B, 3) + '.', 'Compare tenths, then hundredths, then thousandths. The greater number is ' + big], { type: 'pvdec2', a: aS, b: bS }, { decimal: true, decVal: [Math.max(Av, B), 3] });
      }
      return signItem('F504', aS, bS, ans, { MD2: naive }, ['Write both with three places: ' + decPad(Av, 3) + ' and ' + decPad(B, 3) + '.', decPad(Av, 3) + ' ' + ans + ' ' + decPad(B, 3) + ', so ' + aS + ' ' + ans + ' ' + bS], { type: 'pvdec2', a: aS, b: bS }, { na: Av, nb: B });
    },
    F505(r) {
      const X = r.int(1001, 9999), to = r.int(0, 2); // to: 0 whole, 1 tenth, 2 hundredth
      const unit = [1000, 100, 10][to], lo = Math.floor(X / unit) * unit, ans = roundTo(X, unit);
      if (X % unit === 0) return GEN.F505(r);
      const nextDigit = Math.floor((X % unit) / (unit / 10));
      const toName = ['whole number', 'tenth', 'hundredth'][to];
      return num('F505', 'Round ' + dec(X, 3) + ' to the nearest ' + toName + '.', dec(ans, 3), { M11: lo !== ans ? dec(lo, 3) : null }, ['It is between ' + decPad(lo / unit, to) + ' and ' + decPad(lo / unit + 1, to) + '.', 'The next digit is ' + nextDigit + ', so it rounds to ' + decPad(ans / unit, to)], { type: 'paper' }, { decimal: true, decVal: [ans, 3] });
    },
    F506(r) {
      const a = r.int(102, 999), b = r.int(12, 99);
      if (b % 10 === 0) return GEN.F506(r);
      const bo = b % 10, bt = b - bo;
      return num('F506', a + ' × ' + b + ' = ?', a * b, { MN5: a * bo + a * (bt / 10) }, [a + ' × ' + bo + ' = ' + a * bo, a + ' × ' + bt + ' = ' + a * bt, a * bo + ' + ' + a * bt + ' = ' + a * b], { type: 'area', rows: [a], cols: [bt, bo] }, { a, b, op: '×' });
    },
    F507(r) {
      const b = r.int(11, 49), q = r.int(12, 99), a = b * q;
      const qt = q - (q % 10), qo = q % 10;
      const steps = [b + ' × ' + qt + ' = ' + b * qt + '. ' + a + ' − ' + b * qt + ' = ' + (a - b * qt) + '.'];
      if (qo) steps.push(b + ' × ' + qo + ' = ' + b * qo + '. ' + (a - b * qt) + ' − ' + b * qo + ' = 0.');
      steps.push((qo ? qt + ' + ' + qo + ' = ' + q + '. ' : '') + 'So ' + a + ' ÷ ' + b + ' = ' + q);
      return num('F507', a + ' ÷ ' + b + ' = ?', q, { M08: qo === 0 ? q / 10 : null, M18: q - 1 }, steps, { type: 'paper' }, { a, b, op: '÷' });
    },
    F508(r) {
      const add = r.next() < 0.5, aDp = r.pick([1, 2]), bDp = aDp === 1 ? 2 : 1;
      let A = r.int(11, 999), B = r.int(11, 999); // in their own dp units
      const A2 = aDp === 2 ? A : A * 10, B2 = bDp === 2 ? B : B * 10; // hundredths
      if (!add && A2 <= B2) return GEN.F508(r);
      const res = add ? A2 + B2 : A2 - B2, ans = dec(res, 2);
      const aS = dec(A, aDp), bS = dec(B, bDp);
      if (dpOf(aS) !== aDp || dpOf(bS) !== bDp) return GEN.F508(r);
      // misconception: line up last digits (treat both as hundredths)
      const naive = add ? A + B : A - B;
      return num('F508', aS + (add ? ' + ' : ' − ') + bS + ' = ?', ans, { MD5: naive > 0 ? dec(naive, 2) : null }, ['Line up the points: ' + decPad(A2, 2) + (add ? ' + ' : ' − ') + decPad(B2, 2) + '.', decPad(A2, 2) + (add ? ' + ' : ' − ') + decPad(B2, 2) + ' = ' + decPad(res, 2) + (decPad(res, 2) !== ans ? ', which is ' + ans : '')], { type: 'deccol', a: decPad(A2, 2), b: decPad(B2, 2), op: add ? '+' : '−', res: decPad(res, 2) }, { decimal: true, decVal: [res, 2], dop: [A2, B2, add ? '+' : '−'] });
    },
    F509(r) {
      const v = r.int(0, 2);
      let x, xdp, y, ydp;
      if (v === 0) { x = r.int(2, 9); xdp = 0; y = r.int(1, 9); ydp = 1; }
      else if (v === 1) { x = r.int(1, 9); xdp = 1; y = r.int(1, 9); ydp = 1; }
      else { x = r.int(11, 99); xdp = 1; y = r.int(2, 9); ydp = 0; }
      const prod = x * y, dp = xdp + ydp, ans = dec(prod, dp);
      const xs = dec(x, xdp), ys = dec(y, ydp);
      if (dpOf(xs) !== xdp || dpOf(ys) !== ydp) return GEN.F509(r); // 4.0 would show as 4
      return num('F509', xs + ' × ' + ys + ' = ?', ans, { MD6: dp > 0 ? dec(prod, dp === 1 ? 2 : 1) : null }, ['Multiply as whole numbers: ' + x + ' × ' + y + ' = ' + prod + '.', 'There ' + (dp === 1 ? 'is 1 decimal place' : 'are ' + dp + ' decimal places') + ' in all, so ' + xs + ' × ' + ys + ' = ' + ans], { type: 'paper' }, { decimal: true, decVal: [prod, dp], dmul: [x, xdp, y, ydp] });
    },
    F510(r) {
      if (r.next() < 0.5) {
        const b = r.int(2, 9), q = r.int(11, 99), A = q * b; // tenths
        const xs = dec(A, 1), ans = dec(q, 1);
        if (dpOf(xs) !== 1 || dpOf(ans) !== 1) return GEN.F510(r);
        return num('F510', xs + ' ÷ ' + b + ' = ?', ans, { MD6: String(q) }, [xs + ' is ' + A + ' tenths. ' + A + ' ÷ ' + b + ' = ' + q + ' tenths.', xs + ' ÷ ' + b + ' = ' + ans], { type: 'paper' }, { decimal: true, decVal: [q, 1], ddiv: [A, 1, b, 0] });
      }
      const n = r.int(2, 9), y = r.pick([5, 2, 1]), per = 10 / y; // dividing by 0.5, 0.2, 0.1
      const ys = dec(y, 1);
      return num('F510', n + ' ÷ ' + ys + ' = ?', n * per, { MD7: dec(n * y, 1) }, ['How many ' + ys + 's fit in 1? ' + per + '.', n + ' × ' + per + ' = ' + n * per], { type: 'paper' }, { ddiv: [n * 10, 1, y, 1] });
    },
    F511(r) {
      const pairs = [[2, 3], [3, 4], [2, 5], [4, 6], [2, 7], [3, 5], [4, 5], [6, 8], [3, 8], [5, 6]];
      const [b, d] = r.pick(pairs), L = lcm(b, d), a = r.int(1, b - 1), c = r.int(1, d - 1);
      if (gcd(a, b) !== 1 || gcd(c, d) !== 1) return GEN.F511(r);
      const A = a * L / b, Cc = c * L / d, add = r.next() < 0.6 || A === Cc;
      if (add) return num('F511', a + '/' + b + ' + ' + c + '/' + d + ' = ?/' + L, A + Cc, { MF7: a + c }, ['Use ' + fracName(L, 2) + ': ' + a + '/' + b + ' = ' + A + '/' + L + ' and ' + c + '/' + d + ' = ' + Cc + '/' + L + '.', A + ' + ' + Cc + ' = ' + (A + Cc)], { type: 'fracbar', bars: [{ n: a, d: b }, { n: c, d }, { n: A + Cc, d: L, ask: true }] }, { a: A, b: Cc, op: '+' });
      const [hiN, hiD, loN, loD, H, Lo] = A > Cc ? [a, b, c, d, A, Cc] : [c, d, a, b, Cc, A];
      return num('F511', hiN + '/' + hiD + ' − ' + loN + '/' + loD + ' = ?/' + L, H - Lo, { MF7: hiN - loN > 0 ? hiN - loN : null }, ['Use ' + fracName(L, 2) + ': ' + hiN + '/' + hiD + ' = ' + H + '/' + L + ' and ' + loN + '/' + loD + ' = ' + Lo + '/' + L + '.', H + ' − ' + Lo + ' = ' + (H - Lo)], { type: 'fracbar', bars: [{ n: hiN, d: hiD }, { n: loN, d: loD }, { n: H - Lo, d: L, ask: true }] }, { a: H, b: Lo, op: '−' });
    },
    F512(r) {
      const b = r.int(2, 8), a = r.int(1, b - 1), thing = r.pick(['pizzas', 'pies', 'loaves of bread', 'melons']);
      if (r.next() < 0.5) return num('F512', a + ' ÷ ' + b + ' = ?/' + b, a, { MF8: b }, ['Sharing ' + a + (a === 1 ? ' whole' : ' wholes') + ' among ' + b + ' gives each a fraction.', a + ' ÷ ' + b + ' = ' + a + '/' + b + ', so the top is ' + a], { type: 'fracbar', obj: OBJ[thing], bars: Array.from({ length: a }, () => ({ n: 1, d: b })) }, { frac: [a, b] });
      if (a === 1) return GEN.F512(r); // "1 loaves are shared": the story needs at least 2
      return num('F512', a + ' ' + thing + ' are shared equally by ' + b + ' friends. How much does each friend get? ?/' + b, a, { MF8: b }, ['Cut each of the ' + a + ' into ' + b + ' equal pieces. Each friend gets 1 piece from each.', 'That is ' + a + ' pieces of size 1/' + b + ', so ' + a + '/' + b + ' and the top is ' + a], { type: 'fracbar', obj: OBJ[thing], bars: Array.from({ length: a }, () => ({ n: 1, d: b })) }, { frac: [a, b] });
    },
    F513(r) {
      const b = r.int(2, 6), d = r.int(2, 6), a = r.int(1, b - 1), c = r.int(1, d - 1);
      if (r.next() < 0.3) { const whole = b * r.int(2, 6); return num('F513', a + '/' + b + ' of ' + whole + ' = ?', a * whole / b, { M15: a + whole }, ['Find 1/' + b + ' of ' + whole + ': ' + whole + ' ÷ ' + b + ' = ' + whole / b + '.', a + ' × ' + whole / b + ' = ' + a * whole / b], { type: 'fracbar', bars: [{ n: a, d: b }] }, { a, b: whole / b, op: '×' }); }
      return num('F513', a + '/' + b + ' × ' + c + '/' + d + ' = ?/' + b * d, a * c, { MF9: a * d !== a * c ? a * d : null }, ['Multiply the bottoms: ' + b + ' × ' + d + ' = ' + b * d + '.', 'Multiply the tops: ' + a + ' × ' + c + ' = ' + a * c], { type: 'fracarea', a, b, c, d }, { a, b: c, op: '×' });
    },
    F514(r) {
      const k = r.int(2, 8), n = r.int(2, 6);
      if (r.next() < 0.5) return num('F514', n + ' ÷ 1/' + k + ' = ?', n * k, { MD7: n % k === 0 ? n / k : null }, ['How many 1/' + k + ' pieces fit in 1 whole? ' + k + '.', n + ' × ' + k + ' = ' + n * k], { type: 'fracbar', bars: Array.from({ length: Math.min(n, 4) }, () => ({ n: k, d: k })) }, { a: n, b: k, op: '×' });
      return num('F514', '1/' + k + ' ÷ ' + n + ' = 1/?', k * n, { MF10: k % n === 0 ? k / n : null }, ['Split the 1/' + k + ' piece into ' + n + ' equal parts. The pieces get smaller.', k + ' × ' + n + ' = ' + k * n], { type: 'fracbar', bars: [{ n: 1, d: k }, { n: 1, d: k * n }] }, { a: k, b: n, op: '×' });
    },
    // ===== Phase 7: money and time =====
    MY01(r) {
      const c = r.pick(COINS), k = r.int(1, 4), v = c.v * k;
      return num('MY01', 'How many cents ' + (k === 1 ? 'is 1 ' + c.one : 'are ' + k + ' ' + c.many) + '?', v, { MY1: k === v ? null : k }, ['A ' + c.one + ' is worth ' + c.v + (c.v === 1 ? ' cent.' : ' cents.'), k === 1 ? '1 ' + c.one + ' is ' + v + (v === 1 ? ' cent.' : ' cents.') : 'Add ' + c.v + ' once for each coin. ' + Array(k).fill(c.v).join(' + ') + ' = ' + v], { type: 'coins', coins: Array(k).fill(c.v) });
    },
    MY02(r) {
      let coins, total;
      do { const n = r.int(2, 6); coins = Array.from({ length: n }, () => r.pick([25, 10, 10, 5, 5, 1, 1])).sort((x, y) => y - x); total = coins.reduce((a, x) => a + x, 0); } while (total > 99 || new Set(coins).size < 2);
      const steps = ['Start with the coin worth the most: ' + coins[0] + '.'];
      let run = coins[0];
      coins.slice(1).forEach((x) => { steps.push(run + ' + ' + x + ' = ' + (run + x)); run += x; });
      return num('MY02', 'How many cents are these coins worth?', total, { MY1: coins.length }, steps, { type: 'coins', coins });
    },
    MY03(r) {
      const name = r.pick(NAMES), thing = r.pick(['pencil', 'sticker', 'ruler', 'marker']), price = r.int(2, 9) * 5;
      if (r.next() < 0.5) { const have = r.int(price / 5 + 2, 19) * 5; return num('MY03', name + ' has ' + have + ' cents. A ' + thing + ' costs ' + price + ' cents. How many cents are left after ' + name + ' buys it?', have - price, { M14: have + price }, ['Buying it takes the price away.', have + ' − ' + price + ' = ' + (have - price)], { type: 'paper', scene: [{ coins: coinsFor(have) }, { obj: OBJ[thing], tag: price + '¢' }] }); }
      const more = r.int(2, 9) * 5; return num('MY03', name + ' has ' + price + ' cents and finds ' + more + ' cents more. How many cents does ' + name + ' have now?', price + more, { M14: Math.abs(price - more) || null }, ['Finding more money means we add.', price + ' + ' + more + ' = ' + (price + more)], { type: 'paper', scene: [{ coins: coinsFor(price) }, { op: '+' }, { coins: coinsFor(more) }] });
    },
    MY04(r) {
      const name = r.pick(NAMES), thing = r.pick(['book', 'toy car', 'juice', 'kite']);
      let price; do { price = r.int(3, 19) * 5; } while (price % 10 === 0 && r.next() < 0.5);
      const toTen = (10 - price % 10) % 10, next = price + toTen, rest = 100 - next, change = 100 - price;
      const digitWise = String((10 - Math.floor(price / 10)) * 10 + (10 - price % 10));
      const steps = toTen ? ['Count up to the next ten. ' + price + ' + ' + toTen + ' = ' + next, 'Then count up by tens to 100. ' + next + ' + ' + rest + ' = 100', 'Add the two jumps. ' + toTen + ' + ' + rest + ' = ' + change] : ['The price is already a ten. Count up to 100. ' + price + ' + ' + rest + ' = 100', 'The change is the jump. 100 − ' + price + ' = ' + change];
      return num('MY04', name + ' pays 1 dollar for a ' + thing + ' that costs ' + price + ' cents. A dollar is 100 cents. How many cents of change does ' + name + ' get?', change, { MY2: digitWise !== String(change) ? digitWise : null }, steps, { type: 'paper', scene: [{ bills: [1] }, { obj: OBJ[thing], tag: price + '¢' }] });
    },
    TM01(r) { return clockItem('TM01', r.int(1, 12), r.pick([0, 30]), r); },
    TM02(r) { let m; do { m = r.int(1, 11) * 5; } while (m === 30); return clockItem('TM02', r.int(1, 12), m, r); },
    TM03(r) { let m; do { m = r.int(1, 59); } while (m % 5 === 0); return clockItem('TM03', r.int(1, 12), m, r); },
    TM04(r) {
      const h = r.int(1, 9), m = r.int(0, 11) * 5, d = r.int(3, 35) * 5, endT = h * 60 + m + d, eh = Math.floor(endT / 60), em = endT % 60;
      if (eh > 12) return GEN.TM04(r);
      const t = (hh, mm) => hh + ':' + String(mm).padStart(2, '0');
      const what = r.pick(['A movie', 'A swim lesson', 'A school play', 'A bus ride']);
      const H = Math.floor(d / 60), R = d % 60, mid = t(h + H, m);
      const steps = H ? (R ? ['From ' + t(h, m) + ' to ' + mid + ' is ' + (H === 1 ? '1 hour, or 60 minutes.' : H + ' hours. ' + H + ' × 60 = ' + 60 * H), 'From ' + mid + ' to ' + t(eh, em) + ' is ' + R + ' more minutes.', 'Add them. ' + 60 * H + ' + ' + R + ' = ' + d]
        : ['From ' + t(h, m) + ' to ' + t(eh, em) + ' is ' + (H === 1 ? '1 hour.' : H + ' hours.'), 'Each hour is 60 minutes. ' + H + ' × 60 = ' + d])
        : eh === h ? ['Both times are in the same hour, so look at the minutes.', em + ' − ' + m + ' = ' + d]
          : em === 0 ? ['It ends on the next hour. Count on from ' + t(h, m) + ' to ' + t(eh, 0) + '.', '60 − ' + m + ' = ' + d]
            : ['Count on to the next hour first. From ' + t(h, m) + ' to ' + t(eh, 0) + ' is ' + (60 - m) + ' minutes.', 'From ' + t(eh, 0) + ' to ' + t(eh, em) + ' is ' + em + ' more minutes.', 'Add them. ' + (60 - m) + ' + ' + em + ' = ' + d];
      const asHundreds = (eh * 100 + em) - (h * 100 + m);
      return num('TM04', what + ' starts at ' + t(h, m) + ' and ends at ' + t(eh, em) + '. How many minutes long is it?', d, { MT4: asHundreds !== d ? asHundreds : null }, steps, { type: 'clock2', h, m, eh, em });
    },
    // ===== Money & Wealth Adventures: the math of money =====
    FN01(r) {
      const n = r.int(2, 9), p = r.int(2, 9), name = r.pick(NAMES);
      if (r.next() < 0.5) {
        const thing = r.pick(['melon', 'notebook', 'kite', 'ball']);
        return num('FN01', 'A ' + thing + ' costs $' + p + '. How much do ' + n + ' ' + thing + 's cost?', n * p, { M15: n + p }, [n + ' ' + thing + 's at $' + p + ' each is ' + n + ' groups of ' + p + '.', n + ' × ' + p + ' = ' + n * p], { type: 'paper', scene: [{ obj: OBJ[thing], n, tag: '$' + p }] });
      }
      return num('FN01', name + ' sells ' + n + ' cups of lemonade at $' + p + ' each. How many dollars come in?', n * p, { M15: n + p }, ['Money that comes in is called revenue.', n + ' × ' + p + ' = ' + n * p], { type: 'paper', scene: [{ obj: 'lemonade', n, tag: '$' + p }] });
    },
    FN02(r) {
      const n = r.pick([5, 6, 8, 10, 12, 15, 20]), p = r.int(2, 5), c = r.int(1, p - 1), R = n * p, C = n * c;
      const e = r.next() < 0.5 ? 0 : r.int(2, Math.max(2, Math.min(9, R - C - 1)));
      const P = R - C - e;
      if (P <= 0) return GEN.FN02(r);
      const name = r.pick(NAMES);
      const prompt = name + ' sells ' + n + ' cups of lemonade at $' + p + ' each. Each cup costs $' + c + ' to make.' + (e ? ' The sign cost $' + e + '.' : '') + ' What is the profit in dollars?';
      const steps = ['Revenue: ' + n + ' × ' + p + ' = ' + R, 'Cost of the cups: ' + n + ' × ' + c + ' = ' + C, e ? 'Profit: ' + R + ' − ' + C + ' − ' + e + ' = ' + P : 'Profit: ' + R + ' − ' + C + ' = ' + P];
      const pred = { MW1: R, MW3: R + C + e };
      if (e) pred.MW2 = R - C;
      return num('FN02', prompt, P, pred, steps, { type: 'paper', scene: [{ obj: 'lemonade', n, tag: '$' + p }, { obj: 'lemon', tag: '$' + c }].concat(e ? [{ obj: 'placard', tag: '$' + e }] : []) });
    },
    FN04(r) {
      const w = r.int(2, 9), k = r.int(2, 9), have = r.int(0, 4) * 5, goal = have + w * k, name = r.pick(NAMES), thing = r.pick(['game', 'bike bell', 'book set', 'kite']);
      const need = goal - have;
      const prompt = name + ' wants a ' + thing + ' that costs $' + goal + '.' + (have ? ' ' + name + ' has saved $' + have + '.' : '') + ' ' + name + ' saves $' + w + ' each week. How many weeks until ' + name + ' has enough?';
      const steps = have ? ['Still needed: ' + goal + ' − ' + have + ' = ' + need, 'Weeks: ' + need + ' ÷ ' + w + ' = ' + k] : ['Weeks: ' + goal + ' ÷ ' + w + ' = ' + k];
      const pred = {}; if (have) pred.MN6 = need;
      return num('FN04', prompt, k, pred, steps, { type: 'paper', scene: [{ obj: OBJ[thing], tag: '$' + goal }].concat(have ? [{ obj: 'jar', tag: '$' + have }] : []).concat([{ obj: 'calendar', tag: '+$' + w }]) });
    },
    FN05(r) {
      const T = r.pick([4, 5, 10]), k = r.int(1, T - 1), m = r.int(2, 9), P = T * m, name = r.pick(NAMES);
      const prompt = 'A lemonade company is split into ' + T + ' equal shares. ' + name + ' owns ' + k + ' of them. The company makes $' + P + ' profit. How many dollars is ' + name + '\u2019s part?';
      const steps = ['Each share gets ' + P + ' ÷ ' + T + ' = ' + m, k + ' shares get ' + k + ' × ' + m + ' = ' + k * m];
      return num('FN05', prompt, k * m, { MW5: P, M15: k + m }, steps, { type: 'paper', scene: [{ obj: 'lemonade' }, { shares: T, mine: k }, { obj: 'money-bag', tag: '$' + P }] });
    },
    FN07(r) {
      const A = r.int(1, 9) * 100, a = A / 10, A1 = A + a, b = A1 / 10, A2 = A1 + b, name = r.pick(NAMES);
      const intro = name + ' puts $' + A + ' in a savings jar. Each year the jar grows by one tenth of what is in it.';
      const steps = ['Year 1: one tenth of ' + A + ' is ' + a + '. ' + A + ' + ' + a + ' = ' + A1, 'Year 2: one tenth of ' + A1 + ' is ' + b + '. ' + A1 + ' + ' + b + ' = ' + A2];
      if (r.next() < 0.35) return num('FN07', intro + ' How many dollars does the jar grow in year 2?', b, { MW4: a }, steps.concat(['Growth in year 2: ' + A2 + ' − ' + A1 + ' = ' + b]), { type: 'paper', scene: [{ obj: 'jar', tag: '$' + A }] });
      return num('FN07', intro + ' How many dollars are in the jar after 2 years?', A2, { MW4: A + 2 * a }, steps, { type: 'paper', scene: [{ obj: 'jar', tag: '$' + A }] });
    },
    FN03(r) {
      // dollars and cents: written with a decimal point, two places for the cents
      const a = r.int(105, 899), b = r.int(105, 899), add = r.next() < 0.5, name = r.pick(NAMES);
      if (add) {
        if (a + b > 999) return GEN.FN03(r);
        return num('FN03', 'A pen costs $' + money(a) + ' and a pad costs $' + money(b) + '. How many dollars for both?', dec(a + b, 2), {}, ['Line up the decimal points: dollars with dollars, cents with cents.', money(a) + ' + ' + money(b) + ' = ' + money(a + b)], { type: 'paper', scene: [{ obj: 'pen', tag: '$' + money(a) }, { obj: 'pad', tag: '$' + money(b) }] }, { decimal: true });
      }
      const pay = (Math.floor(a / 100) + 1 + r.int(0, 3)) * 100;
      return num('FN03', name + ' pays $' + money(pay) + ' for a book that costs $' + money(a) + '. How many dollars of change?', dec(pay - a, 2), {}, ['Line up the decimal points: dollars with dollars, cents with cents.', money(pay) + ' − ' + money(a) + ' = ' + money(pay - a)], { type: 'paper', scene: [{ bills: billsFor(pay / 100) }, { obj: 'book', tag: '$' + money(a) }] }, { decimal: true });
    },
    FN06(r) {
      // unit price: the price of one, from a pack price
      const n = r.pick([2, 3, 4, 5, 6, 8, 10]), u = r.int(2, 19) * 5, P = n * u, thing = r.pick(['pencils', 'stickers', 'erasers']);
      if (r.next() < 0.3) {
        let n2, u2; do { n2 = r.pick([2, 3, 4, 5, 6, 8, 10]); u2 = r.int(2, 19) * 5; } while (n2 === n || u2 === u);
        const P2 = n2 * u2, cheaper = u < u2 ? 'Pack A' : 'Pack B';
        return textChoice('FN06', 'Pack A has ' + n + ' ' + thing + ' for $' + money(P) + '. Pack B has ' + n2 + ' ' + thing + ' for $' + money(P2) + '. Which pack costs less for one?', cheaper, [cheaper === 'Pack A' ? 'Pack B' : 'Pack A'], ['Pack A: ' + money(P) + ' ÷ ' + n + ' = ' + money(u), 'Pack B: ' + money(P2) + ' ÷ ' + n2 + ' = ' + money(u2), 'The smaller price for one is the better buy.'], { type: 'paper', scene: [{ label: 'A', obj: OBJ[thing], n, tag: '$' + money(P) }, { label: 'B', obj: OBJ[thing], n: n2, tag: '$' + money(P2) }] }, r);
      }
      return num('FN06', n + ' ' + thing + ' cost $' + money(P) + '. How many dollars is one?', dec(u, 2), {}, ['One costs the pack price divided by how many.', money(P) + ' ÷ ' + n + ' = ' + money(u)], { type: 'paper', scene: [{ obj: OBJ[thing], n, tag: '$' + money(P) }] }, { decimal: true });
    },
    FN08(r) {
      // read a price line: prices on a grid, week by week; going up is never guaranteed
      const prices = priceWeeks(r), w = (k) => prices[k - 1];
      const ups = [1, 2, 3].filter((k) => w(k + 1) > w(k)), downs = [1, 2, 3].filter((k) => w(k + 1) < w(k));
      const model = { type: 'priceline', prices };
      if (ups.length && r.next() < 0.5) { const k = r.pick(ups); return num('FN08', 'How many dollars did the price go up from week ' + k + ' to week ' + (k + 1) + '?', w(k + 1) - w(k), { MW6: w(k + 1) }, ['Week ' + k + ': ' + w(k) + '. Week ' + (k + 1) + ': ' + w(k + 1) + '.', w(k + 1) + ' − ' + w(k) + ' = ' + (w(k + 1) - w(k))], model); }
      if (downs.length && r.next() < 0.6) { const k = r.pick(downs); return num('FN08', 'How many dollars did the price go down from week ' + k + ' to week ' + (k + 1) + '?', w(k) - w(k + 1), { MW6: w(k + 1) }, ['Week ' + k + ': ' + w(k) + '. Week ' + (k + 1) + ': ' + w(k + 1) + '.', w(k) + ' − ' + w(k + 1) + ' = ' + (w(k) - w(k + 1))], model); }
      const hi = Math.max(...prices), wk = prices.indexOf(hi) + 1;
      return num('FN08', 'In which week was the price highest?', wk, { MW7: hi }, ['The highest point is ' + hi + ' dollars.', 'That point is above week ' + wk + '. So the week is ' + wk + '.'], model);
    },
    // ===== Phase 7: measurement and geometry =====
    MS01(r) {
      const cm = r.next() < 0.5, max = cm ? 15 : 12, len = r.int(2, max - 2), start = r.next() < 0.5 ? 0 : r.int(1, max - len), end = start + len;
      const thing = r.pick(['ribbon', 'pencil', 'crayon']), unit = cm ? 'centimeters' : 'inches';
      const steps = start === 0 ? ['It starts at 0 and ends at ' + end + '.', 'So it is ' + len + ' ' + unit + ' long.'] : ['It starts at ' + start + ', not at 0.', 'Count the units from ' + start + ' to ' + end + '.', end + ' − ' + start + ' = ' + len];
      return num('MS01', 'How many ' + unit + ' long is the ' + thing + '?', len, { MM1: start ? end : null }, steps, { type: 'ruler', cm, max, start, end });
    },
    MS02(r) {
      const cm = r.next() < 0.5, a = r.int(12, cm ? 90 : 48), b = r.int(5, a - 3), unit = cm ? 'centimeters' : 'inches';
      return num('MS02', 'The red ribbon is ' + a + ' ' + unit + ' long. The blue ribbon is ' + b + ' ' + unit + ' long. How much longer is the red ribbon?', a - b, { M14: a + b }, ['How much longer means find the difference.', a + ' − ' + b + ' = ' + (a - b)], { type: 'lengths', a, b, cm });
    },
    MS03(r) {
      const cm = r.next() < 0.5, unit = cm ? 'centimeters' : 'inches', w = r.int(3, 12); let h; do { h = r.int(2, 9); } while (h === w);
      const P = 2 * (w + h);
      if (r.next() < 0.35) {
        const pred = {}; if (P - w !== h) pred.MM2 = P - w;
        return num('MS03', 'A rectangle has a perimeter of ' + P + ' ' + unit + '. It is ' + w + ' ' + unit + ' long. How wide is it?', h, pred, ['The two length sides: ' + w + ' + ' + w + ' = ' + 2 * w, 'The two width sides share the rest: ' + P + ' − ' + 2 * w + ' = ' + 2 * h, 'Each width side is half of that: ' + 2 * h + ' ÷ 2 = ' + h], { type: 'rect', w, h, cm, show: 'perim', unknownH: true });
      }
      return num('MS03', 'A rectangle is ' + w + ' ' + unit + ' long and ' + h + ' ' + unit + ' wide. What is its perimeter in ' + unit + '?', P, { MM2: w + h, MM3: w * h !== P ? w * h : null }, ['A rectangle has 4 sides. Opposite sides are the same length.', 'Add all 4 sides: ' + w + ' + ' + h + ' + ' + w + ' + ' + h + ' = ' + P], { type: 'rect', w, h, cm, show: 'perim' });
    },
    MS04(r) {
      const w = r.int(2, 9), h = r.int(2, 7), A = w * h, P = 2 * (w + h);
      const pred = { MM3: P !== A ? P : null, M15: w + h !== A ? w + h : null };
      if (r.next() < 0.5) return num('MS04', 'How many squares cover the rectangle?', A, pred, ['There are ' + h + ' rows with ' + w + ' squares in each row.', h + ' × ' + w + ' = ' + A], { type: 'rect', w, h, cm: true, show: 'grid' });
      const cm = r.next() < 0.5, unit = cm ? 'centimeters' : 'inches';
      return num('MS04', 'A rectangle is ' + w + ' ' + unit + ' long and ' + h + ' ' + unit + ' wide. What is its area in square ' + unit + '?', A, pred, ['Area is the length times the width.', w + ' × ' + h + ' = ' + A], { type: 'rect', w, h, cm, show: 'area' });
    },
    GE01(r) {
      const sh = r.pick(SHAPES), rot = r.int(0, 359);
      const count = Array.from({ length: sh.n }, (_, i) => i + 1).join(', ');
      const steps = ['Count the straight sides: ' + count + '.', 'A shape with ' + sh.n + ' sides is a ' + sh.name + '.'];
      if (r.next() < 0.5) return textChoice('GE01', 'What is this shape called?', sh.name, SHAPES.filter((x) => x !== sh).map((x) => x.name), steps, { type: 'shape', n: sh.n, rot }, r);
      return num('GE01', 'How many sides does a ' + sh.name + ' have?', sh.n, {}, ['A ' + sh.name + ' has ' + sh.n + ' sides and ' + sh.n + ' corners.'], { type: 'paper' });
    },
    GE02(r) {
      if (r.next() < 0.6) {
        const a = r.int(1, 17) * 5;
        return num('GE02', 'A right angle is split into two angles. One angle is ' + a + ' degrees. How many degrees is the other angle?', 90 - a, { MG1: 100 - a }, ['A right angle is 90 degrees.', '90 − ' + a + ' = ' + (90 - a)], { type: 'angle', total: 90, a });
      }
      const a = r.int(2, 34) * 5;
      return num('GE02', 'A straight angle is split into two angles. One angle is ' + a + ' degrees. How many degrees is the other angle?', 180 - a, { M14: 180 + a }, ['A straight angle is 180 degrees.', '180 − ' + a + ' = ' + (180 - a)], { type: 'angle', total: 180, a });
    },
    GE03(r) {
      let x, y; do { x = r.int(0, 8); y = r.int(0, 8); } while (x === y);
      const steps = ['Start at 0.', 'Go across to ' + x + '.', 'Then go up to ' + y + '.', 'The star is ' + x + ' across and ' + y + ' up.'];
      if (r.next() < 0.5) return num('GE03', 'How far across from 0 is the star?', x, { MG2: y }, steps, { type: 'grid', x, y, max: 8 });
      return num('GE03', 'How far up from 0 is the star?', y, { MG2: x }, steps, { type: 'grid', x, y, max: 8 });
    },
    F515(r) {
      const l = r.int(2, 6), w = r.int(2, 5), h = r.int(2, 5);
      return num('F515', 'A box is ' + l + ' cubes long, ' + w + ' cubes wide and ' + h + ' cubes tall. How many cubes fill it?', l * w * h, { M15: l + w + h }, ['One layer: ' + l + ' × ' + w + ' = ' + l * w + ' cubes.', h + ' layers: ' + l * w + ' × ' + h + ' = ' + l * w * h], { type: 'volume', l, w, h }, { a: l * w, b: h, op: '×' });
    }
  });

  function generate(skill, rng) {
    if (!GEN[skill]) throw new Error('Unknown skill ' + skill);
    const item = GEN[skill](rng);
    // second format for every skill: multiple choice with diagnostic distractors (except PV10 and build items)
    if (item.format === 'number' && !item.textChoices && /^\d+(\.\d+)?$/.test(item.answer) && rng.next() < 0.35) {
      const set = new Set([item.answer]);
      Object.values(item.predicted).forEach((v) => set.add(v));
      const dp = dpOf(item.answer), n = Math.round(Number(item.answer) * Math.pow(10, dp));
      let delta = 1;
      while (set.size < 4) { set.add(dec(n + delta, dp)); if (set.size < 4 && n - delta >= 0) set.add(dec(n - delta, dp)); delta += (delta < 10 ? 9 : 1); }
      const choices = Array.from(set).slice(0, 4);
      if (!choices.includes(item.answer)) choices[0] = item.answer;
      // shuffle deterministically
      for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
      item.format = 'choice';
      item.choices = choices;
    }
    return item;
  }

  // answers are compared as typed, after removing commas, spaces and leading zeros; decimals also ignore trailing zeros
  function normalize(v) {
    let t = String(v).trim();
    if (!/^[\d,.\s]+$/.test(t)) return t;
    t = t.replace(/[,\s]/g, '');
    if (/^\d*\.\d*$/.test(t) && t !== '.') { t = t.replace(/0+$/, '').replace(/\.$/, ''); if (t.startsWith('.')) t = '0' + t; }
    return t.replace(/^0+(?=\d)/, '');
  }
  function check(item, response) {
    const resp = normalize(response);
    if (resp === item.answer) return { correct: true, misconception: null };
    let mis = null;
    Object.keys(item.predicted || {}).forEach((k) => { if (!mis && item.predicted[k] === resp) mis = k; });
    return { correct: false, misconception: mis };
  }

  // ---------- Fix Pip's mistake: an erroneous worked example built from a real misconception ----------
  // What Pip did wrong, in words a child can read
  const PIP_DID = {
    MW1: 'Pip gave all the money that came in, not the profit.',
    MW2: 'Pip forgot one of the costs.',
    MW3: 'Pip added the costs instead of taking them away.',
    MW4: 'Pip added the first year\u2019s growth again.',
    MW5: 'Pip gave the whole profit to one owner.',
    MW6: 'Pip gave a price instead of how much it changed.',
    MW7: 'Pip gave the price instead of the week.',
    MM1: 'Pip read the number at the end instead of counting from the start.',
    MM2: 'Pip added only two sides of the rectangle.',
    MM3: 'Pip mixed up area and perimeter.',
    MG1: 'Pip used 100 degrees for a right angle.',
    MG2: 'Pip went up first, then across.',
    MY1: 'Pip counted the coins instead of adding what they are worth.',
    MY2: 'Pip took each digit from 10 instead of counting up to 100 cents.',
    MT4: 'Pip subtracted the times as if an hour had 100 minutes.',
    M01: 'Pip took the smaller digit from the bigger one in each column.',
    M02: 'Pip broke a ten but forgot there was one ten fewer.',
    M04: 'Pip wrote the bottom digit when the top digit was zero.',
    M05: 'Pip wrote a two-digit sum in one place instead of making a ten.',
    M06: 'Pip made a ten but forgot to add it to the tens.',
    M07: 'Pip used the digit on its own instead of what its place makes it worth.',
    M08: 'Pip left out a zero that holds an empty place.',
    M09: 'Pip wrote the parts side by side instead of putting them together.',
    M11: 'Pip chopped off the end instead of finding the closer number.',
    M12: 'Pip counted the starting number too, so the answer is one off.',
    M13: 'Pip took away in the wrong order.',
    M14: 'Pip picked the operation from one word instead of the whole story.',
    M15: 'Pip added the numbers instead of multiplying.',
    M16: 'Pip mixed up the rules for times 0 and times 1.',
    M18: 'Pip used a fact next door: one group too many or too few.',
    MC1: 'Pip took every digit from 10, but only the last one comes from 10.',
    MN1: 'Pip counted each jump as 1 when each jump was bigger.',
    MN3: 'Pip did 10 groups but forgot to take one group away.',
    MN4: 'Pip took away instead of finding how many groups.',
    MN5: 'Pip multiplied by the tens but lost the zero.',
    MN6: 'Pip did the first step and then stopped.',
    MP1: 'Pip added the numbers shown instead of finding the missing part.',
    ME1: 'Pip thought = means "write the answer next".',
    M1T: 'Pip changed the ones instead of the tens.',
    MF11: 'Pip counted the parts that are not shaded.',
    MF12: 'Pip counted the tick marks instead of the jumps.',
    MF1: 'Pip added the same number to the top and bottom instead of multiplying.',
    MF2: 'Pip thought a bigger bottom number means a bigger fraction.',
    MF3: 'Pip added the bottom numbers too.',
    MF4: 'Pip just added the whole number to the top.',
    MF6: 'Pip added tenths and hundredths without changing the tenths first.',
    MF7: 'Pip added the tops before making the pieces the same size.',
    MF8: 'Pip divided the other way round.',
    MF9: 'Pip multiplied the top of one fraction by the bottom of the other.',
    MF10: 'Pip made the pieces bigger instead of smaller.',
    MD1: 'Pip wrote hundredths in the tenths place.',
    MD2: 'Pip thought the decimal with more digits is bigger.',
    MD3: 'Pip stuck zeros on the end instead of moving the digits.',
    MD4: 'Pip mixed up the tenths and hundredths places.',
    MD5: 'Pip lined up the last digits instead of the decimal points.',
    MD6: 'Pip put the decimal point in the wrong place.',
    MD7: 'Pip thought dividing always makes a number smaller.',
    MX1: 'Pip wrote the parts side by side instead of adding them.',
    MX2: 'Pip found only two of the four parts.',
    MR1: 'Pip left a remainder big enough for one more group.',
    MO1: 'Pip worked left to right and ignored the order rules.'
  };
  const MIS_FAMILIES = [
    ['MW1', 'MW2', 'MW3', 'M14', 'MN6'], ['MW4', 'MW5', 'M15', 'MN6'], ['MW6', 'MW7', 'MW1', 'MN6'],
    ['MM1', 'MM2', 'MM3', 'M12', 'M15'], ['MG1', 'MG2', 'MT4', 'M14'],
    ['MY1', 'MY2', 'M12', 'M13'], ['MT4', 'M01', 'M02', 'M13'],
    ['M01', 'M02', 'M04', 'M05', 'M06', 'M12', 'M13', 'M1T', 'MP1', 'ME1', 'MC1', 'M14', 'MN6'],
    ['M07', 'M08', 'M09', 'M11', 'MN1', 'M1T'],
    ['M15', 'M16', 'M18', 'MN3', 'MN4', 'MN5', 'MX1', 'MX2', 'MR1', 'MO1'],
    ['MF1', 'MF2', 'MF3', 'MF4', 'MF6', 'MF7', 'MF8', 'MF9', 'MF10', 'MF11', 'MF12'],
    ['MD1', 'MD2', 'MD3', 'MD4', 'MD5', 'MD6', 'MD7']
  ];
  // a worked line with Pip's wrong answer: "43 − 17 = ?" becomes "43 − 17 = 34"
  function makeMistake(skill, r) {
    for (let tries = 0; tries < 40; tries++) {
      const base = GEN[skill](r);
      if (base.format !== 'number') continue;
      const keys = Object.keys(base.predicted || {}).filter((k) => PIP_DID[k]);
      if (!keys.length) continue;
      const wrong = base.predicted[r.pick(keys)], res = check(base, wrong);
      if (res.correct || !PIP_DID[res.misconception]) continue;
      const mis = res.misconception;
      const shown = /= \?$/.test(base.prompt) ? base.prompt.replace(/= \?$/, '= ' + wrong) : base.prompt + ' Pip answered ' + wrong + '.';
      // wrong reasons come from the same topic, so the child has to think about this problem
      const family = MIS_FAMILIES.find((f) => f.includes(mis)) || Object.keys(PIP_DID);
      const pool = family.filter((k) => k !== mis && PIP_DID[k]);
      const others = [];
      while (others.length < 2 && others.length < pool.length) { const k = r.pick(pool); if (!others.includes(k)) others.push(k); }
      const options = [mis].concat(others).map((k) => ({ k, text: PIP_DID[k] }));
      for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
      const lines = /= \?$/.test(base.prompt) ? [shown] : [base.prompt, 'Pip’s answer: ' + wrong];
      return { skill, format: 'mistake', prompt: shown, lines, base, wrong, mis, options, answer: base.answer, predicted: base.predicted, steps: base.steps, model: base.model };
    }
    return null;
  }

  // ---------- Tenbright 2.0 Phase 4: new kinds of evidence ----------
  // Same math, new story: the item's own numbers told as a short story. The steps, the answer and the clues stay the
  // engine's, so every number still comes from the engine. Story sentences reuse the word-problem wording.
  const NO_TRANSFER = /^(WP|C114$|F411$|C108$)/;
  function makeTransfer(skill, r) {
    if (NO_TRANSFER.test(skill)) return null;
    for (let tries = 0; tries < 30; tries++) {
      const it = GEN[skill](r);
      const { a, b, op } = it;
      if (it.format !== 'number' || !op || typeof a !== 'number' || typeof b !== 'number' || !Number.isInteger(a) || !Number.isInteger(b)) continue;
      if (!/^\d+$/.test(it.answer) || /\d\.\d|\//.test(it.prompt) || a < 1 || b < 1) continue;
      const c = Number(it.answer);
      const name = r.pick(NAMES), thing = r.pick(THINGS);
      let prompt = null;
      if (op === '+' && a + b === c) prompt = name + ' had ' + a + ' ' + thing + '. ' + name + ' found ' + b + ' more. How many ' + thing + ' now?';
      else if (op === '−' && a - b === c) prompt = name + ' had ' + a + ' ' + thing + ' and gave away ' + b + '. How many are left?';
      else if (op === '×' && a * b === c && Math.min(a, b) <= 99 && Math.min(a, b) >= 2) { const g = Math.min(a, b), e = Math.max(a, b); prompt = 'There are ' + g + ' ' + r.pick(['bags', 'boxes', 'baskets', 'rows']) + ' with ' + e + ' ' + thing + ' in each. How many ' + thing + ' in all?'; }
      else if (op === '÷' && a === b * c && b >= 2) { let other = r.pick(NAMES); while (other === name) other = r.pick(NAMES); prompt = name + ' has ' + a + ' ' + thing + '. That is ' + b + ' times as many as ' + other + '. How many does ' + other + ' have?'; }
      if (!prompt) continue;
      return Object.assign({}, it, { prompt, kind: 'transfer', story: true, from: it.prompt, model: Object.assign({}, it.model, { obj: OBJ[thing] }) });
    }
    return null;
  }
  // Fill in the missing step: Pip's worked steps with one result left out. The answer is that step's own number.
  // a number with thousands commas or a plain number (a comma after it, as in "= 16, make a ten", is not part of it)
  const STEP_RESULT = /= (\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(?![\d,.]*\d)(?!\/| R)/g;
  function stepResult(s) { let m, last = null; STEP_RESULT.lastIndex = 0; while ((m = STEP_RESULT.exec(s))) last = m; return last; }
  function makeStepFill(skill, r) {
    for (let tries = 0; tries < 30; tries++) {
      const it = GEN[skill](r);
      if (!it.steps || it.steps.length < 2 || it.format === 'build') continue;
      const can = [];
      it.steps.slice(0, -1).forEach((s, k) => {
        const m = stepResult(s); if (!m) return;
        const v = m[1].replace(/,/g, ''), before = (s.slice(0, m.index).match(/\d[\d,]*(?:\.\d+)?/g) || []).map((x) => Number(x.replace(/,/g, '')));
        // a real result: not the final answer, written the way it is typed, and not just a number from the same step rewritten
        if (v !== it.answer && normalize(v) === v && !before.includes(Number(v))) can.push(k);
      });
      if (!can.length) continue;
      const k = r.pick(can), m = stepResult(it.steps[k]);
      const answer = m[1].replace(/,/g, '');
      return { skill, format: 'stepfill', kind: 'stepfill', prompt: it.prompt, base: it, steps: it.steps, blank: { step: k, at: m.index + 2, len: m[1].length }, answer, predicted: {}, model: it.model, decimal: /\./.test(answer) };
    }
    return null;
  }
  // which new kinds a skill can offer (sampled once, with a fixed seed, so the answer never changes)
  const CAN = {};
  function canOffer(skill) {
    if (CAN[skill]) return CAN[skill];
    const r = makeRng(skill.split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7));
    let transfer = false, stepfill = false;
    for (let i = 0; i < 6 && !(transfer && stepfill); i++) { transfer = transfer || !!makeTransfer(skill, r); stepfill = stepfill || !!makeStepFill(skill, r); }
    return (CAN[skill] = { transfer, stepfill, reason: true });
  }
  // the kinds of evidence a skill has so far: right on the first try, with at most a small nudge
  function evidence(st) {
    const a = st.attempts || [], ok = (x) => x.correct && x.hint <= 1;
    return {
      independent: a.filter((x) => (x.kind || 'plain') === 'plain' && ok(x)).length,
      transfer: a.some((x) => x.kind === 'transfer' && ok(x)),
      stepfill: a.some((x) => x.kind === 'stepfill' && ok(x)),
      reason: !!(st.why && st.why.right > 0) || a.some((x) => x.kind === 'mistake' && ok(x))
    };
  }
  // mastery needs separate kinds of evidence: at least two of story, missing step and reason, where the skill has them
  function evidenceMissing(st, skill) {
    const can = canOffer(skill), ev = evidence(st);
    const kinds = ['transfer', 'stepfill', 'reason'].filter((k) => can[k]);
    const have = kinds.filter((k) => ev[k]);
    if (have.length >= Math.min(2, kinds.length)) return [];
    return kinds.filter((k) => !ev[k]);
  }

  // ---------- explanation variants: a miss after one explanation brings a different one ----------
  const EXPLAIN_KINDS = ['steps', 'picture', 'idea'];
  function explainState(st) { return (st.explain = st.explain || { tried: {}, pending: null, avoid: null }); }
  function explainPick(st) {
    const x = explainState(st), rate = (k) => { const t = x.tried[k]; return t && t[0] ? t[1] / t[0] : null; };
    let pool = EXPLAIN_KINDS.filter((k) => k !== x.avoid);
    const untried = pool.filter((k) => !x.tried[k]);
    if (x.avoid && untried.length) return untried[0];
    // otherwise the one that has worked best so far; steps first when nothing is known
    pool = pool.slice().sort((p, q) => (rate(q) ?? 0.5) - (rate(p) ?? 0.5) || EXPLAIN_KINDS.indexOf(p) - EXPLAIN_KINDS.indexOf(q));
    return pool[0];
  }
  function explainShown(st, kind) { if (EXPLAIN_KINDS.includes(kind)) explainState(st).pending = kind; }
  // the next first try at the skill tells whether the explanation helped
  function explainOutcome(st, correct) {
    const x = st.explain; if (!x || !x.pending) return;
    const t = (x.tried[x.pending] = x.tried[x.pending] || [0, 0]);
    t[0]++; if (correct) t[1]++;
    x.avoid = correct ? null : x.pending;
    x.pending = null;
  }
  // what has helped most, once there is enough to say (for the parent page)
  function explainBest(st) {
    const x = st.explain; if (!x) return null;
    const ok = EXPLAIN_KINDS.filter((k) => x.tried[k] && x.tried[k][0] >= 2 && x.tried[k][1] / x.tried[k][0] >= 0.5);
    ok.sort((p, q) => x.tried[q][1] / x.tried[q][0] - x.tried[p][1] / x.tried[p][0]);
    return ok[0] || null;
  }

  // ---------- Tenbright 2.0 Phase 5: games ----------
  // Three short games on skills the child has already lit, each with a real math purpose. Every number comes from here.
  // A game opens when its first skill is lit; harder levels open with later skills. No timers unless the child chooses
  // the optional timed run, which is offered only after a game level has been finished once.
  const GAMES = {
    bridge: { name: 'Build the Bridge', levels: [['C107', 'C103'], ['AS10', 'AS07'], ['AS13', 'AS15']] },
    pizza: { name: 'Pizza Shop', levels: [['F301'], ['F413'], ['F415']] },
    detective: { name: 'Number Detective', levels: [['PV07', 'C107'], ['F412', 'MU13']] },
    // races (owner, Nov 27, 2026): each answer moves the racer one stop. Pip's race uses the child's lit number skills
    // (every region but Zuri's); Zuri's race uses her lit shapes and measuring skills. Levels are filled in below.
    race: { name: 'Pip’s Lantern Race', levels: [] },
    zrace: { name: 'Zuri’s Shape Race', levels: [] }
  };
  const RACE_STOPS = 6;
  const isZuriSkill = (id) => /^(GE|MS)\d/.test(id);
  const GAME_ROUNDS = 5;
  // ---------- Money & Wealth Adventures: pretend money inside one story, fresh each time ----------
  // Each adventure is a short story of engine questions. A step names the math skill it uses (its first answer counts as
  // story evidence for that skill); the last step is an idea check with two or three choices. `story` is the strip of
  // running totals the child sees, as [label, value] pairs. Investing stories open only when a parent turns them on.
  const ADVENTURES = {
    piggy: { name: 'Piggy Bank Start', needs: ['C102', 'C103'], skills: ['C102', 'C103'], idea: 'Saving adds up; spending takes away', real: 'Families save a little at a time to buy something later.', home: 'Count the coins in a jar together, add a few, and count again.' },
    shelf: { name: 'The Toy Shelf', needs: ['MY01', 'AS01'], skills: ['AS01'], idea: 'Spending takes money away', real: 'Before buying, people check how much money will be left.', home: 'Give your child a few coins at a shop and let them work out what is left after one small buy.' },
    kite: { name: 'Save for the Kite', needs: ['AS10'], skills: ['AS10', 'AS05'], idea: 'A saving goal', real: 'People set a goal and count up to see how much more they need.', home: 'Choose something your child wants and work out together how much more is needed.' },
    jar: { name: 'Count the Jar', needs: ['MY02'], skills: ['MY02', 'AS10'], idea: 'What money is worth', real: 'Cashiers count coins starting with the ones worth the most.', home: 'Empty a coin jar together and count it, biggest coins first.' },
    change: { name: 'Check Your Change', needs: ['MY04'], skills: ['MY04', 'AS05'], idea: 'Making and checking change', real: 'Shoppers count up from the price to check their change.', home: 'At a store, guess the change before the cashier gives it.' },
    twenty: { name: 'The $20 Challenge', needs: ['FN04'], skills: ['AS01', 'AS10', 'FN04'], idea: 'Spend, save or set aside for a goal', real: 'People decide what to spend now and what to save for later.', home: 'Talk about one thing your family needs and one thing someone wants, and which comes first.' },
    stall: { name: 'Market Stall Prices', needs: ['FN01'], skills: ['FN01', 'AS05', 'AS07'], idea: 'Price times quantity', real: 'Shops multiply the price by how many to find a total.', home: 'At the market, pick one item and work out the cost of several.' },
    lemonade: { name: 'Build a Lemonade Stand', needs: ['FN02'], skills: ['FN01', 'FN02'], idea: 'Revenue, cost and profit', real: 'Shops and businesses take their costs away from the money that comes in to know if they made money.', home: 'Ask: if the lemonade cost more to make, what would happen to the profit?', explainer: true },
    company: { name: 'Become a Company Owner', needs: ['FN05'], skills: ['F408', 'FN05'], idea: 'A share is part ownership', real: 'People who own shares own part of a company and get part of its profit.', home: 'Ask: if a company makes less profit next year, what happens to each owner’s part?', investing: true, explainer: true },
    pricetest: { name: 'Lemonade Price Test', needs: ['FN02'], skills: ['FN01', 'FN02'], idea: 'Pricing and demand', real: 'Shops try different prices: a higher price can mean fewer sales.', home: 'Ask: if a toy cost twice as much, would as many people buy it?' },
    rainy: { name: 'A Rainy Day', needs: ['FN02'], skills: ['FN01', 'FN02'], idea: 'A loss', real: 'When costs are bigger than sales, a business has a loss that day.', home: 'Talk about a time plans changed because of the weather, and what it cost.' },
    shopping: { name: 'Shopping List', needs: ['PV13', 'AS08'], skills: ['PV13', 'AS08', 'AS12'], idea: 'Budgeting with an estimate', real: 'Shoppers round prices to check quickly whether a list fits their money.', home: 'Before checkout, round each item on a short list and estimate the total together.' },
    cents: { name: 'Dollars and Cents', needs: ['FN03'], skills: ['FN03'], idea: 'Money as decimals', real: 'Prices use a decimal point: dollars on the left, cents on the right.', home: 'Read prices on a receipt together and say the dollars and the cents.' },
    better: { name: 'The Better Buy', needs: ['FN06'], skills: ['FN06'], idea: 'Unit price', real: 'Shelf labels often show the price for one, so shoppers can compare packs.', home: 'At the store, find two pack sizes of the same thing and work out the price for one.' },
    split: { name: 'Split the Bill', needs: ['F408'], skills: ['F408', 'AS05'], idea: 'Sharing a cost fairly', real: 'Friends who share a meal often divide the bill so each pays the same.', home: 'Share a pretend bill for a family meal and work out each person\u2019s part.' },
    dividend: { name: 'Dividend Day', needs: ['FN05'], skills: ['F408', 'FN05'], idea: 'Dividends', real: 'Some companies pay part of their profit to the people who own shares.', home: 'Ask: if a company makes more profit, what happens to each owner\u2019s part? And if it makes less?', investing: true },
    bulk: { name: 'Lemons in Bulk', needs: ['FN06'], skills: ['FN06', 'MU06'], idea: 'Unit cost for a business', real: 'Businesses compare the cost of one item in small and big packs.', home: 'Compare the price for one in a small and a big pack of something you buy often.' },
    early: { name: 'Start a Year Early', needs: ['FN07'], skills: ['FN07'], idea: 'Time helps growth', real: 'Money saved earlier has more years to grow.', home: 'Look at how a savings jar would grow if you started this year or next year.', investing: true },
    updown: { name: 'Up and Down Prices', needs: ['FN08'], skills: ['FN08'], idea: 'Prices change; gains are not guaranteed', real: 'The price of a share goes up and down; going up last week does not mean it will next week.', home: 'Track the price of one thing, like bananas, for four weeks and draw it as a line.', investing: true },
    growth: { name: 'The Money-Growing Mystery', needs: ['FN07'], skills: ['FN07'], idea: 'Interest and compound growth', real: 'Banks add interest to savings, and the interest can grow on itself.', home: 'Look at a bank savings rate together and talk about how it can change.', investing: true, explainer: true }
  };
  const litStatus = (st) => ['mastered', 'certified', 'placed'].includes(st.status);
  function adventureOpen(skills, id, opts) {
    const A = ADVENTURES[id];
    if (A.investing && !(opts && opts.investing)) return false;
    return A.needs.every((s) => skills[s] && litStatus(skills[s]));
  }
  // clue answers as text, like every engine item, and never equal to the right answer
  function advStep(skill, prompt, answer, how, story, predicted, extra) {
    const pr = {};
    Object.keys(predicted || {}).forEach((k) => { if (predicted[k] === null || predicted[k] === undefined) return; const v = String(predicted[k]); if (v !== String(answer) && !Object.values(pr).includes(v)) pr[k] = v; });
    return Object.assign({ game: 'adventure', skill, prompt, answer: String(answer), how, story, predicted: pr }, extra || {});
  }
  const idea = (prompt, answer, choices, how, story) => advStep(null, prompt, answer, how, story, {}, { choices, idea: true });
  const D = (n) => '$' + n, CT = (n) => n + '¢';
  const ADV_BUILD = {
    piggy(r) {
      const name = r.pick(NAMES), a = r.int(2, 5), b = r.int(2, 4), t1 = a + b, c = r.int(1, 10 - t1), t2 = t1 + c, d = r.int(2, t2 - 1), t3 = t2 - d;
      return { intro: name + ' is saving pennies in a piggy bank. Every coin is pretend.', steps: [
        advStep('C102', name + ' has ' + a + ' pennies and saves ' + b + ' more. How many pennies now?', t1, a + ' + ' + b + ' = ' + t1, [['Pennies', a]], { M12: t1 - 1 }),
        advStep('C102', 'Next week ' + name + ' saves ' + c + ' more. How many pennies now?', t2, t1 + ' + ' + c + ' = ' + t2, [['Pennies', t1]], { M12: t2 - 1 }),
        advStep('C103', name + ' spends ' + d + ' pennies on a sticker. How many pennies are left?', t3, t2 + ' − ' + d + ' = ' + t3, [['Pennies', t2], ['Spent', d]], { M14: t2 + d }),
        idea('When you save, does the money in the bank go up or down?', 'Up', ['Up', 'Down'], 'Saving adds to the money, so it goes up.', [['Pennies', t3]])
      ] };
    },
    shelf(r) {
      const name = r.pick(NAMES), have = r.int(14, 20), p1 = r.int(3, 6), left1 = have - p1, p2 = r.int(2, left1 - 3), left2 = left1 - p2, want = left2 + r.int(2, Math.min(6, 20 - left2)), more = want - left2;
      return { intro: name + ' has ' + CT(have) + ' to spend at the toy shelf. The money is pretend.', steps: [
        advStep('AS01', 'A sticker costs ' + CT(p1) + '. How many cents are left after ' + name + ' buys it?', left1, have + ' − ' + p1 + ' = ' + left1, [['Have', CT(have)], ['Price', CT(p1)]], { M14: have + p1 }),
        advStep('AS01', 'A pencil top costs ' + CT(p2) + '. How many cents are left now?', left2, left1 + ' − ' + p2 + ' = ' + left2, [['Have', CT(left1)], ['Price', CT(p2)]], { M14: left1 + p2 }),
        advStep('AS01', 'A toy car costs ' + CT(want) + '. How many more cents does ' + name + ' need for it?', more, want + ' − ' + left2 + ' = ' + more, [['Have', CT(left2)], ['Price', CT(want)]], { M14: want + left2 }),
        idea('When you spend money, does the money you have go up or down?', 'Down', ['Up', 'Down'], 'Spending takes money away, so it goes down.', [['Have', CT(left2)]])
      ] };
    },
    kite(r) {
      const name = r.pick(NAMES), K = r.int(9, 18) * 5, S = r.int(12, K - 20), need1 = K - S, w = r.int(4, need1 - 6), S2 = S + w, need2 = K - S2, g = need2 + r.int(2, 9), left = S2 + g - K;
      return { intro: name + ' wants a kite that costs ' + D(K) + '. The money is pretend.', steps: [
        advStep('AS10', name + ' has saved ' + D(S) + '. How many more dollars are needed?', need1, K + ' − ' + S + ' = ' + need1, [['Goal', D(K)], ['Saved', D(S)]], { M14: K + S }),
        advStep('AS10', name + ' saves ' + D(w) + ' more. How many more dollars are needed now?', need2, K + ' − ' + S2 + ' = ' + need2, [['Goal', D(K)], ['Saved', D(S2)]], { M14: need1 + w }),
        advStep('AS05', 'Grandma adds ' + D(g) + '. After buying the kite, how many dollars are left?', left, S2 + ' + ' + g + ' − ' + K + ' = ' + left, [['Goal', D(K)], ['Saved', D(S2 + g)]], { MN6: S2 + g }),
        idea('Which reaches a goal sooner?', 'Saving more each week', ['Saving more each week', 'Saving less each week'], 'More each week means fewer weeks to the goal.', [['Goal', D(K)]])
      ] };
    },
    jar(r) {
      let coins, total;
      do { const n = r.int(3, 6); coins = Array.from({ length: n }, () => r.pick([25, 10, 10, 5, 5, 1, 1])).sort((x, y) => y - x); total = coins.reduce((a, x) => a + x, 0); } while (total > 70 || total < 20 || new Set(coins).size < 2);
      const t2 = total + 25, toDollar = 100 - t2;
      return { intro: 'Pip found a jar of coins. Let’s count it. Every coin is pretend.', steps: [
        advStep('MY02', 'How many cents are the coins in the jar worth?', total, 'Start with the biggest coin and count on: ' + coins.join(' + ') + ' = ' + total, [['Coins', coins.length]], { MY1: coins.length }, { coins }),
        advStep('MY02', 'Pip adds one quarter. How many cents are in the jar now?', t2, total + ' + 25 = ' + t2, [['Jar', CT(total)]], { MY1: coins.length + 1 }, { coins: coins.concat([25]).sort((x, y) => y - x) }),
        advStep('AS10', 'A dollar is 100 cents. How many more cents make a dollar?', toDollar, '100 − ' + t2 + ' = ' + toDollar, [['Jar', CT(t2)]], { MY2: t2 % 10 ? String((10 - Math.floor(t2 / 10)) * 10 + (10 - t2 % 10)) : null }),
        idea('Are 3 pennies worth more than 1 dime?', 'No', ['Yes', 'No'], '3 pennies are 3 cents. A dime is 10 cents.', [['Jar', CT(t2)]])
      ] };
    },
    change(r) {
      const p1 = r.int(4, 17) * 5, c1 = 100 - p1, p2 = r.int(4, 17) * 5, c2 = 100 - p2, both = c1 + c2;
      return { intro: 'Pip pays with a dollar twice. Let’s check the change. The money is pretend.', steps: [
        advStep('MY04', 'A juice costs ' + CT(p1) + '. Pip pays 100 cents. How many cents of change?', c1, 'Count up from ' + p1 + ' to 100: 100 − ' + p1 + ' = ' + c1, [['Paid', CT(100)], ['Price', CT(p1)]], { MY2: p1 % 10 ? String((10 - Math.floor(p1 / 10)) * 10 + (10 - p1 % 10)) : null }),
        advStep('MY04', 'A snack costs ' + CT(p2) + '. Pip pays 100 cents again. How many cents of change?', c2, 'Count up from ' + p2 + ' to 100: 100 − ' + p2 + ' = ' + c2, [['Paid', CT(100)], ['Price', CT(p2)]], { MY2: p2 % 10 ? String((10 - Math.floor(p2 / 10)) * 10 + (10 - p2 % 10)) : null }),
        advStep('AS05', 'How many cents of change did Pip get in all?', both, c1 + ' + ' + c2 + ' = ' + both, [['Change', CT(c1)], ['Change', CT(c2)]], { M14: Math.abs(c1 - c2) || null }),
        idea('What does counting up from the price to the money paid find?', 'Change', ['Change', 'Price'], 'The jump from the price to the money paid is the change.', [['Change', CT(both)]])
      ] };
    },
    twenty(r) {
      const b = r.int(4, 12), left = 20 - b, w = r.int(2, 5), k = r.int(2, 6), G = left + w * k, need = G - left;
      return { intro: 'You have $20 of pretend money. Let’s make a plan.', steps: [
        advStep('AS01', 'A book costs ' + D(b) + '. How many dollars are left if you buy it?', left, '20 − ' + b + ' = ' + left, [['Have', D(20)], ['Book', D(b)]], { M14: 20 + b }),
        advStep('AS10', 'You save what is left for a game that costs ' + D(G) + '. How many more dollars do you need?', need, G + ' − ' + left + ' = ' + need, [['Saved', D(left)], ['Goal', D(G)]], { M14: G + left }),
        advStep('FN04', 'You save ' + D(w) + ' each week. How many weeks until you have enough?', k, need + ' ÷ ' + w + ' = ' + k, [['Still needed', D(need)], ['Each week', D(w)]], { MN6: need }),
        idea('Which of these is a need?', 'Lunch', ['Lunch', 'A toy'], 'A need is something we must have, like food. A want is nice to have.', [['Goal', D(G)]])
      ] };
    },
    stall(r) {
      const n1 = r.int(2, 6), p1 = r.int(2, 6), n2 = r.int(2, 6), p2 = r.int(2, 6), a = n1 * p1, b = n2 * p2, tot = a + b, pay = (Math.floor(tot / 10) + 1) * 10, ch = pay - tot;
      return { intro: 'Pip is shopping at the market stall. The money is pretend.', steps: [
        advStep('FN01', 'Melons cost ' + D(p1) + ' each. How many dollars do ' + n1 + ' melons cost?', a, n1 + ' × ' + p1 + ' = ' + a, [['Melons', n1], ['Price', D(p1)]], { M15: n1 + p1 }),
        advStep('FN01', 'Notebooks cost ' + D(p2) + ' each. How many dollars do ' + n2 + ' notebooks cost?', b, n2 + ' × ' + p2 + ' = ' + b, [['Notebooks', n2], ['Price', D(p2)]], { M15: n2 + p2 }),
        advStep('AS05', 'How many dollars for the melons and the notebooks together?', tot, a + ' + ' + b + ' = ' + tot, [['Melons', D(a)], ['Notebooks', D(b)]], {}),
        advStep('AS07', 'Pip pays with ' + D(pay) + '. How many dollars of change?', ch, pay + ' − ' + tot + ' = ' + ch, [['Total', D(tot)], ['Paid', D(pay)]], { M14: pay + tot }),
        idea('When every item costs the same, which finds the total?', 'Multiply', ['Multiply', 'Subtract'], 'The number of items times the price is the total.', [['Total', D(tot)]])
      ] };
    },
    lemonade(r) {
      const n = r.pick([10, 12, 15, 20, 24, 30]), p = r.int(2, 5), c = 1, e = r.int(4, 9), R = n * p, C = n * c, G = R - C, N = G - e;
      return { intro: 'Let’s run a lemonade stand. Every number is pretend money for this story.', explain: { cups: n, price: p, cost: c, sign: e }, steps: [
        advStep('FN01', 'You sold ' + n + ' cups at ' + D(p) + ' each. How many dollars came in?', R, 'Money in is revenue. ' + n + ' × ' + p + ' = ' + R, [['Cups', n], ['Price', D(p)]], { M15: n + p }),
        advStep('FN01', 'Each cup cost ' + D(c) + ' to make. How many dollars did the ' + n + ' cups cost?', C, n + ' × ' + c + ' = ' + C, [['Cups', n], ['Price', D(p)], ['Sales', D(R)]]),
        advStep('FN02', 'Profit is the money in take away the costs. What is the profit?', G, R + ' − ' + C + ' = ' + G, [['Cups', n], ['Price', D(p)], ['Sales', D(R)], ['Costs', D(C)]], { MW1: R, MW3: R + C }),
        advStep('FN02', 'The sign for the stand cost ' + D(e) + '. What is the profit now?', N, R + ' − ' + C + ' − ' + e + ' = ' + N, [['Cups', n], ['Price', D(p)], ['Sales', D(R)], ['Costs', D(C + e)]], { MW1: R, MW2: G, MW3: R + C + e }),
        idea('Which is bigger, the revenue or the profit?', 'Revenue', ['Revenue', 'Profit'], 'The revenue is ' + R + '. The profit is ' + N + '. Profit is what is left after costs, so it is smaller.', [['Sales', D(R)], ['Costs', D(C + e)], ['Profit', D(N)]])
      ] };
    },
    company(r) {
      const T = 10, k = r.int(2, 5), m = r.int(3, 9), P = T * m, m2 = r.int(1, m - 1), P2 = T * m2;
      return { intro: 'A lemonade company is split into 10 equal shares. You own ' + k + ' of them. The money is pretend.', explain: { shares: T, own: k, profit: P, profit2: P2 }, steps: [
        advStep('F408', 'The company makes ' + D(P) + ' profit. How many dollars does each share get?', m, P + ' ÷ ' + T + ' = ' + m, [['Shares', T], ['You own', k], ['Profit', D(P)]], {}),
        advStep('FN05', 'You own ' + k + ' shares. How many dollars is your part?', k * m, k + ' × ' + m + ' = ' + k * m, [['You own', k], ['Each share', D(m)]], { MW5: P, M15: k + m }),
        advStep('FN05', 'Next year the profit is only ' + D(P2) + '. How many dollars is your part now?', k * m2, P2 + ' ÷ ' + T + ' = ' + m2 + ', and ' + k + ' × ' + m2 + ' = ' + k * m2, [['You own', k], ['Profit', D(P2)]], { MW5: P2 }),
        idea('Is owning a share a promise of money every year?', 'No', ['Yes', 'No'], 'Profit can go up or down, so a share is not a promise.', [['Your part', D(k * m2)]])
      ] };
    },
    growth(r) {
      const A = r.int(1, 9) * 100, a = A / 10, flat2 = A + 2 * a, A1 = A + a, b = A1 / 10, A2 = A1 + b, diff = A2 - flat2;
      return { intro: 'Two jars each start with ' + D(A) + '. Which one grows more? The money is pretend.', explain: { start: A }, steps: [
        advStep('FN07', 'Jar A adds ' + D(a) + ' each year. How many dollars after 2 years?', flat2, A + ' + ' + a + ' + ' + a + ' = ' + flat2, [['Jar A', D(A)]], {}),
        advStep('FN07', 'Jar B grows by one tenth of what is in it. How many dollars after 1 year?', A1, 'One tenth of ' + A + ' is ' + a + '. ' + A + ' + ' + a + ' = ' + A1, [['Jar B', D(A)]], {}),
        advStep('FN07', 'How many dollars are in Jar B after 2 years?', A2, 'One tenth of ' + A1 + ' is ' + b + '. ' + A1 + ' + ' + b + ' = ' + A2, [['Jar B', D(A1)]], { MW4: A1 + a }),
        advStep('FN07', 'How many more dollars does Jar B have than Jar A after 2 years?', diff, A2 + ' − ' + flat2 + ' = ' + diff, [['Jar A', D(flat2)], ['Jar B', D(A2)]], {}),
        idea('Why does Jar B grow more?', 'It grows on its growth', ['It grows on its growth', 'It started with more'], 'Both started the same. Jar B adds a tenth of a bigger amount each year.', [['Jar B', D(A2)]])
      ] };
    }
  };
  // short animated explainers (plan section 7, scripts A, B and C): frames of a picture and one Pip line, numbers from here
  function adventureExplainer(id, r) {
    if (id === 'lemonade') {
      const n = r.pick([10, 12, 15, 20]), p = r.int(2, 4), e = r.int(4, 9), R = n * p, C = n, N = R - C - e;
      return [
        { say: 'I am Pip, a helper made by a computer. Let\u2019s run a lemonade stand.', pic: { type: 'stand' } },
        { say: 'We sold ' + n + ' cups. Each cup sells for $' + p + '.', pic: { type: 'cups', n } },
        { say: 'Money in is called revenue. ' + n + ' × ' + p + ' = ' + R, pic: { type: 'bars', bars: [['Revenue', R]] } },
        { say: 'Each cup costs $1 to make. ' + n + ' × 1 = ' + C, pic: { type: 'bars', bars: [['Revenue', R], ['Costs', C]] } },
        { say: 'Profit is what is left after costs. The sign cost $' + e + '. ' + R + ' − ' + C + ' − ' + e + ' = ' + N, pic: { type: 'bars', bars: [['Revenue', R], ['Costs', C + e], ['Profit', N]] } }
      ];
    }
    if (id === 'growth') {
      const A = r.int(1, 9) * 100, a = A / 10, A1 = A + a, b = A1 / 10, A2 = A1 + b, flat2 = A1 + a;
      return [
        { say: 'Two jars start with $' + A + '. Which one grows faster?', pic: { type: 'bars', bars: [['Jar A', A], ['Jar B', A]] } },
        { say: 'Jar A adds $' + a + ' each year. Jar B adds one tenth of what it holds.', pic: { type: 'bars', bars: [['Jar A', A], ['Jar B', A]] } },
        { say: 'After one year, both jars have $' + A1 + '. ' + A + ' + ' + a + ' = ' + A1, pic: { type: 'bars', bars: [['Jar A', A1], ['Jar B', A1]] } },
        { say: 'Now one tenth of ' + A1 + ' is ' + b + '. ' + A1 + ' + ' + b + ' = ' + A2 + '. Jar A has ' + flat2 + '.', pic: { type: 'bars', bars: [['Jar A', flat2], ['Jar B', A2]] } },
        { say: 'Growth on growth is called compound growth. Banks use it for interest. A bank tells you its rate first, and the rate can change.', pic: { type: 'bars', bars: [['Jar A', flat2], ['Jar B', A2]] } }
      ];
    }
    if (id === 'company') {
      const k = r.int(2, 5), m = r.int(3, 9), P = 10 * m, m2 = r.int(1, m - 1), P2 = 10 * m2;
      return [
        { say: 'A company can be split into equal parts called shares. This one has 10.', pic: { type: 'pie', n: 10, own: 0 } },
        { say: 'You own ' + k + ' of the 10 shares. You own ' + k + ' tenths of the company.', pic: { type: 'pie', n: 10, own: k } },
        { say: 'The company made $' + P + ' profit. Each share gets ' + P + ' ÷ 10 = ' + m, pic: { type: 'pie', n: 10, own: k } },
        { say: 'Your ' + k + ' shares get ' + k + ' × ' + m + ' = ' + k * m, pic: { type: 'bars', bars: [['Profit', P], ['Your part', k * m]] } },
        { say: 'Next year the profit is $' + P2 + '. Your part is ' + k + ' × ' + m2 + ' = ' + k * m2 + '. Profit can be smaller, so a share is not a promise.', pic: { type: 'bars', bars: [['Profit', P2], ['Your part', k * m2]] } }
      ];
    }
    return null;
  }
  Object.assign(ADV_BUILD, {
    pricetest(r) {
      const sA = r.int(5, 8) * 5, sB = r.int(2, sA / 5 - 2) * 5, rA = 2 * sA, rB = 3 * sB, pA = rA - sA, pB = rB - sB;
      if (pA === pB) return ADV_BUILD.pricetest(r);
      const best = pA > pB ? '$2' : '$3';
      return { intro: 'Each cup costs $1 to make. Let\u2019s test two prices. The money is pretend.', steps: [
        advStep('FN01', 'At $2 a cup, ' + sA + ' cups sold. How many dollars came in?', rA, sA + ' × 2 = ' + rA, [['Price', D(2)], ['Cups', sA]], { M15: sA + 2 }),
        advStep('FN02', 'The cups cost $1 each. What is the profit at $2?', pA, rA + ' − ' + sA + ' = ' + pA, [['Sales', D(rA)], ['Costs', D(sA)]], { MW1: rA, MW3: rA + sA }),
        advStep('FN01', 'At $3 a cup, only ' + sB + ' cups sold. How many dollars came in?', rB, sB + ' × 3 = ' + rB, [['Price', D(3)], ['Cups', sB]], { M15: sB + 3 }),
        advStep('FN02', 'What is the profit at $3?', pB, rB + ' − ' + sB + ' = ' + pB, [['Sales', D(rB)], ['Costs', D(sB)]], { MW1: rB, MW3: rB + sB }),
        idea('Which price made more profit this time?', best, ['$2', '$3'], 'At $2 the profit is ' + pA + '. At $3 the profit is ' + pB + '.', [['Profit at $2', D(pA)], ['Profit at $3', D(pB)]])
      ] };
    },
    rainy(r) {
      const m = r.int(10, 20), s2 = r.int(2, Math.floor((m - 1) / 3)), R = 3 * s2, L2 = m - R;
      return { intro: 'It rained on the day of the lemonade stand. The money is pretend.', steps: [
        advStep('FN01', 'You made ' + m + ' cups. Each cup cost $1 to make. How many dollars did they cost?', m, m + ' × 1 = ' + m, [['Cups made', m]], {}),
        advStep('FN01', 'Only ' + s2 + ' cups sold, at $3 each. How many dollars came in?', R, s2 + ' × 3 = ' + R, [['Costs', D(m)], ['Cups sold', s2]], { M15: s2 + 3 }),
        advStep('FN02', 'How many dollars bigger are the costs than the sales?', L2, m + ' − ' + R + ' = ' + L2, [['Sales', D(R)], ['Costs', D(m)]], { M14: m + R }),
        idea('What is it called when costs are bigger than sales?', 'A loss', ['A loss', 'A profit'], 'The costs were ' + L2 + ' dollars more than the sales, so the stand had a loss.', [['Loss', D(L2)]])
      ] };
    },
    shopping(r) {
      const pick = () => { let x; do { x = r.int(11, 39); } while (x % 10 === 0 || x % 10 === 5); return x; };
      let p1, p2, p3; do { p1 = pick(); p2 = pick(); p3 = pick(); } while (p1 + p2 + p3 > 95); // the list fits in $100
      const rd = (x) => Math.round(x / 10) * 10, r1 = rd(p1), est = rd(p1) + rd(p2) + rd(p3), tot = p1 + p2 + p3;
      return { intro: 'You have $100 of pretend money for a shopping list.', steps: [
        advStep('PV13', 'Shoes cost ' + D(p1) + '. What is ' + p1 + ' rounded to the nearest ten?', r1, p1 + ' is between ' + Math.floor(p1 / 10) * 10 + ' and ' + (Math.floor(p1 / 10) * 10 + 10) + '. It is closer to ' + r1 + '.', [['Shoes', D(p1)]], {}),
        advStep('AS08', 'A hat costs ' + D(p2) + ' and a ball costs ' + D(p3) + '. Round all three prices and add them. What is the estimate?', est, rd(p1) + ' + ' + rd(p2) + ' + ' + rd(p3) + ' = ' + est, [['Shoes', D(p1)], ['Hat', D(p2)], ['Ball', D(p3)]], {}),
        advStep('AS08', 'Now add the real prices. How many dollars in all?', tot, p1 + ' + ' + p2 + ' + ' + p3 + ' = ' + tot, [['Estimate', D(est)]], {}),
        advStep('AS12', 'How many dollars are left from $100?', 100 - tot, '100 − ' + tot + ' = ' + (100 - tot), [['Have', D(100)], ['Total', D(tot)]], { M14: 100 + tot }),
        idea('Why round the prices first?', 'To check quickly if it fits', ['To check quickly if it fits', 'To pay less'], 'Rounding gives a quick estimate. The real total is close to it.', [['Total', D(tot)]])
      ] };
    },
    cents(r) {
      let a, b; do { a = r.int(105, 495); b = r.int(105, 495); } while (a % 5 || b % 5);
      const t = a + b, pay = Math.ceil((t + 1) / 100) * 100, ch = pay - t;
      return { intro: 'Prices with dollars and cents. The money is pretend.', decimal: true, steps: [
        advStep('FN03', 'A pen costs $' + money(a) + ' and a pad costs $' + money(b) + '. How many dollars for both?', dec(t, 2), money(a) + ' + ' + money(b) + ' = ' + money(t), [['Pen', '$' + money(a)], ['Pad', '$' + money(b)]], {}, { decimal: true }),
        advStep('FN03', 'You pay $' + money(pay) + '. How many dollars of change?', dec(ch, 2), money(pay) + ' − ' + money(t) + ' = ' + money(ch), [['Total', '$' + money(t)], ['Paid', '$' + money(pay)]], {}, { decimal: true }),
        advStep('FN03', 'A dollar is 100 cents. How many cents is $' + money(t) + '?', t, money(t) + ' dollars is ' + Math.floor(t / 100) + ' dollars and ' + (t % 100) + ' cents. ' + Math.floor(t / 100) + ' × 100 + ' + (t % 100) + ' = ' + t, [['Total', '$' + money(t)]], { MY1: Math.floor(t / 100) + (t % 100) }),
        idea('In $' + money(t) + ', what does the ' + Math.floor((t % 100) / 10) + ' after the point stand for?', Math.floor((t % 100) / 10) + ' dimes', [Math.floor((t % 100) / 10) + ' dimes', Math.floor((t % 100) / 10) + ' dollars'], 'The first place after the point is tenths of a dollar: dimes.', [['Total', '$' + money(t)]])
      ] };
    },
    better(r) {
      let nA, uA, nB, uB; do { nA = r.pick([2, 3, 4, 5]); nB = r.pick([6, 8, 10]); uA = r.int(6, 19) * 5; uB = r.int(4, 18) * 5; } while (uA === uB);
      const PA = nA * uA, PB = nB * uB, best = uA < uB ? 'The small pack' : 'The big pack';
      return { intro: 'Two packs of pencils. Which is the better buy? The money is pretend.', decimal: true, steps: [
        advStep('FN06', 'The small pack has ' + nA + ' pencils for $' + money(PA) + '. How many dollars is one pencil?', dec(uA, 2), money(PA) + ' ÷ ' + nA + ' = ' + money(uA), [['Small pack', '$' + money(PA)], ['Pencils', nA]], {}, { decimal: true }),
        advStep('FN06', 'The big pack has ' + nB + ' pencils for $' + money(PB) + '. How many dollars is one pencil?', dec(uB, 2), money(PB) + ' ÷ ' + nB + ' = ' + money(uB), [['Big pack', '$' + money(PB)], ['Pencils', nB]], {}, { decimal: true }),
        advStep('FN06', 'Which pack costs less for one pencil?', best, 'One pencil costs ' + money(uA) + ' in the small pack and ' + money(uB) + ' in the big pack.', [['Small pack', '$' + money(uA)], ['Big pack', '$' + money(uB)]], {}, { choices: ['The small pack', 'The big pack'] }),
        idea('Is the bigger pack always the better buy?', 'No, check the price for one', ['No, check the price for one', 'Yes, always'], 'Sometimes the big pack costs more for each one. Check the price for one.', [['Better buy', best === 'The small pack' ? 'Small pack' : 'Big pack']])
      ] };
    },
    split(r) {
      const n = r.int(3, 6), each = r.int(4, 12), bill = n * each, extra = n * r.int(1, 3), n2 = n + 1, tot2 = bill + extra;
      if (tot2 % n2) return ADV_BUILD.split(r);
      return { intro: 'Friends share a pizza dinner and split the bill. The money is pretend.', steps: [
        advStep('F408', 'The bill is ' + D(bill) + ' for ' + n + ' friends. How many dollars does each pay?', each, bill + ' ÷ ' + n + ' = ' + each, [['Bill', D(bill)], ['Friends', n]], { MN4: bill - n }),
        advStep('AS05', 'They add a dessert for ' + D(extra) + '. How many dollars is the bill now?', tot2, bill + ' + ' + extra + ' = ' + tot2, [['Bill', D(bill)], ['Dessert', D(extra)]], {}),
        advStep('F408', 'One more friend joins and shares it all. How many dollars does each of the ' + n2 + ' pay?', tot2 / n2, tot2 + ' ÷ ' + n2 + ' = ' + tot2 / n2, [['Bill', D(tot2)], ['Friends', n2]], { MN4: tot2 - n2 }),
        idea('What makes a split fair here?', 'Everyone pays the same part', ['Everyone pays the same part', 'The first one pays it all'], 'Dividing the bill into equal parts means everyone pays the same.', [['Each pays', D(tot2 / n2)]])
      ] };
    },
    dividend(r) {
      const T = r.pick([10, 20]), k = r.int(2, 5), m = r.int(2, 6), P = T * m, m2 = m + r.int(1, 4), P2 = T * m2;
      return { intro: 'You own ' + k + ' of the ' + T + ' shares in a lemonade company. The money is pretend.', steps: [
        advStep('F408', 'The company pays out ' + D(P) + ' of its profit to its owners. How many dollars does each share get?', m, P + ' ÷ ' + T + ' = ' + m, [['Shares', T], ['Paid out', D(P)]], {}),
        advStep('FN05', 'You own ' + k + ' shares. How many dollars is your dividend?', k * m, k + ' × ' + m + ' = ' + k * m, [['You own', k], ['Each share', D(m)]], { MW5: P, M15: k + m }),
        advStep('FN05', 'Next year it pays out ' + D(P2) + '. How many dollars is your dividend now?', k * m2, P2 + ' ÷ ' + T + ' = ' + m2 + ', and ' + k + ' × ' + m2 + ' = ' + k * m2, [['You own', k], ['Paid out', D(P2)]], { MW5: P2 }),
        idea('Where does a dividend come from?', 'The company\u2019s profit', ['The company\u2019s profit', 'A promise from a bank'], 'A dividend is part of the profit. If the profit is smaller, the dividend can be smaller or nothing.', [['Your dividend', D(k * m2)]])
      ] };
    },
    bulk(r) {
      let u1, u2; do { u1 = r.int(5, 12) * 5; u2 = r.int(4, 11) * 5; } while (u2 >= u1);
      const n1 = 12, n2 = 20, P1 = n1 * u1, P2 = n2 * u2, packs = r.int(2, 5), cost = packs * P2;
      return { intro: 'The lemonade stand needs lemons. Which pack is cheaper for one lemon? The money is pretend.', decimal: true, steps: [
        advStep('FN06', 'A bag of ' + n1 + ' lemons costs $' + money(P1) + '. How many dollars is one lemon?', dec(u1, 2), money(P1) + ' ÷ ' + n1 + ' = ' + money(u1), [['Small bag', '$' + money(P1)], ['Lemons', n1]], {}, { decimal: true }),
        advStep('FN06', 'A box of ' + n2 + ' lemons costs $' + money(P2) + '. How many dollars is one lemon?', dec(u2, 2), money(P2) + ' ÷ ' + n2 + ' = ' + money(u2), [['Big box', '$' + money(P2)], ['Lemons', n2]], {}, { decimal: true }),
        advStep('MU06', 'You buy ' + packs + ' boxes. Each box costs $' + money(P2) + '. How many dollars in all?', dec(cost, 2), packs + ' × ' + money(P2) + ' = ' + money(cost), [['Boxes', packs], ['Each box', '$' + money(P2)]], {}, { decimal: true }),
        idea('Why can a big box be a better buy?', 'Each lemon costs less', ['Each lemon costs less', 'The box is bigger'], 'One lemon costs ' + money(u2) + ' in the box and ' + money(u1) + ' in the bag.', [['Box, one lemon', '$' + money(u2)]])
      ] };
    },
    early(r) {
      const A = r.int(1, 9) * 100, a = A / 10, A1 = A + a, b = A1 / 10, A2 = A1 + b, diff = A2 - A1;
      return { intro: 'Maya and Kai each put ' + D(A) + ' in a savings jar that grows by one tenth each year. Maya starts a year earlier. The money is pretend.', steps: [
        advStep('FN07', 'How many dollars does Maya have after 1 year?', A1, 'One tenth of ' + A + ' is ' + a + '. ' + A + ' + ' + a + ' = ' + A1, [['Maya', D(A)]], {}),
        advStep('FN07', 'How many dollars does Maya have after 2 years?', A2, 'One tenth of ' + A1 + ' is ' + b + '. ' + A1 + ' + ' + b + ' = ' + A2, [['Maya', D(A1)]], { MW4: A1 + a }),
        advStep('FN07', 'Kai started a year later, so Kai has had 1 year. How many dollars does Kai have?', A1, A + ' + ' + a + ' = ' + A1, [['Kai', D(A)]], {}),
        advStep('FN07', 'How many more dollars does Maya have than Kai?', diff, A2 + ' − ' + A1 + ' = ' + diff, [['Maya', D(A2)], ['Kai', D(A1)]], {}),
        idea('Why does starting early help?', 'There is more time to grow', ['There is more time to grow', 'The jar is bigger'], 'Both jars grow the same way. Maya\u2019s jar had one more year.', [['Maya', D(A2)], ['Kai', D(A1)]])
      ] };
    },
    updown(r) {
      const p = priceWeeks(r), ups = [0, 1, 2].filter((i) => p[i + 1] > p[i]), downs = [0, 1, 2].filter((i) => p[i + 1] < p[i]), u = r.pick(ups), d = r.pick(downs), model = { type: 'priceline', prices: p };
      return { intro: 'A pretend company\u2019s share price, week by week.', steps: [
        advStep('FN08', 'How many dollars did the price go up from week ' + (u + 1) + ' to week ' + (u + 2) + '?', p[u + 1] - p[u], p[u + 1] + ' − ' + p[u] + ' = ' + (p[u + 1] - p[u]), [['Week ' + (u + 1), D(p[u])], ['Week ' + (u + 2), D(p[u + 1])]], { MW6: p[u + 1] }, { model }),
        advStep('FN08', 'How many dollars did the price go down from week ' + (d + 1) + ' to week ' + (d + 2) + '?', p[d] - p[d + 1], p[d] + ' − ' + p[d + 1] + ' = ' + (p[d] - p[d + 1]), [['Week ' + (d + 1), D(p[d])], ['Week ' + (d + 2), D(p[d + 1])]], { MW6: p[d + 1] }, { model }),
        advStep('FN08', 'In which week was the price highest?', p.indexOf(Math.max(...p)) + 1, 'The highest point is ' + Math.max(...p) + ' dollars. It is above week ' + (p.indexOf(Math.max(...p)) + 1) + '.', [['Highest', D(Math.max(...p))]], { MW7: Math.max(...p) }, { model }),
        idea('If the price went up last week, will it surely go up next week?', 'No', ['No', 'Yes'], 'Prices go up and down. Going up before does not mean it will go up again.', [['Week 4', D(p[3])]])
      ] };
    }
  });
  function adventure(id, r) {
    const b = ADV_BUILD[id];
    if (!b) return null;
    return Object.assign({ id }, b(r));
  }
  const lit = (st) => !!st && ['mastered', 'certified', 'placed'].includes(st.status);
  // the highest level open for this child, or 0 while the game is still closed
  function gameLevel(skills, game) {
    const lv = GAMES[game].levels;
    let n = 0;
    lv.forEach((ids, i) => { if (ids.some((id) => lit(skills[id]))) n = i + 1; });
    return n;
  }
  // Build the Bridge: the bridge must reach the far bank; the planks laid so far reach part of the way.
  // Which plank fills the gap? (missing part = whole − part)
  function bridgeRound(level, r) {
    const max = [20, 100, 1000][level - 1];
    let total, have;
    if (level === 1) { total = r.int(11, 20); have = r.int(3, total - 2); }
    else if (level === 2) { total = r.int(4, 10) * 10 + r.int(0, 9); have = r.int(12, total - 8); }
    else { total = r.int(3, 9) * 100 + r.int(0, 99); have = r.int(120, total - 40); }
    const gap = total - have;
    const wrong = new Set();
    [total + have, gap + 1, gap - 1, level > 1 ? gap + 10 : gap + 2, level > 1 ? gap - 10 : gap - 2].forEach((w) => { if (w > 0 && w !== gap && w <= max * 2) wrong.add(w); });
    const choices = [gap].concat([...wrong].slice(0, 2));
    for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
    return { game: 'bridge', level, total, have, answer: String(gap), choices: choices.map(String),
      prompt: 'The bridge must reach ' + total + '. The planks reach ' + have + '. Which plank fills the gap?',
      how: 'The gap is the whole take away the part. ' + total + ' − ' + have + ' = ' + gap + '.' };
  }
  // Pizza Shop: serve the order by tapping slices. Level 2 cuts the pizza into smaller slices (equivalent fractions);
  // level 3 serves two orders on one pizza (adding fractions with the same bottom number).
  function pizzaRound(level, r) {
    const d = r.pick([2, 3, 4, 6, 8]);
    if (level === 1) { const n = r.int(1, d - 1); return { game: 'pizza', level, slices: d, order: [[n, d]], answer: String(n), prompt: 'A customer wants ' + n + '/' + d + ' of a pizza. Tap the slices to serve it.', how: 'The pizza is cut into ' + d + ' equal slices. ' + n + '/' + d + ' means ' + n + ' of them.' }; }
    if (level === 2) {
      const dd = r.pick([2, 3, 4]), k = r.pick([2, 3, 4].filter((x) => dd * x <= 12)), n = r.int(1, dd - 1), slices = dd * k;
      return { game: 'pizza', level, slices, order: [[n, dd]], answer: String(n * k), prompt: 'A customer wants ' + n + '/' + dd + ' of a pizza. This pizza is cut into ' + slices + ' slices. Tap the slices to serve it.', how: 'Each ' + (dd === 2 ? 'half' : dd === 3 ? 'third' : 'quarter') + ' is ' + k + ' slices. ' + n + ' × ' + k + ' = ' + n * k + '.' };
    }
    const a = r.int(1, d - 2 > 0 ? d - 2 : 1), b = r.int(1, Math.max(1, d - 1 - a));
    if (a + b >= d) return pizzaRound(level, r);
    return { game: 'pizza', level, slices: d, order: [[a, d], [b, d]], answer: String(a + b), prompt: 'Two friends share one pizza. One wants ' + a + '/' + d + ' and one wants ' + b + '/' + d + '. Tap all the slices they get.', how: 'The slices are the same size, so count them. ' + a + ' + ' + b + ' = ' + (a + b) + '.' };
  }
  // Number Detective: find the hidden number. Level 1: patterns that add. Level 2: patterns that multiply, and number
  // sentences with a hidden number.
  function detectiveRound(level, r) {
    const kind = level === 1 ? 'add' : r.pick(['add', 'times', 'missing']);
    if (kind === 'missing') {
      const op = r.pick(['+', '×']);
      if (op === '+') { const a = r.int(5, 60), b = r.int(5, 39), first = r.next() < 0.5; return { game: 'detective', level, kind, answer: String(first ? a : b), clue: (first ? '?' : a) + ' + ' + (first ? b : '?') + ' = ' + (a + b), prompt: 'Find the hidden number.', how: 'Take away the part you know. ' + (a + b) + ' − ' + (first ? b : a) + ' = ' + (first ? a : b) + '.' }; }
      const a = r.int(2, 9), b = r.int(2, 9);
      return { game: 'detective', level, kind, answer: String(b), clue: a + ' × ? = ' + a * b, prompt: 'Find the hidden number.', how: 'How many groups of ' + a + ' make ' + a * b + '? ' + a + ' × ' + b + ' = ' + a * b + '.' };
    }
    let seq, rule, step;
    if (kind === 'add') { step = level === 1 ? r.pick([1, 2, 5, 10]) : r.int(3, 12); const s0 = r.int(1, level === 1 ? 20 : 40); seq = [0, 1, 2, 3, 4].map((i) => s0 + i * step); rule = 'add ' + step; }
    else { step = r.pick([2, 3]); const s0 = r.int(1, 4); seq = [0, 1, 2, 3, 4].map((i) => s0 * Math.pow(step, i)); rule = 'multiply by ' + step; }
    const hide = r.int(1, 4), ans = seq[hide];
    const shown = seq.map((x, i) => (i === hide ? '?' : String(x)));
    const prev = seq[hide - 1];
    return { game: 'detective', level, kind, answer: String(ans), seq: shown, rule, prompt: 'Find the hidden number in the pattern.',
      how: 'The rule is ' + rule + '. ' + prev + (kind === 'add' ? ' + ' : ' × ') + step + ' = ' + ans + '.' };
  }
  // a race: RACE_STOPS engine questions from the skills this child has lit for that racer (no "build" questions)
  function raceRounds(game, skills, r, n) {
    const pool = GAMES[game].levels[0].filter((id) => lit(skills[id]));
    if (!pool.length) return [];
    const out = [];
    for (let k = 0; out.length < (n || RACE_STOPS) && k < 200; k++) {
      const id = r.pick(pool), it = generate(id, r);
      if (it.format !== 'number' && it.format !== 'choice') continue;
      out.push({ game, skill: id, item: it, prompt: it.prompt, answer: String(it.answer), how: (it.steps || []).slice(-2).join(' ') });
    }
    return out;
  }
  function gameRound(game, level, r) { return game === 'bridge' ? bridgeRound(level, r) : game === 'pizza' ? pizzaRound(level, r) : detectiveRound(level, r); }

  // ---------- Lantern Line: number-line estimation warm-up ----------
  // Placing numbers on an empty number line trains the sense of how big numbers are, which strongly predicts later math.
  // The score is the percent absolute error (PAE): how far the tap was from the true spot, as a share of the whole line.
  function lineItem(grade, r) {
    const g = Number(grade) || 2;
    const pickRange = () => {
      if (g <= 1) return r.pick([[0, 20], [0, 100], [0, 100]]);
      if (g === 2) return r.pick([[0, 100], [0, 100], [0, 1000]]);
      if (g === 3) return r.pick([[0, 1000], [0, 1000], [0, 100], ['frac']]);
      if (g === 4) return r.pick([[0, 1000], [0, 10000], ['frac'], ['frac']]);
      return r.pick([[0, 10000], ['frac'], ['dec'], ['dec']]);
    };
    const rg = pickRange();
    if (rg[0] === 'frac') {
      const d = r.pick([2, 3, 4, 5, 8, 10]), n = r.int(1, d - 1);
      return { kind: 'line', lo: 0, hi: 1, target: n / d, label: n + '/' + d, hiLabel: '1' };
    }
    if (rg[0] === 'dec') {
      const t = r.int(1, 99);
      return { kind: 'line', lo: 0, hi: 1, target: t / 100, label: (t % 10 ? (t / 100).toFixed(2) : (t / 100).toFixed(1)), hiLabel: '1' };
    }
    const [lo, hi] = rg, span = hi - lo;
    let v; do { v = r.int(lo + Math.ceil(span * 0.03), hi - Math.ceil(span * 0.03)); } while (v % (span / 10) === 0 && r.next() < 0.8);
    return { kind: 'line', lo, hi, target: v, label: String(v), hiLabel: String(hi) };
  }
  const linePAE = (item, placed) => Math.abs(placed - item.target) / (item.hi - item.lo);

  // ---------- Bayesian knowledge tracing ----------
  const BKT = { L0: 0.10, T: 0.15, S: 0.10, G: { number: 0.05, build: 0.05, choice: 0.25, mistake: 0.05, stepfill: 0.05 } };
  function bktUpdate(pKnown, correct, format, hintLevel) {
    const G = BKT.G[format] ?? 0.1;
    const S = BKT.S;
    let post;
    if (correct) post = (pKnown * (1 - S)) / (pKnown * (1 - S) + (1 - pKnown) * G);
    else post = (pKnown * S) / (pKnown * S + (1 - pKnown) * (1 - G));
    // a level-1 nudge halves the evidence of a correct answer
    if (correct && hintLevel === 1) post = pKnown + (post - pKnown) * 0.5;
    return post + (1 - post) * BKT.T;
  }

  // ---------- mastery and scheduling ----------
  const DAY = 86400000;
  const CHECK_DAYS = [7, 30, 90];

  function newSkillState() {
    return { status: 'locked', p: BKT.L0, attempts: [], learned: false, masteredAt: null, checks: [], misconceptions: {}, certifiedAt: null };
  }

  // skill: the skill id; with it, mastery also needs the separate kinds of evidence (Tenbright 2.0 Phase 4)
  function masteryMet(st, skill) {
    if (skill && evidenceMissing(st, skill).length) return false;
    const indep = st.attempts.filter((a) => (a.hint === 0 || a.hint === 1) && (a.kind || 'plain') === 'plain');
    if (indep.length < 10) return false;
    const last = indep.slice(-10);
    const acc = last.filter((a) => a.correct).length / 10;
    const formats = new Set(indep.map((a) => a.format));
    return st.p >= 0.95 && acc >= 0.9 && formats.size >= 2;
  }

  function refreshUnlocks(skills) {
    SKILL_ORDER.forEach((id) => {
      const st = skills[id];
      if (st.status === 'locked') {
        const ok = SKILLS[id].prereqs.every((p) => ['mastered', 'certified', 'placed'].includes(skills[p].status));
        if (ok) st.status = 'learning';
      }
    });
  }

  function recordAttempt(skills, id, item, result, hintLevel, now) {
    const st = skills[id];
    const kind = item.kind || (item.format === 'mistake' ? 'mistake' : 'plain');
    st.attempts.push({ correct: result.correct, format: item.format, hint: hintLevel, mis: result.misconception, at: now, kind });
    explainOutcome(st, result.correct);
    if (st.attempts.length > 60) st.attempts.shift();
    if (hintLevel <= 1) st.p = bktUpdate(st.p, result.correct, item.format, hintLevel);
    if (result.misconception) {
      st.misconceptions[result.misconception] = (st.misconceptions[result.misconception] || 0) + 1;
    }
    if (result.correct && st.activeMis) {
      st.clearRun = (st.clearRun || 0) + 1;
      if (st.clearRun >= 3) { st.misconceptions[st.activeMis] = 0; st.activeMis = null; st.clearRun = 0; }
    }
    if (!result.correct) st.clearRun = 0;
    // a misconception is confirmed after two matches within the last five attempts
    if (result.misconception) {
      const recent = st.attempts.slice(-5).filter((a) => a.mis === result.misconception).length;
      if (recent >= 2) st.activeMis = result.misconception;
    }
    if (st.status === 'learning' && st.learned) st.status = 'practiced';
    if ((st.status === 'practiced' || st.status === 'learning') && st.learned && masteryMet(st, id)) {
      st.status = 'mastered';
      st.masteredAt = now;
      st.checks = CHECK_DAYS.map((d) => ({ day: d, due: now + d * DAY, done: false, passed: null, items: [] }));
      refreshUnlocks(skills);
    }
  }

  function dueCheck(st, now) {
    if (!['mastered', 'certified', 'placed'].includes(st.status)) return null;
    return st.checks.find((c) => !c.done && c.due <= now) || null;
  }

  // records one retention-check item; a check is 4 items, passed at >= 3 correct (75%, the closest to 80% on 4 items is 3 of 4)
  function recordCheckItem(skills, id, correct, now) {
    const st = skills[id];
    const c = dueCheck(st, now);
    if (!c) return null;
    c.items.push(correct);
    if (c.items.length >= 4) {
      c.done = true;
      const n = c.items.filter(Boolean).length;
      c.passed = n >= 3;
      if (!c.passed) {
        st.status = 'practiced';
        st.p = Math.min(st.p, 0.6);
        st.checks = [];
      } else if (c.day === 30) {
        st.status = 'certified';
        st.certifiedAt = now;
      }
    }
    return c;
  }

  // next activity rule from the Phase 2 mastery spec
  // ---------- grade levels ----------
  // Each skill's grade comes from its Common Core code (2.NBT... is grade 2). Grade never locks a skill:
  // a grade focus only changes which open skill comes first.
  const GRADE_LEVELS = [1, 2, 3, 4, 5];
  const SCHOOL_GRADES = ['1', '2', '3', '4', '5', 'other'];
  const gradeOf = (id) => parseInt(SKILLS[id].ccss, 10);
  function defaultFocus(schoolGrade) {
    const g = parseInt(schoolGrade, 10);
    return g >= 1 && g <= 5 ? g : 'all';
  }
  function gradeProgress(skills) {
    return GRADE_LEVELS.map((g) => {
      const ids = SKILL_ORDER.filter((id) => gradeOf(id) === g);
      return { grade: g, total: ids.length, lit: ids.filter((id) => ['mastered', 'certified', 'placed'].includes(skills[id].status)).length, open: ids.filter((id) => skills[id].status !== 'locked').length };
    });
  }

  function nextActivity(skills, now, focus) {
    for (const id of SKILL_ORDER) if (skills[id].activeMis) return { kind: 'remediate', skill: id, reason: 'A clue keeps coming up in this skill, so we practice it with the model.' };
    for (const id of SKILL_ORDER) if (dueCheck(skills[id], now)) return { kind: 'check', skill: id, reason: 'A lantern dimmed: it is time for a retention check.' };
    const g = GRADE_LEVELS.includes(Number(focus)) ? Number(focus) : null;
    const active = SKILL_ORDER.filter((id) => ['learning', 'practiced'].includes(skills[id].status));
    if (active.length) {
      let pool = active, note = '';
      if (g) {
        const onGrade = active.filter((id) => gradeOf(id) === g);
        if (onGrade.length) { pool = onGrade; note = ' (Grade ' + g + ' focus)'; }
        else {
          // nothing open in the chosen grade yet: work on the earlier skills that unlock it
          const need = new Set();
          SKILL_ORDER.filter((id) => gradeOf(id) === g && skills[id].status === 'locked').forEach((id) => ancestors(id).forEach((a) => need.add(a)));
          const bridge = active.filter((id) => need.has(id));
          if (bridge.length) { pool = bridge; note = ' It opens the Grade ' + g + ' skills.'; }
          else note = ' Every Grade ' + g + ' skill is lit, so Pip moves on.';
        }
      }
      pool = pool.slice().sort((x, y) => skills[x].p - skills[y].p);
      const id = pool[0];
      return { kind: skills[id].learned ? 'practice' : 'learn', skill: id, reason: (skills[id].learned ? 'This skill has the lowest mastery estimate right now.' : 'All of its earlier skills are mastered, so it is ready to learn.') + note };
    }
    const lit = SKILL_ORDER.filter((id) => ['mastered', 'certified', 'placed'].includes(skills[id].status));
    const litOnGrade = g ? lit.filter((id) => gradeOf(id) === g) : [];
    return { kind: 'review', skill: litOnGrade[0] || lit[0] || 'PV03', reason: 'Everything in this slice is mastered; mixing in review.' };
  }

  function newLearner(nickname, birthYear, startHint, schoolGrade) {
    const skills = {};
    SKILL_ORDER.forEach((id) => { skills[id] = newSkillState(); });
    refreshUnlocks(skills);
    const grade = SCHOOL_GRADES.includes(String(schoolGrade)) ? String(schoolGrade) : null;
    return { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), nickname, birthYear, startHint, grade, focus: grade ? defaultFocus(grade) : 'all', skills, placementDone: false, sessions: [], created: Date.now() };
  }

  // ---------- placement (Phase 2, section 5) ----------
  const PLACEMENT_ANCHORS = ['PV04', 'PV10', 'AS05', 'AS07', 'AS12', 'AS15', 'MU03', 'MU12'];
  const PLACEMENT_MAX_ITEMS = 29;
  function ancestors(id, acc) {
    acc = acc || new Set();
    SKILLS[id].prereqs.forEach((p) => { if (!acc.has(p)) { acc.add(p); ancestors(p, acc); } });
    return acc;
  }
  // anchors for the added grades; the walk starts near the child's school grade and drops down if the first anchor is missed
  const ANCHORS_G1 = ['C107', 'C111'];
  const ANCHORS_G4 = ['F404', 'F406', 'F413'];
  const ANCHORS_G5 = ['F508', 'F511', 'F506'];
  // story anchors (Tenbright 2.0 Discovery Adventure): every walk also checks one or two word problems
  const STORY_ANCHORS = ['C114', 'WP02', 'WP04', 'F411', 'WP05'];
  function placementPlan(schoolGrade) {
    const g = parseInt(schoolGrade, 10);
    if (g === 1) return { queue: ANCHORS_G1.concat(['C114', 'PV04', 'PV10', 'AS05', 'AS07']), fallback: [] };
    if (g === 4) return { queue: ['AS12', 'MU12'].concat(ANCHORS_G4.slice(0, 2), ['F411'], ANCHORS_G4.slice(2), ['F418'], ANCHORS_G5.slice(0, 1)), fallback: ['PV04', 'PV10', 'AS05', 'AS07', 'MU03'] };
    if (g === 5) return { queue: ['AS15', 'MU12', 'WP05', 'F406', 'F413', 'F418'].concat(ANCHORS_G5), fallback: ['PV04', 'AS05', 'AS07', 'AS12', 'MU03'] };
    return { queue: ['PV04', 'PV10', 'AS05', 'WP02', 'AS07', 'AS12', 'AS15', 'MU03', 'MU12', 'WP04'].concat(ANCHORS_G4, ANCHORS_G5), fallback: ANCHORS_G1 };
  }
  // Phase 7 strands in the walk: one money or time check and one measuring or shapes check, matched to the school grade.
  // They wait at the end of the queue and move to the front once the questions left are just enough to ask them.
  const STRAND_REGIONS = ['market', 'clock', 'workshop', 'shapes'];
  const STRAND_ANCHORS = { 1: ['TM01', 'GE01'], 2: ['MY02', 'MS01'], 3: ['TM03', 'MS04'], 4: ['MY04', 'GE02'], 5: ['GE03', 'TM04'] };
  const isStrandAnchor = (id) => STRAND_REGIONS.includes(SKILLS[id].region);
  function strandAnchors(schoolGrade) { return (STRAND_ANCHORS[parseInt(schoolGrade, 10)] || STRAND_ANCHORS[2]).slice(); }
  // a strand check is a 2-question spot check: 2 of 2 counts as known; anything less means the child practices that
  // strand on the map, which is the safe side to err on. It costs exactly 2 questions and brings no follow-up.
  const STRAND_COST = 2;
  function strandsForward(ps) {
    const left = ps.queue.filter(isStrandAnchor);
    if (!left.length) return;
    // a child who has not passed any check yet is not asked the strands: their skills open later on the map
    if (!ps.passed.length && ps.current && isStrandAnchor(ps.current)) { ps.queue = ps.queue.filter((a) => !isStrandAnchor(a)); ps.current = ps.queue[0] || null; return; }
    // this is looked at between checks, so leave room for the core check that would come next: up to 4 questions and
    // a follow-up
    if (PLACEMENT_MAX_ITEMS - ps.items - 5 < STRAND_COST * left.length && !isStrandAnchor(ps.queue[0])) {
      ps.queue = left.concat(ps.queue.filter((a) => !isStrandAnchor(a)));
      ps.current = ps.queue[0];
      strandsForward(ps);
    }
  }
  // gentle: the parent said the child does not enjoy math yet or feels worried, so the walk opens with an easier check
  function newPlacement(schoolGrade, opts) {
    const plan = placementPlan(schoolGrade);
    const queue = plan.queue.slice().concat(strandAnchors(schoolGrade)), fallback = plan.fallback.slice();
    if (opts && opts.gentle && fallback.length) queue.unshift(fallback.shift());
    return { queue, fallback, current: queue[0], answers: [], passed: [], failed: [], items: 0, done: false, ev: {}, probe: null, probes: [], decided: 0, restedAt: 0, grade: schoolGrade || null };
  }
  // A follow-up question after a miss, to tell what kind of difficulty it is (Discovery Adventure):
  //  reading: a story was missed, so the same kind of math is asked without a story;
  //  foundation: a check was not passed, so one question from the skill underneath shows where to start.
  const READING_PROBE = { C114: 'C102', WP02: 'AS05', WP04: 'MU16', WP05: 'AS05', F411: 'MU16' };
  // a near miss: one away, ten away, a hundred away, or two digits swapped
  function isSlip(answer, response) {
    const a = Number(answer), r = Number(response);
    if (!Number.isFinite(a) || !Number.isFinite(r) || a === r) return false;
    const d = Math.abs(a - r);
    if (d === 1 || d === 10 || d === 100) return true;
    const sa = String(answer), sr = String(response);
    return sa.length === sr.length && sa.length > 1 && sa.split('').sort().join('') === sr.split('').sort().join('');
  }
  function evFor(ps, id) { ps.ev = ps.ev || {}; return (ps.ev[id] = ps.ev[id] || { n: 0, right: 0, formats: [], slips: 0, patterns: {}, probe: null }); }
  // rule: 3 of 3 passes; 0 or 1 of 3 fails; 2 of 3 gets one more item that decides; 0 of 2 stops early
  // info (optional): { format, response, answer, misconception, op } from the item just answered
  function placementRecord(ps, correct, info) {
    info = info || {};
    const anchor = ps.current, ev = evFor(ps, anchor);
    ev.n++; if (correct) ev.right++;
    if (info.format && !ev.formats.includes(info.format)) ev.formats.push(info.format);
    if (!correct && info.misconception) ev.patterns[info.misconception] = (ev.patterns[info.misconception] || 0) + 1;
    if (!correct && !info.misconception && isSlip(info.answer, info.response)) ev.slips++;
    ps.answers.push(!!correct); ps.items++;
    const n = ps.answers.length, right = ps.answers.filter(Boolean).length;
    let verdict = null;
    if (isStrandAnchor(anchor)) { if (n === 2) verdict = right === 2 ? 'pass' : 'fail'; }
    else if (n === 2 && right === 0) verdict = 'fail';
    else if (n === 3 && right === 3) verdict = 'pass';
    else if (n === 3 && right <= 1) verdict = 'fail';
    else if (n === 4) verdict = ps.answers[3] ? 'pass' : 'fail';
    if (verdict) {
      (verdict === 'pass' ? ps.passed : ps.failed).push(ps.current);
      ps.queue.shift();
      // missed the very first anchor: step down a grade before going on
      if (verdict === 'fail' && ps.passed.length === 0 && ps.failed.length === 1 && ps.fallback && ps.fallback.length) {
        ps.queue = ps.fallback.filter((a) => !ps.queue.includes(a) && a !== ps.current).concat(ps.queue);
        ps.fallback = [];
      }
      // skip anchors that depend on a failed one
      if (verdict === 'fail') ps.queue = ps.queue.filter((a) => !ancestors(a).has(ps.current));
      ps.current = ps.queue[0] || null;
      ps.answers = [];
      ps.decided = (ps.decided || 0) + 1;
      strandsForward(ps);
    }
    // follow-up question (counts toward the 29-question limit, never toward pass or fail)
    if (ps.ev && !ps.probe && ps.items < PLACEMENT_MAX_ITEMS - 1 && !isStrandAnchor(anchor)) {
      const nothingKnown = !Object.keys(ev.patterns).length;
      if (!correct && STORY_ANCHORS.includes(anchor) && !ev.probe && nothingKnown) {
        const skill = anchor === 'C114' && info.op === '−' ? 'C103' : READING_PROBE[anchor];
        if (skill) { ev.probe = { kind: 'reading', skill, correct: null }; ps.probe = { anchor, kind: 'reading', skill }; }
      } else if (verdict === 'fail' && !ev.probe && nothingKnown && ev.slips < ev.n - ev.right) {
        const known = new Set(ps.passed.concat(ps.failed, ps.queue, ps.fallback || []));
        const skill = SKILLS[anchor].prereqs.find((p) => !known.has(p));
        if (skill) { ev.probe = { kind: 'foundation', skill, correct: null }; ps.probe = { anchor, kind: 'foundation', skill }; }
      }
    }
    if (!ps.current || ps.items >= PLACEMENT_MAX_ITEMS) ps.done = true;
    if (ps.done) ps.probe = null;
    return verdict;
  }
  // what the walk asks next: a pending follow-up first, then the current check
  function placementNext(ps) {
    if (ps.done) return null;
    if (ps.probe) return { skill: ps.probe.skill, probe: ps.probe.kind };
    return { skill: ps.current, probe: null };
  }
  function placementProbeRecord(ps, correct) {
    const p = ps.probe; if (!p) return;
    ps.items++;
    const ev = evFor(ps, p.anchor);
    ev.probe = { kind: p.kind, skill: p.skill, correct: !!correct };
    ps.probes = (ps.probes || []).concat([{ anchor: p.anchor, kind: p.kind, skill: p.skill, correct: !!correct }]);
    ps.probe = null;
    if (ps.items >= PLACEMENT_MAX_ITEMS) ps.done = true;
  }
  // a rest stop after every 3 decided checks; the child can keep going or take a break and come back
  const REST_EVERY = 3;
  function placementRestDue(ps) {
    return !ps.done && !ps.probe && ps.decided > 0 && ps.decided % REST_EVERY === 0 && ps.restedAt !== ps.decided;
  }
  function placementRested(ps) { ps.restedAt = ps.decided; }
  function placementStage(ps) { return Math.floor((ps.decided || 0) / REST_EVERY) + 1; }
  // what the walk found, for the parent report: facts only, no levels or labels
  function discoverySummary(ps) {
    const ev = ps.ev || {};
    const notes = [];
    Object.keys(ev).forEach((id) => {
      const e = ev[id], passed = ps.passed.includes(id);
      const pat = Object.keys(e.patterns).sort((a, b) => e.patterns[b] - e.patterns[a])[0];
      if (pat) notes.push({ skill: id, kind: 'pattern', misconception: pat });
      else if (e.probe && e.probe.kind === 'reading' && e.probe.correct === true) notes.push({ skill: id, kind: 'reading', probeSkill: e.probe.skill });
      else if (e.probe && e.probe.kind === 'foundation') notes.push({ skill: id, kind: e.probe.correct ? 'newStep' : 'foundation', probeSkill: e.probe.skill });
      else if (passed && e.slips) notes.push({ skill: id, kind: 'slip' });
    });
    return { strong: ps.passed.slice(), building: ps.failed.slice(), notes, items: ps.items, grade: ps.grade || null };
  }

  // ---------- understanding states (Tenbright 2.0) ----------
  // One state per skill, from all the evidence so far. Shown to parents in plain words, never to the child.
  //  understands · partly · withHelp (right mostly with big hints or Work it with Pip) · cantExplainYet (right, but
  //  "Why did that work?" mostly missed) · notYet · needsCheck (too little evidence) · notStarted
  const UNDERSTANDING = ['understands', 'partly', 'withHelp', 'cantExplainYet', 'notYet', 'needsCheck', 'notStarted'];
  function understanding(st) {
    const a = st.attempts || [];
    if (!a.length) {
      if (['placed', 'mastered', 'certified'].includes(st.status)) return 'understands';
      return st.status === 'locked' ? 'notStarted' : 'needsCheck';
    }
    const indep = a.filter((x) => x.hint <= 1).slice(-10), helped = a.filter((x) => x.hint >= 2).slice(-10);
    const acc = (xs) => (xs.length ? xs.filter((x) => x.correct).length / xs.length : null);
    const ia = acc(indep), ha = acc(helped);
    const why = st.why;
    if (indep.length >= 3 && ia >= 0.9) return why && why.total >= 2 && why.right / why.total < 0.5 ? 'cantExplainYet' : 'understands';
    if (indep.length < 3) {
      if (['placed', 'mastered', 'certified'].includes(st.status)) return 'understands';
      if (helped.length >= 3 && ha >= 0.7) return 'withHelp';
      return 'needsCheck';
    }
    if (ia >= 0.5) return 'partly';
    if (helped.length >= 3 && ha >= 0.7) return 'withHelp';
    return 'notYet';
  }
  function recordWhy(skills, id, right) {
    const st = skills[id]; if (!st) return;
    st.why = st.why || { right: 0, total: 0 };
    st.why.total++; if (right) st.why.right++;
  }
  function applyPlacement(learner, passedAnchors, now) {
    passedAnchors.forEach((id) => {
      // a strand check (money, time, measuring, shapes) vouches only for the skills of its own strand
      const under = [...ancestors(id)].filter((a) => !isStrandAnchor(id) || SKILLS[a].region === SKILLS[id].region);
      [id, ...under].forEach((s) => {
        const st = learner.skills[s];
        st.status = 'placed';
        st.learned = true;
        st.p = Math.max(st.p, 0.9);
        st.masteredAt = now;
        st.checks = [{ day: 7, due: now + 7 * DAY, done: false, passed: null, items: [] }];
      });
    });
    refreshUnlocks(learner.skills);
    learner.placementDone = true;
  }
  function migrateLearner(L) {
    SKILL_ORDER.forEach((id) => { if (!L.skills[id]) L.skills[id] = newSkillState(); });
    // skills added under a later map that sit underneath something already strong count as already strong
    SKILL_ORDER.forEach((id) => {
      if (!['mastered', 'certified', 'placed'].includes(L.skills[id].status)) return;
      ancestors(id).forEach((a) => { const st = L.skills[a]; if (st.status === 'locked' || (st.status === 'learning' && !st.learned && !st.attempts.length)) { st.status = 'placed'; st.learned = true; st.p = Math.max(st.p, 0.9); } });
    });
    // a skill unlocked under an older map but whose new prerequisites are not met stays open, so progress is never taken away
    refreshUnlocks(L.skills);
    if (L.grade === undefined) L.grade = null;
    if (L.focus === undefined) L.focus = 'all';
    return L;
  }

  GAMES.race.levels = [SKILL_ORDER.filter((id) => !isZuriSkill(id))];
  GAMES.zrace.levels = [SKILL_ORDER.filter(isZuriSkill)];
  const api = { makeRng, digits, MISCONCEPTIONS, SKILLS, SKILL_ORDER, generate, check, bktUpdate, BKT, masteryMet, recordAttempt, recordCheckItem, dueCheck, nextActivity, newLearner, refreshUnlocks, PLACEMENT_ANCHORS, PLACEMENT_MAX_ITEMS, STRAND_ANCHORS, strandAnchors, placementPlan, newPlacement, placementRecord, applyPlacement, STORY_ANCHORS, READING_PROBE, isSlip, placementNext, placementProbeRecord, placementRestDue, placementRested, placementStage, discoverySummary, UNDERSTANDING, understanding, recordWhy, migrateLearner, GAMES, GAME_ROUNDS, gameLevel, gameRound, RACE_STOPS, raceRounds, ADVENTURES, adventureOpen, adventure, adventureExplainer, makeTransfer, makeStepFill, canOffer, evidence, evidenceMissing, EXPLAIN_KINDS, explainPick, explainShown, explainOutcome, explainBest, stepResult, ancestors, numberName, DAY, CHECK_DAYS, GRADE_LEVELS, SCHOOL_GRADES, gradeOf, defaultFocus, gradeProgress, makeMistake, PIP_DID, lineItem, linePAE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TBEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
