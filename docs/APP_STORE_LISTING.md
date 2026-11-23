# Tenbright: App Store listing and submission pack (iOS v1.0)

Status: **draft, Nov 23, 2026.** Nothing here has been submitted. Items marked **OWNER** are decisions or actions only Smith can take.
The legal text (privacy notice, terms, privacy policy URL) needs the privacy attorney's sign-off before submission.

---

## 1. Listing fields (App Store Connect → App Information / Version)

| Field | Limit | Draft | Notes |
|---|---|---|---|
| App name | 30 | **Tenbright: Math with Pip** (24) | Depends on the USPTO search (open item F13). Apple also rejects a name already used by another app. Check "Tenbright" in App Store Connect when you reserve the name. |
| Subtitle | 30 | **Grades 1–5 math, step by step** (29) | |
| Primary category | – | **Education** | |
| Kids Category | – | **Yes. Age band: 6–8** (recommended) | **OWNER.** Apple allows one band: 5 and under, 6–8 or 9–11. The core content (Grades 1–3, 66 of 103 skills) and the G3 test group (ages 7–9) fit 6–8. Once you choose Kids, the app must keep meeting Kids rules even if you change category later (Guideline 1.3). |
| Price | – | **Free, no in-app purchases** | Matches the "no purchases" terms. |
| Age rating | – | Expected **4+** | Questionnaire answers are in §4. |
| Privacy policy URL | – | **BLOCKER**: needs a public web page | Required for every Kids app (Guideline 5.1.4). The in-app notice must be posted at a public https URL, and it needs the operator details first. |
| Support URL | – | **BLOCKER**: needs a public web page with contact details | |
| Marketing URL | – | optional | |
| Copyright | – | "© 2026 [operator legal name]" | **OWNER**: legal entity name. |
| Bundle ID | – | `org.gmia.tenbright` (placeholder) | **OWNER**: confirm before you register it. A bundle ID can never be changed after the first upload. Use a reverse domain you control. |
| SKU | – | `TENBRIGHT-IOS-001` | Internal only. |

### Keywords (100 characters, comma-separated, no spaces after commas)

```
math,kids,homeschool,fractions,multiplication,times tables,place value,addition,subtraction,decimals
```

The app name and subtitle words are already indexed, so they are not repeated here.

### Promotional text (170; can be changed without a new build)

> Step-by-step math with Pip for Grades 1 to 5. Lessons you can see, practice that adapts, and checks after 7, 30 and 90 days. No ads, no purchases, nothing leaves your device.

### Description (draft, about 1,900 of 4,000 characters)

> Tenbright is a math app for children in Grades 1 to 5, with Pip as their guide. Pip shows each idea step by step with pictures, then your child practices it, and Tenbright checks again after 7, 30 and 90 days that the skill has stayed.
>
> WHAT YOUR CHILD DOES
> • Learns 103 skills from the Common Core standards, from counting to 120 up to multiplying fractions and decimals.
> • Sees each method worked out with base-ten blocks, place-value charts, number lines, ten-frames, bar models, arrays and a soroban.
> • Works problems on paper with Pip, one step at a time.
> • Finds Pip's mistakes and explains why a method works.
> • Warms up with the Lantern Line number-line game.
>
> HOW IT ADAPTS
> A short placement check finds where your child is. After that, Pip picks the next activity: first help with mix-ups, then skills that are due for review, then new skills. Wrong answers are treated as clues. Your child gets a hint that matches the mistake, never a red X.
>
> FOR PARENTS
> • You set Tenbright up and give consent before any child profile exists.
> • A parent page shows what your child understands, what they are working on, why it may be hard, and a 10-minute activity to try at home.
> • Several children can share one device, each with their own record, and secret pictures stop siblings opening each other's profiles.
> • Sound and animation settings, with a Still mode. Tenbright follows your device's reduced-motion setting.
>
> PRIVACY
> Everything stays on this device. Tenbright has no accounts, ads, analytics, trackers or in-app purchases, and sends nothing to us or anyone else. Children never type free text, and the app asks for no real name, photo, location or contacts. You can see everything stored, or erase it, from the parent page.
>
> LANGUAGES
> English, Spanish (Latin America), French, Haitian Creole, Traditional Chinese and Arabic (right to left). Translations are being reviewed by native speakers.
>
> Tenbright supports your child's learning. It does not replace a teacher, and it promises no particular test results.

The description makes no IQ, "brain training" or outcome claims (hard rule 7). **OWNER**: delete the line "Translations are being reviewed by native speakers" once that review is done, or launch in English only.

### What's New (v1.0)
> First release.

---

## 2. App Privacy ("nutrition label")

Answer **"No, we do not collect data from this app."** The label then shows **Data Not Collected**.

This is accurate because Apple counts data as "collected" only when it is sent off the device. Tenbright stores everything locally, has no network code, and the build fails if any outside URL appears in the page.
If you ever add sync or a backend (open item 4), update this label **before** that build ships.

Tracking: **No.** The privacy manifest (`ios-app/ios/App/App/PrivacyInfo.xcprivacy`) declares no tracking, no collected data types and no tracking domains.

---

## 3. Kids Category compliance (Guidelines 1.3 and 5.1.4, page dated Oct 16, 2026)

| Requirement | Tenbright | Evidence |
|---|---|---|
| No links out of the app, purchases or other distractions unless behind a parental gate | **Met.** There are no links out and no purchases. Parent features sit behind an adult gate and a grown-ups PIN. | `build.js` refuses any `http(s)://` URL. `ios-app/scripts/check-web.js` checks again before every sync. `allowNavigation` is empty. |
| No sending PII or device information to third parties | **Met.** Nothing is sent anywhere. | No network code, no SDKs. Only `@capacitor/core` and `@capacitor/ios` are included. |
| No third-party analytics or advertising | **Met.** | Same as above. |
| Privacy policy, and compliance with children's privacy laws (COPPA, GDPR) | **Blocked**: attorney sign-off and the public URL | Open items 1 and 3. |
| Birth date and parental contact asked for only to comply with the law | **Met.** The adult gate's birth year is not stored. The child's birth year is part of the consented record. | Privacy notice. |

**Risk to plan for: Guideline 4.2 (Minimum Functionality).** Apps built on a web view are sometimes rejected as "a repackaged website". Tenbright's case is strong: it is fully offline, all content is in the app, it has an adaptive engine, recorded narration, multiple child profiles and a parent dashboard, and none of it loads from a website.
Make this explicit in the review notes (§5). If it is rejected anyway, the usual fix is a native feature that makes sense for the app, such as storing records in native storage. Reply to App Review before you rebuild.

---

## 4. Age rating questionnaire (2025 system: 4+, 9+, 13+, 16+, 18+)

Every content category: **None.**
- Violence: none. Pip's capoeira is a non-contact dance and martial art, with no opponents.
- Unrestricted web access: **No.**
- User-generated content, messaging or chat: **No.**
- Advertising: **No.**
- In-app controls (parental controls): **Yes.** Parents control settings, profiles and data behind a PIN.
- AI features: the app has no generative AI at run time. Pip's recorded voice was made with an AI voice model and ships as audio files in the app. The privacy notice already says so.
- Medical or wellness: **No.**
- Gambling, contests, loot boxes: **No.**

The expected result is **4+**.

---

## 5. Notes for App Review (paste into "Notes")

> Tenbright is a math-learning app for children in Grades 1–5, built for the Kids Category (ages 6–8). It runs fully offline. Everything is bundled in the app, nothing is loaded from a website, and it makes no network requests at all. It has no accounts, ads, analytics, third-party SDKs or in-app purchases.
>
> Quickest look: on the first screen, tap "Try the sample learner". Enter any birth year that makes you 18 or older (the year is not stored). This opens a made-up learner with a week of progress.
>
> Full setup: tap "Set up as a parent". Pass the adult check, agree to the consent items, and choose any 4-digit PIN. Then add a child (nickname only) and Pip runs a short placement check. The parent page, reached through the grown-ups button and the PIN, shows the progress report, settings, "See everything stored" and data deletion.
>
> Native features: the engine adapts to each child, with spaced-repetition reviews at 7, 30 and 90 days. Narration is recorded audio stored in the app. Each child on a shared device has a separate profile that can be locked with secret pictures, and the parent area is protected by a PIN. The app has a larger-text option and follows the system Reduce Motion setting.

**OWNER**: Apple may contact you about the review, so the account must have a phone number and email that you check.

---

## 6. Screenshots

Required sets (App Store Connect scales them down for smaller devices):
- **iPhone 6.9"**: 1320 × 2868 portrait. 3 to 10 images.
- **iPad 13"**: 2064 × 2752 portrait. Required because the app runs on iPad (device family 1,2).

Draft screenshots are in `docs/store-screenshots/`. They were taken from the store build at the exact pixel sizes, using the sample learner. Kids Category screenshots must show the real app; these do.
**OWNER**: replace them after the final art is in (open item 5). The current Pip art has unconfirmed rights.

---

## 7. Submission checklist (in order)

1. **OWNER: legal entity.** You need it for the privacy notice (F12) and for Apple Developer Program enrollment as an **Organization**. Organization enrollment needs a D-U-N-S number (free, can take up to about 2 weeks), the legal entity name and a website. An Individual account would show your personal name as the seller. For a children's app, enroll as an organization. Fee: **US$99 per year** (spend approval is yours).
2. **OWNER: trademark search** for "Tenbright" (F13), before you reserve the App Store name.
3. **OWNER and attorney:** final privacy notice and terms. Replace the two `[... to be added before public launch]` placeholders and the "preview" wording. `node build.js --store` refuses to build until they are gone. It lists the 7 remaining blockers.
4. Publish the privacy policy and support pages at public https URLs.
5. **OWNER: rights to the Pip art** (open item 5). Also make a 1024 × 1024 app icon master. The current icon is the 512 px glowmoth PWA icon scaled up, which is fine for TestFlight but soft at full size.
6. On a Mac with **Xcode 26 or later** (Apple has required the iOS 26 SDK for uploads since Apr 28, 2026): follow `ios-app/README.md`. Sign with the organization team, Archive, then upload.
7. TestFlight: install on a real iPhone and iPad and run the device checks in `ios-app/README.md` §4.
8. Fill in App Store Connect from §1 to §6, answer export compliance (already declared in Info.plist: no non-exempt encryption), then submit.

### Legal items to put to the attorney (not decided here)
- **Texas SB 2420 (App Store Accountability Act)** has been enforceable since Jun 4, 2026, after the Fifth Circuit stayed the injunction pending appeal. Apple asks developers to adopt the **Declared Age Range API**. Ask whether a free, account-less app with no data collection has obligations under it, and under the Utah and Louisiana equivalents. If it does, the work is a small native plugin.
- **Amended COPPA Rule** (compliance date Apr 22, 2026): confirm that on-device consent is enough while no personal information reaches the operator, and that the notice text meets the amended requirements.
