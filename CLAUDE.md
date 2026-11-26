# Tenbright (GMIA): project memory for Claude Code

Read this file first in every session. It replaces the original claude.ai chat
("Approval to proceed to phase 2", Nov 3–10, 2026), where this project was planned and built.
Full history: `docs/DECISIONS_AND_HISTORY.md`. Planning documents: `docs/`.

## Who and what

- **Owner:** Smith Sagesse, founder of the Global Mathematics Intelligence Academy (GMIA). He approves
  each phase and makes all decisions on spending, hiring, legal matters and public release.
- **Product:** **Tenbright**, GMIA's child-facing math-learning web app. It covers Grades 1–5 (ages about 6–11)
  and launches first with US families and homeschoolers. No ads, no in-app purchases, no
  manipulative design (no streaks, loot boxes or timers on ordinary practice).
- **Guide character:** **Pip**. Since v22, Pip is drawn as a masked superhero boy with a blue suit, yellow cape and
  "T" belt (`art/pip-hero.webp`). The original concept was a glowmoth, which is still the icon
  (`icon-192.png`, `icon-512.png`) and appears in the Phase 3 docs.
- **Brand architecture:** GMIA is the company. Tenbright is the product. Number Kingdom is the world, with five regions:
  Lantern Village (review hub), Bead Meadows (place value), Ferry River (add/subtract),
  Orchard of Rows (multiplication) and Story Bridge (word problems).

## Current state (Tenbright 2.0, Nov 26, 2026; started from v22 of Nov 10)

The working MVP is a single-page HTML/JS app plus assets. The live private link (updated Nov 26, 2026 to the Tenbright 2.0 build, artifact version 23, at the owner's request) is
https://claude.ai/artifact/DzUkbiyZdo9DFxotvogjHT

- A **deterministic math engine**: all problems, answers and worked steps come from code, never from an LLM.
  It covers 126 skills across Grades 1–5 (including money, time, measurement, geometry and the math of money since Nov 26), with a misconception library (wrong-answer patterns mapped to "clue" feedback).
- **Discovery Adventure** (Tenbright 2.0 Phase 2, Nov 26, 2026): the adaptive starting walk, framed for the child as a
  number adventure. It starts near the child's school grade (gently, with an easier check, if the parent said math feels
  hard), checks key skills including one or two story problems, asks each in two kinds of question, and stops at 29 questions (25 until Nov 26; raised so the strand spot checks cost no core check).
  A miss can bring one follow-up question: a story missed → the same kind of math without a story ("reading");
  a check failed → one question from the skill underneath ("foundation" or "new step"). Follow-ups never change pass or fail.
  Since Nov 26 each walk also has two 2-question spot checks from the new strands, matched to the school grade (Grade 1
  TM01+GE01, 2 MY02+MS01, 3 TM03+MS04, 4 MY04+GE02, 5 GE03+TM04; `STRAND_ANCHORS`). They wait at the end of the queue and
  move forward once the questions left are just enough (`strandsForward`), so the core number checks come first; 2 of 2
  counts as known, anything less means practice on the map, with no follow-up. A child who has passed nothing is not
  asked them, and a passed spot check credits only skills of its own strand (`applyPlacement`). With the 29-question
  limit no core check is lost (checked in 42 simulated walks, all grades and answer profiles; about 4 questions longer
  on average than the 25-question walk; children who struggle get the same or a shorter walk).
  Rest stops every 3 checks; the walk is saved on the device and resumes. The child never sees a grade, level or score.
  Parents see "What the Discovery Adventure found" and an Understanding state per skill (understands, partly, with help,
  can do it but explaining why is next, not yet, still checking, not started). **Spaced-repetition mastery** rechecks each skill
- **Lessons:** illustrated step-by-step walkthroughs with Pip and "Work it with Pip" guided practice. Models include
  base-ten blocks, place-value charts, number lines, ten-frames, bar models, arrays and an interactive soroban.
- **Lantern Line**, a number-line warm-up game, plus a child journal and a parent dashboard.
- **Narration:** free, on-device **Kokoro TTS**, voice `af_heart` at speed 0.95, pre-recorded to `audio/pip-*.mp3`.
  An earlier ElevenLabs "Simone" voice was dropped because the paid plan was insufficient.
  On Nov 25, 2026 the owner auditioned 13 Kokoro voices and kept `af_heart` as is. His rule for Pip's speech:
  **no filler words** ("Hmm", "um", "well"...); use pauses instead (sentence breaks, commas).
  When Pip's English wording changes, run `python3 narration/record.py` after the build (see README.md):
  it records only the missing clips, from the app's own list of everything Pip says. The model files (about 350 MB) are not
  in the repo: a fresh cloud session must `pip install kokoro-onnx soundfile` and download them again (README.md says how).
  `kokoro-onnx` is used because PyTorch's download server is blocked in cloud sessions.
- **Voice answers** (opt-in) use the on-device Web Speech API. Children write problems on paper while Pip
  works them step by step, then answer by voice.
- **Languages:** English, Spanish (Latin America), French, Haitian Creole, Traditional Chinese (Taiwan)
  and Modern Standard Arabic, with full RTL, an embedded Cairo font and LTR isolation for math. All translations are
  machine-drafted and need native-speaker review: `source/tenbright-mvp/tenbright-translation-review.xlsx`, rebuilt Nov 26, 2026
  with all 4,759 phrases and Arabic (`tools/translation-review/` regenerates it from the source).
- **"Living Pip"** animation: one character rig with moods, capoeira on correct answers (aú, meia-lua, bananeira
  plus a berimbau sound), flyovers, a galaxy dive (about 1 in 3 correct answers, at most once per 20 s) and piano when idle.
  Settings are Full, Gentle or Still, and the app respects OS reduced-motion.
- **Badges:** 9 badges that unlock Pip accessories (the 9th, Market maker, for 3 money adventures, gives a sun cap). Rewards are earned only and never sold.
- **Child separation:** each child can have "secret pictures" (tap 3 of 9) to open their profile. Pictures are salted and hashed,
  and the lock is on by default from the second child.
- **PWA:** installable and offline, using `sw.js` and `manifest.webmanifest`. The service worker registers only over http(s).
- **Art:** the welcome, celebrate and journal scenes in `art/` have depth maps for mouse and device-tilt parallax.

## Hard rules (do not break)

1. **COPPA / privacy:** no child data leaves the device. No analytics, trackers, ads, external fonts, CDNs or any
   outside URL in the build. The original build failed if any `http(s)://` appeared in the page. Keep that check.
2. Before any child profile exists, the app requires an adult gate (birth year 18+, answer not stored) and recorded parental consent
   (notice version plus method). There must be no path around consent. This was compliance finding F1.
3. Children never type free text. Their input is limited to numbers, choices and taps. Collect no real name, photo, voice recording,
   location or contacts. Voice answers are recognized on-device only.
4. **No LLM-generated math.** Pip may *phrase* things, but every number comes from the engine.
5. Praise strategy, not "smartness". Mistakes are "clues": no red X and no buzzer. Use the same math words every time
   ("regroup", never "borrow").
6. Pip says he is a computer-made helper. He never says "don't tell your parents", never guilts a child into staying, and never claims to be a friend.
7. Make no IQ, "brain training" or outcome claims. Vedic and soroban methods are taught for their math, with an honest history note.
8. Accessibility: child touch targets at least 64 px (88 px for primary actions), text contrast at least 4.5:1 (7:1 for numbers),
   audio-first instructions with captions, and no flashing above 3 times per second.
9. Retention: answer records older than 13 months are deleted on the device. The grown-ups PIN is stored only as a salted hash.
10. Check every change with tests before calling it done. Owner approval is required for phase gates, spend and release.

## Files in this folder

```
CLAUDE.md                 ← this file
START_HERE.md             ← owner's step-by-step setup guide
app/                      ← the latest BUILT app, refreshed from source/tenbright-mvp/dist/ after every source change
  index.html              ← the whole app (about 1.7 MB: inline JS, CSS, embedded fonts and translations)
  sw.js, manifest.webmanifest, icon-*.png, art/, audio/
source/tenbright-mvp/     ← the full source (v22 plus the Tenbright 2.0 work) (build.js, src/, test/, narration/); dist/ is build output, not committed
docs/                     ← planning and legal documents (Phases 1–3, compliance, accounts plan, art brief, release plan)
docs/DECISIONS_AND_HISTORY.md, docs/LINKS.md
```

### The built app vs. the real source

`app/index.html` is the **built output**. Never edit it by hand; change the source and rebuild.
Up to Nov 25, 2026 it was the copy downloaded from the live artifact, with a small claude.ai hosting header on line 1.
Since then it is the plain build output, without that header.

The **real project** is `source/tenbright-mvp/` (from `tenbright-mvp.zip`, the last file attached in the original chat, v22).
The owner uploaded it without the art and audio; `src/art/*.webp` and `narration/audio/*.mp3` were restored from `app/`.
On Nov 21, 2026 `node build.js` reproduced the live v22 page byte for byte (apart from the claude.ai hosting wrapper),
with identical sw.js, manifest, icons, art and audio. It contains:
- `src/app.html`: the main source. Also `src/i18n/*.js` (es, fr, ht, zh, ar), `src/art/`, `narration/audio/map.json`.
- `build.js`: run `node build.js` to produce `dist/index.html` (and `dist/test.html` with test hooks).
- Tests: `node test/engine.test.js` (math engine, millions of generated checks); `node test/explain.test.js` (plain-words lessons); `node test/strategies.test.js` (strategy library); Playwright suites
  `test/e2e.py`, `test/features_test.py`, `test/audio_test.py`, `test/living_test.py`,
  `test/separation_test.py`, `test/discovery_test.py`, `test/adaptive_test.py`, `test/games_test.py`, `test/strategies_test.py`, `test/money_time_test.py`, `test/measure_shape_test.py`, `test/dashboard2_test.py`, `test/adventure_test.py` and `test/i18n_test.py` (axe-core accessibility in light and dark, all languages; `LANGS=en,ar` limits the run).
- `docs/animation-system.md` and `README.md`.

Make changes in `source/tenbright-mvp/src/`, rebuild and run every suite.

**Owner's standing instruction (Nov 25, 2026): refresh `app/` every time the source changes.** Once the suites pass,
copy the build into `app/` in the same commit as the source change:
`index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, and replace `app/art/` and `app/audio/` whole.
**Never copy `dist/test.html`**: it carries the test hooks, and shipping a test hook was compliance finding F11.
Afterwards `diff -rq source/tenbright-mvp/dist app` must report only `test.html`.
Refreshing `app/` in the repository is not a release. Publishing to families (the live link, a website or the app stores)
still needs the owner's approval.

## How to run

- Quick look: open `app/index.html` in a browser. It works offline, without the service worker.
- As a real web app: `cd app && python3 -m http.server 8080`, then open http://localhost:8080
- Source build: `cd source/tenbright-mvp && node build.js && node test/engine.test.js`
- Playwright tests need `pip install playwright` (match the Node Playwright version) and a full Chrome or Chromium at
  `/usr/bin/google-chrome`, which the test scripts use. In Claude Code cloud sessions that path already wraps
  `/opt/pw-browsers/chromium`, so do not run `playwright install`. Use a full Chrome or Chromium:
  Playwright's bundled headless shell crashed on this 1.7 MB page during the Nov 10 handoff check. Full Chrome loaded it
  with 0 errors and 0 outside requests, at desktop and phone width, over http and from file://.

## Open items (blocking public launch)

1. **Operator details** for the privacy notice and terms: legal entity name, mailing address, contact email and phone (compliance F12).
2. **USPTO trademark search** for "Tenbright" in Class 9 and Class 41 (F13).
3. **Licensed privacy attorney sign-off.** Shortlist and scope are in `docs/Tenbright_Commissioning_and_Release_Plan.txt`.
4. **Verifiable parental consent ("email plus") plus a backend,** required before any data syncs off the device
   (`docs/Tenbright_Accounts_Consent_and_Sync_Plan.txt`). The recommendation is managed Postgres with row-level security and an append-only event log.
5. **Rights to the superhero Pip art.** It was cut out of an image the owner supplied, so confirm ownership and AI-tool commercial terms
   before release. Earlier scene art was AI-generated, then upscaled and restyled. Final art is planned as a human commission
   with no generative AI and full copyright assignment (`docs/Tenbright_Art_Commission_Brief.txt`).
6. **Native-speaker review** of all 5 translations.
7. **Next build step the owner was offered:** App Store prep (store build with preview items hidden, iOS project, store listing).
8. **Gate G3 usability sessions** with 5–8 children aged 7–9 (Phase 3 test plan), planned through Gwinnett County homeschool co-ops.

## Working style the owner expects

He wants work that is business-focused, factual and no-nonsense, with thorough research. Lead with the result. Flag decisions that need him clearly.

**Git workflow (owner's standing instruction, Nov 25, 2026):** do each piece of work on a `claude/...` branch. Once every
test suite passes, merge it into `main` yourself (fast-forward; rebase first if `main` moved), push, and then tell him what
was merged. He does not need to approve each merge. This covers development work only: anything that publishes to
families (the live link, a website, the app stores) still needs his approval.
Current focus (Nov 25, 2026): developing the app. Do not raise launch items or plans unless he asks.

**Tenbright 2.0 program (owner approved Nov 26, 2026):** the owner's master prompt and its Phase 1 audit are in the doc
"Tenbright 2.0: Phase 1 Audit" (https://claude.ai/artifact/Cnw1YufTXrKQPPHx4ULdCx). He accepted every recommendation:
- **Pip's adaptive tutoring runs on the device.** No AI at run time and no child data off the device. Explanation variants
  are written ahead of time (AI may help draft them offline), verified against the engine, reviewed and recorded.
- **Coins only as math objects** (a Money Market world), never a reward currency.
- **Parent intake:** only two optional questions (enjoys math? how confident?), kept under privacy notice v1.3.
  Any new kind of stored data needs a notice version bump and re-agreement (the parent page shows the update card).
- **Build order:** 2 Discovery Adventure (done Nov 26) · 3 foundation lessons (done Nov 26: all 103 skills, Grades 1–5) (micro-step rewrite, Grades 1–2 first,
  keep math words with plain explanations, translations in the same pass) · 4 adaptive Pip + independence and mastery
  evidence (done Nov 26) · 5 games (done Nov 26) · 6 strategy library (verify the cited research first; done Nov 26) · 7 geometry, measurement, time, money (done Nov 26) ·
  8 parent dashboard v2 (done Nov 26) · 9 pilot and effectiveness study (needs the owner: families, consent, study design).
- The four wording issues were fixed on Nov 26, 2026 ("Regrouping in adding and taking away", "You looked closely at every clue.
  That is how you learn.", the Lantern Line note without the outcome claim, glowmoth labels removed).

**How lessons explain (Phase 3):** `src/explain.js` turns an engine question into plain words: a "what the numbers mean"
frame, one plain step per engine step (same count and order, ending with the same number sentence, because lesson
pictures, Work it with Pip and the checks key off the step index and the last "= result"), and a check frame.
The engine's short steps stay as they are for the pictures and the "on your paper" view. `test/explain.test.js`
enforces: same result per step as the engine, every number sentence true, sentences of 16 words or fewer, no
"borrow"/"carry"/fillers. Within a step that asks for a result, never say the result in words before its number
sentence (Work it with Pip hides only the number). Add a builder per skill in `explain.js`; a skill without one keeps
the engine's steps. Fix Pip's mistake questions always keep the engine's steps.
**How Pip adapts (Phase 4):** all on the device, no AI at run time.
- *Explanation variants* (`explainPick`/`explainShown`/`explainOutcome` in engine.js): steps (Phase 3 plain words),
  pictures (the lesson's step pictures, for questions that have a picture model) and the big idea (the skill's teach lines,
  then this problem's last step). They appear after the second miss and at the top hint. The next first try at that skill
  records whether it helped; after a miss, the next explanation is a different kind. The parent page says what helps most.
- *New question kinds*: the same math in a new story (`makeTransfer`, word-problem wording, the item's own numbers, steps and
  answer) and fill in the missing step (`makeStepFill`, one middle result of the engine's steps as a box). "Why did that work?"
  and choosing what went wrong in Fix Pip's mistake are the reason evidence.
- *Mastery* (`masteryMet(st, id)`) keeps the old gate (10 independent plain answers, 90%, two formats, mastery estimate 0.95)
  and also needs two of story, missing step and reason, or as many as the skill can offer (`canOffer`, `evidenceMissing`).
  Skills already lit stay lit.
**Games (Phase 5):** Build the Bridge (missing part on a bridge number line), Pizza Shop (tap slices: fractions,
equivalent fractions, adding with the same bottom number) and Number Detective (hidden numbers in patterns and number
sentences). Rounds come from `gameRound` in engine.js; a game opens only when its skills are lit (`gameLevel`). A miss
brings a clue, a second miss shows how. No clock unless the child picks the optional timed run, offered only after the
game was finished once; it counts up and compares only with the child's own best. Games never change mastery.
Touch targets: `--t-child` 64 px and `--t-primary` 88 px (hard rule 8), on every screen size. Raised from 60/76 px in
Phase 5; the owner confirmed on Nov 26, 2026 to keep 64/88 (do not revert).
**Strategy library (Phase 6):** `src/strategies.js` (window.TBStrategies), 18 strategies taught today plus 4 trial
additions (number bonds picture, mental abacus, numbers near 100 / Nikhilam, vertically and crosswise), each with the
owner's 14 parts, an honest origin note and a research note (sources named in words: no outside URL in the build).
Worked examples, practice and the 4-question independent mastery test (3 of 4) are generated, so every number is the
engine's. Parents read it from the grown-ups page (searchable; the body is English for now, pending native-speaker
review of translations). Children see trial methods only when a parent turns on "Offer extra ways to solve" (off by
default); trial results are kept on the device (`ch.trials`) for the pilot, which decides whether each trial stays.
Research checked Nov 26, 2026: mental abacus (Barner et al. 2016 RCT, gains moderated by spatial working memory; 2018
one-year trial, first graders struggled); make ten/decomposition (correlational: Laski and Yu 2013; Vasilyeva, Laski
and Shen 2015); comparing methods (Rittle-Johnson and Star 2007, grades 7 to 8); number lines and representations
(WWC practice guide 2021); bar models (small studies only); Vedic methods (no rigorous study found; 1965 book, not in
the Vedas per Dani and the book's own editor).
**Money and time (Phase 7, first slice):** two new regions, Money Market (MY01 coin values, MY02 count coins, MY03 money
stories, MY04 change from a dollar by counting up) and Clock Tower (TM01 hour and half hour, TM02 to 5 minutes, TM03 to
the minute, TM04 elapsed time). Coins are drawn with their value printed on them and appear only as math objects, never as
a reward or wallet. A clock's spoken description gives where the hands are, never the time. New clues: MY1 counted coins
not value, MY2 change digit by digit, MT1 hands swapped, MT2 next hour, MT3 clock number as minutes, MT4 time as hundreds.
In other languages the coin description is built from short translated pieces (`Coins:` plus `{N} dime` and so on).
**Measurement and geometry (Phase 7, second slice):** Measuring Workshop (MS01 measure with a ruler, including objects that
do not start at 0; MS02 compare lengths; MS03 perimeter and a missing side; MS04 area by rows of squares and by length ×
width) and Shape Garden (GE01 name shapes by their sides; GE02 angles that make a right or straight angle; GE03 across and
up on a grid). Clues: MM1 read the end of the ruler, MM2 only two sides, MM3 area and perimeter mixed, MG1 right angle as
100, MG2 up before across. The grid's spoken description says where the star is (owner's decision, Nov 26, 2026), so a
child using a screen reader can answer the grid questions. Common Core codes with a one-letter
domain (2.G.A.1) are a `{C}` slot in translation.
**Parent dashboard v2 (Phase 8):** "Over the last 8 weeks" shows minutes of practice, the share of answers given on their
own (hint level 0 or 1, plain questions) and lanterns lit, one column per week, plus the last 2 weeks against the 2
before (only when both have 5 or more answers). Everything is computed from data already on the device (sessions,
answers, `masteredAt`); no new kind of data is stored, so the privacy notice stays v1.3. "What {child} is working on,
and why" lists up to 3 skills in progress with a plain line per region (`REGION_WHY`, no outcome claims), what each
builds on (its prerequisites) and what it opens next (skills that list it as a prerequisite).
**Money & Wealth Adventures (owner accepted all 7 recommendations, Nov 26, 2026):** plan in the doc "Money & Wealth
Adventures: Integration Plan" (https://claude.ai/artifact/PHhg5uFNNrJQwKjNVfFRFA). Decisions: Grades 1–5 only (no teen or
adult content); no AI at run time (Pip's on-device rules tell a math gap from a money-idea gap); pretend money exists only
inside one adventure, fresh each time, never earned, kept or spent; animations drawn by code and narrated by Pip, scripts
for a later human studio, no generated video; no options trading or life insurance for children; growth taught with
tenths (no percent or exponents); spending choices are not kept (keeping them needs notice v1.4). Investing stories and
invitations get parent switches. Every adventure step is an engine question; a first answer counts as story evidence
(`kind: 'transfer'`) for its skill; adventures never light a lantern by themselves.
Step 1 (done Nov 26): skills FN01 price × quantity, FN02 revenue/cost/profit, FN04 saving plan, FN05 share of a company,
FN07 growth year by year (Money Market region); clues MW1 revenue as profit, MW2 forgot a cost, MW3 added the costs,
MW4 growth added once, MW5 whole instead of part (MW, not MF: MF1-MF12 are fraction clues; a repeated code silently
replaced four fraction clues until Nov 26, and test/engine.test.js now fails on any clue code defined twice); `E.ADVENTURES`/`adventure(id, r)`/`adventureOpen`; the runner is the
games shell with `game: 'adventure'` (story strip, idea-check choices, "What math did you use?" end screen), reached by a
"Money adventures" map button shown only when an adventure is open; results in `ch.adventures` (at, first, steps, idea).
Step 2 (done Nov 26): ten adventures in `ADV_BUILD` (piggy, shelf, kite, jar, change, twenty, stall, lemonade, company,
growth; each names its math skills, a money idea, a real-life line and a home activity); company and growth are investing
stories (`investing: true`), open only when the parent turns on "Investing stories". Story strip = `[label, value]` pairs.
Explainers (`adventureExplainer`: lemonade, growth, company; 5 frames of a picture and one Pip line, numbers from the
engine, bars grow unless animation is Still) play before the first try, skippable, and on demand after. The invitation
after mastery appears once on the practice end screen when the session's skill was just lit and powers an open
adventure (`session.wasLit`), with Later. Parent card "Math in real life" with switches `S.settings.adventures` (on),
`investing` (off), `invites` (on). Badge "Market maker" (3 adventures) gives Pip a sun cap. Step 3 (done Nov 26, at the owner's request before the pilot): skills FN03 dollars and cents (decimal answers; the
adventure keypad gets a decimal key and answers are compared with `E.check`, so 0.30 = 0.3), FN06 unit price, FN08 read
a price line (picture `priceline`); clues MW6 price not the change, MW7 price not the week; ten more adventures
(pricetest, rainy, shopping, cents, better, split, dividend, bulk, early, updown; dividend, early and updown are
investing stories). All 20 adventures of the plan are built. Story names must come from `NAMES` in i18n.js so they
translate (a name outside it stays English).
Do not claim legal sign-off, hiring or payments. Those are his.
