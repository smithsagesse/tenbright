# Tenbright iOS app

A native iOS shell (Capacitor 8.6.0, Swift Package Manager, no CocoaPods) around the offline **store build** of Tenbright.
There is no app code here: the app is `source/tenbright-mvp/`, built with `node build.js --store` into `dist-store/`,
and copied into the Xcode project by `cap sync`.

What is set:
- Bundle ID `org.gmia.tenbright` (**placeholder, confirm before registering; it can never change after the first upload**),
  version 1.0 (build 1), iPhone and iPad, iOS 15.0 or later, arm64.
- `PrivacyInfo.xcprivacy`: no tracking, no collected data, no tracking domains.
- `ITSAppUsesNonExemptEncryption = NO` (no export-compliance question at each upload).
- No plugins, no network permissions, no microphone or camera permission. Voice answers stay off in the iOS web view,
  because it cannot promise on-device speech recognition, so the microphone is never used.
- `allowNavigation` is empty, so the app cannot open outside pages (Kids Category: no links out).
- Icon and launch screen use the Tenbright glowmoth icon on `#1B2438`. The icon is the 512 px PWA icon scaled to 1024. Replace it with a true 1024 × 1024 master before release.

## 1. One-time setup (on a Mac)

Requires: macOS with **Xcode 26 or later** (Apple requires the iOS 26 SDK for uploads), Node.js 22 or later, and an Apple Developer Program membership.

```bash
cd ios-app
npm install
```

## 2. Build and open

```bash
npm run build:web
```

This refuses to build while launch blockers remain (privacy notice placeholders, "preview" wording). For a TestFlight-only internal build, use this instead:

```bash
npm run build:web:draft
```

Then copy the build into the Xcode project and open it:

```bash
npm run sync
```

```bash
npm run open
```

`npm run sync` first runs `scripts/check-web.js`. It refuses a build that is not a store build, contains any outside URL, or still has self-test code.

In Xcode: select the **App** target → Signing & Capabilities → choose your team. Then Product → Archive → Distribute App → App Store Connect.

Every release: rebuild the web app, `npm run sync`, increase **Build** (CURRENT_PROJECT_VERSION) and, for user-visible releases, **Version** (MARKETING_VERSION).

## 3. Do not change

- `server.hostname` / `iosScheme` (Capacitor defaults: `capacitor://localhost`). Children's records live in the web view's
  local storage for that origin. Changing it in an update would make every family's progress disappear.
- The Kids Category rules. Once the app is in Kids, every later update must keep meeting them (Guideline 1.3).

## 4. Device checks before submission (TestFlight, real iPhone and iPad)

1. First launch with flight mode on: the app works fully offline, and Pip's voice plays.
2. Adult gate → consent → PIN → add a child → placement → lesson → practice, in portrait and landscape.
3. Quit and relaunch: the child's progress is still there. Re-check after **8+ days** without opening the app.
   The 7-day storage cap applies to Safari, not app web views, but some developers have reported web-view data loss. If it ever happens, mirror records into native storage (Capacitor Preferences) in v1.1.
4. Settings → Accessibility: Reduce Motion on → Pip stays still. Larger text option works.
5. Each language, including Arabic right to left: text fits on iPhone SE width.
6. The parent page "See everything stored" and "Erase everything" work. Deleting the app removes all data.
7. Voice answers show as unavailable on the grown-ups page, and no microphone prompt ever appears.
8. No outside page can open from anywhere in the app.
