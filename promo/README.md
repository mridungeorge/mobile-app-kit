# Promo artwork source

The README banner and the Instagram promo are rendered from HTML, not exported from a design tool.
Everything shares [`promo.css`](promo.css), which carries the same tokens as the Halcyon demo, so the
artwork and the reference page cannot drift apart.

```
promo.css        shared tokens and components (phone, rail, chips, approval gate, type, background)
index.html       the animated 1080×1350 page; exposes window.__seek(t)
banner.html      the static 1600×800 README hero
fonts/           Inter, subset to latin, inlined at build time
browser.mjs      shared Chrome discovery, puppeteer resolution and launch flags
render.mjs       frame-by-frame renderer + ffmpeg encode
shot-preview.mjs screenshots the real generated preview page for the README
package.json     devDependencies + npm scripts for every artefact
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

Install once, then every artefact is one command:

```bash
cd promo
npm install

npm run banner          # docs/banner.png   1600×800
npm run still           # promo/.build/beat.png   the approval-gate moment (t = 3.6s)
npm run render          # docs/promo.mp4 + docs/poster.png + docs/promo.gif
npm run preview-shot    # docs/preview.png  the real generated preview page
npm run all             # banner + video + preview shot, in that order
```

Or call the scripts directly from the repo root:

```bash
node promo/render.mjs --banner
node promo/render.mjs --still 3.6 --name beat.png
node promo/render.mjs
node promo/shot-preview.mjs --idea "a marketplace for local dog walkers"
```

Environment:

| Requirement | Default |
|---|---|
| `puppeteer-core` + Chrome/Chromium | `CHROME_PATH`, a local Chrome/Edge install, or `--chrome` |
| `ffmpeg` with `libx264` | `promo/node_modules/ffmpeg-static`, a repo-root install, or `--ffmpeg` / `FFMPEG` |

`browser.mjs` owns Chrome discovery for both scripts, so a machine that can render the video can also
re-shoot the preview screenshot. Explicit paths always win over autodetection.

On Windows, Chrome and Edge are auto-detected from `Program Files` and `%LOCALAPPDATA%`,
`ffmpeg-static` resolves to `ffmpeg.exe`, and pages are loaded through `pathToFileURL`.

On a machine where Chromium needs a local library path (common in sandboxes), prefix the command:

```bash
LD_LIBRARY_PATH=/path/to/sysroot/usr/lib/x86_64-linux-gnu \
NODE_PATH=$(npm root -g) \
node promo/render.mjs
```

## Output contract

| File | Format | Notes |
|---|---|---|
| `docs/banner.png` | 1600×800 PNG | README hero; GitHub scales it to the column width |
| `docs/promo.mp4` | 1080×1350 H.264 High, yuv420p, 30fps, 8.4s | Instagram 4:5 feed; `+faststart` for streaming |
| `docs/poster.png` | 1080×1350 PNG | The settled frame (t = 8.2s), used as the post cover |
| `docs/promo.gif` | 720×900, 12fps, 128 colours | README inline animation, ~1.9 MB |
| `docs/preview.png` | 1400×1000 @2x PNG | Screenshot of the generated preview page |

Instagram accepts the MP4 directly. The poster is the frame to pick if it asks for a cover image.

## Preview screenshot

`docs/preview.png` is not a mockup and not hand-edited. `shot-preview.mjs` runs the skill's own
`questionnaire.mjs` and `generate-preview.mjs` into a throwaway directory, opens the resulting
`.mobile/preview/index.html` in headless Chrome at 1400×1000 @2x and captures it, then deletes the
temporary project. Re-run it whenever the preview UI changes materially, otherwise the README
advertises a screen that no longer exists.

```bash
node promo/shot-preview.mjs                          # the default sleep-tracker intake
node promo/shot-preview.mjs --idea "..." --out docs/preview.png
```
