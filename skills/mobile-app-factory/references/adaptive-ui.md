# Adaptive UI — make one build behave well everywhere

The idea router picks the archetype once. This file is about the *runtime*: the same build has to work on a five-year-old Android phone, a 120 Hz iPhone, in Arabic, at 200% text size, on a plane, and with every permission denied. Adapt, do not assume.

Use this after Phase 3 (UI) and before Phase 4 (motion). Phase 4 must only animate what this file says is safe on the current tier.

> Default targets are **native**: Kotlin + Jetpack Compose and Swift + SwiftUI. The snippets below lead with those. React Native / Flutter equivalents are noted where they differ, because the same rules apply to the prototype path.

## 1. The capability ladder

Detect once at startup, cache it, and expose a single environment object to the UI layer.

**Android (Kotlin)**

```kotlin
// platform/AppEnvironment.kt
enum class Tier { LOW, MID, HIGH }

data class AppEnvironment(
    val tier: Tier,
    val reducedMotion: Boolean,
    val boldText: Boolean,
    val fontScale: Float,
    val rtl: Boolean,
    val dark: Boolean,
    val haptics: Boolean,
    val online: Boolean,
    val lowPower: Boolean,
)

fun detectTier(context: Context): Tier {
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val lowRam = am.isLowRamDevice
    val memGb = am.memoryClass / 1024.0            // memoryClass is MB
    return when {
        lowRam || memGb < 3.0 -> Tier.LOW
        memGb < 6.0 -> Tier.MID
        else -> Tier.HIGH
    }
}
```

**iOS (Swift)**

```swift
// Platform/AppEnvironment.swift
enum Tier { case low, mid, high }

struct AppEnvironment {
    var tier: Tier
    var reducedMotion: Bool
    var boldText: Bool
    var fontScale: CGFloat
    var rtl: Bool
    var dark: Bool
    var haptics: Bool
    var online: Bool
    var lowPower: Bool
}

func detectTier() -> Tier {
    let memoryGB = Double(ProcessInfo.processInfo.physicalMemory) / 1_073_741_824
    let cores = ProcessInfo.processInfo.activeProcessorCount
    if memoryGB < 3 || cores <= 2 { return .low }
    if memoryGB < 6 { return .mid }
    return .high
}
```

Keep the logic in one injectable object so previews and tests can force a tier. Compose: pass it through a `CompositionLocal`. SwiftUI: put it in the `Environment` via an `EnvironmentKey`.

**Prototype path (React Native):** `expo-device` `Device.totalMemory` and `Device.isDevice` give the same signal; do not branch on model names there either.

| Tier | Assume | UI rules | Motion rules |
|---|---|---|---|
| low | 2–3 GB RAM, 60 Hz, older GPU, possibly Android Go | list virtualization mandatory (`LazyColumn` / `LazyVStack`), images decoded at view size, no blur/glass, no shadows beyond 1px, no concurrent video + map | fades and opacity only, 150–250 ms, no parallax, no pinned scrub, no blur, 30 fps acceptable |
| mid | 4–6 GB, 60 Hz | one blur max, small Lottie okay, maps with tile caching | transforms + opacity, springs ≤ 400 ms, no more than 2 simultaneous tweens |
| high | 8 GB+, 120 Hz, ProMotion | full design | full timeline, but still stop when offscreen or backgrounded |

**Never branch on device model names.** Branch on measured capability and on user preference. Model lists age badly and invite spoofing.

## 2. Preferences that override capability

Capability is a ceiling; preference is a veto. The user's settings always win.

| Signal | Native source | Effect |
|---|---|---|
| Reduce Motion | Android `Settings.Global.ANIMATOR_DURATION_SCALE` / Compose `LocalMotionDurationScale`; iOS `UIAccessibility.isReduceMotionEnabled` (observe `reduceMotionStatusDidChangeNotification`) | travel becomes a 150 ms fade; parallax, scrub, autoplay and looping stop; progress still updates |
| Bold Text | Android text scaling / Compose font weight; iOS `UIAccessibility.isBoldTextEnabled` | use the 600-weight token, not a synthetic bold; re-measure line heights |
| Font Scale | Compose `LocalDensity.current.fontScale`; iOS `UIFontMetrics` + `@Environment(\.dynamicTypeSize)` | layouts must reflow, not clip; cap decorative display type at ~1.3× but never body |
| Invert / high contrast | Android `AccessibilityManager.isHighTextContrastEnabled`; iOS `UIAccessibility.isInvertColorsEnabled` | verify hairlines survive inversion; do not encode meaning in hue alone |
| Screen reader | `AccessibilityManager.isTouchExplorationEnabled` / `UIAccessibility.isVoiceOverRunning` | disable scroll-jacking and gesture-only actions; announce state changes |
| Low Power Mode | Android `PowerManager.isPowerSaveMode`; iOS `ProcessInfo.processInfo.isLowPowerModeEnabled` | drop to `low` tier motion and pause background refresh |
| RTL | Compose `LocalLayoutDirection`; iOS `UIView.userInterfaceLayoutDirection` | mirror layout, not icons that imply direction (play, chevrons); use `start`/`end`, never `left`/`right` |
| Theme | Compose `isSystemInDarkTheme()`; SwiftUI `@Environment(\.colorScheme)` | three states: system, light, dark. Persist the override; re-read system changes live |

Observe changes rather than reading once:

```kotlin
// Compose
val reduceMotion = !LocalMotionDurationScale.current.isEnabled   // honours the OS animation scale
val fontScale = LocalDensity.current.fontScale
val dark = isSystemInDarkTheme()
```

```swift
// SwiftUI
@Environment(\.accessibilityReduceMotion) private var reduceMotion
@Environment(\.dynamicTypeSize) private var dynamicType
@Environment(\.colorScheme) private var colorScheme
```

**Prototype path (React Native):** `AccessibilityInfo.isReduceMotionEnabled()` plus the `*Changed` listeners, and `PixelRatio.getFontScale()`. On web, listen to the `prefers-reduced-motion` media query rather than reading it once.

## 3. Layout adaptation

- **Width classes**, not device classes: `compact < 380`, `regular 380–599`, `wide ≥ 600` (tablet/foldable). Compose: `BoxWithConstraints`; SwiftUI: `horizontalSizeClass` plus a width check — both update on rotation and split-screen.
- **Safe areas**: `WindowInsets` / `safeAreaInset(edge:)`. Bottom action bars must sit above the home indicator and the keyboard.
- **Keyboard**: Compose `imePadding()` + `BringIntoViewRequester`; SwiftUI `.scrollDismissesKeyboard(.interactively)`. Test with a hardware keyboard too.
- **Foldables / tablets**: two-pane list-detail at `wide`, single column at `regular`. Do not stretch a phone layout to 1024 px.
- **Landscape**: allow it unless the core loop is camera or a game. If locked, say so in the store listing.
- **Text growth**: test at 200% (iOS accessibility sizes XXL–AX5). Rules: labels wrap, buttons grow vertically, charts get a text fallback, no fixed-height rows containing text.
- **Density**: data-dense archetypes (fintech, b2b-field) can use 32–36 dp/pt rows; consumer/health use 44–56. Never below 44×44 touch targets regardless of density.

## 4. Offline and flaky network

Assume the network is optional for anything that is not a live transaction.

```kotlin
data class PendingMutation(
    val id: String,
    val kind: String,
    val payload: String,
    val createdAt: Long,
    val attempts: Int,
)
```

Store the queue in Room (Android) or SwiftData/Core Data (iOS), never in memory, with a client-generated idempotency key.

- **Optimistic UI** with a `pending` badge; reconcile on response; on conflict, keep both and ask the user (never silently overwrite a field capture).
- **Read cache** with stale-while-revalidate; show `last updated 4m ago` rather than a spinner over stale content.
- **Retry** with jittered backoff, cap attempts, and a manual "Retry now".
- **Offline banner** is persistent but not modal. A modal offline screen in a field app is a bug.
- **Media**: capture locally first, upload later, compress to the display size (not the sensor size) unless the archetype needs originals (camera-photo, inspections).
- **Conflict policy by archetype**: last-write-wins is fine for preferences; never for money, health entries, or inspection evidence.
- **Background work**: WorkManager (Android) / `BGTaskScheduler` (iOS), each with a declared reason. Do not run a foreground service just to poll.

## 5. Permission adaptation

Every permission has four states, and the UI must handle all four: `undetermined`, `granted`, `denied`, `blocked` (cannot ask again).

| State | UI |
|---|---|
| undetermined | explain the benefit *before* the system prompt, using a pre-permission sheet; only ask when the feature is first used |
| granted | proceed; show a subtle indicator if the sensor is active (location, mic, camera) |
| denied | feature-level empty state with "Enable" that re-requests once, plus a manual fallback where possible |
| blocked | explain and deep-link to Settings (`Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)` / `UIApplication.openSettingsURLString`), keeping the manual fallback |

Ask with the platform API — `rememberLauncherForActivityResult(RequestPermission())` on Compose, `.requestAuthorization` on iOS — never a custom dialog pretending to be the system one.

Manual fallbacks that keep the app usable:

- Location denied → postcode/ZIP entry or a city picker.
- Camera denied → photo-library import, or manual entry for a scanner.
- Notifications denied → in-app inbox and a visible streak/status; never nag.
- Health denied → manual entry; do not hide the whole app.
- Photos limited (iOS) → show the selected set and a "Manage" entry.

## 6. Motion adaptation

The motion layer must consume the environment, not re-detect it.

```kotlin
data class MotionProfile(
    val durationMs: Int,
    val offsetDp: Int,
    val staggerMs: Int,
    val parallax: Boolean,
    val scrub: Boolean,
)

fun motionFor(env: AppEnvironment): MotionProfile = when {
    env.reducedMotion -> MotionProfile(150, 0, 0, false, false)
    env.tier == Tier.LOW || env.lowPower -> MotionProfile(200, 8, 20, false, false)
    env.tier == Tier.MID -> MotionProfile(300, 16, 40, false, false)
    else -> MotionProfile(450, 24, 60, true, true)
}
```

```swift
struct MotionProfile {
    var duration: Double
    var offset: CGFloat
    var stagger: Double
    var parallax: Bool
    var scrub: Bool
}

func motionFor(_ env: AppEnvironment) -> MotionProfile {
    if env.reducedMotion { return .init(duration: 0.15, offset: 0, stagger: 0, parallax: false, scrub: false) }
    if env.tier == .low || env.lowPower { return .init(duration: 0.2, offset: 8, stagger: 0.02, parallax: false, scrub: false) }
    if env.tier == .mid { return .init(duration: 0.3, offset: 16, stagger: 0.04, parallax: false, scrub: false) }
    return .init(duration: 0.45, offset: 24, stagger: 0.06, parallax: true, scrub: true)
}
```

Rules:

- Pause animations when the screen is not visible (Compose lifecycle `repeatOnLifecycle`, SwiftUI `scenePhase`, GSAP `visibilitychange` on web).
- Cancel on disposal / `onDisappear`; no orphaned animation loops.
- Animate `transform` and `opacity` (`graphicsLayer` / `.scaleEffect` + `.opacity`); never animate `width`, `height`, `top`, or `margin` in a list.
- Do not start an entrance animation on every focus — only the first mount, and only above the fold.
- Keep the reduce-motion path *readable*: all content visible, no zero-opacity leftovers.
- Compose: respect `LocalMotionDurationScale` automatically by using the standard animation APIs. SwiftUI: honour `accessibilityReduceMotion` in every custom `withAnimation`.

## 7. Native surface adaptation

Add these only when they serve the core loop; each one is a store declaration and a QA surface.

| Surface | Use when | Notes |
|---|---|---|
| Home-screen widget | the user checks one number daily (streak, balance, next shift) | iOS WidgetKit + Android Glance; deep-link into the exact screen; no interactive login |
| Live Activity / ongoing notification | a time-boxed live state (delivery, workout, timer) | iOS ActivityKit requires a push token and a clear end state; Android foreground service must declare its type |
| Dynamic Island | same as Live Activity, compact | do not duplicate the full UI |
| App shortcuts / quick actions | 2–4 repeat actions | long-press menu; also expose in-app |
| Deep links / universal links | sharing, notifications, web-to-app | one routing table, tested cold-start and warm-start; handle deleted content |
| Share extension | receiving links/photos into the app | iOS extension target; Android `ACTION_SEND` |
| Haptics | confirmations, toggles, errors | respect the system haptics setting; never on scroll |
| Background refresh | sync that must happen without opening | declare a reason; budget battery; show last-sync time |
| Watch / Wear | glanceable companion only | not a second app; no purchase flow |

## 8. Personalisation without a data swamp

- Personalise **presentation**, not entitlement: order, density, shortcuts, and defaults. Never change price, health advice, or safety information by profile.
- Store preferences locally first; sync only what the user would expect to follow them.
- Offer an explicit "Reset personalisation" control.
- If you use behavioural analytics, disclose it in the privacy manifest/data safety form and provide an opt-out where required (ATT on iOS for cross-app tracking).
- Recommendations must have a visible reason ("Because you logged sleep 4 nights") and a way to dismiss.

## 9. Feature flags and staged rollout

```kotlin
data class Flag(val key: String, val enabled: Boolean, val rollout: Int, val minVersion: String? = null)

fun isOn(flag: Flag, userId: String, appVersion: String): Boolean {
    if (!flag.enabled) return false
    if (flag.minVersion != null && appVersion < flag.minVersion) return false
    return (stableHash(userId) % 100) < flag.rollout
}
```

- Default **off** for anything that touches payments, health, or permissions.
- Flags must be readable offline (cached last-known state) and must fail closed.
- Kill switches for: AI provider, map tiles, upload pipeline, push.
- Log the flag state with every crash report; otherwise you cannot reproduce.
- Remove flags within two releases; stale flags are how apps rot.

## 10. Adaptive QA matrix

Run this before Phase 7 sign-off. It is the minimum, not the full `qaFocus` list from the profile.

| Axis | Cases |
|---|---|
| Device | low-tier Android, mid-tier Android, iPhone with notch, iPad or foldable |
| Text | default, 200% font scale, Bold Text on |
| Motion | default, Reduce Motion on, Low Power Mode on |
| Theme | system light, system dark, in-app override, high contrast |
| Language | English, one RTL locale, one long-string locale (German) |
| Network | wifi, 3G throttled, airplane mode, captive portal, offline→online mid-write |
| Permission | all granted, each denied, blocked-after-denial |
| Lifecycle | cold start, warm start, background 30 min, rotation, incoming call |
| Store | screenshots at required sizes, dynamic type doesn't clip store previews |

Pass condition: no clipped text, no unreachable action, no blank screen, no lost write, and every reduced-motion screen still tells the whole story.
