# Halcyon — motion demo

A one-page React + TypeScript demo of the **motion-experiences** skill running on the
**mobile-app-factory** design tokens. It is not a product; it is a reference you can copy
patterns from.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle
npm run preview    # serve the built bundle
```

## What is demonstrated

| Where | Technique | Skill reference |
|---|---|---|
| Hero, on load | GSAP timeline: nav → eyebrow → headline → CTA → device, one direction, settles in ~2s | `gsap-recipes.md` §2 |
| Headline | React Bits `SplitText` (`chars`, `rise`, trigger `load`) | `react-bits-catalog.md` §3 |
| Primary CTA | React Bits `StarBorder` (canvas border light) + `Magnet` + `ClickSpark` | `react-bits-catalog.md` §2 |
| Feature cards | React Bits `AnimatedContent` (scroll, distance 18, `once`) | `react-bits-catalog.md` §2 |
| Scroll content | `ScrollTrigger.batch` reveal: 16px + fade, `once`, 50ms stagger | `gsap-recipes.md` §3 |
| "How it works" | Pinned, scrubbed timeline (desktop only, ≥900px) | `gsap-recipes.md` §4 |
| Phone mock | In-screen motion: entry choreography, ring draw, bar scale-in, breathing glow | `design-language.md` §6 |
| Stats | Count-up on view, formatted numbers | `gsap-recipes.md` §10 |
| Reduced motion | `useReducedMotion` + `gsap.matchMedia`; SplitText replaced by a static `h1`; all reveals visible | `gsap-recipes.md` §1 |

## Design tokens

`src/styles.css` implements the Rune-derived palette: neutrals at hue 265, one accent,
hairline borders, 4/8/12/16/24 spacing, 4–12px radii, 13–16px body type. Light and dark
come from `prefers-color-scheme`; every value has a single source in `:root`.

## React Bits provenance

The components in `src/components/reactbits/` are vendored copies from
[React Bits](https://github.com/DavidHDev/react-bits) (`ts-default` flavour), MIT + Commons
Clause v1.0, © 2026 David Haz. See `src/components/reactbits/NOTICE.md`. In a real project,
install fresh copies:

```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW
```

## File map

```
src/
  App.tsx                        page + all GSAP timelines
  main.tsx                       React root
  styles.css                     tokens, layout, phone mock, reduced motion
  motion/gsap.ts                 plugin registration + helpers (from the skill assets)
  hooks/useReducedMotion.ts      OS setting, live updates
  components/reactbits/          vendored React Bits components
```
