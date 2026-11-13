# Native motion — Compose and SwiftUI

The default stack for this kit is native, so the motion layer has to be native too. This file is
the mapping from the Rune tokens to the two production frameworks. It is not a catalogue of effects:
it is the five jobs of motion, implemented, with a reduced-motion path in every one.

The tokens are already in the generated projects, so an app scaffolded by `mobile-app-factory` ships
with them:

| Platform | File | Exports |
|---|---|---|
| Android | `ui/theme/Motion.kt` | `Motion` (spring specs + durations), `rememberReducedMotion()`, `MotionEnter`, `Modifier.pressFeedback`, `staggerDelay` |
| iOS | `DesignSystem/Motion.swift` | `Motion` (springs + durations), `Motion.resolve`, `Motion.delay`, `RunePressStyle`, `.runeReveal(index:)` |

| Token | Duration | Bounce | Use |
|---|---|---|---|
| `snap` | 250 ms | 0 | Small controls, indicators, width changes |
| `settle` | 300 ms | 0 | **Default** state change |
| `reflow` | 400 ms | .05 | Layout moves, reorder, expand |
| `glide` | 320 ms | .05 | Sheets, page transitions |
| `morph` | 300 ms | .16 | Shared-element hero, one per screen |
| `pop` | 250 ms | .15 | Confirmations, never destructive actions |
| reduced fade | 150 ms | — | Everything, when Reduce Motion is on |

---

## Jetpack Compose

### 1. Tokens as specs

`Motion.kt` keeps the durations as constants and the springs as generic factories, so the same token
works for `Float`, `IntOffset`, `Dp` and colour without a second table:

```kotlin
object Motion {
    const val SNAP_MS = 250
    const val SETTLE_MS = 300
    const val REFLOW_MS = 400
    const val GLIDE_MS = 320
    const val MORPH_MS = 300
    const val POP_MS = 250
    const val REDUCED_FADE_MS = 150
    const val STAGGER_MS = 32

    fun <T> snap()   = spring<T>(dampingRatio = 0.9f, stiffness = Spring.StiffnessMedium)
    fun <T> settle() = spring<T>(dampingRatio = 0.9f, stiffness = Spring.StiffnessMediumLow)
    fun <T> reflow() = spring<T>(dampingRatio = 0.85f, stiffness = Spring.StiffnessLow)
    fun <T> glide()  = spring<T>(dampingRatio = 0.85f, stiffness = Spring.StiffnessMediumLow)
    fun <T> morph()  = spring<T>(dampingRatio = 0.72f, stiffness = Spring.StiffnessMediumLow)
    fun <T> pop()    = spring<T>(dampingRatio = 0.70f, stiffness = Spring.StiffnessMedium)
    fun <T> reducedFade() = tween<T>(durationMillis = REDUCED_FADE_MS)
}
```

Springs are the point. A `tween` with an ease curve is the fallback for platforms that cannot
express a spring, not the default on Compose.

### 2. Entry — `AnimatedVisibility`

Entry is one region at a time: header plus 3–6 items, `settle`, 24–40 ms stagger. Never animate a
whole `LazyColumn` item-by-item on first paint.

```kotlin
@Composable
fun MotionEnter(
    visible: Boolean,
    modifier: Modifier = Modifier,
    reduced: Boolean = rememberReducedMotion(),
    content: @Composable AnimatedVisibilityScope.() -> Unit
) {
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = if (reduced) fadeIn(Motion.reducedFade<Float>())
                else fadeIn(Motion.settle<Float>()) +
                     slideInVertically(Motion.settle<IntOffset>()) { it / 6 },
        exit  = if (reduced) fadeOut(Motion.reducedFade<Float>())
                else fadeOut(Motion.snap<Float>()) +
                     slideOutVertically(Motion.snap<IntOffset>()) { it / 8 },
        content = content
    )
}
```

Sixteen to twenty-four pixels of travel, not a full-screen slide. The fade carries the meaning; the
offset only tells the eye where the block came from.

### 3. Reveal — `LazyColumn` placement

Reveal on scroll is placement animation, not a per-item `AnimatedVisibility`. `Modifier.animateItem`
gives you the fade and the reorder in one modifier and keeps it off the main thread:

```kotlin
LazyColumn {
    items(items, key = { it.id }) { item ->
        RowItem(item)
            .animateItem(
                fadeInSpec = Motion.settle(),
                placementSpec = Motion.reflow(),
                fadeOutSpec = Motion.snap()
            )
    }
}
```

Use `animateContentSize` for a block that grows in place (an expanded card, a validation message):

```kotlin
Column(Modifier.animateContentSize(animationSpec = Motion.reflow())) { … }
```

`animateContentSize` animates layout, so keep it on a container that does not also animate its own
offset — two layout animations on one node fight and produce a wobble.

### 4. Flourish — `SharedTransitionLayout`

Exactly one expressive moment per screen. On Compose the cheapest credible one is a shared element
between the list and the detail:

```kotlin
@OptIn(ExperimentalSharedTransitionApi::class)
@Composable
fun Catalogue() {
    SharedTransitionLayout {
        AnimatedContent(targetState = selected, label = "hero") { id ->
            if (id == null) {
                Grid(
                    modifier = Modifier.sharedElement(
                        rememberSharedContentState(key = "hero-${items.first().id}"),
                        animatedVisibilityScope = this@AnimatedContent
                    )
                )
            } else {
                Detail(
                    modifier = Modifier.sharedElement(
                        rememberSharedContentState(key = "hero-$id"),
                        animatedVisibilityScope = this@AnimatedContent
                    )
                )
            }
        }
    }
}
```

Do not put a shared transition on a checkout, a form or a medical record. The budget in
`.mobile/00-profile.json` is a ceiling per screen.

### 5. Press feedback

Starts on touch-down, not on release. Use the same `MutableInteractionSource` as the clickable so
the two cannot desynchronise:

```kotlin
val interaction = remember { MutableInteractionSource() }

Row(
    modifier = Modifier
        .pressFeedback(interaction)
        .clickable(interactionSource = interaction, indication = null) { open() }
) { … }
```

### 6. Reduced motion

Android exposes it as `Settings.Global.ANIMATOR_DURATION_SCALE`. Zero means the user (or a battery
saver) turned animation off:

```kotlin
@Composable
fun rememberReducedMotion(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        runCatching {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE, 1f
            ) == 0f
        }.getOrDefault(false)
    }
}
```

Every helper above takes `reduced` and falls back to `Motion.reducedFade()` — a 150 ms fade, with
the content still fully legible and in its final position.

---

## SwiftUI

### 1. Tokens as springs

`Motion.swift` expresses the same table with `Animation.spring(duration:bounce:)` (iOS 17+), which
is the closest thing SwiftUI has to the Compose spring parameters:

```swift
enum Motion {
    static let snap   = Animation.spring(duration: 0.25, bounce: 0)
    static let settle = Animation.spring(duration: 0.30, bounce: 0)
    static let reflow = Animation.spring(duration: 0.40, bounce: 0.05)
    static let glide  = Animation.spring(duration: 0.32, bounce: 0.05)
    static let morph  = Animation.spring(duration: 0.30, bounce: 0.16)
    static let pop    = Animation.spring(duration: 0.25, bounce: 0.15)
    static let reducedFade = Animation.easeOut(duration: 0.15)
}
```

`bounce` is not the same parameter as Compose's `dampingRatio`; treat the table as the contract and
tune the pair together if you change one, or the two platforms stop feeling like one product.

### 2. Entry — `.transition`

```swift
struct HeaderBlock: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.s3) {
            Text(title).font(Theme.title)
            ForEach(Array(items.prefix(6).enumerated()), id: \.offset) { index, item in
                RowView(item)
                    .runeReveal(index: index)
            }
        }
        .opacity(shown ? 1 : 0)
        .offset(y: shown || reduceMotion ? 0 : 16)
        .onAppear {
            withAnimation(Motion.resolve(.settle, reduceMotion: reduceMotion)) { shown = true }
        }
    }
}
```

`.transition(.move(edge: .bottom).combined(with: .opacity))` is the equivalent when the view is
inserted and removed rather than merely appearing. Pair it with `withAnimation(Motion.resolve(...))`
at the call site — a `.transition` with no animation context does nothing.

### 3. Reveal and layout — `matchedGeometryEffect` for the hero

`matchedGeometryEffect` is the SwiftUI shared element. One per screen, on the thing the user
actually tapped:

```swift
struct HeroCard: View {
    @Namespace private var hero
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var expanded = false

    var body: some View {
        if expanded {
            DetailView()
                .matchedGeometryEffect(id: "hero", in: hero)
                .onTapGesture {
                    withAnimation(Motion.resolve(.morph, reduceMotion: reduceMotion)) { expanded = false }
                }
        } else {
            CardView()
                .matchedGeometryEffect(id: "hero", in: hero)
                .onTapGesture {
                    withAnimation(Motion.resolve(.morph, reduceMotion: reduceMotion)) { expanded = true }
                }
        }
    }
}
```

Under Reduce Motion, skip the geometry match entirely and cross-fade: a matched transition with a
150 ms fade reads as a glitch, because the element is still travelling.

### 4. Flourish — `phaseAnimator` and `keyframeAnimator`

For an effect that is not a state change (a success tick, a listening pulse), `phaseAnimator` is the
modern API and it is interruptible:

```swift
Image(systemName: "checkmark.circle.fill")
    .phaseAnimator([1.0, 1.08, 1.0]) { view, scale in
        view.scaleEffect(scale)
    } animation: { _ in
        reduceMotion ? Motion.reducedFade : Motion.pop
    }
```

`keyframeAnimator` is the right tool when the property path matters — a multi-stop rise, a settle
with one overshoot — because it animates keyframes rather than interpolating between two states:

```swift
Text("Saved")
    .keyframeAnimator(initialValue: 0.0, trigger: saveCount) { view, offset in
        view.offset(y: offset)
    } keyframes: { _ in
        KeyframeTrack {
            CubicKeyframe(-12, duration: 0.12)
            SpringKeyframe(0, duration: 0.28, spring: .init(response: 0.3, dampingFraction: 0.8))
        }
    }
```

Both are iOS 17+. Both need the reduced-motion guard: a keyframe track with no animation is a jump
cut, so fall back to `opacity` with `Motion.reducedFade`.

### 5. Press feedback — `ButtonStyle` + `.sensoryFeedback`

```swift
struct RunePressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.97 : 1)
            .animation(reduceMotion ? Motion.reducedFade : Motion.snap, value: configuration.isPressed)
            .sensoryFeedback(.impact(weight: .light), trigger: configuration.isPressed)
    }
}
```

Haptics are part of the motion budget, not a decoration: one light impact on a primary action, a
success notification on completion, nothing on scroll.

### 6. Reduced motion

`@Environment(\.accessibilityReduceMotion)` is the only correct source — do not read the system
animation setting through private APIs. Every token helper takes it as an argument, so there is one
branch, in one place:

```swift
withAnimation(Motion.resolve(.glide, reduceMotion: reduceMotion)) { showSheet = true }
```

---

## What never animates

| Never | Why |
|---|---|
| A checkout, payment sheet or medical record | `expressive` motion here reads as unserious and, in health, as misleading |
| Text letter-by-letter outside one headline | Unreadable and slow; the rest of the screen arrives first |
| Infinite loops behind content | Kills contrast and battery, and never stops competing for attention |
| Scroll-jacking or virtual scroll | Native scroll must stay native on touch |
| More than one shared element per screen | Two heroes means no hero |
| Anything over 600 ms for a UI state change | Reads as broken, not premium |

## Checklist before you call the motion layer done

- [ ] All five jobs implemented or deliberately skipped per the `motionBudget`
- [ ] Springs from the token table, not ad-hoc `tween` durations
- [ ] Press feedback starts on touch-down
- [ ] One flourish per screen, and none on a checkout, form or health record
- [ ] Reduce Motion path verified on a device, with the content still readable
- [ ] No layout shift on first paint; reveal uses transform + opacity only
- [ ] Haptics fire once per action, never on scroll
- [ ] 60 fps on a mid-range Android; no long tasks during the reveal
