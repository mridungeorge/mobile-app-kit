# Design and motion language

[← back to the README](../README.md)

One language, distilled from Rune, applied across every stack:

- **Surfaces** — neutral and low-chroma. Dark `#121314` / card `#1c1d20`; light `#f0f1f4` / `#ffffff`. Depth comes from a 5–10% hairline border, not a large shadow.
- **Type** — small and tight. Body 13–14, label 12/500, section 11.5/600, negative tracking on display sizes.
- **Space** — 4 / 8 / 12 / 16 / 24. Radii 4 / 6 / 8 / 10 / 12.
- **Colour** — one accent per app, on the primary action and one data highlight. Everything else is neutral.
- **Motion** — springs, not arbitrary easing: `snap 250ms`, `settle 300ms`, `reflow 400ms`, `glide 320ms`, `morph 300ms/bounce .16`. Utilities never exceed 400ms. On native these are Compose `spring()`/`tween()` and SwiftUI `.spring(response:dampingFraction:)`; on web/Capacitor they are GSAP eases.
- **Reduce Motion** — travel is replaced with a 150ms fade. No screen is ever unreadable with animation off.

Motion is spent against a **budget** set by the profile, not a quota: `restrained` for fintech, health records, B2B and utilities; `standard` for productivity, commerce, social and travel; `expressive` for games, media, kids and camera. Expressive motion never reaches a checkout, a medical record or a data-entry form.

[`references/component-map.md`](../skills/mobile-app-factory/references/component-map.md) maps every Rune component to Jetpack Compose, SwiftUI, Flutter and React Native, so the same screen spec builds anywhere instead of being re-invented per platform.

The full token set and the reasoning behind it are in [`references/design-language.md`](../skills/mobile-app-factory/references/design-language.md); the native implementation of the springs is in [`native-motion.md`](../skills/motion-experiences/references/native-motion.md).
