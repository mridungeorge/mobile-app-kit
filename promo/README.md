# Promo artwork source

The README banner and the Instagram promo are rendered from HTML, not exported from a design tool.
Everything shares [`promo.css`](promo.css), which carries the same tokens as the Halcyon demo, so the
artwork and the reference page cannot drift apart.

```
promo.css        shared tokens and components (phone, rail, chips, approval gate, type, background)
index.html       the animated 1080×1350 page; exposes window.__seek(t)
banner.html      the static 1600×800 README hero
fonts/           Inter, subset to latin, inlined at build time
render.mjs       frame-by-frame renderer + ffmpeg encode
```

## What the animation says

The promotional story is the pipeline as it actually runs, in that order:

1. the headline assembles,
2. the rail fills across ten stages — **Intake · Route · Preview · Product · Design · Build ·
   Motion · Comply · Release · Review**,
3. when the spark reaches **Preview** the node turns green and the `Preview approved` chip lands —
   the one human decision in the whole run,
4. the device rises and the native app screen fills in, with the `Kotlin + Compose` and
   `Swift + SwiftUI` target chips.

The preview node is deliberately green, not blue: it is a gate, not a build step. Keep that
distinction if you edit the rail.

## Why a seek function

`index.html` does not use CSS animations or GSAP for the capture. It exposes:

```js
window.__seek(t)     // paint the page at time t, in seconds
window.__duration    // 8.4
```

Every property is computed from `t` by a pure function, so frames are independent: the renderer can
capture them out of order, retry one, or skip ahead, and the output is identical every time. That is
also what makes the still poster and the video converge on exactly the same frame.

The gate timing is derived, not hard-coded — `GATE_T` is computed from the rail fill start, duration
and the Preview node index, so moving the rail timing cannot desynchronise the chip.

## Render

```bash
node promo/render.mjs --banner            # docs/banner.png   1600×800
node promo/render.mjs --still 3.6 --name beat.png   # the approval-gate moment
node promo/render.mjs                     # mp4 + poster + gif
```

Environment:

| Requirement | Default |
|---|---|
| `puppeteer-core` + Chrome/Chromium | `CHROME_PATH`, a local Chrome/Edge install, or `--chrome` |
| `ffmpeg` with `libx264` | `node_modules/ffmpeg-static`, `ffmpeg-static` in the temp tool dir, or `--ffmpeg` / `FFMPEG` |

```bash
npm install --no-save puppeteer-core ffmpeg-static
CHROME_PATH="/path/to/chrome" node promo/render.mjs
```

On a machine where Chromium needs a local library path (common in sandboxes), prefix the command:

```bash
LD_LIBRARY_PATH=/path/to/sysroot/usr/lib/x86_64-linux-gnu \
NODE_PATH=$(npm root -g) \
node promo/render.mjs
```

On Windows, `CHROME_PATH` is auto-detected from the standard `Program Files` and `%LOCALAPPDATA%`
locations, `ffmpeg-static` resolves to `ffmpeg.exe`, and pages are loaded through `pathToFileURL`.

## Output contract

| File | Format | Notes |
|---|---|---|
| `docs/banner.png` | 1600×800 PNG | README hero; GitHub scales it to the column width |
| `docs/promo.mp4` | 1080×1350 H.264 High, yuv420p, 30fps, 8.4s | Instagram 4:5 feed; `+faststart` for streaming |
| `docs/poster.png` | 1080×1350 PNG | The settled frame (t = 8.2s), used as the post cover |
| `docs/promo.gif` | 720×900, 12fps, 128 colours | README inline animation, ~1.9 MB |

Instagram accepts the MP4 directly. The poster is the frame to pick if it asks for a cover image.

## Preview screenshot

`docs/preview.png` is not part of the promo render — it is a real screenshot of
`.mobile/preview/index.html` produced by the skill itself (questionnaire → generate-preview →
headless Chrome at 1400×1000 @2x). Re-shoot it whenever the preview UI changes materially, otherwise
the README advertises a screen that no longer exists.
