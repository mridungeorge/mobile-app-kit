# Adaptive UI — make one build behave well everywhere

The idea router picks the archetype once. This file is about the *runtime*: the same build has to work on a five-year-old Android phone, a 120 Hz iPhone, in Arabic, at 200% text size, on a plane, and with every permission denied. Adapt, do not assume.

Use this after Phase 3 (UI) and before Phase 4 (motion). Phase 4 must only animate what this file says is safe on the current tier.

## 1. The capability ladder

Detect once at startup, cache in memory, and expose a single `AppEnvironment`:

```ts
// src/platform/environment.ts
import { Platform, Dimensions, PixelRatio, AccessibilityInfo } from "react-native";

export type Tier = "low" | "mid" | "high";

export type AppEnvironment = {
  tier: Tier;
  reducedMotion: boolean;
  boldText: boolean;
  fontScale: number;
  rtl: boolean;
  dark: boolean;
  haptics: boolean;
  online: boolean;
  lowPower: boolean;
  screen: { width: number; height: number };
};

export const deviceTier = (): Tier => {
  const memory = (globalThis as any).performance?.memory?.jsHeapSizeLimit ?? 0;
  const cores = (globalThis as any).navigator?.hardwareConcurrency ?? 4;
  if (Platform.OS === "web") return cores <= 2 || memory < 4e8 ? "low" : cores <= 4 ? "mid" : "high";
  // expo-device: Device.deviceType, Device.totalMemory, Platform.constants
  return "mid"; // replace with a real device check; see below
};
```

For native, prefer `expo-device` + `expo-application`:

```ts
import * as Device from "expo-device";

const tier: Tier =
  (Device.totalMemory ?? 4e9) < 3e9 ? "low"
  : (Device.totalMemory ?? 4e9) < 6e9 ? "mid"
  : "high";
```

| Tier | Assume | UI rules | Motion rules |
|---|---|---|---|
| low | 2–3 GB RAM, 60 Hz, older GPU, possibly Android Go | list virtualization mandatory, images resized to view size, no blur/glass, no shadows beyond 1px, no concurrent video + map | fades and opacity only, 150–250 ms, no parallax, no pinned scrub, no blur, 30 fps acceptable |
| mid | 4–6 GB, 60 Hz | one blur max, small Lottie okay, maps with tile caching | transforms + opacity, springs ≤ 400 ms, no more than 2 simultaneous tweens |
| high | 8 GB+, 120 Hz, ProMotion | full design | full timeline, but still stop when offscreen or backgrounded |

Expose it to components with a tiny context, not a global mutable:

```tsx
const EnvironmentContext = createContext<AppEnvironment>(defaultEnv);
export const useEnvironment = () => useContext(EnvironmentContext);
```

**Never branch on device model names.** Branch on measured capability and on user preference. Model lists age badly and invite spoofing.

## 2. Preferences that override capability

Capability is a ceiling; preference is a veto. The user's settings always win.

| Signal | Source | Effect |
|---|---|---|
| Reduce Motion | `AccessibilityInfo.isReduceMotionEnabled()` (RN), `useReducedMotion()` (web), `MediaQuery.of(context).disableAnimations` (Flutter) | travel becomes a 150 ms fade; parallax, scrub, autoplay and looping stop; progress still updates |
| Bold Text | `AccessibilityInfo.isBoldTextEnabled()` | use the 600-weight token, not a synthetic bold; re-measure line heights |
| Font Scale | `PixelRatio.getFontScale()` / `MediaQuery.textScaler` | layouts must reflow, not clip; cap decorative display type at ~1.3× but never body |
| Invert / high contrast | `AccessibilityInfo.isInvertColorsEnabled()` | verify hairlines survive inversion; do not encode meaning in hue alone |
| Screen reader | `AccessibilityInfo.isScreenReaderEnabled()` | disable scroll-jacking and gesture-only actions; announce state changes |
| Low Power Mode | `expo-battery` `getPowerStateAsync()` | drop to `low` tier motion and pause background refresh |
| RTL | `I18nManager.isRTL` | mirror layout, not icons that imply direction (play, chevrons); use `start`/`end`, never `left`/`right` |
| Theme | `useColorScheme()` + in-app override | three states: system, light, dark. Persist the override; re-read system changes live |

```tsx
useEffect(() => {
  const subs = [
    AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion),
    AccessibilityInfo.addEventListener("boldTextChanged", setBoldText),
    AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader)
  ];
  AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  return () => subs.forEach((s) => s.remove());
}, []);
```

On web, listen to the media queries rather than reading once:

```ts
const mq = matchMedia("(prefers-reduced-motion: reduce)");
mq.addEventListener("change", (e) => setReducedMotion(e.matches));
```

## 3. Layout adaptation

- **Width classes**, not device classes: `compact < 380`, `regular 380–599`, `wide ≥ 600` (tablet/foldable). Use `useWindowDimensions()`, which updates on rotation and split-screen.
- **Safe areas**: `react-native-safe-area-context`; bottom action bars must sit above the home indicator and the keyboard.
- **Keyboard**: `KeyboardAvoidingView` + `keyboardShouldPersistTaps="handled"` on every form; test with a hardware keyboard too.
- **Foldables / tablets**: two-pane list-detail at `wide`, single column at `regular`. Do not stretch a phone layout to 1024 px.
- **Landscape**: allow it unless the core loop is camera or a game. If locked, say so in the store listing.
- **Text growth**: test at 200% (`fontScale` 2.0). Rules: labels wrap, buttons grow vertically, charts get a text fallback, no fixed-height rows containing text.
- **Density**: data-dense archetypes (fintech, b2b-field) can use 32–36 px rows; consumer/health use 44–56 px. Never below 44×44 pt touch targets regardless of density.

## 4. Offline and flaky network

Assume the network is optional for anything that is not a live transaction.

```ts
type Mutation = { id: string; kind: string; payload: unknown; createdAt: number; attempts: number };
```

- **Queue writes** in SQLite (not memory), with an idempotency key generated on the client.
- **Optimistic UI** with a `pending` badge; reconcile on response; on conflict, keep both and ask the user (never silently overwrite a field capture).
- **Read cache** with stale-while-revalidate; show `last updated 4m ago` rather than a spinner over stale content.
- **Retry** with jittered backoff, cap attempts, and a manual "Retry now".
- **Offline banner** is persistent but not modal. A modal offline screen in a field app is a bug.
- **Media**: capture locally first, upload later, compress to the display size (not the sensor size) unless the archetype needs originals (camera-photo, inspections).
- **Conflict policy by archetype**: last-write-wins is fine for preferences; never for money, health entries, or inspection evidence.

## 5. Permission adaptation

Every permission has four states, and the UI must handle all four: `undetermined`, `granted`, `denied`, `blocked` (cannot ask again).

| State | UI |
|---|---|
| undetermined | explain the benefit *before* the system prompt, using a pre-permission sheet; only ask when the feature is first used |
| granted | proceed; show a subtle indicator if the sensor is active (location, mic, camera) |
| denied | feature-level empty state with "Enable" that re-requests once, plus a manual fallback where possible |
| blocked | explain, deep-link to Settings (`Linking.openSettings()`), and keep the manual fallback |

Manual fallbacks that keep the app usable:

- Location denied → postcode/ZIP entry or a city picker.
- Camera denied → photo-library import, or manual entry for a scanner.
- Notifications denied → in-app inbox and a visible streak/status; never nag.
- Health denied → manual entry; do not hide the whole app.
- Photos limited (iOS) → show the selected set and a "Manage" entry.

## 6. Motion adaptation

The motion layer must consume the environment, not re-detect it.

```ts
export const motionFor = (env: AppEnvironment) => {
  if (env.reducedMotion) return { duration: 0.15, y: 0, stagger: 0, parallax: false, scrub: false };
  if (env.tier === "low" || env.lowPower) return { duration: 0.2, y: 8, stagger: 0.02, parallax: false, scrub: false };
  if (env.tier === "mid") return { duration: 0.3, y: 16, stagger: 0.04, parallax: false, scrub: false };
  return { duration: 0.45, y: 24, stagger: 0.06, parallax: true, scrub: true };
};
```

Rules:

- Pause timelines when the screen is not focused (`useIsFocused`, `visibilitychange`).
- Cancel on unmount; no orphan `requestAnimationFrame` loops.
- Animate `transform` and `opacity`; never animate `width`, `height`, `top`, or `margin` in a list.
- Do not start an entrance animation on every focus — only the first mount, and only above the fold.
- Keep the reduce-motion path *readable*: all content visible, no zero-opacity leftovers.
- On web, GSAP `matchMedia` plus `ScrollTrigger` cleanup; on RN, Reanimated `useReducedMotion()`.

## 7. Native surface adaptation

Add these only when they serve the core loop; each one is a store declaration and a QA surface.

| Surface | Use when | Notes |
|---|---|---|
| Home-screen widget | the user checks one number daily (streak, balance, next shift) | iOS WidgetKit + Android Glance; deep-link into the exact screen; no interactive login |
| Live Activity / ongoing notification | a time-boxed live state (delivery, workout, timer) | iOS ActivityKit requires a push token and a clear end state; Android foreground service must declare its type |
| Dynamic Island | same as Live Activity, compact | do not duplicate the full UI |
| App shortcuts / quick actions | 2–4 repeat actions | long-press menu; also expose in-app |
| Deep links / universal links | sharing, notifications, web-to-app | one router table, tested cold-start and warm-start; handle deleted content |
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

```ts
type Flag = { key: string; enabled: boolean; rollout: number; minVersion?: string };
const bucket = hash(userId ?? deviceId) % 100;
const on = flag.enabled && bucket < flag.rollout;
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
