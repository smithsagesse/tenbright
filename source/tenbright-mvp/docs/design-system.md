# Tenbright design system 2

This system is built on the `apple-design` skill (Apple's WWDC design guidance, translated for the web) and keeps Tenbright's brand: the lantern gold, the night-sky "Kingdom" and Pip. The code lives in `src/app.html`, in the `:root` tokens and the "Design system 2 — components" block.

## Foundations

- **Type**
  - The font is the system's rounded face (`ui-rounded`, which is SF Pro Rounded on iPhone, iPad and Mac). Nunito is embedded for other devices, and Cairo for Arabic.
  - Hierarchy comes from weight, size and leading used together.
  - Tracking depends on size:
    - large titles −0.022 to −0.03 em;
    - headlines −0.012 em;
    - body −0.01 em;
    - captions 0.
  - Body text is 17 px, the iOS default, and layouts scale with "Larger text".
- **Colour**
  - Grown-up screens use the iOS grouped style: `#F2F2F7` page, white cards, `#1C1C1E` ink. In dark mode: black page, `#1C1C1E` cards, white ink.
  - The accent blue is `#0066D9`. White text on it measures 5.4:1, which passes AA. Apple's `#007AFF` measures only 4.0:1, so it is not used.
  - Green, orange and red are darkened variants that keep AA contrast.
  - Child screens use a deep night-sky gradient. The lantern gold (`#F4A425`) marks the one main action on each screen.
- **Materials**
  - Child controls are translucent glass: a 10% white fill, a background blur, a light top edge and a fine border.
  - The grown-ups navigation bar is a translucent material that content scrolls under. The bar background reaches the window edges.
  - The sheet a question sits on is solid, with a deep shadow, so the math is always on a calm surface.
  - Never use a light glass on a light glass.
- **Shape**
  - Corner radii are 12 (fields), 14 (buttons), 18 (cards), 20 to 28 (child sheets) and capsules for child buttons.
- **Press feedback**
  - Every button responds on pointer-down: a scale to 0.97 (keypads 0.94) within 60 ms, released over 140 ms with an ease-out.
  - On iPhone, a passive `touchstart` listener makes `:active` fire on touch.
- **Controls**
  - Text fields: iOS filled fields with a blue focus ring.
  - Settings: on/off switches.
  - Consent statements: round checkmarks, because agreeing is not a setting.
  - Sliders: iOS-style, with a white thumb and a thin track.
  - Grown-ups PIN: a round passcode keypad.

## Fitting every screen

| Width | Layout |
|---|---|
| Phones (≤ 600 px) | Single column, with 52 to 64 px child buttons. On practice questions Pip sits beside the answer box, so the keypad and Check stay on screen, and the top bar stays on one line. |
| Small tablets and large phones (601–700 px) | Single column at full size. |
| Tablets (701–1099 px) | The question and the keypad sit side by side. Map regions use two columns. |
| Computers (≥ 1100 px) | Content is centred at most 1,120 px wide on child screens and 880 px on grown-up pages. Map regions use four columns. |
| Short windows (≤ 560 px tall) | Phones held sideways get a smaller keypad and Pip is hidden, so Check stays reachable. |

Safe areas (notches, home indicator) are respected on every edge.

## Accessibility

- **Contrast:** axe-core WCAG 2.2 AA passes in light and dark on every screen.
- **Reduced motion:** the device setting, or the parent's "Still", gives cross-fades only (see `animation-system.md`).
- **Reduced transparency:** every glass surface and the navigation bar become solid.
- **More contrast:** controls get solid 2 px borders and muted text becomes full ink.
- **Right-to-left:** Arabic mirrors the layout; math, keypads and switches are handled separately.
