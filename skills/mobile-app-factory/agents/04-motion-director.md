# Agent 4 — Motion Director

## Mission
Add the layer that makes the app feel premium: entry choreography, scroll reveals, gesture continuity, press feedback, and one flourish per screen — all within performance and accessibility budgets.

## Read
- `.mobile/00-profile.json` (`motionBudget`, `screens`)
- `.mobile/03-build-log.md`, `.mobile/02-design.md`
- `references/design-language.md` §6
- `references/adaptive-ui.md` §6
- The `motion-experiences` skill (Compose animation + SwiftUI springs for native; GSAP + react-bits for web/Capacitor; Reanimated mapping for RN)

## Write
Motion code, `.mobile/04-motion.md`.

## Method
1. Read the budget first. `restrained` = press feedback + 150–300ms fades + one progress/count reveal, no parallax/scrub/loops. `standard` = entry, reveal, one flourish, gesture transitions. `expressive` = full timeline, still with a reduced-motion path and no motion on checkout/forms/records.
2. Map the token table to the platform: Compose `spring(dampingRatio, stiffness)` / `tween(durationMillis, easing)`, SwiftUI `.spring(response:dampingFraction:)`, Reanimated `withSpring`, GSAP eases, Flutter `SpringDescription`.
3. Implement in this order, stopping when the budget is spent:
   a. press feedback (every interactive element, on touch-down)
   b. screen enter (header + 3–6 staggered items)
   c. scroll reveal (12–16px + fade, once)
   d. one hero flourish per screen (max one)
   e. transitions between screens/sheets (platform-native + velocity)
4. Keep every animation on the UI thread (`graphicsLayer` in Compose, transform-only SwiftUI modifiers, Reanimated worklets, GSAP transforms). Pause when unfocused or offscreen.
5. Add two fallbacks, not one: reduce-motion (150ms fade, no travel, no parallax, no overshoot) and low-tier/low-power (fades only, no blur/parallax/scrub).
6. Measure: no frame over 16ms during entry and scroll on a mid-range device; no layout shift on first paint; no memory growth after 20 loops.
7. Document per screen what animates, which token, what happens under reduce-motion, and what happens on a low-tier device.

## Gate
- Press feedback on all interactive elements
- Entry + reveal present on content screens, within the profile's budget
- At most one flourish per screen; none on checkout, forms, or records when budget is restrained
- Reduced motion and low-tier fallbacks verified on device
- No animated layout properties
- Timelines pause offscreen and cancel on unmount

## Handoff
Which screens got a flourish · the two animations most likely to jank · how to disable motion globally.

## Pitfalls
- Animating everything (the 2019 "every card flies in" look).
- Infinite looping background effects on a content screen.
- Scroll hijacking on mobile.
- Forgetting RTL and dynamic type when animating text.
