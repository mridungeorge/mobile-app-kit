# Design Language

Derived from [Rune](https://github.com/anomalyco/rune) (`crates/rune/src/tok.rs`, `crates/rune-motion/src/tokens.rs`, `crates/rune-kit`). Rune is MIT-licensed (© 2026 Anomaly); this file is a distillation of its design decisions for mobile, not a copy of its source. Rune is a GPU-native UI framework built for 120 Hz desktop and mobile; its design system is worth stealing because it is **quiet, dense, and spring-driven** rather than gradient-heavy.

## Contents
1. Five principles
2. Colour
3. Type
4. Space, radius, elevation
5. Component anatomy
6. Motion system
7. Anti-patterns
8. Adapting to Material/iOS conventions

---

## 1. Five principles

1. **Neutral by default, one accent.** A screen should read as one colour family plus a single accent used for the primary action and one data highlight. Multiple accents = assembled, not designed.
2. **Hairlines, not shadows.** Separation comes from a 5–10% border or a separator line. Shadows are reserved for genuinely floating layers (sheets, popovers) and stay under 16px blur at mobile sizes.
3. **Dense but breathable.** 13–14px body with 4/8/12/16/24 spacing. Mobile screens hold more than web screens think they can, as long as alignment is strict.
4. **Motion confirms, never entertains.** Springs arrive and stop. Utilities ≤ 400ms. One expressive flourish per screen, usually the hero or the primary CTA.
5. **Toolbar-grade contrast.** Text at 4.5:1 minimum, secondary text no lighter than ~55% luminance on the surface. If it only reads in a dark room, it fails.

---

## 2. Colour

OKLCH-derived neutrals (hue 265, chroma ≤ 0.01) so light and dark feel like the same material.

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | `#121314` | `#f0f1f4` | App background, scroll surface |
| `card` | `#1c1d20` | `#ffffff` | Cards, list groups, sheets |
| `cardBorder` | `#ffffff0d` (5%) | `#0000001a` (10%) | 1px border on every raised surface |
| `text` | `#eff0f2` | `#1a1c1f` | Primary text |
| `textSecondary` | `#a2a5aa` | `#606369` | Captions, metadata, placeholders |
| `separator` | `#ffffff0e` | `#00000021` | List dividers, hairlines |
| `controlTrack` | `#ffffff0d` | `#33333321` | Switch track, segmented background |
| `press` | `#ffffff08` | `#3333331f` | Pressed state overlay |
| `hover` | `#ffffff04` | `#33333312` | Hover (web/Capacitor only) |
| `accent` | `#4392f7` | `#3680dd` | Primary action, selected state |
| `success` | `#11ae5b` | `#1da758` | Confirmation |
| `warning` | `#dc7200` | `#df7b0c` | Caution |
| `danger` | `#e05e94`* | `#ce4682`* | Destructive (see note) |

\* Rune's accent ramp includes a pink rather than a red. For destructive actions use a red that passes contrast: `#e5484d` dark / `#c62a2f` light.

**Accent ramp** (pick one, do not mix): blue `#4392f7` · purple `#a376e9` · pink `#e05e94` · orange `#dc7200` · green `#11ae5b` · graphite `#888c94`.

Rules:
- Backgrounds are never pure black or pure white except sheet/card surfaces in light mode.
- Tinted surfaces are allowed as `accent` at 8–12% alpha, never as a saturated fill behind text.
- Gradients are a single low-contrast sweep (≤ 12% lightness delta), used once per screen at most.
- Data visualisation: accent + two neutrals. Never a rainbow.

---

## 3. Type

| Role | Size / weight | Line height | Tracking |
|---|---|---|---|
| Display (hero, onboarding) | 28–34 / 670 | 1.1 | −0.32 |
| Page title | 20–22 / 600 | 1.2 | −0.2 |
| Section header | 11.5 / 600, uppercase optional | 1.3 | +0.4 if uppercase |
| Body | 13–14 / 400 | 1.35 | 0 |
| Label / button | 12–13 / 500 | 1.2 | 0 |
| Caption / metadata | 11.5 / 400–500 | 1.3 | 0 |
| Numeric / code | mono, 12–13 / 500 | 1.4 | tabular numerals |

- System fonts are correct for v1 (SF Pro on iOS, Roboto/Inter on Android). If a brand font is required, bundle one weight family and subset it; never ship five weights.
- Use `fontVariant: ['tabular-nums']` for any number that changes in place (timers, prices, counters) — otherwise it jitters.
- Max two type sizes per card. Three is a hierarchy problem, not a design choice.

---

## 4. Space, radius, elevation

**Space scale**: `4, 8, 12, 16, 24, 32, 48`. Screen gutter 16 (compact) or 20 (comfortable). Card padding 12–16. Section gap 24.

**Radius**: `4` (chips, inputs), `6` (buttons), `8` (cards), `10` (sheets, modals), `12` (hero surfaces, images). Nothing above 12 except avatars (full circle) and pills.

**Elevation** — three levels only:
| Level | Dark | Light | Used for |
|---|---|---|---|
| flat | no shadow, border 5% | border 8% | cards, list groups |
| raised | `0 1px 2px #0006`, border 8% | `0 1px 2px #00000014`, border 8% | sticky headers, floating buttons |
| overlay | `0 16px 32px #0000004d`, border 12% | `0 16px 32px #00000014` | sheets, dialogs, popovers |

Add a `scrim` behind overlays: `#00000099` dark / `#00000066` light.

---

## 5. Component anatomy

**Button (primary)** — height 44, radius 6, horizontal padding 16, accent fill, label 13/600 in white (or `#0b0b0c` on light accents), pressed = scale 0.98 + 6% darken, disabled = 40% opacity and no press motion.

**Button (secondary)** — card fill, hairline border, `text` label. **Ghost** — no fill until pressed. Never more than one primary button on screen.

**Surface / card** — `card` fill, `cardBorder` 1px, radius 8, padding 12–16. Grouped lists use one card with internal 1px separators inset 16 from the leading edge, not one card per row.

**List row** — min height 56, 16 gutter, leading icon 20–24, title 14/500, subtitle 12/400 secondary, trailing chevron or value. Pressed = `press` overlay, no scale.

**Sheet** — radius 10 top corners, drag handle 36×4 at 12 from top, `overlay` elevation, backdrop scrim. Enters with `glide` (320ms), exits with `glideExit` (260ms). Must be dismissible by drag and by scrim tap.

**Input** — height 44, radius 6, `controlTrack` fill or transparent + border, label above at 11.5/500 secondary, focus ring = accent at 2px offset 1. Error = danger border + 12px message, never colour alone.

**Segmented control** — track `controlTrack`, radius 8, selected pill `card` with 1px border, selection moves with `snap` (250ms), label 12/500.

**Switch** — 38×22, radius 11, knob 18, `morph`/`snap` motion. Rune's canonical component: state change should feel like a physical object settling, not a colour swap.

**Toast** — bottom inset 16 above safe area, card fill, radius 8, 12/500 text, auto-dismiss 4s, enters `pop` (250ms), exits fade 150ms. One at a time.

**Empty state** — icon or 1:1 illustration at 96, title 15/600, body 13/400 secondary max 2 lines, one action. No stock illustrations; geometric marks in accent at 12% are enough.

---

## 6. Motion system

Rune's tokens are **duration + bounce** springs (`Spring::new(duration, bounce)`), bounce 0 unless noted. Map them to Reanimated `withSpring`, GSAP `elastic`/`power` eases, or Flutter `SpringDescription`.

| Token | Enter | Exit | Use |
|---|---|---|---|
| `instant` | 100ms / 0 | 100ms / 0 | Pointer-tied, drag feedback, colour changes |
| `snap` | 250ms / 0 | 200ms / 0 | Small controls, indicators, width changes |
| `settle` | 300ms / 0 | 240ms / 0 | **Default** state change |
| `reflow` | 400ms / 0 | 320ms / 0 | Layout shifts, siblings moving into a gap |
| `glide` | 320ms / 0 | 260ms / 0 | Sheets, drawers, page transitions |
| `morph` | 300ms / .16 | 270ms / .08 | One shape becoming another (chip → panel) |
| `pop` | 250ms / .15 | 200ms / .05 | Press release, confirmation, toast |
| `drift` | 850ms / 0 | 600ms / 0 | Slow reveals the eye follows — never utility UI |

**CSS/Capacitor curves** (for the web layer): enter `cubic-bezier(.2,.8,.2,1)` 150ms, exit `cubic-bezier(.4,0,1,1)` 110ms, overshoot `cubic-bezier(.34,1.45,.64,1)`, draw-on `cubic-bezier(.45,0,.2,1)`.

### Converting Rune springs to each platform

Rune describes a spring as `(duration_ms, bounce)` where bounce 0 is critically damped. Treat the duration as the perceptual settle time and derive the physics parameters rather than guessing:

- Angular frequency: `ω = 2π / (duration / 1000)`
- Damping ratio: `ζ ≈ 1 − bounce` (bounce .15–.2 → ζ .8–.85, a single small overshoot)
- Stiffness (mass 1): `k = ω²`
- Damping coefficient (mass 1): `c = 2ζω`

| Platform | Mapping |
|---|---|
| Reanimated | `withSpring({ mass: 1, stiffness: ω*ω, damping: 2*ζ*ω, overshootClamping: bounce === 0 })` |
| SwiftUI | `.spring(duration: duration/1000, bounce: bounce)` (iOS 17+) |
| Jetpack Compose | `spring(dampingRatio = ζ, stiffness = ω*ω)` |
| Flutter | `SpringDescription(mass: 1, stiffness: ω*ω, damping: 2*ζ*ω)` |
| GSAP / CSS | no true spring; use `power2.out` at the same duration, and `back.out(1.2)` only for `pop`/`morph` |

Do not mechanically convert: a 250 ms spring on a 120 Hz device and a 60 Hz device should feel the same, but a 400 ms spring on a low-tier Android may drop frames. The low-tier fallback is a 150–200 ms fade, not a slower spring.

**Choreography**
- Screen enter: header fades/slides 8px (`settle`), content staggers 24–40ms per item, max 6 items staggered. Never stagger a long list — virtualise and let rows appear.
- Scroll reveal: 12–16px translate + fade, threshold 15% of viewport, `once: true` for content, `scrub` only for hero/parallax.
- Page/sheet dismiss must be interruptible: velocity-aware, never a fixed timer.
- Press feedback starts on touch-down (`instant`), not on release.
- Only animate `transform` and `opacity`. Animating width/height/top is a jank source; use layout animation or a scale trick.

**Reduce Motion**: cross-fade 150ms, no translation, no spring overshoot, no parallax. Keep the state change legible. Test with the OS setting on, not a manual flag.

---

## 7. Anti-patterns

| Don't | Why | Do instead |
|---|---|---|
| Glassmorphism everywhere | Costs GPU, kills contrast, dates instantly | One translucent surface (sheet header or nav bar) max |
| Big blurred coloured blobs | Reads as AI-generated 2024 | One gradient sweep at ≤ 12% delta, or none |
| Spring bounce on every press | Feels toy-like | Bounce only on confirm/pop moments |
| 3+ font sizes in a card | No hierarchy | Title 14/500 + body 13/400 |
| Coloured text on coloured fill | Contrast failures | Neutral text, coloured icon/dot |
| Full-screen scroll-jacking | Breaks platform expectations | Native scroll + scrubbed hero only |
| Icon-only buttons without labels | Accessibility failure | `accessibilityLabel` always |
| Animating on mount for every list row | Jank + nausea | Virtualised rows, reveal once |

---

## 8. Adapting to platform conventions

You are not shipping Rune; you are shipping an app that *feels* like it. Keep:

- **iOS**: 44pt minimum targets, edge-swipe back, large title collapse, sheet detents, SF Symbols, haptics on destructive and confirm actions.
- **Android**: 48dp targets, predictive back, Material You dynamic colour if the user enables it (map onto the accent ramp), ripple on press, system font scaling to 200%.

Where they conflict, follow the platform for navigation and the design language for surfaces, type, and motion. A shared component layer with platform-specific navigation is the correct split.
