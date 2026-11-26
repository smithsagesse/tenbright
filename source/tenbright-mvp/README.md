# Tenbright MVP

The GMIA Phase 4 MVP: all 52 grade 2–3 skills plus the T3 Mental Math Strategy. It runs fully in the browser and keeps all data on the device.

## What works

- Parent setup: consent checkboxes, a 4-digit grown-ups PIN, child profile (nickname, birth year, current math).
- Discovery Adventure (the adaptive starting walk, at most 25 questions): starts near the school grade, or with an easier check when the parent said math feels hard; checks key skills including story problems, each in two kinds of question; 3 of 3 passes, 2 of 3 gets a deciding item, and a failed check skips the checks that depend on it. One follow-up after a miss tells a reading difficulty (same math without a story), a missing foundation or a new step (a question from the skill underneath). Rest stops every 3 checks; the walk saves and resumes. The child never sees a grade or score; parents get "What the Discovery Adventure found" and an understanding state per skill.
- Two optional parent questions (does your child enjoy math, how do they feel about it), kept only under privacy notice v1.3; parents who agreed to an older notice are asked again first.
- School grade (Grades 1–5 or homeschool) at setup, editable by parents. A grade-level selector (All levels / Grade 2 / Grade 3) on the map and in parent settings makes Pip suggest that grade's skills first; it never locks anything, clues and retention checks still come first, and earlier skills a grade needs are practiced before it. Parents see progress by grade, and every skill is labelled with its grade and Common Core code.
- Kingdom map with five regions; Pip's idea follows the Phase 2 next-activity rule: remediation, then due retention checks, then the lowest-mastery skill, then unlocks.
- 103 skills across Grades 1–5 (Common Core): Grade 1 (C101–C114: counting to 120, facts within 10 and 20, make ten, doubles, three addends, missing numbers, the equal sign, tens and ones, comparing, 10 more/less, adding and subtracting tens, story problems); the 52-skill Grade 2–3 map (PV01–PV14, AS01–AS17, MU01–MU16, WP01–WP05) plus the Mental Math Strategy T3; Grade 3 fractions (F301–F302); Grade 4 (F401–F419: place value to a million, comparing and rounding, multi-digit add/subtract, multiplying and dividing, remainders, factors and primes, times as many, patterns, equivalent/comparing/adding fractions, mixed numbers, fraction × whole, tenths and hundredths, comparing decimals); Grade 5 (F501–F515: expressions, powers of 10, decimals to thousandths, comparing and rounding decimals, multi-digit multiply and divide, decimal operations, unlike fractions, fractions as division, multiplying and dividing fractions, volume). Decimal and fraction answers are exact; fractions are drawn stacked and read aloud as words.
- Seven map regions, including Fraction Falls and Decimal Docks; grade-aware placement starts near the child's school grade and drops down a grade if the first anchor is missed.
- Illustrated lesson walkthrough for every skill: Pip (waving, thinking, pointing, cheering) explains each step in a speech bubble while the picture changes with the step (columns fill in, carries and regrouping appear, blocks are traded, hops are drawn). Back/Next, arrow keys and read-aloud per step; then guided and independent practice.
- Models: base-ten blocks, place-value charts, number lines with hops, ten-frames, bar models for word problems, pairs, equal groups, arrays, and an interactive soroban.
- Work it with Pip: on any practice question, Pip asks the child to write the problem on paper, then goes step by step, asking for each step's result (typed or spoken), showing the paper as it should look, and finally asks for the whole answer. Guided answers do not count as independent mastery evidence.
- Voice answers (parent opt-in, off by default): the child taps Talk and says a number or "next", "back", "again", "help", "check". Uses the browser's on-device speech recognition only (SpeechRecognition with processLocally); if the browser cannot promise on-device recognition, the feature stays off. No audio or transcript is kept.
- Fix Pip's mistake (erroneous worked examples): about 1 in 5 practice questions, once a skill has been taught, shows Pip's wrong answer built from a real misconception in the engine's library; the child picks what went wrong from three same-topic explanations, then gives the right answer.
- Why did that work? (self-explanation): once a session, after a first-try correct answer, the child picks the reason the method works from three strategies in the same strand.
- Lantern Line warm-up: 5 number-line estimation tasks (0–20, 0–100, 0–1,000, 0–10,000, fractions and decimals by grade), tap or slider; scored by percent absolute error and tracked over time.
- My journal: self-referenced progress for the child (things I can do now, number-sense trend, mistakes found and fixed); the end screen compares the child with their own past, never with others.
- Interleaving prefers look-alike skills from the same strand when mixing earlier skills into practice.
- Each child's work stays separate: every child has their own record (unique id; placement, skills, reviews, answers, warm-ups, badges, Pip's look), and only the child chosen on Who's playing is written to. Secret pictures (optional per child, on by default from the second child): the child taps 3 of 9 pictures to open their profile, so a sibling can't play in it by mistake. Works before reading, no lockout (after 3 misses Pip suggests asking a grown-up), stored salted and hashed, and the unlock screen never shows which pictures were tapped. Parents set, change or turn it off per child on the grown-ups page.
- Design system 2 (see `docs/design-system.md`), built on the apple-design skill: the system's rounded type (SF Pro Rounded on Apple devices, Nunito elsewhere), iOS grouped lists and a translucent navigation bar for grown-ups, a night-sky world with glass controls for children, switches, iOS-style fields, sliders and a round passcode keypad, instant press feedback, and layouts tuned for phones, tablets and computers (Pip beside the answer box on phones so Check stays on screen; question and keypad side by side on tablets; centred, width-limited layouts on computers). Honors reduced motion, reduced transparency and increased contrast.
- Accessibility: zero axe-core WCAG 2.2 AA violations across all screens in light and dark mode; one heading per screen; pictures announced as images; larger-text option for each device.
- Installable, offline app when served from a website (service worker caches the page and Pip's audio; nothing is sent anywhere).
- Hint ladder (nudge, strategy, first step, full worked example); clue feedback for 21 misconception patterns; worked steps after a second miss; never a red X.
- Mastery engine: Bayesian knowledge tracing per skill plus the observable gate, retention checks at 7/30/90 days, certification at 30 days, targeted remediation.
- Parent report: this week, understands, working on, why it may be hard, a 10-minute home activity, how progress is measured, per-skill evidence, session length, demo clock, delete child or erase everything.
- Languages: English, Spanish (Latin America), French (international), Haitian Creole (Kreyòl ayisyen, standard IPN/Akademi spelling), Traditional Chinese (Taiwan) and Modern Standard Arabic (العربية, right to left), chosen on the welcome screen or in parent settings; switching never changes progress. Every screen, lesson, hint, worked step, Pip line, word problem, parent page and the privacy notice is translated. Numbers follow each language (French 3,5 and a "," key; Chinese number words), names and objects in word problems are localized, and voice answers understand numbers and commands in each language (e.g. "cuarenta y dos", "quatre-vingt-dix-sept", "twa san karannde", "swivan", "三百零五", "下一個", "ثلاثمئة وخمسة وأربعون", "التالي"). Arabic mirrors the whole layout right to left while math stays left to right (every run of numbers and operators, fractions, number pads, place-value columns and number lines), uses the embedded Cairo typeface (SIL OFL), Western digits as on the keypad, Arabic names in word problems with verbs that agree with each name's gender, and generic coin and note values that fit every Arab country. Translations are machine-drafted and awaiting native-speaker review (see `tenbright-translation-review.xlsx`).
- Read-aloud via the most natural on-device voice; math symbols are read as words. Online voices are never used.
- Living Pip the superhero (see `docs/animation-system.md`): Pip is the masked superhero boy with the cape, used on every screen with idle life (breathing, bobbing, random blinking, a body that bounces while he talks) and his moods. Every correct answer gets a capoeira move (aú cartwheel, meia-lua spin kick or bananeira handstand) with a berimbau twang. On the map and other calm screens he sometimes flies overhead looking for problems to solve; on about one correct answer in three he dives down from a star portal in the galaxy, lands beside the problem just solved, does his move and flies back up; when the map sits idle, or on his second tap, he plays a little grand piano. He says hello when a lesson starts, dances when a session ends, thinks on a hint, and gives a kind head tilt (never disappointment) on a mistake. Flights and dives never block the screen and are off in Gentle and Still. Lesson and practice pictures animate only what changed (new blocks pop in, crossed-out counters drift away, groups deal out, fractions fill, number-line hops draw themselves, regrouped digits bounce). Gentle confetti, a lantern glow and soft synthesized sound effects mark celebrations.
- Badges for effort and persistence (Explorer, First practice, Never give up, Detective, Warm-up friend, First lantern, Why wizard, Lantern keeper) unlock accessories and happy faces the child picks for Pip in the journal. No streaks, timers, currencies or comparisons.
- Parent controls for sound and motion: automatic reading on/off (speaker buttons still work), Pip's voice volume, sound effects on/off and volume, and animation Full / Gentle / Still. A device that asks for reduced motion always gets Still. Nothing flashes.

## Known deviations from the Phase 2 spec

- The mastery gate needs 2 question formats, not 3, and no separate transfer or explain items yet.
- Retention checks are 4 items passed at 3 of 4 (75%), the closest whole-item match to the 80% bar.
- Consent is recorded locally; verifiable parental consent, accounts, sync and a backend come next.
- Pip's voice: recorded narration made with the open Kokoro-82M model (Apache-2.0), voice "Heart", generated locally and shipped as audio files in `dist/audio` (no outside service at run time). `src/speech.js` turns any sentence into whole-sentence, phrase and number clips; anything without a clip falls back to the device voice. Lessons can be played through with Play all. In Spanish, French, Haitian Creole, Chinese and Arabic, Pip is read by the device's own on-device voice for that language; if the device has none (common for Haitian Creole), Pip's words stay on screen and the parent page says so. Pip never reads Kreyòl with an English or French voice.

## Files

- `src/engine.js` — the math engine (items, answers, worked steps, misconception predictions, BKT, mastery, scheduling, placement).
- `src/content.js` — lesson text, hints and home activities.
- `src/explain.js` — plain-words worked examples: what the numbers mean, each step in words with the engine's number sentence, and a check (all of Grades 1–2 so far: 45 skills, C101–C114, PV01–PV12, AS01–AS12, AS17, MU01–MU02, WP01–WP03 and T3; other skills keep the engine's steps).
- `src/app.html` — the app shell and UI.
- `src/i18n.js` — translation engine: sentences become patterns with number, name and object slots, filled back in each language's style; also spoken-math wording and spoken-number parsing per language.
- `src/i18n/es.js`, `fr.js`, `ht.js`, `zh.js`, `ar.js` — about 2,220 translated patterns per language.
- `build.js` — inlines the engine and content into `dist/index.html`.
- `test/engine.test.js` — verification pipeline: 5,000 generated items per skill, checked for correct answers, constraints, distractors, misconception detection, worked steps; plus BKT, mastery, retention and placement tests.
- `test/features_test.py` — Fix Pip's mistake, Why did that work, Lantern Line, journal, accessibility of new screens, offline reload.
- `test/audio_test.py` — every sentence maps to recorded clips; every clip holds speech; the app plays Pip's clips.
- `test/e2e.py` — headless-browser walkthrough of the whole flow, including the lesson walkthrough and an automatic check that every number sentence, block count, ten-frame and group shown in the lesson pictures is correct.
- `test/separation_test.py` — secret pictures (set, mismatch, unlock, misses, grown-up help, change, turn off), answers landing only in the active child's record, hashed storage, unique ids, axe in light and dark, translations in all five languages.
- `test/living_test.py` — Pip's moods, capoeira, flyover, galaxy dive and piano and one-shot reactions to each learning moment, sound channels and parent controls, confetti and its cleanup, badges and Pip's look, math pictures that animate changes, Still and reduced motion (no running animations), axe in light and dark, translations of every new word.
- `test/explain.test.js` — the plain-words lessons (`src/explain.js`): for thousands of generated questions per skill, each plain step gives the same result as the engine step, every number sentence is true, sentences stay short, and no "borrow", "carry" or filler words appear.
- `test/discovery_test.py` — the Discovery Adventure: gentle and grade-aware starts, two kinds of question, the no-story follow-up, rest stops with break and resume, no grade shown to the child, the parent report and understanding states, the notice update before new answers are kept, axe in light and dark.
- `test/i18n_test.py` — walks the whole app in Spanish, French, Haitian Creole and Chinese at phone width, fails on any English left on screen, runs axe-core per language, and checks spoken output and voice parsing in each language.
- `narration/` — Pip's chosen voice (`voice.json`) and `build-manifest.js`, which lists every clip Pip needs.

## Commands

```
node test/engine.test.js
node test/explain.test.js
node build.js
python3 test/e2e.py
python3 test/features_test.py
python3 test/audio_test.py
python3 test/i18n_test.py
python3 test/living_test.py
python3 test/separation_test.py
python3 test/discovery_test.py
```

Pip's recorded voice (English). Run after `node build.js` whenever Pip's wording changes, then rebuild and run the suites:

```
python3 narration/record.py                       # record only the clips the app needs and does not have yet
python3 narration/record.py --drop "P:old phrase"  # also remove clips that are no longer used
python3 narration/record.py --all                  # re-record everything after changing the voice in narration/voice.json (about 40 minutes)
python3 narration/record.py --say "Hi, I'm Pip!"   # try a sentence; writes narration/say.wav
```

It needs `pip install kokoro-onnx soundfile playwright`, ffmpeg, and the Kokoro v1.0 model files
(`kokoro-v1.0.onnx`, `voices-v1.0.bin` from the kokoro-onnx GitHub release "model-files-v1.0") in `~/kokoro-model`
or `$KOKORO_MODEL_DIR`. It runs entirely on this machine.
