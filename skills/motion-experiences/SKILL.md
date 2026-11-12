---
name: motion-experiences
description: Adds premium scroll animation and in-screen motion to native, web and mobile-web UIs — SwiftUI and Jetpack Compose springs on native, GSAP (ScrollTrigger, timelines, Flip, SplitText) and React Bits on web. Use this whenever the user asks for animations, "make it feel alive", scroll effects, parallax, reveal-on-scroll, page transitions, micro-interactions, hero animation, "premium feel", landing page motion, React Bits, GSAP, Lottie-style motion, SwiftUI animation, Compose animation, native app motion, or motion for an app built with React Native, Expo, Flutter or Capacitor. Also use it when reviewing UI that feels static, cheap or "AI-generated" — motion is usually the missing layer.
---

# Motion Experiences

Motion is the difference between a UI that looks designed and one that looks generated. But most motion work fails for one of two reasons: **too much** (everything flying in, scroll-jacked, 12 effects per screen) or **the wrong layer** (animating layout properties until the page janks).

This skill covers every stack that actually ships, native first:

| Target | Primary tool | Why |
|---|---|---|
| Native iOS/Android | **SwiftUI** `Animation.spring` and **Compose** `spring()` | The default stack for this kit; platform springs, platform reduced-motion, no bridge |
| Web, PWA, Capacitor/Ionic apps | **GSAP** (+ ScrollTrigger, Flip, SplitText) and **React Bits** | Timeline control, scrubbing, interruption, DOM/canvas effects |
| React Native / Expo | **Reanimated** | Runs on the UI thread; GSAP does not animate native views |
| Flutter | implicit animations + `flutter_animate` | Same timing tokens |

Native motion is in `references/native-motion.md`, and the token files ship inside the generated apps (`ui/theme/Motion.kt`, `DesignSystem/Motion.swift`). Read that file first whenever the app is Kotlin/Swift.

The **timing language is shared** (from the Rune motion tokens): `instant 100ms`, `snap 250`, `settle 300`, `reflow 400`, `glide 320`, `morph 300/bounce .16`, `pop 250/bounce .15`, `drift 850`. If a stack can't express springs, approximate with these durations and `cubic-bezier(.2,.8,.2,1)` enter / `cubic-bezier(.4,0,1,1)` exit.

## The five jobs of motion

Every screen gets at most these, in this order of priority. Stop when the budget is spent.

1. **Feedback** — press, toggle, hover. Starts on touch-down, 100ms, never on release.
2. **Entry** — how content arrives. Header + 3–6 staggered items, `settle`, 24–40ms stagger.
3. **Reveal** — content appearing as you scroll. 12–16px translate + fade, `once: true`.
4. **Flourish** — exactly **one** expressive moment per screen: hero parallax, pinned scene, text split, magnetic CTA.
5. **Transition** — between screens/sheets. Platform-native timing, interruptible, velocity-aware.

If a request implies all five on every screen, push back and choose: motion budget is a design decision, not a checklist.

## Budget by product type

If the project came from `mobile-app-factory`, read `.mobile/00-profile.json` and use its `motionBudget` instead of guessing:

| Budget | Products | Allowed |
|---|---|---|
| `restrained` | finance, health records, B2B, utilities | press feedback, 150–300ms fades, one progress/count reveal. No parallax, scrub, autoplay or looping effects. |
| `standard` | productivity, commerce, social, travel, delivery | entry + stagger reveal, one hero flourish, gesture transitions, haptics. Restrained on checkout and forms. |
| `expressive` | games, media, kids, camera, brand-led consumer | full timeline, pinned scrub, particles/glow, sound — still with reduced-motion and low-tier paths. |

Never put `expressive` motion on a checkout, a medical record, or a data-entry form. The budget is a ceiling per screen, not a quota.

## Quick start — GSAP in React

```bash
npm i gsap
```

```tsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

useGSAP(() => {
  gsap.from('.card', {
    y: 16, opacity: 0, duration: 0.3, ease: 'power2.out', stagger: 0.032,
  });
}, { scope: containerRef });
```

`useGSAP` handles cleanup and reverts context on unmount — do not hand-roll `useEffect` + `ctx.revert()` unless you're not on React.

**Always** wrap scroll work in `gsap.matchMedia()` so reduced-motion users get a static page:

```ts
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  // scroll timelines here
});
```

## Quick start — React Bits

React Bits is a copy-paste component registry (120+ components across Animations, Backgrounds, Components, Micro, TextAnimations), many built on GSAP. Install per component, not wholesale. It is MIT + Commons Clause v1.0, © 2026 David Haz — keep the licence notice when you vendor a component:

```bash
# with shadcn CLI
npx shadcn@latest add @react-bits/SplitText-TS-TW

# or jsrepo
npx jsrepo@latest add https://reactbits.dev/r/SplitText-TS-TW
```

Suffix order matters: `-{JS|TS}-{CSS|TW}`. For an agent-driven install, add the registry to `components.json` first:

```json
{ "registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" } }
```

Then `npx shadcn@latest mcp init --client claude` and ask for the component by name.

Curated picks by job: `references/react-bits-catalog.md`.

## Mobile reality check

- **Scroll hijacking is banned on touch.** No ScrollSmoother, no virtual scroll, no `scroll-behavior: smooth` on route changes. Native scroll must stay native.
- **Animate `transform` and `opacity` only.** Width/height/top/left/filter cause layout or paint on every frame.
- **One WebGL/canvas background per page, maximum**, and lazy-mount it below the fold. Low-end Android GPUs will drop frames otherwise.
- **Test on a mid-range Android device**, not a desktop with device emulation.
- **Tier the effect**, don't just ship the desktop version: low-tier or low-power devices get fades only, no blur/parallax/pinned scrub. The tier rules live in `mobile-app-factory/references/adaptive-ui.md`.
- **Safe areas**: motion must respect `env(safe-area-inset-*)`; a sheet that animates from `translateY(100%)` must account for the home indicator.
- **Reduced motion** is not optional: replace travel with a 150ms fade, keep the state change legible.

React Native equivalents (Reanimated patterns, scroll reveals, gesture sheets): `references/mobile-motion.md`. Native SwiftUI/Compose implementations of all five jobs, mapped to the Rune spring tokens: `references/native-motion.md`.

## Recipes

Full code in `references/gsap-recipes.md`:

- Hero entrance timeline (mask + stagger + one overshoot)
- Scroll reveal with `once` and `batch`
- Pinned feature section (scrub, snap points)
- Parallax image with clamped movement
- Split-text headline (SplitText, reduced-motion fallback)
- Scroll progress indicator
- Page transition (View Transitions API + GSAP fallback)
- Magnetic button (`quickTo`, pointer-only, disabled on touch)
- Number counter on view
- Accordion / height animation with Flip

## Rules that prevent the "AI demo" look

| Don't | Why |
|---|---|
| Every card animating in with a different direction | Reads as a template |
| Bounce/elastic on utility UI | Toy-like; reserve for confirm/pop |
| Infinite looping gradients behind text | Kills contrast and battery |
| Cursor effects on touch devices | Meaningless, expensive |
| Animating text letter-by-letter for body copy | Unreadable and slow; reserve for one headline |
| Scroll-triggered animations that replay | Distracting; use `once: true` |
| Animations longer than 600ms for UI | Feels broken |

## Performance and accessibility checklist

- [ ] Only `transform` / `opacity` animated (except deliberate layout animation via Flip)
- [ ] `will-change` applied narrowly and removed after the animation
- [ ] ScrollTrigger instances killed on unmount; `useGSAP` scope used
- [ ] `matchMedia` reduced-motion branch verified with the OS setting on
- [ ] No animation blocks first input; `pointer-events` correct during transitions
- [ ] 60fps on a mid-range Android; no long tasks (>50ms) during scroll
- [ ] Focus order unaffected; modals trap focus; `aria-hidden` on decorative layers
- [ ] Canvas/WebGL layers have `aria-hidden="true"` and `pointer-events: none`
- [ ] Motion survives RTL and dynamic type

## Bundled resources

| File | Use |
|---|---|
| `references/native-motion.md` | SwiftUI and Compose: token files, entry, reveal, shared-element flourish, press, reduced motion |
| `references/react-bits-catalog.md` | Which component for which job, with install names |
| `references/gsap-recipes.md` | Copy-paste GSAP + React patterns |
| `references/mobile-motion.md` | Reanimated/Flutter mapping, gesture and scroll patterns |
| `assets/gsap-setup.ts` | Plugin registration, `useGSAP` helpers, reduced-motion guard |
| `assets/ScrollReveal.tsx` | Drop-in reveal component (GSAP, once, a11y-safe) |

Pairs with `mobile-app-factory`: its design tokens define *how fast* and *how far*; this skill defines *what moves*.
