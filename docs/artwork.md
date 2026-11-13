# Artwork

[← back to the README](../README.md)

The banner, the animated promo and the preview screenshot in this README are generated from source, not screenshots of a mockup. Both promo pages share [`promo/promo.css`](../promo/promo.css), so the artwork and the reference page cannot drift apart.

```bash
cd promo && npm install          # puppeteer-core + ffmpeg-static, once

npm run banner                   # docs/banner.png   (1600×800)
npm run render                   # docs/promo.mp4    (1080×1350, 8.4s, H.264)
                                 # docs/poster.png   (cover frame)
                                 # docs/promo.gif    (README animation)
npm run preview-shot             # docs/preview.png  (the real generated preview page)
npm run all                      # all of the above, in order
```

The animation is rendered frame by frame from a deterministic `window.__seek(t)`, so a re-render is repeatable and a still can be checked at any beat:

```bash
npm run still                                      # promo/.build/beat.png, the approval gate
node promo/render.mjs --still 5.2 --name beat.png  # any other beat
```

`docs/preview.png` is not a mockup: `shot-preview.mjs` runs the skill's own questionnaire and preview generator into a temp directory and screenshots the result, so the README cannot advertise a preview UI that no longer exists.

Both scripts share [`promo/browser.mjs`](../promo/browser.mjs) for Chrome discovery, so one environment renders everything. Chrome/Edge is auto-detected on macOS, Linux and Windows; set `CHROME_PATH` or pass `--chrome` to override:

```bash
CHROME_PATH="/path/to/chrome" node promo/render.mjs
```

| File | Size | Use |
|---|---|---|
| `docs/banner.png` | 1600×800 | README hero |
| `docs/promo.mp4` | 1080×1350, 8.4s | Instagram feed post |
| `docs/poster.png` | 1080×1350 | Post cover / carousel slide |
| `docs/promo.gif` | 720×900, 12fps | Inline README animation |
| `docs/preview.png` | 1400×1000 @2x | The real generated preview page |

The Inter font used to render these files is third-party — see [`NOTICE.md`](../NOTICE.md).
