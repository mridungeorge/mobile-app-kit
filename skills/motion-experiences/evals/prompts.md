# Motion Experiences — trigger and quality evals

## Trigger set

| Prompt | Should activate? |
|---|---|
| "This landing page feels dead. Add scroll animations." | yes |
| "Make the hero feel premium." | yes |
| "Add reveal-on-scroll to these cards." | yes |
| "How do I use GSAP ScrollTrigger in React?" | yes |
| "Which React Bits component for a text reveal?" | yes |
| "Animate a bottom sheet in React Native." | yes |
| "My GSAP animations replay on route change." | yes |
| "Animate this SVG logo in After Effects." | no |
| "Set up a Postgres index." | no |

## Quality set

**1. Landing page motion**
> "Add motion to my SaaS landing page. It currently has no animation."

Pass:
- Names the five jobs and picks a budget (feedback, entry, reveal, one flourish, transition)
- Uses `useGSAP` + `gsap.matchMedia`, not raw `useEffect`
- Reveals 12–16px + fade, `once: true`
- Restricts the pinned section to desktop widths
- Reduced-motion branch leaves content visible
- Animates transform/opacity only

Fail:
- Every card flies in from a different direction
- ScrollSmoother / scroll hijacking on touch
- `opacity: 0` set without a reduce-motion reveal (blank page for those users)
- Bounce on body text

**2. Component choice**
> "I need a premium animated border on my primary CTA."

Pass:
- Picks `StarBorder` (or one equivalent), not three border effects
- Explains the canvas cost and that it is one-per-page
- Keeps contrast and focus-visible styling

**3. React Native reveal**
> "Add scroll reveals to a React Native feed."

Pass:
- Reanimated, UI thread, `useAnimatedStyle`
- Does not animate every row; virtualises and reveals once
- Maps Rune tokens to `withSpring({ duration, dampingRatio })`
- Honours `AccessibilityInfo.isReduceMotionEnabled()`

Fail:
- Tries to import GSAP into React Native
- `onScroll` + `setState` per frame
- 30 rows each with their own delayed spring

**4. Performance review**
> "My scroll animation janks on Android."

Pass:
- Checks what is animated (width/top/filter are red flags)
- Checks ScrollTrigger count and cleanup
- Checks image sizes and WebGL layers
- Suggests `will-change` narrowly and removal after

**5. Budget-aware motion**
> "Add motion to this budgeting app, and also to this kids learning app."

Pass:
- Budgeting app gets `restrained`: press feedback, 150–300ms fades, one count/progress reveal; no parallax, confetti, or scroll-jacking around money
- Kids app gets `expressive` but calm: one hero flourish, no rapid flashing, no variable-ratio reward loop, parental-gate interactions still clear
- Reads `.mobile/00-profile.json` if present; otherwise states the budget it is applying
- Both get a reduced-motion path that keeps all content visible

Fail:
- Same animation stack and intensity for both
- Celebrates a payment or a streak with confetti
- Fast flashing or looping motion in the kids app

## Regression checks

- [ ] Every recipe in `references/gsap-recipes.md` includes a reduced-motion path
- [ ] `assets/gsap-setup.ts` registers each plugin once
- [ ] `assets/ScrollReveal.tsx` compiles under `strict` TypeScript
- [ ] The demo in this repo still builds (`motion-demo: npm run build`)
