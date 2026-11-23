# Editing Tenbright

All of Tenbright's source is in this repository. GitHub builds and tests every change automatically, and you can undo any change.

## Three ways to make a change

| Way | Best for | How |
|---|---|---|
| **1. Ask Claude** (recommended for most changes) | Anything: features, wording, translations, Pip, art, fixes | In Claude (chat, or Claude Code on the web or desktop with this repo attached), describe the change. Claude edits the source, runs every test, commits it here and republishes your private link. |
| **2. Edit in your browser** | Small, exact changes: a colour, a number, a typo in a lesson | Open the repo on github.com, press the **`.`** key (this opens the editor at github.dev), edit a file, then commit from the Source Control panel on the left. Or open a file and click the pencil icon. |
| **3. Edit on your computer** | Bigger hands-on work | Clone the repo with GitHub Desktop, open it in VS Code or Claude Code, then run `python3 test/run_all.py` from `source/tenbright-mvp/`. |

## After every change: check the result

1. Open the **Actions** tab on GitHub. Each change gets a **Build and test** run, which takes about 5 to 10 minutes.
   - A green tick means the change built and every test passed.
   - A red X means something broke. Open the run to see which test failed, then ask Claude to fix it or undo your change.
2. To try the app, open the run, scroll down to **Artifacts**, download **tenbright-app**, unzip it and open `index.html`.
3. To undo a change, open the file's **History** on GitHub and revert the commit, or ask Claude to revert it.

The checks are strict on purpose:
- The build fails if any outside web address gets into the app, which protects the COPPA rule that no child data leaves the device.
- 103 skills × 5,000 generated problems are checked for correct math.
- Accessibility is checked in light and dark mode and in every language.

## Where things live

Edit only inside `source/tenbright-mvp/src/`. The `app/` folder is the built copy of the live version: don't edit it, because it is regenerated from `src/`.

| To change… | File | Look for |
|---|---|---|
| Colours, fonts, corner rounding | `src/app.html` | `:root {` near the top. The dark-mode colours follow right after it. |
| Lesson text, hints, strategies and parent tips for each skill | `src/content.js` | The skill code, e.g. `PV03:` |
| Names and objects in word problems | `src/engine.js` | `const NAMES =` and `const THINGS =` |
| Review spacing (7 / 30 / 90 days) | `src/engine.js` | `CHECK_DAYS` |
| Placement skills | `src/engine.js` | `PLACEMENT_ANCHORS` |
| Badges | `src/app.html` | `const BADGES` |
| Pip's flyover timing (22–45 s) and idle piano (20 s) | `src/app.html` | `22000`, `23000` and `20000` near `flyby()` |
| Galaxy dive chance (34%) and minimum gap (20 s) | `src/app.html` | `Math.random() < 0.34` |
| Pip's picture | `src/art/pip-hero.webp` | Replace it with a same-shape transparent image |
| Scene pictures | `src/art/welcome*.webp`, `celebrate*`, `journal*` | Keep the file names; each scene has several sizes and a `-depth` map |
| Translations | `src/i18n/es.js`, `fr.js`, `ht.js`, `zh.js`, `ar.js` | The English sentence, then its translation |
| Pip's recorded English voice | `narration/` | Recorded with Kokoro. Ask Claude to record new lines |

### Changing what Pip or the app says

Every English sentence is also translated into five languages and recorded in Pip's voice. If you change English wording yourself:
- the other languages keep showing the old sentence's translation, or English, until it is translated;
- Pip reads the new sentence with the device's voice instead of his recorded voice;
- the translation test will flag the change.

For wording changes, the easiest path is to ask Claude. Claude updates all six languages and re-records Pip in the same change.

### Rules every change must keep

`CLAUDE.md` lists the hard rules. The most important:
- No outside web addresses, analytics or trackers.
- Children never type free text.
- All math comes from the engine, never from AI.
- Mistakes are "clues": no red X and no buzzer.
- Child buttons are at least 64 px.
