# Component map — Rune kit → mobile

Rune's `rune-kit` is desktop-first but its component vocabulary ports cleanly. This table maps every component confirmed in `crates/rune-kit/src/lib.rs` to the nearest mobile primitive, so a screen spec written in Rune terms can be built in any of the five supported stacks without inventing a new widget set.

Read this with `assets/rn/components/` (the nine ready-made RN components) and `design-language.md` (anatomy and variants).

## Rules before the table

1. **One kit per app.** Pick the column that matches the stack and use it for every component. On native builds that means Material 3 in Compose and platform SwiftUI on iOS — do not add a third-party UI kit on top of the platform one. Mixing RN core + Tamagui + a random UI lib is what makes an app look assembled.
2. **Re-skin, don't re-invent.** Map Rune anatomy onto the platform primitive: the button is still a button, it just gets height 44, radius 6, accent fill and a 0.98 press scale.
3. **Platform navigation wins.** Use native stacks/tabs/modals (SwiftUI `NavigationStack`, Compose Navigation; Expo Router or Flutter `go_router` on the prototype paths). Rune's `Page`/`Sidebar`/`Toolbar` are desktop shells; on mobile they become a nav bar, tab bar, and bottom sheet.
4. **Every interactive component needs**: label, role, state (default/hover/pressed/focused/disabled/loading/error), and a 44×44 minimum hit area. If it has no disabled state in the spec, it is incomplete.
5. **No component is added for decoration.** If the screen works without it, cut it.

## The map

Legend: **Compose** = Jetpack Compose + Material 3 (Android default), **SwiftUI** = iOS native (iOS default), **RN** = React Native + the chosen kit (prototype), **Flutter** = Material 3 (prototype).

| Rune (`rune-kit`) | RN | Flutter | SwiftUI | Compose | Notes |
|---|---|---|---|---|---|
| `Button` | `Button` (Pressable) | `FilledButton` | `Button` | `Button` | Primary/secondary/ghost; 44 height; one primary per screen |
| `IconButton` | `Pressable` + icon | `IconButton` | `Button` with `Label` hidden | `IconButton` | Always `accessibilityLabel`; 44×44 hit area |
| `Badge` | `View` + text | `Badge` | `Text` in capsule | `Badge` | Counts or status; no more than one per row |
| `Divider` | `View` 1px | `Divider` | `Divider` | `HorizontalDivider` | Hairline token, inset 16 on list rows |
| `Card` | `Surface` asset | `Card` | `GroupBox` / custom | `Card` | Fill + 1px border, radius 8; no big shadow |
| `Field` | label + input + error | `TextFormField` | `LabeledContent` | `OutlinedTextField` | Label above 11.5/500; error text 12px, not colour-only |
| `TextField` | `TextInput` | `TextField` | `TextField` | `OutlinedTextField` | 44 height; clear button; `textContentType`/autofill |
| `TextArea` | `TextInput multiline` | `TextField(maxLines)` | `TextEditor` | `OutlinedTextField` | Min 3 lines; counter only when a limit exists |
| `Checkbox` | `Checkbox` | `Checkbox` | `Toggle` (checkbox style) | `Checkbox` | Whole row tappable, not just the box |
| `RadioGroup` | `RadioButton` group | `RadioListTile` | `Picker` (inline) | `RadioButton` group | Use for ≤ 5 options; else select |
| `Switch` | `Switch` asset | `Switch` | `Toggle` | `Switch` | 38×22 track, 18 knob; morph/snap; label + description |
| `SegmentedControl` | `SegmentedControl` | `SegmentedButton` | `Picker(.segmented)` | `SingleChoiceSegmentedButtonRow` | 2–4 segments; selection slides with `snap` |
| `Select` | bottom sheet list | `DropdownMenu` | `Menu` / `Picker` | `ExposedDropdownMenuBox` | Mobile: sheet beats a native dropdown for > 6 options |
| `Combobox` | sheet + search field | `Autocomplete` | searchable `Picker` | custom + `TextField` | Debounce 200 ms; show "no results" |
| `PopupList` | action sheet | `PopupMenuButton` | `Menu` | `DropdownMenu` | Destructive item last, in danger colour |
| `Menu` / `context_menu` | long-press action sheet | `showMenu` | `contextMenu` | `DropdownMenu` | Long-press must have a visible alternative |
| `Dialog` | `Modal` / `Alert` | `AlertDialog` | `alert` / `.sheet` | `AlertDialog` | Destructive confirm requires a verb button ("Delete", not "OK") |
| `Popover` | anchored `Modal` | `showMenu` / overlay | `.popover` | `Popup` | Dismiss on outside tap and back |
| `Tooltip` | long-press hint | `Tooltip` | `.help()` | `TooltipBox` | Never the only explanation; 44 target |
| `HoverCard` | n/a (web only) | n/a | n/a | n/a | Skip on touch; use a detail sheet |
| `Accordion` | `Accordion` (controlled) | `ExpansionTile` | `DisclosureGroup` | custom `AnimatedVisibility` | One open at a time unless comparison matters |
| `Collapsible` | `LayoutAnimation` view | `AnimatedSize` | `DisclosureGroup` | `AnimatedVisibility` | Height animation; respect reduce motion |
| `List` / `ListItem` | `FlatList` / `SectionList` | `ListView.builder` | `List` | `LazyColumn` | Virtualise; separator inset 16; swipe actions |
| `Table` | `FlatList` rows + header | `DataTable` | `Table` (iOS 16+) | custom `LazyColumn` | On phone: cards or a horizontal-scroll table, not 8 columns |
| `Tree` / `FileTree` | nested `FlatList` | `ExpansionTile` recursion | `OutlineGroup` | custom | Rare on mobile; prefer drill-down screens |
| `Tabs` / `TabStrip` | bottom tabs (Expo Router) | `NavigationBar` | `TabView` | `NavigationBar` | 3–5 top-level destinations; badges for counts |
| `Page` / `Sidebar` / `SplitView` | stack + tabs; split at ≥ 600 px | `NavigationRail` + body | `NavigationSplitView` | `NavigationSuiteScaffold` | Desktop shells have no direct phone equivalent |
| `Toolbar` | header (`expo-router` header) | `AppBar` | `.toolbar` | `TopAppBar` | Max 2 trailing actions + overflow |
| `WindowTitlebar` | n/a | n/a | n/a | n/a | Not applicable to mobile |
| `Toast` / `ToastStack` | `Toast` provider | `SnackBar` | custom overlay | `Snackbar` | Bottom, 4 s, one at a time, action optional |
| `Loader` | `ActivityIndicator` | `CircularProgressIndicator` | `ProgressView` | `CircularProgressIndicator` | Show after 300 ms, not immediately |
| `Spinner` | small `ActivityIndicator` | small circular | small `ProgressView` | small circular | Inline only; never a full-screen spinner over cached data |
| `Progress` | `View` bar | `LinearProgressIndicator` | `ProgressView(value:)` | `LinearProgressIndicator` | Determinate where possible; label the value |
| `ProgressCircle` | `react-native-svg` ring | `CircularProgressIndicator` | `Circle` trim | `CircularProgressIndicator` | Health/fitness default; text value beside it |
| `RollingText` | `Animated.Text` per digit | custom | `.contentTransition(.numericText())` | `AnimatedContent` | Tabular numerals; no rolling for money totals unless stable |
| `ScrollBar` | platform default | platform default | platform default | platform default | Do not custom-draw on mobile; keep native affordance |
| `ImageZoom` | `react-native-image-zoom`/gesture | `InteractiveViewer` | `zoomable` custom | `Modifier.pointerInput` | Pinch + double-tap; caption outside the zoom |
| `Keybind` / `ShortcutRecorder` | n/a (external keyboard) | `Shortcuts` | `keyboardShortcut` | `onKeyEvent` | iPad/Android tablet only; hide on phone |
| `Palette` (command palette) | search screen | `SearchAnchor` | `.searchable` | `SearchBar` | Power feature; not a primary nav |
| `Markdown` | `react-native-markdown-display` | `flutter_markdown` | `AttributedString` | custom | Sanitise; links open in-app browser |
| `Skeleton` (feedback) | `Skeleton` component | shimmer box | redacted | shimmer box | Match final layout; no spinner+skeleton together |
| `EmptyState` (pattern) | `assets/rn/components` pattern | custom | `ContentUnavailableView` | custom | Icon 96, title, 2-line body, one action |
| `Sheet` (pattern) | `@gorhom/bottom-sheet` | `showModalBottomSheet` | `.sheet` + detents | `ModalBottomSheet` | Drag + scrim dismiss; keep state on dismiss |
| `Banner` (pattern) | inline card | `MaterialBanner` | custom | `Snackbar`/inline | Offline/permission banners are persistent, not modal |

## Components the Rune kit does not have (build or skip)

These appear in real specs and need an explicit decision:

| Need | Build from | Rule |
|---|---|---|
| Date/time picker | platform picker | Never a custom wheel; timezone-aware |
| Number pad / currency input | `TextInput` + formatting | Locale decimal separator; never parse floats for money |
| OTP / PIN | 6 boxes or one field | Support paste and password managers |
| Avatar / avatar stack | `Image` + initials fallback | Alt text = person's name |
| Chip / filter pill | button with `selected` | 44 height; wrap, don't horizontal-scroll a long filter list |
| Stepper / quantity | − value + | Long-press repeat; disable at bounds |
| Rating stars | 5 buttons | Accessible as a single slider/selection, not 5 unlabeled icons |
| Colour picker | swatches | Never required for the core loop |
| Chart | `victory-native` / `fl_chart` / Swift Charts | Text summary + table fallback; no colour-only encoding |
| Map | MapLibre / Mapbox / MapKit | Static fallback when tiles fail; attribution required |
| Camera / scanner | `expo-camera` / ML Kit | Manual entry fallback; permission pre-prompt |
| Signature pad | `react-native-signature-canvas` | Clear + undo; export with timestamp |
| Video player | `expo-video` / `video_player` | Captions, background behaviour, resume |
| Calendar / agenda | `react-native-calendars` | Empty days are fine; do not fake events |

## State matrix every component spec must cover

For each component used, write these lines into `.mobile/02-design.md`:

```
Component: Switch
States:    off · on · disabled · loading (optimistic save) · error (revert + toast)
Sizes:     38×22 (default) only
Motion:    morph 300ms / bounce .16; reduce-motion = 150ms cross-fade
A11y:      role=switch, label from adjacent text, value announced, 44×44 target
Platform:  iOS haptic on toggle; Android ripple off (track only)
```

If a state is not defined, the UI builder will invent one — and it will be the wrong one.

## Composition recipes

**Settings screen.** `List` of `SectionHeader` + rows (`ListItem` with trailing `Switch`/`Select`/chevron), grouped in one `Card` with inset dividers. Destructive action in its own section, danger text, `Dialog` confirm.

**Onboarding.** `Page`-style horizontal pager, 3 cards max, one decision per card, `Button` pinned above the safe area, skip always visible, no permission prompt until the feature is used.

**Feed.** `List` + `Card` per item, `Skeleton` on first load, pull-to-refresh, `EmptyState` with a create action, `Toast` for failed optimistic actions.

**Detail + actions.** Scroll content, sticky `Toolbar`, bottom action bar with one primary `Button` and an overflow `Menu`; `Sheet` for secondary actions; confirm destructive with `Dialog`.

**Form.** `Field` stack, 16 gutter, 24 section gap, inline validation on blur (not on every keystroke), submit pinned, error summary at top with focus jump on submit.

**Paywall.** One plan table (`SegmentedControl` monthly/annual), benefits as 3 rows max, price + renewal terms in 11.5 caption, restore purchases, terms/privacy links. No fake countdowns or pre-checked consent.
