# Promo artwork source

The README banner and the Instagram promo are rendered from HTML, not exported from a design tool.
Everything shares [`promo.css`](promo.css), which carries the same tokens as the Halcyon demo, so the
artwork and the reference page cannot drift apart.

```
promo.css        shared tokens and components (phone, rail, type, background)
index.html       the animated 1080×1350 page; exposes window.__seek(t)
banner.html      the static 1600×800 README hero
fonts/           Inter, subset to latin, inlined at build time
render.mjs       frame-by-frame renderer + ffmpeg encode
```

## Why a seek function

`index.html` does not use CSS animations or GSAP for the capture. It exposes:

```js
window.__seek(t)     // paint the page at time t, in seconds
window.__duration    // 8.0
```

Every property is computed from `t` by a pure function, so frames are independent: the renderer can
capture them out of order, retry one, or skip ahead, and the output is identical every time. That is
also what makes the still poster and the video converge on exactly the same frame.

## Render

```bash
node promo/render.mjs --banner      # docs/banner.png   1600×800
node promo/render.mjs --still 7.8   # one frame, for checking a beat
node promo/render.mjs               # mp4 + poster + gif
```

Environment:

| Requirement | Default |
|---|---|
| `puppeteer-core` + Chromium | global install, or `CHROME_PATH` |
| `ffmpeg` with `libx264` | `ffmpeg-static`, or `FFMPEG` |

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
| `docs/promo.mp4` | 1080×1350 H.264 High, yuv420p, 30fps, 8s | Instagram 4:5 feed; `+faststart` for streaming |
| `docs/poster.png` | 1080×1350 PNG | The settled frame (t = 7.8s), used as the post cover |
| `docs/promo.gif` | 720×900, 12fps, 128 colours | README inline animation, ~2.3 MB |

Instagram accepts the MP4 directly. The poster is the frame to pick if it asks for a cover image.
