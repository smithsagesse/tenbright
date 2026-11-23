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

## Current state (v22, Nov 10, 2026)

The working MVP is a single-page HTML/JS app plus assets. The live private link is
https://claude.ai/artifact/DzUkbiyZdo9DFxotvogjHT

- A **deterministic math engine**: all problems, answers and worked steps come from code, never from an LLM.
  It covers 103 skills across Grades 1–5, with a misconception library (wrong-answer patterns mapped to "clue" feedback).
- **Adaptive placement** checks 8 anchor skills in at most 25 items. **Spaced-repetition mastery** rechecks each skill
  at 7, 30 and 90 days.
- **Lessons:** illustrated step-by-step walkthroughs with Pip and "Work it with Pip" guided practice. Models include
  base-ten blocks, place-value charts, number lines, ten-frames, bar models, arrays and an interactive soroban.
- **Lantern Line**, a number-line warm-up game, plus a child journal and a parent dashboard.
- **Narration:** free, on-device **Kokoro TTS**, voice `af_heart`, pre-recorded to `audio/pip-*.mp3`.
  An earlier ElevenLabs "Simone" voice was dropped because the paid plan was insufficient.
- **Voice answers** (opt-in) use the on-device Web Speech API. Children write problems on paper while Pip
  works them step by step, then answer by voice.
- **Languages:** English, Spanish (Latin America), French, Haitian Creole, Traditional Chinese (Taiwan)
  and Modern Standard Arabic, with full RTL, an embedded Cairo font and LTR isolation for math. All translations are
  machine-drafted and need native-speaker review (`tenbright-translation-review.xlsx` in the source zip).
- **"Living Pip"** animation: one character rig with moods, capoeira on correct answers (aú, meia-lua, bananeira
  plus a berimbau sound), flyovers, a galaxy dive (about 1 in 3 correct answers, at most once per 20 s) and piano when idle.
  Settings are Full, Gentle or Still, and the app respects OS reduced-motion.
- **Badges:** 8 badges that unlock Pip accessories. Rewards are earned only and never sold.
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
app/                      ← the latest BUILT app (v22), downloaded from the live artifact
  index.html              ← the whole app (about 1.7 MB: inline JS, CSS, embedded fonts and translations)
  sw.js, manifest.webmanifest, icon-*.png, art/, audio/
source/tenbright-mvp/     ← the full v22 source (build.js, src/, test/, narration/); dist/ and dist-store/ are build output, not committed
ios-app/                  ← iOS app (Capacitor 8.6.0, SPM): native shell around dist-store/. See ios-app/README.md
docs/                     ← planning and legal documents (Phases 1–3, compliance, accounts plan, art brief, release plan)
docs/DECISIONS_AND_HISTORY.md, docs/LINKS.md
docs/APP_STORE_LISTING.md ← App Store listing, privacy label, Kids Category check, review notes, submission checklist
docs/store-screenshots/   ← iPhone 6.9" and iPad 13" screenshots (made by ios-app/scripts/screenshots.py)
```

### The built app vs. the real source

`app/index.html` is the **built output**. Edit it only for small fixes, and only if the source zip is missing.
Note that line 1 of `app/index.html` carries a small hosting header added by claude.ai. It is harmless.

The **real project** is `source/tenbright-mvp/` (from `tenbright-mvp.zip`, the last file attached in the original chat, v22).
The owner uploaded it without the art and audio; `src/art/*.webp` and `narration/audio/*.mp3` were restored from `app/`.
On Nov 21, 2026 `node build.js` reproduced the live v22 page byte for byte (apart from the claude.ai hosting wrapper),
with identical sw.js, manifest, icons, art and audio. It contains:
- `src/app.html`: the main source. Also `src/i18n/*.js` (es, fr, ht, zh, ar), `src/art/`, `narration/audio/map.json`.
- `build.js`: run `node build.js` to produce `dist/index.html` (and `dist/test.html` with test hooks).
  `node build.js --store` produces the App Store build in `dist-store/` (the `STORE` flag in `src/app.html` hides the
  preview badge, the demo clock and browser-only wording). It **refuses to build** while launch blockers remain
  (privacy-notice placeholders, "preview" wording in the legal text); `--store --draft` builds anyway, for TestFlight only.
  Test suites take `DIST=dist-store` to run against the store build.
- Tests: `node test/engine.test.js` (math engine, millions of generated checks); Playwright suites
  `test/e2e.py`, `test/features_test.py`, `test/audio_test.py`, `test/living_test.py`,
  `test/separation_test.py` and `test/i18n_test.py` (axe-core accessibility in light and dark, all languages; `LANGS=en,ar` limits the run).
- `docs/animation-system.md` and `README.md`.

Make changes in `source/tenbright-mvp/src/`, rebuild, run every suite, then copy `dist/` into `app/` for release.

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
7. **App Store prep: done Nov 23, 2026** (store build, iOS project, listing draft). Remaining submission steps are in
   `docs/APP_STORE_LISTING.md` §7: Apple Developer enrollment as an organization, bundle ID, Kids age band,
   public privacy-policy and support URLs, a 1024 px icon master, and the archive on a Mac with Xcode 26 or later.
8. **Gate G3 usability sessions** with 5–8 children aged 7–9 (Phase 3 test plan), planned through Gwinnett County homeschool co-ops.

## Working style the owner expects

He wants work that is business-focused, factual and no-nonsense, with thorough research. Lead with the result. Flag decisions that need him clearly.
Do not claim legal sign-off, hiring or payments. Those are his.
