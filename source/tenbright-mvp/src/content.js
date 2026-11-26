/* Tenbright child-facing and parent-facing copy for the MVP slice. */
(function (root) {
  'use strict';
  const CONTENT = {
    PV03: {
      hook: 'Pip found some beads in the meadow. How many are there?',
      teach: ['A flat square is 1 hundred.', 'A long rod is 1 ten.', 'A small cube is 1 one.', 'Count the hundreds, then the tens, then the ones.'],
      nudge: 'Start with the big squares. How many hundreds?',
      strategy: 'Each square is 100, each rod is 10, each cube is 1.',
      home: 'Build numbers with coins: $1 bills as hundreds, dimes as tens, pennies as ones. Ask your child to read the total.'
    },
    PV04: {
      hook: 'Every digit sits in a place: hundreds, tens or ones.',
      teach: ['Each digit sits in a place: hundreds, tens or ones.', 'The place tells how much the digit is worth.', 'A digit in the tens place is worth that many tens.'],
      nudge: 'Which place is that digit in?',
      strategy: 'A digit in the tens place is worth that many tens.',
      home: 'Write a 3-digit number and point at one digit. Ask: "How much is this one worth?" Then build it with coins to check.'
    },
    PV10: {
      hook: 'Two ferries are racing. Which one carries more?',
      teach: ['Compare the hundreds first.', 'If the hundreds are the same, compare the tens.', 'If the tens are the same too, compare the ones.', 'The open side of > or < faces the bigger number.'],
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
      teach: ['Add the ones first.', 'If there are 10 or more ones, make a ten.', 'Move the new ten to the tens place.', 'Add the tens, and count the new ten too.'],
      nudge: 'Look at the ones. Is it more than 9?',
      strategy: 'Ten ones make one ten. Move it to the tens.',
      home: 'Use 10 pennies and trade them for a dime whenever you have ten. Try 38¢ + 27¢.'
    },
    AS06: {
      hook: 'Some beads hop off the ferry. How many stay?',
      teach: ['Take the ones away from the ones.', 'Take the tens away from the tens.'],
      nudge: 'Start with the ones.',
      strategy: 'Ones from ones, tens from tens.',
      home: 'Count dimes and pennies, then take some away and count what is left.'
    },
    AS07: {
      hook: 'Not enough ones to take away? Break a ten into ten ones.',
      teach: ['Sometimes there are not enough ones to take away.', 'Then we break one ten into 10 ones.', 'Now we have more ones, and one less ten.', 'This is called regrouping.', 'Take away the ones. Then take away the tens.'],
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
      teach: ['Start with the ones. Break a ten if there are not enough ones.', 'Then the tens. Break a hundred if there are not enough tens.', 'Then the hundreds.'],
      nudge: 'Start with the ones. Is the top digit big enough?',
      strategy: 'Break one of the next place when a place is too small.',
      home: 'Use $1 bills, dimes and pennies to act out 352 − 178, trading when a place runs short.'
    },
    MU03: {
      hook: 'Pip plants seeds in equal rows in the orchard.',
      teach: ['3 × 4 means 3 groups of 4.', 'Add 4 once for each group: 4 + 4 + 4 = 12.', 'The × sign means groups of the same size.'],
      nudge: 'How many groups? How many in each?',
      strategy: 'Add the same number once for each group.',
      home: 'Put snacks into equal bowls and ask how many there are in all.'
    },
    MU06: {
      hook: 'Count by 2s, 5s and 10s to multiply fast.',
      teach: ['Times 2 means double the number.', 'Times 5: count by 5s. It is also half of times 10.', 'Times 10: each one becomes a ten, so write a 0 at the end.'],
      nudge: 'Skip-count. How many jumps?',
      strategy: 'Times 10 makes each one a ten. Times 5 is half of that.',
      home: 'Count nickels by 5s and dimes by 10s while saving up.'
    },
    T3: {
      hook: 'Pip\'s trick: take away from 100 or 1,000 without breaking a ten!',
      teach: ['Look at each digit of the number you take away.', 'Take each digit from 9.', 'For the very last digit, take it from 10 instead.', 'It works because 100 is 99 and 1 more.'],
      nudge: 'Take each digit from 9, and the last one from 10.',
      strategy: 'Take from the 9s, then add the 1 back on the last digit.',
      home: 'Play "change from a dollar": you spend 37¢, how much change? Use the all-from-9 trick.',
      history: 'This trick appears in the 1965 book Vedic Mathematics by Bharati Krishna Tirtha. Historians note it is not found in the ancient Vedas themselves. We teach it because the math is sound and it is useful.'
    }
  };
  const more = {
    PV01: ['Pip has too many beads to count one by one!', ['10 ones can click together to make 1 ten.', 'Make as many tens as you can.', 'Then count the tens and the ones left over.'], 'Can you make one more ten from the ones?', 'Every 10 ones is 1 ten.', 'Count out pennies, and trade every 10 pennies for a dime. Then count the dimes and pennies.'],
    PV02: ['Ten lanterns stack into one tower!', ['10 tens make 1 hundred.', 'Make as many hundreds as you can from the tens.', 'Then count the hundreds and the tens left over.'], 'Can you make a hundred from 10 of the tens?', 'Every 10 tens is 1 hundred.', 'Trade 10 dimes for a dollar. Ask: "How much is 3 dollars and 12 dimes?"'],
    PV05: ['A number can be split into its places.', ['A number can be split into its places.', 'Each part is one place: hundreds, tens or ones.', 'Put the parts back together to make the number.'], 'Which part is the hundreds?', 'Hundreds, tens and ones each get their own place.', 'Write a number in expanded form together, like 300 + 40 + 7, and read it both ways.'],
    PV06: ['Pip hears a number name. Can you write it?', ['A number name tells how many hundreds, tens and ones.', 'Write one digit for each place.', 'If a place is empty, write a 0 there.'], 'How many hundreds? How many tens? How many ones?', 'Write one digit for each place, using 0 for an empty place.', 'Say a number name aloud and have your child write it. Include ones like "five hundred eight".'],
    PV07: ['Pip hops along the number path.', ['Skip-counting means counting by jumps of the same size.', 'Counting by 10s changes the tens digit.', 'Counting by 100s changes the hundreds digit.', 'Counting by 5s makes the ones go 0, 5, 0, 5.'], 'How much does each jump add?', 'Add the same jump each time.', 'Count by 10s from a 3-digit number in the car, like 347, 357, 367.'],
    PV08: ['Some places are empty. Zero keeps their spot.', ['Sometimes a place has nothing in it.', 'We write a 0 to hold that place.', 'Without the 0, the number would mean something else.'], 'Is any place empty?', 'Zero holds a place so the other digits stay put.', 'Build 405 with coins: 4 dollars, no dimes, 5 pennies. Write it together.'],
    PV09: ['A hundred is also ten tens.', ['A hundred is the same as 10 tens.', 'To count all the tens, count the tens inside the hundreds too.', 'Then add the other tens.'], 'How many tens are in the hundreds?', 'Count all the tens, including the ones inside the hundreds.', 'Ask how many dimes make $3.40. Count them out if needed.'],
    PV11: ['Where does this number live on the line?', ['Find where the line starts.', 'Find how much each jump is.', 'Count the jumps to the arrow.'], 'How much is each jump?', 'Start at the first number and add the jumps.', 'Draw a line from 300 to 400 with tick marks every 10 and point to a tick.'],
    PV13: ['Which ten is closer?', ['Rounding finds the nearest ten.', 'First find the two tens the number is between.', 'Then look at the ones digit.', 'If it is 5 or more, round up to the bigger ten.', 'If it is less than 5, round down to the smaller ten.'], 'Which two tens is the number between?', 'The ones digit tells you: 5 or more rounds up.', 'Round prices to the nearest 10 cents at the store.'],
    PV14: ['Which hundred is closer?', ['Rounding finds the nearest hundred.', 'First find the two hundreds the number is between.', 'Then look at the tens digit.', 'If it is 5 or more, round up to the bigger hundred.', 'If it is less than 5, round down to the smaller hundred.'], 'Which two hundreds is the number between?', 'The tens digit tells you: 5 or more rounds up.', 'Round the number of pages in a book to the nearest hundred.'],
    AS01: ['Quick adding and taking away.', ['To add, start with the bigger number and count on.', 'To take away, count back.', 'Or think of an adding fact you know.'], 'Start from the bigger number and count on.', 'Start with the bigger number and count on.', 'Play a quick "make 20" game with fingers or coins.'],
    AS02: ['Make a ten to add faster!', ['Ten is an easy number to add to.', 'Take some from one number to fill the other up to 10.', 'Then add what is left to 10.'], 'How many more does the first number need to make 10?', 'Fill the ten-frame first, then add what is left.', 'Use an egg carton cut to 10 cups. Fill it first, then count what is left.'],
    AS03: ['Adding and taking away are a family.', ['Adding and taking away are a family.', 'The same three numbers are in every fact of the family.', 'If you know one fact, you know the others.'], 'What adding fact uses these numbers?', 'Taking away undoes adding.', 'Write one fact like 7 + 8 = 15 and ask your child for the other three in the family.'],
    AS08: ['The ferry carries three or four groups at once!', ['Add all the ones first.', 'Make tens from the ones if you can.', 'Then add all the tens, and the new tens too.'], 'Add the ones column first.', 'Ones first, make tens, then add the tens.', 'Add the ages of everyone at dinner, ones first.'],
    AS09: ['Use a friendly number!', ['A friendly number ends in 0.', 'Move a little from one number to the other.', 'Now one number is friendly, and adding is easy.', 'The total stays the same.'], 'Can you make one number a ten?', 'Move a little from one number to the other to make a ten.', 'At the store: $4.99 + $2.30 is $5.00 + $2.29.'],
    AS10: ['How far is it from one number to the other?', ['Start at the smaller number.', 'Hop to the next ten.', 'Then hop to the bigger number.', 'Add up your hops.'], 'Hop to the next ten first.', 'Count up from the small number to find how far apart they are.', 'Ask: "We are at page 38. How many pages to page 72?" Count up together.'],
    AS13: ['No tens to break? Break a hundred first.', ['Look at 400 − 167. There are 0 ones and 0 tens.', 'We cannot break a ten, because there are none.', 'So break 1 hundred into 10 tens first.', 'Then break 1 ten into 10 ones.', 'Now 400 is 3 hundreds, 9 tens and 10 ones.'], 'There are no tens to break. What can you break instead?', 'Break a hundred into 10 tens. Then break a ten into 10 ones.', 'Use $4 in dollar bills to pay $1.67. Trade a dollar for dimes, then a dime for pennies.'],
    AS14: ['The column way to add.', ['Write the numbers so the places line up.', 'Add the ones first, then the tens, then the hundreds.', 'If a place makes 10 or more, make a ten.', 'The new ten moves to the next place.'], 'Start with the ones column.', 'Line up the places. Add from right to left. Make a ten when you can.', 'Add two 3-digit numbers on paper together. Say out loud each time a new ten moves over.'],
    AS15: ['The column way to take away.', ['Write the numbers so the places line up.', 'Start with the ones.', 'If the top digit is too small, break one from the next place.', 'Then take away, one place at a time.'], 'Is the top digit big enough?', 'Line up the places. Start with the ones. Break a ten when you need to.', 'Subtract two 3-digit numbers on paper together, checking by adding back.'],
    AS16: ['About how much? Round first.', ['"About how much" asks for an estimate.', 'Round each number to the nearest hundred.', 'Add the round numbers.', 'The exact answer should be close to the estimate.'], 'Round each number first.', 'Round numbers give a quick check of the exact answer.', 'Before paying, estimate the total of two prices to the nearest dollar.'],
    AS17: ['Why does it work?', ['Ten ones are worth the same as one ten.', 'That is why 10 ones can become 1 ten.', 'And why 1 ten can be broken into 10 ones.'], 'Think about what ten ones are worth.', 'Making a ten and breaking a ten are both a trade of 10 for 1.', 'Ask your child to explain one homework problem to you as if you were Pip.'],
    MU01: ['Can everyone find a partner?', ['Put the dots in pairs.', 'If every dot has a partner, the number is even.', 'If one dot is left over, the number is odd.'], 'Make pairs. Is one left over?', 'Even numbers split into pairs with none left.', 'Pair up socks or shoes and ask if the number is odd or even.'],
    MU02: ['Rows and rows of seeds.', ['An array has equal rows.', 'Each row has the same number of dots.', 'Add that number once for each row.'], 'How many in each row? How many rows?', 'Add the row amount once for each row.', 'Look for arrays at home: egg cartons, muffin trays, windows.'],
    MU04: ['Hop along by the same amount.', ['Skip-count by the number in each group.', 'Count one hop for each group.', 'The number you land on is the answer.'], 'How big is each hop? How many hops?', 'Skip-count once for each group.', 'Skip-count by 5s and 10s while climbing stairs.'],
    MU05: ['Turn it around!', ['3 × 6 is 3 rows of 6.', 'Turn the array on its side. Now it is 6 rows of 3.', 'The dots are the same, so the answer is the same.'], 'Does turning the array change the number of dots?', 'Swapping the two numbers does not change the answer.', 'Make an array of coins, then turn it and count again.'],
    MU07: ['Zero groups and one group.', ['Times 0 means the groups are empty, or there are no groups.', 'So any number times 0 is 0.', 'Times 1 means just one group, or one in each group.', 'So any number times 1 stays the same.'], 'How many are in each group?', 'Times 0 makes 0. Times 1 keeps the number the same.', 'Show 5 empty cups: how many marbles? Then 1 cup with 5.'],
    MU08: ['Double, then double again!', ['Doubling means adding a number to itself.', 'Times 4 is double, then double again.', 'Times 8 is double three times.'], 'Double the number. Now double again.', 'Double to go from 2s to 4s, and from 4s to 8s.', 'Practice doubles: 3, 6, 12, 24. Then try 8 × 3 by doubling three times.'],
    MU09: ['Threes and sixes from facts you know.', ['3 is 2 and 1 more.', 'So times 3 is times 2, and one more group.', '6 is 5 and 1 more.', 'So times 6 is times 5, and one more group.'], 'Start with the times 2 or times 5 fact.', 'Use an easy fact, then add one more group.', 'Count by 3s, then double each to get the 6s.'],
    MU10: ['The nines trick: ten groups take away one.', ['9 is one less than 10.', 'So find 10 groups first.', 'Then take away one group.', '9 × 7 is 70 take away 7, which is 63.'], 'What are 10 groups? Now take one group away.', '9 groups are 10 groups take away one group.', 'Ask: "What is 10 × 6? Now take away 6." Repeat with other nines.'],
    MU11: ['Sevens are 5 and 2.', ['7 is 5 and 2.', 'So 7 groups are 5 groups and 2 groups.', 'Find each part, then add them.', '7 × 6 is 30 and 12, which is 42.'], 'Split the 7 into 5 and 2.', 'Use two facts you know, then add them.', 'Practice 7s by splitting: "5 sixes and 2 sixes make…"'],
    MU12: ['The last few facts.', ['Split a big number into 5 and the rest.', 'Find each part with a fact you know.', 'Then add the two parts.', 'A square fact, like 6 × 6, has the same two numbers.'], 'Which easy fact can you start from?', 'Split into facts you know, then add.', 'Pick 3 facts a week to practice with a quick card game.'],
    MU13: ['Find the missing number.', ['8 × ? = 48 asks: how many 8s make 48?', 'Count by 8s until you reach 48.', 'Count how many numbers you said.'], 'How many groups of that number make the total?', 'Ask: how many groups of this number make the total?', 'Ask: "I have 24 cookies in bags of 4. How many bags?"'],
    MU14: ['Times tens!', ['60 is 6 tens.', 'So 4 × 60 is 4 groups of 6 tens.', '4 × 6 is 24, so that is 24 tens.', '24 tens is 240.'], 'How many tens is that number?', 'Multiply the tens, then name them as tens.', 'Ask how much 4 packs of 30 stickers is.'],
    MU15: ['Patterns in the times table.', ['If one number is even, the answer is even.', 'Odd times odd is odd.', 'In the 9s, the digits add up to 9.', 'Patterns help you check answers.'], 'Look for a pattern you know.', 'Odd times odd is odd. Anything times even is even.', 'Look at a times table together and find three patterns.'],
    MU16: ['All the facts, step by step.', ['Every fact can be built from a fact you know.', 'Double for 2s. Split into 5 and the rest for big numbers.', 'Practice a few facts each day.'], 'Which easy fact can you start from?', 'Every fact can be built from one you know.', 'Five minutes of fact practice a day, a few facts at a time, beats one long session.'],
    WP01: ['Things join, or go away.', ['Draw the story as a bar.', 'Is the start, the change or the end missing?', 'Add or subtract to find it.'], 'Draw the story. What is missing?', 'Find what is missing in the story, then choose plus or minus.', 'Tell a story problem about toys and ask your child to draw it before solving.'],
    WP02: ['Two parts make a whole.', ['Two parts make a whole.', 'If the whole is missing, add the parts.', 'If a part is missing, take the other part away from the whole.'], 'Is a part missing, or the whole?', 'Parts add to the whole.', 'Sort snacks into two kinds and ask part-whole questions.'],
    WP03: ['Who has more, and how many more?', ['Draw two bars.', 'The extra piece on the longer bar is the difference.', 'Take the smaller amount from the bigger one to find it.'], 'Draw two bars. How long is the extra piece?', '"How many more" means find the difference.', 'Compare two family members\' heights or ages: "How many more?"'],
    WP04: ['Equal groups in a story.', ['Find how many groups there are.', 'Find how many are in each group.', 'Equal groups mean we multiply.'], 'How many groups? How many in each?', 'Groups times the number in each group gives the total.', 'At snack time: "3 plates with 4 crackers each. How many crackers?"'],
    WP05: ['A story with two steps.', ['Find what happens first, and work it out.', 'Then find what happens next.', 'Use the first answer in the second step.'], 'What happens first in the story?', 'Do step one. Then use its answer for step two.', 'Tell a two-step story at dinner and ask for both steps.']
  };
  Object.keys(more).forEach((k) => {
    const [hook, teach, nudge, strategy, home] = more[k];
    CONTENT[k] = { hook, teach, nudge, strategy, home };
  });
  // Grades 1, 3 (fractions), 4 and 5: [hook, teaching points, nudge, strategy, home activity]
  const added = {
    C101: ['Pip is counting lanterns all the way to 120!', ['To find the next number, count one more.', 'When the ones get to 9, one more makes 10 ones.', '10 ones make a new ten. Then the ones start again at 0.', 'Keep counting past 100, all the way to 120.'], 'What number is one more?', 'When the ones reach 9, the next number starts a new ten.', 'Count steps, stairs or cars together, and keep going past 100 to 120.'],
    C102: ['Pip has some beads, then finds a few more.', ['Adding means putting two groups together.', 'Put the bigger number in your head.', 'Count on the smaller number, one at a time.', 'The last number you say is the answer.'], 'Start at the first number and count on.', 'Put the bigger number in your head and count on.', 'Use two small piles of coins. Ask "How many in all?" and count on from the bigger pile.'],
    C103: ['Some beads roll away. How many are left?', ['Taking away means some of them go away.', 'Start with all of them.', 'Cross out the ones that go away.', 'Count the ones that are left.'], 'How many did you start with? How many went away?', 'Take away means fewer. Count what is left.', 'Put out 10 crackers, eat a few, and ask how many are left.'],
    C104: ['Ten is a special number. Which pairs make it?', ['A ten-frame has 10 boxes.', 'Some boxes are full. Some boxes are empty.', 'Count the empty boxes.', 'The full boxes and the empty boxes make 10.'], 'Count the empty boxes in the ten-frame.', 'Know your pairs to 10: 1 and 9, 2 and 8, 3 and 7, 4 and 6, 5 and 5.', 'Play "Make 10": hold up some fingers and ask how many more make 10.'],
    C105: ['Doubles are twins: the same number twice!', ['A double is the same number two times.', 'Some problems are almost a double.', 'Start with the double you know.', 'Then add one more.'], 'Is there a double hiding nearby?', 'Use a double you know, then add or take away 1.', 'Practice doubles with dice: roll one and say its double.'],
    C106: ['Three piles of beads. Is there a quick way?', ['Look for two numbers that make 10.', 'Add those two first.', 'Then add the last number to 10.'], 'Which two numbers make 10?', 'Make a 10 first, then add the rest.', 'Roll three dice and look for a pair that makes 10 or a double.'],
    C107: ['A number is hiding behind Pip!', ['Some problems have a missing number.', 'Ask: this number and how many more make the total?', 'Count on from the first number to the total.', 'How many numbers you counted is the missing number.'], 'Count on from the first number to the total.', 'Find the missing part: total take away the part you know.', 'Hide some coins under a cup: "There were 12, now I see 7. How many are hiding?"'],
    C108: ['The equal sign is like a balance.', ['The = sign means both sides are worth the same.', 'Work out each side.', 'If both sides match, it is true.'], 'What does each side make?', 'Both sides of = must be the same amount.', 'Use a balance or a ruler on a pencil with coins on each side to show "the same".'],
    C109: ['Beads come in rods of ten.', ['A digit is one of the numbers 0 to 9 we write with.', 'A rod has 10 beads. It is 1 ten.', 'A loose bead is 1 one.', 'Count the rods for the tens. Count the loose beads for the ones.'], 'Count the rods first, then the loose beads.', 'The left digit counts tens, the right digit counts ones.', 'Bundle straws or sticks into tens with rubber bands, then count tens and ones.'],
    C110: ['Which ferry has more passengers?', ['Look at the tens first.', 'More tens means a bigger number.', 'If the tens are the same, look at the ones.', 'The open side of > or < faces the bigger number.'], 'Which number has more tens?', 'Tens first, then ones.', 'Pick two house numbers or page numbers and ask which is greater.'],
    C111: ['A ten-rod jumps on or off the ferry.', ['10 more means one more ten.', '10 less means one less ten.', 'Only the tens digit changes. The ones stay the same.'], 'Does the tens digit go up or down?', 'Adding or taking away 10 only changes the tens.', 'Use dimes and pennies. Add or take a dime and say the new amount.'],
    C112: ['Pip adds tens to tens and ones to ones.', ['Add the ones to the ones.', 'Add the tens to the tens.', 'Then put the tens and ones together.'], 'Are you adding tens or ones?', 'Tens go with tens and ones go with ones.', 'Add dimes to a pile of dimes and pennies, then count the total.'],
    C113: ['Pip takes away whole tens.', ['These numbers are whole tens, with 0 ones.', 'Take away the tens like you take away ones.', 'Then say how many tens are left.'], 'How many tens take away how many tens?', 'Subtract tens like ones, then say "tens".', 'Use dimes: start with 8 dimes, give away 3, and count what is left.'],
    C114: ['Something happens in a story. Will there be more or fewer?', ['Picture the story in your head.', 'If someone gets more, the group gets bigger. We add.', 'If some are given away or lost, the group gets smaller. We subtract.'], 'Does the story get bigger or smaller?', 'Draw the story first. Then choose plus or minus.', 'Make up stories at snack time and ask whether to add or take away.'],
    F301: ['Pip shares a lantern cake fairly.', ['A fraction names part of a whole.', 'The whole is cut into equal parts.', 'The bottom number tells how many equal parts.', 'The top number tells how many parts we mean.'], 'How many equal parts are there in all?', 'Bottom: the equal parts in the whole. Top: the parts we count.', 'Cut a sandwich or paper into equal parts and name a fraction for some of them.'],
    F302: ['Fractions live on the number line too.', ['The line from 0 to 1 is one whole.', 'It is cut into equal jumps.', 'Each jump is one part, like 1/4.', 'Count the jumps from 0 to find the fraction.'], 'Count the jumps from 0, not the marks.', 'Each equal jump is one part of the whole.', 'Fold a strip of paper into equal parts and label each fold from 0 to 1.'],
    F401: ['Pip counts the stars: hundreds of thousands!', ['Commas split big numbers into groups of three digits.', 'Each place is worth 10 times the place to its right.', 'In 372,415 the 7 is in the ten thousands place.', 'So the 7 is worth 70,000.'], 'Which place is that digit in?', 'Name the place, then multiply the digit by what one is worth there.', 'Read big numbers from the news or a map together and say what each digit is worth.'],
    F402: ['Which mountain is taller?', ['More digits means a bigger number.', 'Same number of digits? Compare from the left.', 'The first place where the digits are different decides.'], 'Do they have the same number of digits?', 'Compare from the biggest place to the smallest.', 'Compare the populations of two towns or the prices of two cars.'],
    F403: ['About how many? Round it.', ['Find the two round numbers it is between.', 'Look at the digit just after the rounding place.', 'If it is 5 or more, round up.', 'If it is less than 5, round down.'], 'Which two round numbers is it between?', 'The digit just after the rounding place tells you.', 'Round the cost of groceries to the nearest ten dollars and add in your head.'],
    F404: ['Big numbers, same steps.', ['Line up the places.', 'Start with the ones and move left.', 'If a place makes 10 or more, make a ten.', 'If a place is too small, break one from the next place.'], 'Which place do you start with?', 'Work from right to left, one place at a time.', 'Add or subtract two four-digit numbers from a receipt or scoreboard.'],
    F405: ['Multiply each place, then add the parts.', ['Split 347 into 300, 40 and 7.', 'Multiply each part by the other number.', 'Add the parts together.'], 'Split the big number into its places.', 'Multiply the parts, then add them.', 'Find the cost of 4 tickets at $125 each by splitting 125 into 100, 20 and 5.'],
    F406: ['Two 2-digit numbers make a rectangle.', ['Split both numbers into tens and ones.', 'Multiply each part by each part. That makes four parts.', 'Add the four parts.'], 'How many parts does the rectangle have?', 'Four parts: tens times tens, tens times ones, ones times tens, ones times ones.', 'Draw a rectangle for 23 × 14 on paper and fill in the four parts.'],
    F407: ['Equal groups, with some left over.', ['Make as many equal groups as you can.', 'What is left over is the remainder.', 'The remainder is always smaller than one group.'], 'How many groups fit? What is left?', 'If what is left could make one more group, make it.', 'Share a bag of grapes among family members and talk about the leftovers.'],
    F408: ['Share a big number in steps.', ['Take away big, easy groups first, like 10 or 100 groups.', 'Keep taking groups away until nothing is left.', 'Add up all the groups to get the answer.'], 'What easy group can you take away first?', 'Divide in easy steps, then add them.', 'Split $96 equally among 4 people using tens first, then ones.'],
    F409: ['Factors are the numbers that multiply to make it.', ['A factor splits a number into equal groups, with nothing left over.', '3 is a factor of 12, because 3 × 4 = 12.', 'Factors come in pairs, like 3 and 4.'], 'Does it split into equal groups with nothing left?', 'Find the pair: what times this number makes the total?', 'Arrange 12 or 24 coins into all the rectangles you can.'],
    F410: ['Some numbers can only make one rectangle.', ['A prime number has exactly two factors: 1 and itself.', 'A composite number has more factors.', 'The number 1 is neither.'], 'Can you find a factor other than 1 and the number?', 'Try 2, 3, 5 and 7.', 'Try to arrange 7 coins and then 8 coins into rectangles. Which has more ways?'],
    F411: ['One pile can be a few times as big as another.', ['"4 times as many" means 4 equal groups.', 'Draw one bar, then 4 bars the same size.', 'Multiply to find the bigger amount.', 'Divide if you know the bigger amount.'], 'Draw the smaller amount as one bar.', 'Times as many means equal groups.', 'Compare: "My pencil is 15 cm. Yours is 3 times as long. How long?"'],
    F412: ['Find the rule and keep the pattern going.', ['Look at how each number changes.', 'Say the rule, like add 4 or multiply by 2.', 'Use the rule on the last number.'], 'How does each number change?', 'Find the rule, then use it once more.', 'Make a pattern with blocks and ask your child to say the rule and the next step.'],
    F413: ['Different pieces, same amount.', ['Cut every piece into the same number of smaller pieces.', 'Then multiply the top and the bottom by that number.', '2/3 = 8/12.'], 'What was the bottom number multiplied by?', 'Do the same to the top and the bottom.', 'Fold paper strips into halves, quarters and eighths and line them up.'],
    F414: ['Which share is bigger?', ['Make the bottom numbers the same.', 'Then compare the top numbers.', 'Same top number? The smaller bottom number means bigger pieces.'], 'Can you make the bottoms match?', 'Make the bottom numbers match, then compare the tops.', 'Cut two pizzas or paper plates into different parts and compare shares.'],
    F415: ['Same-size pieces add up like counting.', ['The bottom number tells the size of the pieces.', 'Add or take away the top numbers.', 'The bottom number stays the same.'], 'Are the pieces the same size?', 'Count the pieces. Their size does not change.', 'Use measuring cups: 1/4 cup plus 2/4 cup is 3/4 cup.'],
    F416: ['Whole lanterns and a part of one.', ['Each whole is cut into the same number of pieces.', '2 1/4 means 2 wholes and 1 more quarter.', '2 wholes are 8 quarters. With 1 more, that is 9 quarters.', 'So 2 1/4 = 9/4.'], 'How many pieces are in each whole?', 'Multiply the wholes by the pieces in each, then add the extra pieces.', 'Count cups of flour in quarters when baking.'],
    F417: ['Groups of fractions.', ['3 × 2/5 means 3 groups of 2/5.', 'That is 6 fifths.', 'Multiply the top number. The bottom number stays the same.'], 'How many pieces are in each group?', 'Multiply the top number. Keep the bottom number.', 'Each person gets 3/4 of a cup of juice. How much for 3 people?'],
    F418: ['Tenths and hundredths at the docks.', ['1 tenth is 10 hundredths.', '3/10 = 30/100 = 0.30.', 'The first place after the point is tenths. The next is hundredths.'], 'How many hundredths make one tenth?', 'Change tenths to hundredths, then use two places after the point.', 'Use money: a dime is 1/10 of a dollar and a penny is 1/100.'],
    F419: ['Which boat carries more?', ['Write both numbers with the same number of places after the point.', 'A 0 at the end does not change the amount: 0.4 = 0.40.', 'Then compare them like whole numbers: 0.40 > 0.38.'], 'Compare the tenths first.', 'Tenths first, then hundredths.', 'Compare prices like $0.40 and $0.38 at the store.'],
    F501: ['Do things in the right order.', ['Work inside the parentheses first.', 'Then multiply or divide.', 'Then add or take away.'], 'What is inside the parentheses?', 'Parentheses first, then times and divide, then plus and minus.', 'Write a shopping total like (3 + 2) × $4 and work it out together.'],
    F502: ['Times 10 moves every digit one place.', ['Times 10: each digit moves one place to the left.', 'Divide by 10: each digit moves one place to the right.', 'The point stays still. The digits move.'], 'How many places do the digits move?', 'Count the zeros in 10, 100 or 1,000.', 'Change dollars to cents and back: $3.25 × 100 = 325 cents.'],
    F503: ['Places after the point.', ['After the point come tenths, then hundredths, then thousandths.', 'In 2.375 the 7 is in the hundredths place.', 'So it is worth 7 hundredths, which is 0.07.'], 'Which place after the point is it?', 'Each place is worth one tenth of the place on its left.', 'Read race times like 9.581 seconds and name each digit.'],
    F504: ['Close numbers: which is bigger?', ['Give both numbers the same number of places after the point.', '0.45 = 0.450.', 'Then compare from the left.'], 'Add zeros so both have three places.', 'Compare tenths, then hundredths, then thousandths.', 'Compare two athletes\' times to the thousandth of a second.'],
    F505: ['Round decimals like whole numbers.', ['Find the two numbers it is between.', 'Look at the next digit.', 'If it is 5 or more, round up.', 'If it is less than 5, round down.'], 'Which two numbers is it between?', 'The next digit to the right tells you.', 'Round prices like $3.48 to the nearest dollar and add them up.'],
    F506: ['Big numbers times 2-digit numbers.', ['Split the 2-digit number into tens and ones.', 'Multiply by the ones, then by the tens.', 'Add the two parts.'], 'What do you get when you multiply by the ones?', 'Make two parts, then add them.', 'Work out the cost of 24 tickets at $135 each on paper.'],
    F507: ['Share by a 2-digit number.', ['Guess how many tens of groups fit.', 'Take those groups away.', 'Then find the rest of the groups.', 'Add up all the groups.'], 'About how many groups of that size fit?', 'Start with tens of groups, then finish with ones.', 'Share 384 stickers among 16 classmates using chunks.'],
    F508: ['Line up the points!', ['Write the decimal points one under the other.', 'Fill empty places with zeros.', 'Add or take away like whole numbers.'], 'Are the decimal points lined up?', 'Points in a line, then work one place at a time.', 'Add up two prices like $3.50 and $1.27 on paper.'],
    F509: ['Multiply, then place the point.', ['Multiply as if there were no points.', 'Count the digits after the points in both numbers.', 'Put that many digits after the point in the answer.'], 'How many digits come after the points in all?', 'Multiply, then count the digits after the points.', 'Find the cost of 3 pens at $1.25 each.'],
    F510: ['Dividing decimals.', ['4.8 ÷ 4: think of 48 tenths shared by 4. That is 12 tenths, or 1.2.', '3 ÷ 0.5 asks: how many halves fit in 3?', 'Dividing by a number less than 1 gives a bigger answer.'], 'How many tenths is it?', 'Think in tenths, or ask how many fit.', 'How many 50-cent coins make $3?'],
    F511: ['Different-size pieces? Make them match.', ['Find a bottom number both fractions can have.', 'Change each fraction to that bottom number.', 'Then add or take away the top numbers.'], 'What bottom number can both have?', 'Make the pieces the same size first, then count.', 'Mix 1/2 cup and 1/3 cup of water and use sixths to find the total.'],
    F512: ['Sharing makes fractions.', ['3 ÷ 4 means 3 shared by 4.', 'Each one gets 3/4.', 'The top is what is shared. The bottom is how many share it.'], 'What is being shared, and by how many?', 'Sharing 3 by 4 gives 3/4 each.', 'Share 2 sandwiches among 3 people and name each share.'],
    F513: ['A part of a part.', ['Multiply the top numbers.', 'Multiply the bottom numbers.', '1/2 × 3/4 = 3/8.'], 'Top times top, bottom times bottom.', 'Multiply the tops, then the bottoms.', 'Fold paper in half, then into quarters, and shade 1/2 of 3/4.'],
    F514: ['How many pieces fit?', ['3 ÷ 1/4: each whole holds 4 quarters, so 12 fit.', '1/4 ÷ 2: split a quarter into 2, so each piece is 1/8.', 'Dividing by a small piece like 1/4 gives a bigger answer.'], 'How many of those pieces fit in one whole?', 'Count how many fit, or split each piece.', 'How many 1/4-cup scoops fill 3 cups?'],
    F515: ['How many cubes fill the box?', ['Count the cubes in one layer: length times width.', 'The height tells how many layers there are.', 'Multiply one layer by the number of layers.'], 'How many cubes are in one layer?', 'Volume = length × width × height.', 'Fill a small box with sugar cubes or blocks and count by layers.']
  };
  Object.keys(added).forEach((k) => {
    const [hook, teach, nudge, strategy, home] = added[k];
    CONTENT[k] = { hook, teach, nudge, strategy, home };
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.TBContent = CONTENT;
})(typeof window !== 'undefined' ? window : globalThis);
