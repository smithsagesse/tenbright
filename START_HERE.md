# Moving Tenbright (GMIA) into Claude Code on your desktop

This folder holds everything Claude Code needs to pick up where the claude.ai chat left off:

- **`CLAUDE.md`** is the project's memory. Claude Code reads it automatically every session. It covers what Tenbright is,
  the current state (v22), the rules that must not break (COPPA, no outside data, no AI-generated math) and the open items.
- **`app/`** is the latest working app (v22, the superhero Pip version), downloaded from your live link.
  Open `app/index.html` in a browser to see it.
- **`docs/`** holds all 8 planning and legal documents (as PDF and as text), plus:
  - `DECISIONS_AND_HISTORY.md`: what was decided in the 92-turn conversation, in order;
  - `LINKS.md`: links to the live app and to every document.
- **`source/`** is where the full source code goes. Step 2 below explains how; it takes about 2 minutes.

Claude Code can't import a chat word for word. `CLAUDE.md` and the history file carry everything it needs to continue the work.

---

## Step 1: Unzip this folder somewhere permanent

Move `Tenbright-ClaudeCode.zip` to a permanent place, then unzip it. For example:
- **Mac:** `Documents/Tenbright`
- **Windows:** `Documents\Tenbright`

Don't leave it in Downloads.

## Step 2: Add the source code (important)

The editable source (code, build script, tests, translations) lives in the file `tenbright-mvp.zip`.
It was attached to the **last message** of the original chat.

1. On your computer, open https://claude.ai/chat/1d8f02fd-906c-4fa5-ae9a-a66610593d22
2. Scroll to the very bottom, to the message about superhero Pip, capoeira and the galaxy dive.
3. Click the `tenbright-mvp.zip` attachment to download it.
4. Unzip it into this folder's `source/` folder. You should then have `source/tenbright-mvp/src/app.html`.

If you skip this step, Claude Code can still work from `app/`. Big changes are safer with the source.

## Step 3: Install the Claude desktop app (if you don't have it)

1. Go to **claude.com/download** and install the app for Mac or Windows.
2. Open it and sign in with the same account you use on claude.ai. Claude Code requires a paid plan
   (Pro, Max, Team or Enterprise).
3. **Windows only:** install Git from **git-scm.com/downloads/win**, then fully quit and reopen the Claude app.
   The Code tab needs Git on Windows.

## Step 4: Open the project in Claude Code

1. In the Claude desktop app, click the **Code** tab at the top.
2. Under the prompt box, choose a **Local** environment.
3. Click the folder control, choose **Open folder** and select your `Tenbright` folder (the one containing `CLAUDE.md`).

## Step 5: Paste this as your first message

> Read CLAUDE.md, docs/DECISIONS_AND_HISTORY.md and source/PUT_SOURCE_ZIP_HERE.md. Confirm you understand the project and its rules.
> Check whether the source is in source/. If it is, install what the build and tests need, run `node build.js` and every test suite,
> and report the results. Then serve app/ locally and tell me the address so I can try it. Don't change any code yet.

Claude Code will ask permission before running commands or installing anything. Read each request and click Allow.
To build and test, it needs **Node.js** and **Python with Playwright**. If they're missing, it will offer to install them.

## Step 6: Continue the work

These are the next steps already on the table:
- **App Store prep:** a store build with the preview items hidden, the iOS project and a store listing.
  Note that iOS builds require a Mac with Xcode.
- **Launch blockers that need you:**
  - your legal entity name, address, email and phone for the privacy notice;
  - a USPTO trademark search for "Tenbright";
  - the privacy attorney's sign-off;
  - confirming you own the rights to the superhero Pip art.
- Native-speaker review of the 5 translations.
- Gate G3 testing with 5–8 children.

Tell Claude Code which one to start with.

## Optional: put it under version control (recommended)

Ask Claude Code: *"Initialize a git repository here, make the first commit, and help me push it to a new private GitHub repo."*
This gives you a full history, so any change can be undone.

---

### Good to know

- **The original chat still works.** Everything there stays. You can keep using it for documents and planning, and use
  Claude Code for building. If you make app changes in the old chat, download the new `tenbright-mvp.zip` again and
  replace the copy in `source/`.
- **Your live app link doesn't change.** Claude Code works on your computer. Publishing a new version for families
  (your own website, or app stores) is a step you approve.
- The documents in `docs/` are copies from Nov 10, 2026. The live versions are in `docs/LINKS.md`.
