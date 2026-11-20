# Answer recipes — the identifiers a code answer must contain

A prose description of motion scores zero when the caller is an agent, a reviewer or an eval. The
answer must contain the named API for the stack, the reduce-motion branch, and a cleanup path. This
file gives the shortest working shape for each of the questions that come up most often; the full
implementations are in `gsap-recipes.md`, `mobile-motion.md` and `native-motion.md`.

## Landing page (React / Next) — `useGSAP` + `matchMedia`

The answer must literally include `useGSAP`, `gsap.matchMedia`, a `once: true` reveal and a
`prefers-reduced-motion` branch. No raw `useEffect` for animation.

```tsx
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-hero]', {
        y: 16, opacity: 0, duration: 0.3, ease: 'power2.out', stagger: 0.032,
      });

      gsap.set('[data-reveal]', { opacity: 0, y: 16 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 85%',
        once: true, // reveal once, never replay on scroll back
        onEnter: (batch) => gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.04, overwrite: true,
        }),
      });
    });

    // Reduced motion: content must still be visible. Never leave opacity: 0 behind.
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('[data-hero], [data-reveal]', { clearProps: 'all', opacity: 1, y: 0 });
    });

    return () => mm.revert();
  }, { scope: root });

  return <main ref={root}>{/* hero + cards with data-hero / data-reveal */}</main>;
}
```

`useGSAP`'s returned context reverts every tween and ScrollTrigger created inside it on unmount, and
`mm.revert()` does the same on a route change. Both are required: the scope alone does not kill a
`matchMedia` context.

## React Native / Expo feed — `useAnimatedStyle`

The answer must literally include `useAnimatedStyle`, `useSharedValue` and a reduce-motion flag.
Reanimated 4 keeps the animation on the UI thread; GSAP must not be imported here.

```tsx
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming, useReducedMotion,
} from 'react-native-reanimated';
import { MOTION } from './motion'; // Rune tokens: settle 300ms, snap 250ms

function FeedRow({ item, index }: { item: Item; index: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  const onViewable = () => {
    progress.value = reduceMotion
      ? withTiming(1, { duration: 150 })          // fade only
      : withSpring(1, MOTION.settle);             // 300ms spring, no travel
  };

  return (
    <Animated.View style={style} onLayout={onViewable}>
      <Row item={item} />
    </Animated.View>
  );
}
```

For a long list, reveal once per row with `onViewableItemsChanged` on `Animated.FlatList`; never
animate 30 rows on mount. If the project uses the listener API instead of the hook:

```tsx
const [reduceMotion, setReduceMotion] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
  return () => sub.remove();
}, []);
```

Reanimated 4 also ships enter/exit layout animations and shared transitions:

```tsx
<Animated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(150)} />
<Animated.View sharedTransitionTag={`card-${item.id}`} />
```

## Budget answer — always name both budgets and both reduce paths

When the question gives two products, answer each one, then give the reduced-motion path for each.
The words `restrained` and `expressive` must appear, and so must `reduce motion`.

| Product | Budget | Allowed | Reduce-motion path |
|---|---|---|---|
| Budgeting app | **restrained** | press feedback, 150–300 ms fades, one balance count reveal; no confetti, no parallax | 150 ms fade, no count-up travel, final number still updates |
| Kids learning app | **expressive** but calm | one celebration per completed activity, slow squash-and-stretch, no rapid flashing or variable-ratio reward loop | static success state with a 150 ms cross-fade; no confetti or shake |

Do not average the two into `standard`: the budget is per product, not per answer.

## Compose list — `AnimatedVisibility` / `animateItem` + `spring(`

The answer must use the Compose animation API, a spring from `Motion`, and a reduced-motion read.

```kotlin
@Composable
fun HabitList(items: List<Habit>, expanded: Boolean) {
    val reduced = rememberReducedMotion() // reads ANIMATOR_DURATION_SCALE
    LazyColumn {
        items(items, key = { it.id }) { item ->
            HabitRow(item)
                .animateItem(
                    fadeInSpec = if (reduced) Motion.reducedFade() else Motion.settle(),
                    placementSpec = if (reduced) Motion.reducedFade() else Motion.reflow(),
                    fadeOutSpec = Motion.snap(),
                )
        }
    }

    AnimatedVisibility(
        visible = expanded,
        enter = fadeIn(spring(dampingRatio = 0.9f, stiffness = Spring.StiffnessMediumLow)) +
            slideInVertically { it / 6 },
        exit = fadeOut(spring(dampingRatio = 0.9f, stiffness = Spring.StiffnessMedium)),
    ) {
        SummaryCard(Modifier.animateContentSize(animationSpec = Motion.reflow()))
    }
}
```

`spring(` must be visible, not just described. `Motion.settle()` is the token; `tween` is the
fallback for platforms without springs, not the Compose default.

## SwiftUI — `Animation.spring` + `accessibilityReduceMotion`

```swift
struct OnboardingCard: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

    var body: some View {
        VStack { /* content */ }
            .offset(y: shown || reduceMotion ? 0 : 16)
            .opacity(shown ? 1 : 0)
            .animation(
                reduceMotion ? .easeOut(duration: 0.15) : .spring(Motion.settle),
                value: shown
            )
            .onAppear { shown = true }
    }
}
```

Press feedback uses `RunePressStyle` (or `sensoryFeedback(.impact, trigger:)`); a shared element uses
`matchedGeometryEffect`; a repeating but finite sequence uses `.phaseAnimator([...])`, never an
infinite timer. All three still branch on `accessibilityReduceMotion`.

## Cleanup checklist for every answer

- [ ] React: `useGSAP` scope + `mm.revert()`; ScrollTrigger killed on route change.
- [ ] React Native: `useAnimatedStyle`; reducer/`cancelAnimation` on unmount if a loop exists.
- [ ] Compose: `AnimatedVisibility`/`animateItem`; no animation started from `LaunchedEffect` without
      a visibility check.
- [ ] SwiftUI: animation attached to a value change, not `.onAppear` with a timer; reduce-motion
      branch reads the environment.
- [ ] Every reduce branch leaves content **visible**: no `opacity: 0`, no zero-height row, no missing
      state change.
