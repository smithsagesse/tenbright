# Tenbright: the Living Mathematics Universe

This document covers the audit, the character system, the reaction map and the technical rules behind Pip's animation, sound and celebrations. The code lives in `src/app.html`, in the "Pip's life" section.

## 1. Audit (before this work)

| Element | Where | State before |
|---|---|---|
| Pip (`pipSvg`) | Welcome hero, Meet Pip, map, session end | Static drawing, one expression |
| Pip (`pipPose`) | Lesson walkthrough, Work it with Pip, Fix Pip's mistake, Lantern Line, warm-up end, journal | 4 static poses (wave, think, point, cheer). The only motion was a 6 px bob on cheer and wave |
| Pip on practice questions | Item screen | **Absent**: no character reacted to answers |
| Painted scenes (5 children, a fox) | Welcome banner, session end, journal | Hand-painted art with 3D depth parallax. No per-character rig (raster art) |
| Lesson pictures (blocks, ten-frames, groups, fraction bars, number lines, column work) | Lessons and practice | Whole picture re-drawn each step with a single fade. The changed part was not highlighted |
| Feedback | Practice | Text plus an icon. No sound, no character reaction |
| Celebrations | Session end | Static text and a lantern count. No confetti, medals or rewards |
| Sound | Whole app | Pip's voice only. No sound effects, no volume control, no way to turn narration off |
| Motion settings | Whole app | OS reduced motion respected. No parent control |
| Screen changes | Whole app | Instant swap |

## 2. Character system: Pip the superhero

Pip is now the superhero boy in the blue mask and cape (art: `src/art/pip-hero.webp`, a cut-out of the owner's character art). He keeps the name Pip. One rig (`pipChar(size, mood, opts)`) is used everywhere, so he has the same proportions on every screen. The painted figure sits inside an SVG with named layers that move on their own:

- float, body and pose layers (breathing, bobbing, the poses below)
- eyelids painted over the mask, which blink at a random rhythm
- a talk layer that bounces while his voice plays
- an accessory layer
- mood extras: sparkles, thought bubbles, a heart, music notes, a star pointer, a piano, speed lines

**Signature acts**

| Act | When | What happens |
|---|---|---|
| Capoeira | Every correct answer | One of three moves, chosen in turn: **aú** (cartwheel), **meia-lua** (half-moon spin kick) and **bananeira** (handstand), with a berimbau "twang" after the chime. Gentle: a nod. Still: no movement |
| Flyover | Every 22–45 s on the map, journal, Meet Pip, profile pick, session end and Lantern Line end | Pip flies across the top of the screen, cape out, scanning for problems to solve, then leaves. Never over a question being answered |
| Galaxy dive | About one correct answer in three (at most once every 20 s), Full animation only | A star portal opens at the top, Pip spins down from the galaxy with a whoosh, lands beside the problem just solved with a soft thump and dust, does a capoeira move, then flies back up the same path (enter and exit match). About 4 s, never blocks input |
| Piano | After 20 s idle on the map, or the second tap on Pip | Pip sits at a small grand piano and plays a short pentatonic tune; keys press and notes float up |

**Personality.** Pip is curious, warm and a little playful, and is never sarcastic. He makes mistakes himself ("Fix Pip's mistake") and treats errors as clues. He celebrates effort as much as answers.

**Moods:**

| Mood | Face | Body |
|---|---|---|
| idle | Soft smile | Hovers |
| wave | Smile | Wing waves, wave lines |
| think | Eyes up, flat mouth, one brow raised | Thought bubbles pulse |
| point | Looks at the picture | Wing points, the star glints |
| curious | Wide eyes, small "o" | Slight tilt, question mark |
| cheer | Open grin, cheeks | Wings up, sparkles twinkle |
| proud | Happy closed eyes, wide smile | Chest puffs, warm glow |
| encourage | Kind raised brows, gentle smile | Head tilts toward the child, small heart |
| surprised | Big eyes, "o" mouth | Quick jump, "!" |
| dance | Happy closed eyes, open grin | Sways and hops, music notes |

**One-shot reactions** play once, when the event happens, and never again on a re-render: hello, hop, cheer, proud, tilt, think, wiggle, twirl, dance. Pip's mouth moves while his voice is playing.

## 3. Reaction map

| Learning moment | Pip | Sound | Effect |
|---|---|---|---|
| Opens Meet Pip | wave, hello hop | — | — |
| Lesson starts | wave, hello hop | soft rising "start" | — |
| Each lesson step | step's pose; new parts of the picture animate | — | Only what changed moves |
| Practice question shown | curious, beside the question | — | — |
| Hint opened | think | soft twinkle | — |
| Right first try | cheer + capoeira move | bright two-note chime, berimbau | Small sparkle burst; sometimes the galaxy dive |
| Right after a clue | proud + capoeira move | chime, berimbau | Sparkle burst, counts toward "Never give up"; sometimes the galaxy dive |
| Wrong answer | encourage (head tilt, heart) | soft low "hmm" tone, never a buzzer | No red, no X |
| Second miss, steps shown | encourage | — | Worked steps |
| Pip's mistake found or fixed | cheer | chime | — |
| "Why did that work?" right | proud | chime | — |
| Lantern Line: within 4% / 10% / further | surprised / cheer / encourage | chime / chime / soft | — |
| Session complete | dance | arpeggio | Confetti |
| New lantern lit | proud | lantern shimmer | Lantern counter glows |
| Badge earned | — | sparkle | Medal drops in and swings |
| Tap Pip on the map | capoeira, piano or hello, in turn | berimbau / piano / "boing" | Pip says a friendly line |
| Idle on the map 20 s | piano | piano tune | — |

## 4. Math animation

After each render, the lesson and practice pictures are compared with the previous picture of the same lesson. Only new or changed parts animate, so the motion shows the math:

- **Adding:** new blocks, counters and digits pop in one after another.
- **Taking away:** crossed-out counters drift and fade.
- **Groups (multiplying):** items deal into each group in turn.
- **Sharing (dividing):** items deal into each group in turn, so the picture shows them being shared out.
- **Fractions:** the shaded parts fill one by one.
- **Number lines:** hops draw themselves along the line.
- **Column work:** carried or regrouped digits bounce in, and crossed digits are struck through.
- **Bar models in word problems:** found parts glow and removed parts slide away.

## 5. Rewards (effort, not perfection)

Badges reward persistence, curiosity and practice. None reward speed or streaks:

| Badge | How it is earned | Gift |
|---|---|---|
| Explorer | Finish the first map exploration | Party hat |
| First practice | Finish a practice session | Bow tie |
| Never give up | Fix 5 answers after a clue | Scarf |
| Detective | Fix 3 of Pip's mistakes | Glasses |
| Warm-up friend | Finish 3 Lantern Line warm-ups | Flower |
| First lantern | Light a lantern by practicing | Star crown |
| Why wizard | Explain why it worked 3 times | Wink face |
| Lantern keeper | Light 10 lanterns by practicing | Star-eyes face |

The child picks Pip's accessory and celebration face in the journal. There are:

- no prices, ads or currencies;
- no timers, streaks or loss messages;
- no comparison with other children.

## 6. Technical, performance and safety rules

**Parent controls.** The grown-ups page (settings are kept on this device) has:

- Pip reads aloud automatically (on/off). The speaker buttons still work when this is off.
- Pip's voice volume.
- Sound effects (on/off).
- Sound effects volume.
- Animation: Full / Gentle / Still.

**Reduced motion.** If the device asks for reduced motion, the app is Still whatever is chosen:

- Still: Pip changes expression with no movement.
- Gentle: blinking and expression changes, with no bouncing, confetti, 3D motion, flyovers or galaxy dives. Capoeira becomes a nod.

**No flashing.**

- Nothing changes brightness more than once a second.
- Confetti is a few dozen soft-colored pieces for about 2.5 s.
- Glows are slow fades.

**Sound.**

- Every effect is synthesized on the device with Web Audio, so there are no files to download.
- Effects are short (0.1–0.9 s), use a pentatonic scale and stay quiet under the voice.
- Each of the two channels (voice and effects) has its own gain node.

**Performance.**

- Pip is a small inline SVG animated by CSS transforms.
- Animation phases continue across re-renders, so typing an answer doesn't restart Pip's motion.
- The pointer is read once per frame.
- Confetti uses a single canvas that is removed when it finishes.
- Nothing runs while the tab is hidden.

**Privacy.**

- The only new data kept is each child's earned badges and Pip's chosen look, stored on this device.
- No outside requests were added.
- The build still fails on any external URL.
