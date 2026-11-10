# UX checklist — the pass/fail list before screenshots

Use this in Phase 2 (design spec), Phase 3 (build), and Phase 7 (review). Every item is binary: **pass**, **fail**, or **not applicable with a written reason**. "Mostly" is a fail. The reviewer blocks on any fail in sections 1–5.

## 1. First run and onboarding

- [ ] Cold start reaches interactive content in **< 2 s** on a mid-tier device; a splash is not a loading screen for a spinner.
- [ ] Onboarding is **≤ 3 steps**, one decision per step, and every step has a visible Skip (unless legally required, e.g. health consent).
- [ ] The value proposition is readable **without** scrolling and without animation completing.
- [ ] No account wall before the user sees the core value, unless the archetype requires identity (fintech, b2b, dating). If it does, say why on the sign-in screen.
- [ ] Sign in with Apple is offered wherever third-party social login exists (Apple 4.8).
- [ ] Permissions are requested **in context**, after a pre-prompt that explains the benefit. No permission stack on first launch.
- [ ] The app works in a guest/offline state wherever the profile says accounts are optional.
- [ ] Restoring a purchase is reachable without signing in.

## 2. Core loop

- [ ] The primary action is visible on the first screen of the loop, reachable one-handed, and named with a verb.
- [ ] The loop completes end to end without a dead end, placeholder, or "coming soon".
- [ ] Every destructive action has undo or a confirm; money/health/evidence actions always confirm.
- [ ] Back navigation is predictable: system back, edge swipe, and the on-screen back all do the same thing.
- [ ] Interruptions are safe: call, notification, backgrounding, rotation, and process death mid-write do not lose data.
- [ ] Deep links open the right screen from cold start, warm start, and while signed out.
- [ ] Sharing/export produces something a recipient can open (no proprietary blob without explanation).

## 3. States (every screen, every list, every form)

For each screen, all six states must exist and be designed — not left to the framework:

| State | Pass condition |
|---|---|
| **Empty** | Explains what will appear, why it is empty, and one action to fill it. No "No data". |
| **Loading** | Skeleton or inline indicator after 300 ms; never a full-screen spinner over cached content. |
| **Partial** | Cached/stale content is visible with a "last updated" timestamp and a retry. |
| **Error** | Plain-language cause + retry + alternate path (offline, support). No raw codes or stack traces. |
| **Success** | Confirmation is visible without a toast that disappears before it is read. |
| **Disabled / locked** | Explains *why* and what unlocks it; no mystery grey buttons. |

- [ ] Forms validate **on blur**, show errors next to the field, and focus the first error on submit.
- [ ] The keyboard never covers the submit button or the active field.
- [ ] Lists virtualise above 30 items; pull-to-refresh does not duplicate rows.
- [ ] No layout shift when images or fonts load (reserve aspect ratio and line height).
- [ ] Truncation is deliberate: titles 2 lines max, body clamps with an expand affordance where needed.

## 4. Accessibility (blocking)

- [ ] Every icon-only control has an `accessibilityLabel` / `semanticLabel` / `contentDescription`.
- [ ] Touch targets are **≥ 44×44 pt** (iOS) / **≥ 48×48 dp** (Android), including the visual padding around small icons.
- [ ] Screen-reader order matches visual order; decorative elements are hidden; headings are marked as headings.
- [ ] Every image has alt text, or is explicitly decorative. Charts have a text summary of the values.
- [ ] Contrast: body **≥ 4.5:1**, large text **≥ 3:1**, UI boundaries **≥ 3:1**. Check both themes.
- [ ] Colour is never the only carrier of meaning (error, status, selected, required).
- [ ] Text survives **200% font scale** on Android and the largest Dynamic Type on iOS without clipping or overlap.
- [ ] Reduce Motion is respected; with it on, no content is hidden and no action depends on a gesture animation.
- [ ] Bold Text / high contrast / invert colours do not break hairlines or focus rings.
- [ ] Focus order is logical on iPad/Android tablet with a keyboard; focus ring is visible.
- [ ] Captions or transcripts exist for any video/audio the app produces or plays.
- [ ] Haptics and sounds are supplementary; every one has a visual equivalent.
- [ ] RTL mirroring is correct if an RTL locale ships; directional icons are not mirrored (play, chevrons that mean "next").

## 5. Store-sensitive UX (these cause rejections)

- [ ] **Account deletion** is in-app, reachable in ≤ 3 taps from Settings, and there is a public web link (Apple 5.1.1(v), Play).
- [ ] **UGC**: report, block, and filter are reachable from every piece of content; the developer contact is published; a moderation response process exists (Apple 1.2).
- [ ] **AI output**: a report/flag control exists on every generated result, and the provider/data-sharing disclosure is visible before first use.
- [ ] **Paywall**: price, billing period, renewal terms, cancellation path, restore, Terms and Privacy are all visible before purchase. No fake urgency, no pre-checked consent, no hidden close button.
- [ ] **Digital goods** use IAP/Play Billing; physical goods/services use the permitted external path; no "subscribe on our website" link unless the region/entitlement permits it.
- [ ] **Kids**: no ads or third-party analytics in the child experience; parental gate before external links or purchases; no manipulative reward loops.
- [ ] **Health**: no diagnostic claims; a "not medical advice" statement where relevant; export and delete exist.
- [ ] **Location**: the purpose string matches the actual use; the app still works with location denied; background location is justified in-app.
- [ ] **Notifications**: opt-in is not required to use the app; the settings screen can turn each category off.
- [ ] **Demo account** exists for review and the credentials are in App Review information / Play console.
- [ ] No placeholder text, lorem ipsum, "TODO", broken images, or empty tabs anywhere in the submitted build.
- [ ] Screenshots show the **real app** at the required sizes, with no device frames that misrepresent the UI, and no claims the app cannot demonstrate.

## 6. Content and tone

- [ ] Error copy says what happened and what to do next, in the user's language. No "Oops!", no blame.
- [ ] Button labels are verbs and specific ("Save changes", not "Submit").
- [ ] Empty states and permission prompts use the same nouns as the rest of the app.
- [ ] Numbers, dates, currency, and units follow the device locale; no hard-coded `$` or `MM/DD/YYYY`.
- [ ] Legal/marketing claims have evidence or are removed ("fastest", "cures", "100% private", "#1").
- [ ] A first-time user can name what the app does after 10 seconds without reading the store listing.

## 7. Performance and reliability

- [ ] No frame drops below 55 fps during the primary scroll on a mid-tier device (30 fps floor on low-tier).
- [ ] Images are resized to their display size and cached; no 4000 px JPEG in a 64 px avatar.
- [ ] Memory does not grow across 20 loop repetitions; no leaked timers, listeners, or subscriptions.
- [ ] App size is justified; no unused fonts, videos, or SDKs.
- [ ] Battery: no continuous GPS/Bluetooth/animation when the screen is off or the feature is not in use.
- [ ] Crash-free on the release build (not just debug), including cold start with no network.
- [ ] Network calls have timeouts, cancellation, and retry with backoff; no infinite spinners.
- [ ] Offline queue survives process death and reconciles without duplicate writes.

## 8. Platform conventions

- [ ] iOS: edge-swipe back works; sheet detents feel native; large title collapses; haptics on confirm/destructive.
- [ ] Android: predictive back works; ripple is present where expected; system font scaling respected; themed icon and splash provided.
- [ ] Status bar and navigation bar contrast is correct in both themes; no content under the notch or home indicator.
- [ ] Tablet/foldable: layout uses the extra width (two-pane or max-width content) rather than stretching.
- [ ] Orientation is either supported properly or explicitly locked with a reason.

## 9. Reviewer's one-screen scorecard

Copy this into `.mobile/07-review.md`:

```
UX verdict: PASS | FAIL
Blocking fails: <section.item> ...
States missing: <screen: state> ...
A11y fails: <component: issue> ...
Store-sensitive fails: <rule> ...
Perf notes: <device, fps, cold start, size>
Evidence: screenshots at <paths>, recording at <path>
```

A PASS requires zero blocking fails in sections 1–5 and no unresolved item in section 9. Everything else becomes a follow-up ticket, not a launch blocker.
