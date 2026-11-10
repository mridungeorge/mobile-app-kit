# Mobile Motion (React Native, Flutter, Compose)

GSAP and React Bits do not run on native views. The **interaction model** transfers; the implementation does not. This file maps the same five jobs onto native stacks using the Rune tokens.

## Contents
1. Token mapping
2. Press feedback
3. Screen entry
4. Scroll reveal
5. Parallax
6. Gesture sheet
7. Shared-element transition
8. Reduced motion
9. Flutter and Compose
10. Performance rules

---

## 1. Token mapping

| Token | Reanimated config | Flutter | Compose |
|---|---|---|---|
| instant | `{ duration: 100, dampingRatio: 1 }` | `Duration(milliseconds: 100)` | `tween(100)` |
| snap | `{ duration: 250, dampingRatio: 1 }` | `250ms` | `tween(250)` |
| settle | `{ duration: 300, dampingRatio: 1 }` | `300ms` | `tween(300)` |
| reflow | `{ duration: 400, dampingRatio: 1 }` | `400ms` | `tween(400)` |
| glide | `{ duration: 320, dampingRatio: 1 }` | `320ms` | `tween(320)` |
| morph | `{ duration: 300, dampingRatio: 0.84 }` | `SpringDescription` ζ≈0.84 | `spring(dampingRatio = 0.84f)` |
| pop | `{ duration: 250, dampingRatio: 0.85 }` | ζ≈0.85 | `spring(0.85f)` |

Reanimated accepts `duration` + `dampingRatio` directly, so `bounce` maps as `dampingRatio = 1 - bounce`. Copy `assets/rn/motion.ts` from `mobile-app-factory`.

---

## 2. Press feedback

Starts on touch-down, settles on release, no bounce on rows:

```tsx
const scale = useSharedValue(1);

<AnimatedPressable
  onPressIn={() => { scale.value = withSpring(0.98, { duration: 100, dampingRatio: 1 }); }}
  onPressOut={() => { scale.value = withSpring(1, { duration: 250, dampingRatio: 0.85 }); }}
  style={useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))}
/>
```

Rows should use an overlay colour instead of scale; scaling a full-width row reads as a bug.

---

## 3. Screen entry

Stagger with delay, not a global timeline:

```tsx
const enter = (i: number) =>
  withDelay(i * 32, withSpring(1, { duration: 300, dampingRatio: 1 }));
```

Cap the stagger at 6 items. For a long list, animate the container once and let rows appear with the data — do not animate 30 rows.

Expo Router / React Navigation: use the platform transition (`slide_from_right` on iOS-like stacks, fade for tabs). Custom navigation animation is a common source of double transitions and broken back gestures.

---

## 4. Scroll reveal

Use the scroll handler on the UI thread and reveal once:

```tsx
const seen = useRef(new Set<number>());

const handler = useAnimatedScrollHandler((e) => {
  const y = e.contentOffset.y;
  // reveal items whose offset is now within viewport
  // (precompute item offsets from onLayout and store in shared values)
  items.forEach((item, i) => {
    if (!seen.current.has(i) && y > item.offset - 600) {
      seen.current.add(i);
      item.progress.value = withSpring(1, { duration: 300, dampingRatio: 1 });
    }
  });
});
```

Simpler and often better: `Animated.FlatList` with `onViewableItemsChanged` and a per-item animated style. Avoid `onScroll` + `setState` — that re-renders the list on every frame.

Reveal recipe: `opacity 0→1`, `translateY 12→0`, 300ms, once.

---

## 5. Parallax

```tsx
const scrollY = useSharedValue(0);
const style = useAnimatedStyle(() => ({
  transform: [{
    translateY: interpolate(scrollY.value, [-200, 0, 400], [-40, 0, 60], Extrapolation.CLAMP),
  }],
}));
```

Clamp the range, keep the image 120% height, never parallax text.

---

## 6. Gesture sheet

```tsx
const y = useSharedValue(0);
const start = useSharedValue(0);

const pan = Gesture.Pan()
  .onStart(() => { start.value = y.value; })
  .onUpdate((e) => { y.value = Math.max(0, start.value + e.translationY); })
  .onEnd((e) => {
    const shouldClose = y.value > 120 || e.velocityY > 800;
    y.value = withSpring(shouldClose ? HEIGHT : 0, { duration: 320, dampingRatio: 1 });
    if (shouldClose) runOnJS(onClose)();
  });
```

Rules: interruptible, velocity-aware, scrim opacity interpolated from `y`, and a fallback close button for accessibility.

`gorhom/react-native-bottom-sheet` already implements this correctly — use it unless you have a specific reason not to.

---

## 7. Shared-element transition

- Expo SDK 54+: `react-native-reanimated` shared element transitions (`sharedTransitionTag`) or Expo Router's `Link` with `sharedTransition`.
- Older/native: `react-navigation-shared-element` or platform-native transitions.
- Keep the tag on one element per screen and match aspect ratios to avoid a snap at the end.

---

## 8. Reduced motion

```tsx
const [reduce, setReduce] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
  return () => sub.remove();
}, []);
```

Then swap springs for `withTiming(…, { duration: 150 })` and drop translate/parallax. Test with the OS toggle, not a dev flag.

Also honour `AccessibilityInfo.isReduceTransparencyEnabled()` if you use blur.

---

## 9. Flutter and Compose

**Flutter**

```dart
AnimatedContainer(
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeOutCubic,
  transform: Matrix4.translationValues(0, 12 * (1 - t), 0),
  child: child,
)
```

- `Curves.easeOutCubic` ≈ enter; `Curves.easeInCubic` ≈ exit.
- For springs: `SpringSimulation` / `flutter_animate`'s `Curve` + duration.
- `Hero(tag: …)` for shared elements; `PageRouteBuilder` for custom transitions.
- `MediaQuery.disableAnimationsOf(context)` for reduced motion.

**Compose**

```kotlin
val progress by animateFloatAsState(
  targetValue = if (visible) 1f else 0f,
  animationSpec = spring(dampingRatio = 1f, stiffness = Spring.StiffnessMediumLow),
)
```

- `AnimatedVisibility` with `fadeIn() + slideInVertically { it / 8 }`.
- `SharedTransitionLayout` (Compose 1.7+) for shared elements.
- `LocalAccessibilityManager` / `Settings.Global.ANIMATOR_DURATION_SCALE` for reduced motion.

---

## 10. Performance rules

- Animate `transform` and `opacity`. Layout properties (`width`, `height`, `top`) go through `LayoutAnimation` or the layout system, not per-frame JS.
- Keep work on the UI thread: `useAnimatedStyle`, `useDerivedValue`, worklets. `runOnJS` only for terminal side effects.
- Do not create shared values inside list renderers without memoising the row component.
- Blur (`expo-blur`, `BlurView`) is expensive on Android — one per screen, never animating.
- Images: size them to the viewport; decoding a 4000px image for a 300px card causes scroll jank.
- Profile with the RN performance monitor / Xcode Instruments on a physical mid-range device.
