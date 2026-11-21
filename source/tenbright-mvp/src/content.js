/* Tenbright child-facing and parent-facing copy for the MVP slice. */
(function (root) {
  'use strict';
  const CONTENT = {
    PV03: {
      hook: 'Pip found some beads in the meadow. How many are there?',
      teach: ['A flat square is 1 hundred.', 'A long rod is 1 ten.', 'A little cube is 1 one.', 'Count the hundreds, then the tens, then the ones.'],
      nudge: 'Start with the big squares. How many hundreds?',
      strategy: 'Each square is 100, each rod is 10, each cube is 1.',
      home: 'Build numbers with coins: $1 bills as hundreds, dimes as tens, pennies as ones. Ask your child to read the total.'
    },
    PV04: {
      hook: 'Every digit lives in a house: hundreds, tens or ones.',
      teach: ['In 372, the 3 is in the hundreds house, so it is worth 300.', 'The 7 is in the tens house, so it is worth 70.', 'The 2 is in the ones house, so it is worth 2.'],
      nudge: 'Which house is that digit in?',
      strategy: 'A digit in the tens house is worth that many tens.',
      home: 'Write a 3-digit number and point at one digit. Ask: "How much is this one worth?" Then build it with coins to check.'
    },
    PV10: {
      hook: 'Two ferries are racing. Which one carries more?',
      teach: ['Compare the hundreds first.', 'If the hundreds are the same, compare the tens.', 'If the tens are the same too, compare the ones.'],
      nudge: 'Look at the hundreds first.',
      strategy: 'The number with more hundreds is bigger, no matter what the tens and ones say.',
      home: 'Pick two prices at the store and ask which costs more and how your child knows.'
    },
    PV12: {
      hook: 'Pip adds one more lantern, or one more tower. What changes?',
      teach: ['Adding 10 adds one ten. Only the tens digit changes.', 'Adding 100 adds one hundred. Only the hundreds digit changes.'],
      nudge: 'Which place gets one more, or one less?',
      strategy: '10 more means one more ten. Keep the ones the same.',
      home: 'Count by tens from a 3-digit number, like 347, 357, 367. Then try counting by hundreds.'
    },
    AS04: {
      hook: 'The ferry carries two groups of beads across the river.',
      teach: ['Add the ones to the ones.', 'Add the tens to the tens.', 'Put them together.'],
      nudge: 'Start with the ones.',
      strategy: 'Ones add with ones, tens add with tens.',
      home: 'Add two ages or two prices under $1 by adding dimes to dimes and pennies to pennies.'
    },
    AS05: {
      hook: 'Too many ones for one dock! Ten ones can ride together as one ten.',
      teach: ['Add the ones. If you get 10 or more, make a ten.', 'Move the new ten to the tens place.', 'Add the tens, including the new one.'],
      nudge: 'Look at the ones. Is it more than 9?',
      strategy: 'Ten ones make one ten. Carry it to the tens.',
      home: 'Use 10 pennies and trade them for a dime whenever you have ten. Try 38¢ + 27¢.'
    },
    AS06: {
      hook: 'Some beads hop off the ferry. How many stay?',
      teach: ['Take the ones from the ones.', 'Take the tens from the tens.'],
      nudge: 'Start with the ones.',
      strategy: 'Ones from ones, tens from tens.',
      home: 'Count dimes and pennies, then take some away and count what is left.'
    },
    AS07: {
      hook: 'Not enough ones to take away? Break a ten into ten ones.',
      teach: ['Look at the ones. Can you take the bottom ones from the top ones?', 'If not, break one ten into ten ones.', 'Now there is one fewer ten. Subtract each place.'],
      nudge: 'Can you take those ones away? If not, break a ten.',
      strategy: 'Break one ten into ten ones, then remember there is one less ten.',
      home: 'Make 43 with 4 dimes and 3 pennies. Ask your child to give you 17¢. When they can\'t take 7 from 3, trade a dime for 10 pennies.'
    },
    AS11: {
      hook: 'A big ferry with hundreds, tens and ones!',
      teach: ['Add the ones, and make a ten if you need to.', 'Add the tens, and make a hundred if you need to.', 'Add the hundreds.'],
      nudge: 'Start with the ones. Did you get 10 or more?',
      strategy: 'Ten tens make one hundred, just like ten ones make one ten.',
      home: 'Add two 3-digit numbers from real life, like pages read this week and last week.'
    },
    AS12: {
      hook: 'Break a ten, or break a hundred, when there are not enough.',
      teach: ['Start with the ones. Break a ten if you need to.', 'Then the tens. Break a hundred if you need to.', 'Then the hundreds.'],
      nudge: 'Start with the ones. Is the top digit big enough?',
      strategy: 'Break one of the next place when a place is too small.',
      home: 'Use $1 bills, dimes and pennies to act out 352 − 178, trading when a place runs short.'
    },
    MU03: {
      hook: 'Pip plants seeds in equal rows in the orchard.',
      teach: ['3 × 4 means 3 groups of 4.', 'Count all of them: 4 + 4 + 4 = 12.', 'Equal groups is what times means.'],
      nudge: 'How many groups? How many in each?',
      strategy: 'Add the same number again for each group.',
      home: 'Put snacks into equal bowls and ask how many there are in all.'
    },
    MU06: {
      hook: 'Count by 2s, 5s and 10s to multiply fast.',
      teach: ['× 2: double the number.', '× 5: count by fives, or half of × 10.', '× 10: put a zero on the end, because each one becomes a ten.'],
      nudge: 'Skip-count. How many jumps?',
      strategy: 'Times 10 makes each one a ten. Times 5 is half of that.',
      home: 'Count nickels by 5s and dimes by 10s while saving up.'
    },
    T3: {
      hook: 'Pip\'s puzzle: find 100 − 37 without breaking a ten!',
      teach: ['Take every digit from 9, except the last one.', 'Take the last digit from 10.', '100 − 37: 9 − 3 = 6, 10 − 7 = 3, so the answer is 63.', 'It works because 100 is 99 + 1, and 99 never needs regrouping.'],
      nudge: 'All from 9, and the last from 10.',
      strategy: '100 is 99 + 1. Subtract from the 9s, then add the 1 to the last place.',
      home: 'Play "change from a dollar": you spend 37¢, how much change? Use the all-from-9 trick.',
      history: 'This trick appears in the 1965 book Vedic Mathematics by Bharati Krishna Tirtha. Historians note it is not found in the ancient Vedas themselves. We teach it because the math is sound and it is useful.'
    }
  };
  const more = {
    PV01: ['Pip has too many beads to count one by one!', ['Ten ones can click together into one ten.', 'Make as many tens as you can.', 'Then count tens and the ones left over.'], 'Can you make one more ten from the ones?', 'Every 10 ones is 1 ten.', 'Count out pennies, and trade every 10 pennies for a dime. Then count the dimes and pennies.'],
    PV02: ['Ten lanterns stack into one tower!', ['Ten tens make one hundred.', 'Make as many hundreds as you can from the tens.', 'Then count hundreds and tens.'], 'Can you make a hundred from 10 of the tens?', 'Every 10 tens is 1 hundred.', 'Trade 10 dimes for a dollar. Ask: "How much is 3 dollars and 12 dimes?"'],
    PV05: ['A number can be split into its places.', ['347 is 300 + 40 + 7.', 'Each part is one place: hundreds, tens, ones.', 'Put the parts back together to make the number.'], 'Which part is the hundreds?', 'Hundreds, tens and ones each get their own place.', 'Write a number in expanded form together, like 300 + 40 + 7, and read it both ways.'],
    PV06: ['Pip hears a number name. Can you write it?', ['"Four hundred six" means 4 hundreds and 6 ones.', 'There are no tens, so the tens place holds a 0.'], 'How many hundreds? How many tens? How many ones?', 'Write one digit for each place, using 0 for an empty place.', 'Say a number name aloud and have your child write it. Include ones like "five hundred eight".'],
    PV07: ['Pip hops along the number path.', ['Counting by 10s changes the tens digit.', 'Counting by 100s changes the hundreds digit.', 'Counting by 5s goes 0, 5, 0, 5 in the ones.'], 'How much does each jump add?', 'Add the same jump each time.', 'Count by 10s from a 3-digit number in the car, like 347, 357, 367.'],
    PV08: ['Some houses are empty. Zero keeps their spot.', ['4 hundreds and 5 ones has no tens.', 'Write a 0 in the tens place: 405.', 'Without the 0, it would read 45.'], 'Is any place empty?', 'Zero holds a place so the other digits stay put.', 'Build 405 with coins: 4 dollars, no dimes, 5 pennies. Write it together.'],
    PV09: ['A hundred is also ten tens.', ['342 has 3 hundreds, 4 tens, 2 ones.', 'Each hundred is 10 tens, so 3 hundreds is 30 tens.', '30 tens + 4 tens = 34 tens.'], 'How many tens are in the hundreds?', 'Count all the tens, including the ones inside the hundreds.', 'Ask how many dimes make $3.40. Count them out if needed.'],
    PV11: ['Where does this number live on the line?', ['Find where the line starts.', 'Find how much each jump is.', 'Count the jumps to the arrow.'], 'How much is each jump?', 'Start number + jumps × jump size.', 'Draw a line from 300 to 400 with tick marks every 10 and point to a tick.'],
    PV13: ['Which ten is closer?', ['Find the two tens the number sits between.', 'Look at the ones digit.', '5 or more goes up; 4 or less goes down.'], 'Which two tens is it between?', 'The ones digit decides: 5 or more rounds up.', 'Round prices to the nearest 10 cents at the store.'],
    PV14: ['Which hundred is closer?', ['Find the two hundreds the number sits between.', 'Look at the tens digit.', '5 or more goes up; 4 or less goes down.'], 'Which two hundreds is it between?', 'The tens digit decides when rounding to the nearest 100.', 'Round the number of pages in a book to the nearest hundred.'],
    AS01: ['Quick adding and taking away.', ['To add, count on from the bigger number.', 'To subtract, count back, or think of the adding fact.'], 'Start from the bigger number and count on.', 'Start counting on the next number.', 'Play a quick "make 20" game with fingers or coins.'],
    AS02: ['Make a ten to add faster!', ['8 + 5: give 2 from the 5 to the 8 to make 10.', '10 + 3 = 13.'], 'How many more does the first number need to make 10?', 'Fill the ten-frame first, then add what is left.', 'Use an egg carton cut to 10 cups. Fill it first, then count what is left.'],
    AS03: ['Adding and subtracting are a family.', ['7 + 8 = 15, so 15 − 8 = 7 and 15 − 7 = 8.', 'If you know one fact, you know the family.'], 'What adding fact uses these numbers?', 'Taking away undoes adding.', 'Write one fact like 7 + 8 = 15 and ask your child for the other three in the family.'],
    AS08: ['The ferry carries three or four groups at once!', ['Add all the ones first.', 'Make tens from the ones.', 'Add all the tens, including the new ones.'], 'Add the ones column first.', 'Ones first, make tens, then add the tens.', 'Add the ages of everyone at dinner, ones first.'],
    AS09: ['Use a friendly number!', ['49 + 26: give 1 from 26 to 49.', 'Now it is 50 + 25 = 75.', 'Move a little from one number to the other. The total stays the same.'], 'Can you make one number a ten?', 'Move a little from one number to the other to make a ten.', 'At the store: $4.99 + $2.30 is $5.00 + $2.29.'],
    AS10: ['How far is it from one number to the other?', ['Hop to the next ten.', 'Hop by tens.', 'Add up your hops.'], 'Hop to the next ten first.', 'Count up from the small number to find how far apart they are.', 'Ask: "We are at page 38. How many pages to page 72?" Count up together.'],
    AS13: ['Not enough tens either? Break a hundred.', ['400 − 167: no ones, no tens.', 'Break a hundred into 10 tens, then a ten into 10 ones.', '400 becomes 3 hundreds, 9 tens, 10 ones.'], 'There are no tens to break. What can you break instead?', 'Break a hundred into tens, then a ten into ones.', 'Use $4 in dollar bills to pay $1.67. Trade a dollar for dimes, then a dime for pennies.'],
    AS14: ['The column method for adding.', ['Line up the places.', 'Add ones, then tens, then hundreds.', 'Carry when a place makes 10 or more.'], 'Start with the ones column.', 'Line up places, add right to left, carry tens.', 'Add two 3-digit numbers on paper together, saying each carry out loud.'],
    AS15: ['The column method for subtracting.', ['Line up the places.', 'Start with the ones.', 'Break a ten or a hundred when a place is too small.'], 'Is the top digit big enough?', 'Line up the places. Start with the ones. Break a ten when you need to.', 'Subtract two 3-digit numbers on paper together, checking by adding back.'],
    AS16: ['About how much? Round first.', ['Round each number to the nearest hundred.', 'Add the rounded numbers.', 'Use it to check if an exact answer makes sense.'], 'Round each number first.', 'Rounded numbers give a quick check.', 'Before paying, estimate the total of two prices to the nearest dollar.'],
    AS17: ['Why does it work?', ['Ten ones are the same as one ten.', 'That is why we carry a ten, or break one.'], 'Think about what ten ones are worth.', 'Every carry and every break is a trade of 10 for 1.', 'Ask your child to explain one homework problem to you as if you were Pip.'],
    MU01: ['Can everyone find a partner?', ['Put the dots in pairs.', 'If none is left over, the number is even.', 'If one is left over, it is odd.'], 'Make pairs. Is one left over?', 'Even numbers split into pairs with none left.', 'Pair up socks or shoes and ask if the number is odd or even.'],
    MU02: ['Rows and rows of seeds.', ['An array has equal rows.', 'Add the same number for each row.', '3 rows of 4 is 4 + 4 + 4 = 12.'], 'How many in each row? How many rows?', 'Add the row amount once for each row.', 'Look for arrays at home: egg cartons, muffin trays, windows.'],
    MU04: ['Hop along by the same amount.', ['Skip-count by the number in each group.', 'Count how many hops.', 'Where you land is the product.'], 'How many hops? How big is each hop?', 'Skip-count once for each group.', 'Skip-count by 5s and 10s while climbing stairs.'],
    MU05: ['Turn it around!', ['3 × 6 is 3 rows of 6.', 'Turn the array on its side: 6 rows of 3.', 'Same dots, same answer.'], 'Does turning the array change the number of dots?', 'Swapping the numbers does not change the product.', 'Make an array of coins, then turn it and count again.'],
    MU07: ['Zero groups and one group.', ['Anything times 0 is 0: groups with nothing inside.', 'Anything times 1 is itself: one group.'], 'How many are in each group?', '× 0 makes 0. × 1 keeps the number.', 'Show 5 empty cups: how many marbles? Then 1 cup with 5.'],
    MU08: ['Double, then double again!', ['× 4 is double × 2.', '× 8 is double × 4.'], 'What is the × 2 fact? Now double it.', 'Double to go from 2s to 4s, and 4s to 8s.', 'Practice doubles: 3, 6, 12, 24. Then try 8 × 3 by doubling three times.'],
    MU09: ['Threes, then double for sixes.', ['× 3 is three equal groups.', '× 6 is double × 3.'], 'Find the × 3 fact first.', '× 6 is double the × 3 fact.', 'Count by 3s, then double each to get the 6s.'],
    MU10: ['The nines trick: ten groups take away one.', ['9 × 7 = 10 × 7 − 7.', '70 − 7 = 63.'], 'What is 10 groups? Now take one group away.', '9 groups is 10 groups minus one group.', 'Ask: "What is 10 × 6? Now take away 6." Repeat with other nines.'],
    MU11: ['Sevens are 5 and 2.', ['7 × 6 = 5 × 6 + 2 × 6.', '30 + 12 = 42.'], 'Split the 7 into 5 and 2.', 'Use two facts you know and add them.', 'Practice 7s by splitting: "5 sixes and 2 sixes make…"'],
    MU12: ['The last few facts.', ['Use a fact you know nearby.', 'Squares like 6 × 6 are good anchors.', '7 × 8 is 7 × 7 + 7.'], 'Which fact nearby do you know?', 'Start from a known fact and add or take away a group.', 'Pick 3 facts a week to practice with a quick card game.'],
    MU13: ['Find the missing number.', ['8 × ? = 48.', 'How many 8s make 48?', 'Count by 8s: 8, 16, 24, 32, 40, 48: six 8s.'], 'How many groups of that number make the total?', 'Ask: how many groups of this number make the total?', 'Ask: "I have 24 cookies in bags of 4. How many bags?"'],
    MU14: ['Times tens!', ['60 is 6 tens.', '4 × 6 tens = 24 tens.', '24 tens is 240.'], 'How many tens is that number?', 'Multiply the tens, then name them as tens.', 'Ask how much 4 packs of 30 stickers is.'],
    MU15: ['Patterns in the times table.', ['Times an even number is even.', 'The 9s digits add up to 9.', 'Patterns help you check answers.'], 'Look for a pattern you know.', 'Odd × odd is odd; anything × even is even.', 'Look at a times table together and find three patterns.'],
    MU16: ['All the facts, from memory.', ['Use your strategies to work out any fact.', 'Practice a few each day.', 'Soon they come quickly.'], 'Which strategy fits this fact?', 'Every fact can be built from one you know.', 'Five minutes of fact practice a day, a few facts at a time, beats one long session.'],
    WP01: ['Things join, or go away.', ['Draw the story as a bar.', 'Is the start, the change or the end missing?', 'Add or subtract to find it.'], 'Draw the story. What is missing?', 'Find what is missing in the story, then choose plus or minus.', 'Tell a story problem about toys and ask your child to draw it before solving.'],
    WP02: ['Two parts make a whole.', ['Draw the whole bar.', 'Split it into the two parts.', 'If a part is missing, subtract. If the whole is missing, add.'], 'Is a part missing, or the whole?', 'Parts add to the whole.', 'Sort snacks into two kinds and ask part-whole questions.'],
    WP03: ['Who has more, and how many more?', ['Draw two bars.', 'The difference is the extra piece.', 'Subtract to find it.'], 'Draw two bars. How long is the extra piece?', '"How many more" means find the difference.', 'Compare two family members\' heights or ages: "How many more?"'],
    WP04: ['Equal groups in a story.', ['How many groups?', 'How many in each group?', 'Multiply.'], 'How many groups? How many in each?', 'Groups × in each group = total.', 'At snack time: "3 plates with 4 crackers each. How many crackers?"'],
    WP05: ['A story with two steps.', ['Find what happens first.', 'Then find what happens next.', 'Use the first answer in the second step.'], 'What happens first in the story?', 'Do step one, then use its answer for step two.', 'Tell a two-step story at dinner and ask for both steps.']
  };
  Object.keys(more).forEach((k) => {
    const [hook, teach, nudge, strategy, home] = more[k];
    CONTENT[k] = { hook, teach, nudge, strategy, home };
  });
  // Grades 1, 3 (fractions), 4 and 5: [hook, teaching points, nudge, strategy, home activity]
  const added = {
    C101: ['Pip is counting lanterns all the way to 120!', ['Say the next number by adding 1.', 'After 9 ones comes a new ten: 39, 40.', 'After 99 comes 100, then 101, 102 and on to 120.'], 'What number is one more?', 'When the ones reach 9, the next number starts a new ten.', 'Count steps, stairs or cars together, and keep going past 100 to 120.'],
    C102: ['Pip has some beads, then finds a few more.', ['Start with the bigger number.', 'Count on the smaller number.', 'The last number you say is the total.'], 'Start at the first number and count on.', 'Put the bigger number in your head and count on.', 'Use two small piles of coins. Ask "How many in all?" and count on from the bigger pile.'],
    C103: ['Some beads roll away. How many are left?', ['Start with all the beads.', 'Cross out the ones that go away.', 'Count the ones that are left.'], 'How many did you start with? How many went away?', 'Take away means fewer. Count what is left.', 'Put out 10 crackers, eat a few, and ask how many are left.'],
    C104: ['Ten is a magic number. Which pairs make it?', ['A ten-frame has 10 boxes.', 'Fill some, then count the empty boxes.', 'The filled and the empty make 10.'], 'Count the empty boxes in the ten-frame.', 'Know your pairs to 10: 1 and 9, 2 and 8, 3 and 7, 4 and 6, 5 and 5.', 'Play "Make 10": hold up some fingers and ask how many more make 10.'],
    C105: ['Doubles are twins: the same number twice!', ['6 + 6 = 12 is a double.', '6 + 7 is a near double: one more than 6 + 6.', 'So 6 + 7 = 13.'], 'Is there a double hiding nearby?', 'Use a double you know, then add or take away 1.', 'Practice doubles with dice: roll one and say its double.'],
    C106: ['Three piles of beads. Is there a quick way?', ['Look for two numbers that make 10.', 'Add those first.', 'Then add the third number to 10.'], 'Which two numbers make 10?', 'Make a 10 first, then add the rest.', 'Roll three dice and look for a pair that makes 10 or a double.'],
    C107: ['A number is hiding behind Pip!', ['Read 8 + ? = 13 as "8 and what make 13?"', 'Count on from 8 to 13.', 'You counted on 5, so the hiding number is 5.'], 'Count on from the first number to the total.', 'Find the missing part: total take away the part you know.', 'Hide some coins under a cup: "There were 12, now I see 7. How many are hiding?"'],
    C108: ['The equal sign is a balance.', ['= means both sides are the same amount.', 'Work out each side.', 'If both sides match, it is true.'], 'What does each side make?', 'Both sides of = must be the same amount.', 'Use a balance or a ruler on a pencil with coins on each side to show "the same".'],
    C109: ['Beads come in rods of ten.', ['A rod is 1 ten.', 'Loose beads are ones.', '4 tens and 7 ones is 47.'], 'Count the rods first, then the loose beads.', 'The left digit counts tens, the right digit counts ones.', 'Bundle straws or sticks into tens with rubber bands, then count tens and ones.'],
    C110: ['Which ferry has more passengers?', ['Compare the tens first.', 'If the tens are the same, compare the ones.', '> points to the smaller number: 52 > 48.'], 'Which number has more tens?', 'Tens first, then ones.', 'Pick two house numbers or page numbers and ask which is greater.'],
    C111: ['A ten-rod jumps on or off the ferry.', ['10 more: the tens digit goes up by 1.', '10 less: the tens digit goes down by 1.', 'The ones stay the same.'], 'Does the tens digit go up or down?', 'Adding or taking away 10 only changes the tens.', 'Use dimes and pennies. Add or take a dime and say the new amount.'],
    C112: ['Add tens to tens and ones to ones.', ['34 + 20: 3 tens and 2 tens are 5 tens.', 'The ones stay 4.', 'So 34 + 20 = 54.'], 'Are you adding tens or ones?', 'Tens go with tens and ones go with ones.', 'Add dimes to a pile of dimes and pennies, then count the total.'],
    C113: ['Take away whole tens.', ['70 − 30 is 7 tens take away 3 tens.', 'That leaves 4 tens.', '4 tens is 40.'], 'How many tens take away how many tens?', 'Subtract tens like ones, then say "tens".', 'Use dimes: start with 8 dimes, give away 3, and count what is left.'],
    C114: ['A story happens. Will there be more or fewer?', ['Read the story and picture it.', 'Getting more: add.', 'Giving away or losing: subtract.'], 'Does the story get bigger or smaller?', 'Draw the story first. Then choose plus or minus.', 'Make up stories at snack time and ask whether to add or take away.'],
    F301: ['Pip shares a lantern cake fairly.', ['The whole is cut into equal parts.', 'The bottom number says how many equal parts.', 'The top number says how many parts we mean.'], 'How many equal parts are there in all?', 'Bottom: equal parts in the whole. Top: parts we count.', 'Cut a sandwich or paper into equal parts and name a fraction for some of them.'],
    F302: ['Fractions live on the number line too.', ['Cut the space from 0 to 1 into equal jumps.', 'Each jump is one part, like 1/4.', 'Count the jumps from 0 to find the fraction.'], 'Count the jumps from 0, not the marks.', 'Each equal jump is one unit fraction.', 'Fold a strip of paper into equal parts and label each fold from 0 to 1.'],
    F401: ['Pip counts the stars: hundreds of thousands!', ['Commas split big numbers into thousands and ones.', 'Each place is 10 times the place to its right.', 'In 372,415 the 7 is worth 70,000.'], 'Which place is that digit in?', 'Name the place, then multiply the digit by it.', 'Read big numbers from the news or a map together and say what each digit is worth.'],
    F402: ['Which mountain is taller?', ['More digits means a bigger number.', 'Same number of digits? Compare from the left.', 'The first place that differs decides.'], 'Do they have the same number of digits?', 'Compare from the biggest place to the smallest.', 'Compare the populations of two towns or the prices of two cars.'],
    F403: ['About how many? Round it.', ['Find the two round numbers it sits between.', 'Look at the next digit to the right.', '5 or more rounds up; 4 or less rounds down.'], 'Which two round numbers is it between?', 'The digit to the right of the rounding place decides.', 'Round the cost of groceries to the nearest ten dollars and add in your head.'],
    F404: ['Big numbers, same steps.', ['Line up the places.', 'Start with the ones and move left.', 'Regroup when a place has 10 or more, or not enough.'], 'Which place do you start with?', 'Work from right to left, one place at a time.', 'Add or subtract two four-digit numbers from a receipt or scoreboard.'],
    F405: ['Multiply each place, then add the parts.', ['Split 347 into 300, 40 and 7.', 'Multiply each part.', 'Add the parts together.'], 'Split the big number into its places.', 'Multiply the parts, then add them.', 'Find the cost of 4 tickets at $125 each by splitting 125 into 100, 20 and 5.'],
    F406: ['Two 2-digit numbers make a rectangle.', ['Split both numbers into tens and ones.', 'Multiply all four parts.', 'Add the four parts.'], 'How many parts does the area model have?', 'Four parts: tens × tens, tens × ones, ones × tens, ones × ones.', 'Draw a rectangle for 23 × 14 on paper and fill in the four parts.'],
    F407: ['Equal groups, with some left over.', ['Make as many equal groups as you can.', 'What is left over is the remainder.', 'The remainder is always smaller than the group size.'], 'How many groups fit? What is left?', 'If what is left could make one more group, make it.', 'Share a bag of grapes among family members and talk about the leftovers.'],
    F408: ['Share a big number in steps.', ['Take away big easy chunks, like 10 or 100 groups.', 'Keep taking chunks until nothing is left.', 'Add the chunks to get the answer.'], 'What easy chunk can you take away first?', 'Divide in friendly chunks, then add them.', 'Split $96 equally among 4 people using tens first, then ones.'],
    F409: ['Factors are the numbers that multiply to make it.', ['A factor divides with nothing left over.', '3 is a factor of 12 because 3 × 4 = 12.', 'Factors come in pairs.'], 'Does it divide with nothing left?', 'Find the pair: what times this makes the number?', 'Arrange 12 or 24 coins into all the rectangles you can.'],
    F410: ['Some numbers can only make one rectangle.', ['A prime number has exactly two factors: 1 and itself.', 'A composite number has more.', '1 is neither.'], 'Can you find a factor other than 1 and the number?', 'Try 2, 3, 5 and 7.', 'Try to arrange 7 coins and then 8 coins into rectangles. Which has more ways?'],
    F411: ['One pile can be a few times as big as another.', ['"4 times as many" means 4 equal groups.', 'Draw one bar, then 4 bars the same size.', 'Multiply, or divide if the bigger amount is known.'], 'Draw the smaller amount as one bar.', 'Times as many means multiply.', 'Compare: "My pencil is 15 cm. Yours is 3 times as long. How long?"'],
    F412: ['Find the rule and keep the pattern going.', ['Look at how each number changes.', 'Say the rule: add 4, or multiply by 2.', 'Use the rule on the last number.'], 'How does each number change?', 'Find the rule, then apply it once more.', 'Make a pattern with blocks and ask your child to say the rule and the next step.'],
    F413: ['Different pieces, same amount.', ['Cut every piece into the same number of smaller pieces.', 'Multiply the top and bottom by the same number.', '2/3 = 8/12.'], 'What did the bottom number get multiplied by?', 'Do the same to the top and the bottom.', 'Fold paper strips into halves, quarters and eighths and line them up.'],
    F414: ['Which share is bigger?', ['Make the bottom numbers the same.', 'Then compare the tops.', 'Same top? The smaller bottom is the bigger piece.'], 'Can you make the bottoms match?', 'Make the bottom numbers match, then compare the tops.', 'Cut two pizzas or paper plates into different parts and compare shares.'],
    F415: ['Same-size pieces add up like counting.', ['The bottom number names the piece size.', 'Add or take away the tops.', 'The bottom stays the same.'], 'Are the pieces the same size?', 'Count the pieces; the size does not change.', 'Use measuring cups: 1/4 cup plus 2/4 cup is 3/4 cup.'],
    F416: ['Whole lanterns and a part of one.', ['Each whole is cut into the same pieces.', '2 1/4: 2 wholes are 8 quarters, plus 1 more.', 'So 2 1/4 = 9/4.'], 'How many pieces are in each whole?', 'Wholes × pieces per whole, plus the extra pieces.', 'Count cups of flour in quarters when baking.'],
    F417: ['Groups of fractions.', ['3 × 2/5 is 3 groups of 2/5.', 'That is 6 fifths.', 'Multiply the top; the bottom stays.'], 'How many pieces in each group?', 'Whole × top, same bottom.', 'Each person gets 3/4 of a cup of juice. How much for 3 people?'],
    F418: ['Tenths and hundredths at the docks.', ['1 tenth is 10 hundredths.', '3/10 = 30/100 = 0.30.', 'The first place after the point is tenths, then hundredths.'], 'How many hundredths is one tenth?', 'Change tenths to hundredths, then use two decimal places.', 'Use money: a dime is 1/10 of a dollar and a penny is 1/100.'],
    F419: ['Which boat carries more?', ['Write both with the same number of decimal places.', '0.4 = 0.40.', 'Compare like whole numbers: 0.40 > 0.38.'], 'Compare the tenths first.', 'Tenths first, then hundredths.', 'Compare prices like $0.40 and $0.38 at the store.'],
    F501: ['Do things in the right order.', ['Parentheses first.', 'Then multiply or divide.', 'Then add or subtract.'], 'What is inside the parentheses?', 'Parentheses, then × and ÷, then + and −.', 'Write a shopping total like (3 + 2) × $4 and work it out together.'],
    F502: ['Times 10 moves every digit one place.', ['× 10: each digit moves one place to the left.', '÷ 10: each digit moves one place to the right.', 'The point stays put; the digits move.'], 'How many places do the digits move?', 'Count the zeros in 10, 100 or 1,000.', 'Change dollars to cents and back: $3.25 × 100 = 325 cents.'],
    F503: ['Places after the point.', ['Tenths, hundredths, thousandths.', 'In 2.375 the 7 is in the hundredths place.', 'It is worth 7 hundredths: 0.07.'], 'Which place after the point is it?', 'Each place is 10 times smaller than the one to its left.', 'Read race times like 9.581 seconds and name each digit.'],
    F504: ['Close numbers: which is bigger?', ['Give both the same number of decimal places.', '0.45 = 0.450.', 'Compare from the left.'], 'Add zeros so both have three places.', 'Compare tenths, then hundredths, then thousandths.', 'Compare two athletes\' times to the thousandth of a second.'],
    F505: ['Round decimals like whole numbers.', ['Find the two numbers it sits between.', 'Look at the next digit.', '5 or more rounds up.'], 'Which two numbers is it between?', 'The next digit to the right decides.', 'Round prices like $3.48 to the nearest dollar and add them up.'],
    F506: ['Big numbers times 2-digit numbers.', ['Split the 2-digit number into tens and ones.', 'Multiply by the ones, then by the tens.', 'Add the two parts.'], 'What do you get when you multiply by the ones?', 'Two partial products, then add.', 'Work out the cost of 24 tickets at $135 each on paper.'],
    F507: ['Share by a 2-digit number.', ['Estimate: how many tens of groups fit?', 'Take that chunk away.', 'Then find the ones.'], 'About how many groups of that size fit?', 'Estimate with tens, then finish with ones.', 'Share 384 stickers among 16 classmates using chunks.'],
    F508: ['Line up the points!', ['Write the decimal points one under the other.', 'Fill empty places with zeros.', 'Add or subtract like whole numbers.'], 'Are the decimal points lined up?', 'Points in a line, then work place by place.', 'Add up two prices like $3.50 and $1.27 on paper.'],
    F509: ['Multiply, then place the point.', ['Multiply as if there were no points.', 'Count the decimal places in both numbers.', 'Put that many places in the answer.'], 'How many decimal places are there in all?', 'Multiply, then count the decimal places.', 'Find the cost of 3 pens at $1.25 each.'],
    F510: ['Dividing decimals.', ['4.8 ÷ 4: 48 tenths ÷ 4 = 12 tenths = 1.2.', '3 ÷ 0.5: how many halves fit in 3?', 'Dividing by a number less than 1 makes a bigger answer.'], 'How many tenths is it?', 'Think in tenths, or ask how many fit.', 'How many 50-cent coins make $3?'],
    F511: ['Different-size pieces? Make them match.', ['Find a bottom number both can become.', 'Change each fraction to that bottom number.', 'Then add or subtract the tops.'], 'What bottom number can both become?', 'Same-size pieces first, then count.', 'Mix 1/2 cup and 1/3 cup of water and use sixths to find the total.'],
    F512: ['Sharing makes fractions.', ['3 ÷ 4 means 3 shared among 4.', 'Each gets 3/4.', 'The top is what is shared; the bottom is how many share.'], 'What is being shared, and by how many?', 'a ÷ b = a/b.', 'Share 2 sandwiches among 3 people and name each share.'],
    F513: ['A part of a part.', ['Multiply the tops.', 'Multiply the bottoms.', '1/2 × 3/4 = 3/8.'], 'Top times top, bottom times bottom.', 'Multiply straight across.', 'Fold paper in half, then into quarters, and shade 1/2 of 3/4.'],
    F514: ['How many pieces fit?', ['3 ÷ 1/4: each whole holds 4 quarters, so 12.', '1/4 ÷ 2: split a quarter into 2, so 1/8.', 'Dividing by a small piece like 1/4 gives a bigger answer.'], 'How many of those pieces fit in one whole?', 'Count how many fit, or split each piece.', 'How many 1/4-cup scoops fill 3 cups?'],
    F515: ['How many cubes fill the box?', ['Count the cubes in one layer: length × width.', 'Count the layers: the height.', 'Multiply the layer by the number of layers.'], 'How many cubes are in one layer?', 'Volume = length × width × height.', 'Fill a small box with sugar cubes or blocks and count by layers.']
  };
  Object.keys(added).forEach((k) => {
    const [hook, teach, nudge, strategy, home] = added[k];
    CONTENT[k] = { hook, teach, nudge, strategy, home };
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.TBContent = CONTENT;
})(typeof window !== 'undefined' ? window : globalThis);
