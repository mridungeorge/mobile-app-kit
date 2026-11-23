# Troubleshooting

## `JAVA_HOME is not set and no 'java' command could be found`

Android builds need a JDK on `PATH`. Install Temurin 17+ (or Android Studio, which bundles one) and
set `JAVA_HOME` before `./gradlew`. Android Studio's JBR also works:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

Then `./gradlew --no-daemon :app:assembleDebug`.

## `xcodegen: command not found` / `xcodebuild` fails

XcodeGen and Xcode are macOS-only. On Linux or Windows the iOS project cannot be generated or
compiled; CI (`example-ios`, `ios-build`) is the verification path. Do not mark an iOS row verified
from a non-macOS machine.

## `Unexpected token '﻿'` when a script reads JSON

A BOM was written into the file by an editor or by PowerShell `Set-Content`. Strip it:

```powershell
$t = [IO.File]::ReadAllText($path).TrimStart([char]0xFEFF)
[IO.File]::WriteAllText($path, $t, (New-Object Text.UTF8Encoding($false)))
```

Node's `JSON.parse` rejects a BOM; the kit's scripts write UTF-8 without one.

## The agent answers the preamble instead of the eval case

On Windows, the `opencode.cmd` shim routes the prompt through `cmd.exe`, which truncates at the
first newline. Call the real binary, not the shim:

```text
%APPDATA%\npm\node_modules\@opencode\cli\bin\opencode.exe
```

The runner already does this when it can find the binary.

## Eval run stops with `SKIP` or `ABORTED`

That is a quota or auth stop, not a score. The runner refuses to write a results file after a quota
error. Resume where it stopped:

```bash
node scripts/run-evals.mjs --quality --skill mobile-app-factory --resume .progress-mobile-app-factory.json
```

A case that hits its timeout is scored from disk and recorded with `timed_out: true`; raise its
`timeout_s` in `evals/quality.json` only if the artifacts are incomplete, not because it was slow.

## `./gradlew` fails with `\r` or `bad interpreter`

The wrapper must keep LF endings. `.gitattributes` pins them; if your checkout still has CRLF:

```bash
git config core.autocrlf input
git rm --cached -r . && git reset --hard
```

## `expo export` fails after upgrading Expo

Run `npx expo-doctor` first; it names the package that is on the wrong SDK line. Then
`npx expo install --fix`. The starter pins the SDK 58 versions CI tested.

## `No available iPhone simulator` in CI

Simulator names change with each runner image. The workflows resolve the first installed iPhone by
UDID (`xcrun simctl list devices available -j`); do not hard-code `iPhone 16` or a runtime version.

## `check-skill.mjs` says a reference is broken

It resolves every path mentioned in `SKILL.md`, agents and references. Add the `assets/` or
`scripts/` prefix, or remove the claim. Do not silence the check.

## Store facts are stale

`check-store-facts-freshness.mjs` fails after `review_every_days`. Re-verify every row you rely on by
web search, update `verified_on`, and list what changed in `docs/CHANGELOG.md`. Do not move the date
without checking the sources.

## `readiness-report.mjs --strict` is NOT READY

Expected until the human actions are done. It prints two lists: AI-fixable items (missing artifacts,
invalid metadata, no PASS review) and human/external items (accounts, signing, devices, uploads). Fix
the first list; the second is the handoff.
