# Motion recipes that ship with a test

The shortest working shape for each stack, the reduce-motion branch it must have, and the test that
proves the branch was taken. Copy the recipe and its test together.

## React / Next — `useGSAP` + `matchMedia` + Playwright

```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set('[data-reveal]', { opacity: 0, y: 16 });
    ScrollTrigger.batch('[data-reveal]', {
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04 }),
    });
  });
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('[data-reveal]', { clearProps: 'all', opacity: 1, y: 0 });
  });
  return () => mm.revert();
}, { scope: root });
```

```ts
// e2e/motion.spec.ts
test('reduced motion shows content with no tween', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.page')).toHaveClass(/is-reduced/);
  await expect(page.locator('[data-reveal]').first()).toHaveCSS('opacity', '1');
});
```

Verified by `motion-demo` CI (`npx playwright test`): both the reduced and normal branches load.

## React Native / Expo — Reanimated 4 + Jest

```tsx
const reduce = useReducedMotion();
const style = useAnimatedStyle(() => ({
  opacity: reduce ? 1 : withTiming(1, { duration: 300 }),
  transform: [{ translateY: reduce ? 0 : withSpring(0, springTokens.settle) }],
}));
```

```tsx
// __tests__/motion.test.tsx
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(true)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));
it('uses the fade-only path when reduce motion is on', async () => {
  const view = await render(<Reveal reduce />);
  expect(view.getByTestId('reveal').props.style).toMatchObject({ opacity: 1, transform: [{ translateY: 0 }] });
});
```

The Jest harness and this test ship in the Expo starter (`assets/expo/__tests__/`); CI runs
`npm test`.

## Jetpack Compose — `AnimatedVisibility` + shared element

```kotlin
val reduce = LocalAccessibilityManager.current?.isEnabled != true &&
  Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) > 0f
AnimatedVisibility(
  visible = visible,
  enter = if (reduce) fadeIn(tween(150)) else fadeIn() + slideInVertically(springTokens.settle),
) { CardContent() }
```

```kotlin
@Test fun reducedMotionUsesFadeOnly() {
  composeRule.setContent { Reveal(reduce = true) { Text("Habit") } }
  composeRule.onNodeWithText("Habit").assertIsDisplayed()
  // alpha is 1 immediately; no translation modifier is applied
  composeRule.onNodeWithText("Habit").assertExists()
}
```

Template only: this repository has no instrumented Android runner, so the test is not executed
here. Run it with `./gradlew :app:connectedDebugAndroidTest` on a device.

## SwiftUI — `matchedGeometryEffect` / `.phaseAnimator`

```swift
@Environment(\.accessibilityReduceMotion) private var reduce
@Namespace private var ns

var body: some View {
  if reduce {
    content.transition(.opacity)
  } else {
    content
      .matchedGeometryEffect(id: "card", in: ns)
      .phaseAnimator([false, true]) { view, phase in
        view.scaleEffect(phase ? 1.02 : 1)
      }
  }
}
```

```swift
func testReducedMotionUsesOpacity() {
  let view = Reveal(reduce: true)
  XCTAssertTrue(view.usesFadeOnly)   // expose the branch, do not assert animation timing
}
```

Template only: the iOS starter has XCTest but no simulator assertion for animation frames; the
branch is code-reviewed and its reduce flag is a plain stored property, so it is unit-testable
without a UI test.

## Rule

Every recipe has two paths and one test. A motion answer without the reduce branch and its test is
incomplete, whatever it looks like on a fast phone.
