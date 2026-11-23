# Design — Rune, restrained

## Tokens
- Spacing: **4/8/12/16/24**. 4 label→value, 8 inside a row, 12 between rows, 16 screen margin,
  24 section break.
- Type: SF Pro / Roboto; 34 display, 22 title, 17 body, 13 caption. Dynamic Type / font scale to 200%.
- Colour: neutral surface `#F7F7F5`, ink `#141414`, one accent `#3B6E5A`, success `#4F7A52`.
- Borders: 1px **hairline** at 12% ink; no drop shadows. Separation comes from space.
- Radii: 10 controls, 16 cards, 999 pills.

## Today
Header (title + date), one card per habit with a 44pt check circle, streak caption, and a weekly
progress ring. Primary action is the check circle; there is no floating button. Empty state names
the one action ("Add your first habit").

## History
A 30-column grid of 8pt dots per habit, 4/8 spacing. Completed = accent, missed = hairline outline,
future = transparent. Values are readable as text in the accessibility label.

## States
Loading: skeleton rows, no spinner. Empty: one sentence + one action. Offline: inline banner,
cached data stays rendered. Error: retry action, no modal.

## Motion (settle 300 / snap 250)
Rows **settle** in with a 24ms stagger on first appearance; the check circle **snaps** to filled
with a spring; the progress ring animates once per check-in. Reduced Motion: opacity-only 150ms
fade, no stagger, no ring sweep. Never animate the paywall or the export sheet.

## Adaptive
Width classes: compact single column; medium two-column history; large max 640pt content.
200% text: cards grow, no fixed heights, check circle stays 44pt. Landscape keeps Today scrollable.
