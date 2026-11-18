# localization module

**Adds:** a workflow for String Catalog (`Localizable.xcstrings`) and `res/values-<locale>/strings.xml`, a pseudo-localization script, an RTL checklist, and per-locale store-metadata fields checked by `validate-metadata.mjs`.
**Files touched:** `pseudo-localize.mjs` (this folder) reads the base `strings.xml` and writes `values-en-rXA/strings.xml` with accented, +30% padded strings; no app source changes.
**Workflow:** keep every user-visible string in the catalog or `strings.xml` (no literals in views); mark ids `translatable="false"`; build the pseudo-locale and look for clipped text; test one RTL locale (`ar`) with the Xcode scheme option "Right-to-left pseudolanguage" and Android developer option "Force RTL layout direction"; use `start/end`, never `left/right`.
**Store metadata:** each shipped locale needs its own name, subtitle/short description, description, keywords/promo text and screenshots, under `locales` in `.mobile/metadata/ios.json` and `android.json`. `validate-metadata.mjs` checks the same limits on every locale entry.
**Declarations it changes:** none for privacy; the store listing must exist in every shipped locale.
**Test:** `node pseudo-localize.mjs --self-test` — checks accents, expansion and placeholder preservation (`%1$s`, `{name}`).
