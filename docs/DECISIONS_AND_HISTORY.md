# Tenbright / GMIA: decisions and history

A condensed record of the original claude.ai conversation, "Approval to proceed to phase 2"
(92 turns, Nov 3–10, 2026; https://claude.ai/chat/1d8f02fd-906c-4fa5-ae9a-a66610593d22).
The full planning documents are in this folder. This file records **what was decided, by whom, and why**.

## 1. Mandate

Smith wrote a master directive for GMIA. It describes an AI-powered, lifelong math, mental-math (Vedic, soroban) and
financial-literacy platform, built in four phases with a human approval gate after each:
Phase 1 Strategic Foundation → Phase 2 Educational Blueprint → Phase 3 Product Design → Phase 4 MVP.

## 2. Phase 1: Strategic Foundation (approved Nov 3)

Docs: `GMIA_-_Phase_1_Strategic_Foundation.md`, `GMIA_Phase_1_Executive_Package.txt`.

- **Beachhead:** US families and homeschoolers with children aged 7–10 (grades 2–4), web-first.
- **MVP strand:** place value → add/subtract → multiplication. Built narrow and end to end before anything else.
  The 8-stage lifelong vision is kept as architecture, not scope.
- **No ads and no in-game purchases.** Family subscription model.
- **Competitors reviewed:** Prodigy, Khan Academy/Khanmigo, DreamBox, Beast Academy, Synthesis, IXL, Zearn, Mathseeds and soroban apps.
- **Evidence register:** retrieval and spaced practice, interleaving, mastery learning and CPA are well supported. Soroban has
  limited evidence and is treated as an optional track. "Vedic" techniques are taught for their math, with no claim of Vedic origin
  (the historical claim is rejected by S. G. Dani and others). Matching instruction to learning styles is **not supported** and is not used.
- **Rules:** speed never gates understanding. No IQ, brain or "intelligence" claims. Numerology appears only as cultural history.
- **Two independent axes per learner:** age band (caregiver-entered birth year) sets interface and safeguards;
  mastery position sets what unlocks.
- **Lean budget assumptions:** art about $8–25k, privacy attorney about $5–15k.

## 3. Phase 2: Educational Blueprint (approved Nov 3)

Doc: `GMIA_-_Phase_2_Educational_Blueprint.txt`.

- A 52-skill competency map for grades 2–3, with prerequisites, a misconception library and hint ladders.
  It was later expanded to **103 skills** covering Grades 1–5.
- Mastery engine spec: thresholds, retention checks at 7, 30 and 90 days, and evidence dimensions.
- Approved: a review budget of about $5–9k and a lean, founder-led build path. Sharing the engine with **Piano Quest** (Smith's piano app
  for his son) stays an open option, so the learner and parent models are generic.

## 4. Phase 3: Product Design (approved Nov 3)

Doc: `GMIA_-_Phase_3_Product_Design.txt`. Design artifacts: Tenbright Design System and Tenbright Brand and Screens (see `LINKS.md`).

- **Name:** "Tenbright" ("ten little lights make one bright idea"). Rejected: Tenfold and Numtopia (taken). Backups: Beadlight and Numberwood.
  Needs a USPTO search in Class 9 and Class 41 before final logo spend.
- **Mascot:** Pip the glowmoth. Ten beads make a lantern and ten lanterns make a tower, so the world itself teaches place value.
  Supporting cast: Marta the Mapkeeper, the Rounders, and Captain Carry and Lieutenant Lend.
- **Palette and type:** the "night lantern" palette, with Nunito and Atkinson Hyperlegible. Cairo was added later for Arabic.
- **14 MVP screens:** 8 for the child and 6 for the parent. Child targets are at least 64 px. Audio-first, with no child free text.
- **Not used, by design:** streaks, loot boxes, leaderboards, timers on ordinary practice, notifications to the child, and purchasable items.
- **Gate G3 test plan:** 5–8 children aged 7–9 with parents, in Gwinnett County homeschool co-ops, targeted for Feb 2027. It passes if
  4 of 5 criteria are met.

## 5. Phase 4: MVP build (Nov 3 onward)

- **Slice 1:** 13 skills, a 12-item placement, the Kingdom map, parent report and sample learner "Maya" (grown-ups PIN 1234 for the
  sample, with a "move the clock 7 days" demo). The engine is tested with 5,000 generated questions per skill.
- **Then:** all 52 skills, 21 misconception patterns, full adaptive placement (8 anchors, at most 25 items), number lines,
  ten-frames and bar models (bar models appear only as a hint).
- **Accounts, consent and sync plan** drafted for the attorney (doc in this folder). Its recommendations are "email plus" consent,
  parent-only accounts, and an event-log sync to managed Postgres with row-level security.

## 6. Smith's "act as the best attorney + commission the best illustrator + release" request

Claude stated plainly that it cannot sign contracts, pay anyone or give legal sign-off. Instead it delivered:
- **Compliance Review** (doc): 13 findings, 11 fixed in code. Key fixes:
  - F1: consent bypass through the sample learner.
  - F2: Google Fonts leaking IP addresses. Fonts are now embedded, and the build fails on any outside URL.
  - F4: no adult gate.
  - F5: no privacy notice.
  - F6: no terms.
  - F7: no full data view.
  - F8: no 13-month retention.
  - F9: plain-text PIN, now hashed.
  - F10: consent records lacked a version.
  - F11: a test hook shipped in production.
  Still open: F12 (operator contact details) and F13 (trademark search).
- **Art Commission Brief** (doc): agencies MB Artists, The Bright Agency and Anna Goodson, plus the studio Curious Media.
  Core scope about $12–25k and full scope about $30–50k. Full copyright assignment, no generative AI, and exact quantities in all math art.
- **Commissioning and Release Plan** (doc): an attorney shortlist (Phyllis Marcus at Hunton, Maneesha Mithal at Wilson Sonsini,
  and Kelley Drye's privacy team) and a fixed-fee review scope.

## 7. Feature requests after the MVP (Nov 4–10), in order

1. **Voice:** ElevenLabs "Simone" first. Smith's paid plan was insufficient, so the app switched to **free, on-device Kokoro TTS, voice `af_heart`**,
   recorded per sentence and phrase into `audio/pip-*.mp3`.
2. **Offline / installable PWA.**
3. **Grades 1, 4 and 5** added, with grade-level selection, new misconceptions and new visual models. This gives 103 skills.
4. **Every lesson illustrated step by step with Pip** ("Work it with Pip").
5. **Paper and voice mode:** the child writes the problem on paper, Pip works it step by step, and the child answers by voice
   (on-device Web Speech API, off unless enabled).
6. **Localization:** Spanish (Latin America), French, Haitian Creole, Traditional Chinese (Taiwan) and Arabic (full RTL).
   The translations are machine-drafted. A review workbook, `tenbright-translation-review.xlsx`, is in the source zip.
7. **Art:** AI-generated scene illustrations were upscaled 4× (Real-ESRGAN) and redrawn in a "hand-painted" style.
   At Smith's request they were made full-bleed, edge to edge, and given 3D parallax from MiDaS depth maps.
8. **"Living Mathematics Universe":** one reusable Pip rig with idle life and 10 moods, sound effects, confetti,
   8 badges with unlockable accessories, and parent controls for sound and animation (Full, Gentle or Still).
9. **Child separation:** "secret pictures" (3 of 9, hashed), on by default from the second child.
10. **Redesign** (late Nov 9). Claude then offered App Store prep as the next step.
11. **v22 (Nov 10):** Pip is redrawn as the **masked superhero boy** from Smith's image. He keeps the name Pip.
    Correct answers trigger **capoeira** (aú, meia-lua, bananeira, with a berimbau). He also does **flyovers**,
    a **galaxy dive** (a portal opens, he spins down, lands by the solved problem and flies back up) and **piano** when idle.
    Claude flagged that Smith must confirm rights to that character art before release.

## 8. Testing discipline (keep it)

Every change was verified before publishing with:
- the engine math-correctness suite (millions of checks);
- a Playwright end-to-end run at desktop and phone width, light and dark;
- axe-core accessibility in every language;
- audio-clip coverage;
- living-animation behavior;
- child separation;
- a check that the build contains no outside URL.

After each milestone, the live artifact was republished and `tenbright-mvp.zip` was rebuilt.

## 9. Related ventures (context only)

- **Piano Quest:** Smith's piano-learning app for his son. Engine sharing with Tenbright is still an open option.
