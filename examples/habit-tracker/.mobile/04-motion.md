# Motion

Budget: **restrained** (profile `motionBudget`). One flourish per screen, arrival then stop.

| Job | Where | Token | Reduced motion |
|---|---|---|---|
| Press feedback | check circle, rows | `snap` 250ms, 0.97 scale | no scale, instant state |
| Entry | Today rows | `settle` 300ms, 24ms stagger | 150ms opacity fade, no stagger |
| Progress | weekly ring | `settle` 300ms once per check-in | jump to value |
| Screen transition | Today → Detail | platform push | platform push (already reduced) |

Not allowed in this app: parallax, scroll-scrub, looping or autoplay motion, confetti on streak.

Implementation: `DesignSystem/Motion.swift` and `ui/theme/Motion.kt` carry the springs. Both
read the OS reduce-motion flag (`accessibilityReduceMotion` /
`LocalAccessibilityManager` / `ANIMATOR_DURATION_SCALE`) and select the fade path.

Verified: iOS/Android compile in CI. Reduced-motion behaviour is code-reviewed, not yet tested on a
device; that is on the human list.
