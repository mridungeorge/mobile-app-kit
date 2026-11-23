# Evals

Two sets per skill, both machine-checked and both run by `scripts/run-evals.mjs` against a real
agent CLI in a temp project that contains only this kit:

- **Trigger** — 20 prompts: 10 that should fire the skill, 10 near-misses that should not. Reports
  precision, recall and accuracy.
- **Quality** — 19 mobile cases and 7 motion cases, each with assertions on the files and the named
  APIs the answer must contain. A timeout is a harness limit: the artifacts on disk are scored and
  the case is recorded with `timed_out: true` rather than failed.

`--agent` picks `claude`, `opencode` or `codex`; `--cli-args "<command> {prompt}"` wraps anything
else. No API key is needed when the CLI is already signed in. Results are committed under
`skills/*/evals/results/`.

## Results

| Date | Agent | Model | Skill | Set | Result |
|---|---|---|---|---|---|
| 2026-11-16 | Claude Code | CLI default | mobile-app-factory | trigger | precision 1.0 · recall 0.8 · accuracy 0.9 (18/20) |
| 2026-11-16 | Claude Code | CLI default | motion-experiences | trigger | precision 1.0 · recall 0.6 · accuracy 0.8 (16/20) |
| 2026-11-17 | Codex CLI | gpt-6.1-sol (low) | mobile-app-factory | trigger | precision 1.0 · recall 1.0 · accuracy 1.0 (20/20) |
| 2026-11-17 | Codex CLI | gpt-6.1-sol (low) | motion-experiences | trigger | precision 0.909 · recall 1.0 · accuracy 0.95 (19/20) |
| 2026-11-17 | Codex CLI | gpt-6.1-sol (low) | motion-experiences | quality | 0/7 |
| 2026-11-17 | Codex CLI | gpt-6.1-sol (low) | mobile-app-factory | quality | not measured — quota |
| 2026-11-18 | OpenCode | big-pickle (free) | mobile-app-factory | quality | 11/19 — 11 cases hit the 300s limit, artifacts still scored |
| 2026-11-18 | OpenCode | big-pickle (free) | motion-experiences | quality | 3/7 |
| 2026-11-20 | OpenCode | big-pickle (free), 2 repeats | mobile-app-factory | quality | **12/19** complete passes; most misses are flaky single-repeat file writes |
| 2026-11-20 | OpenCode | big-pickle (free), 2 repeats | motion-experiences | quality | **3/4 completed** cases (budget-aware, native-swiftui and native-compose not run: quota) |

The 2026-11-20 run was cut short by the free model's quota. Per-case detail is in
`skills/mobile-app-factory/evals/results/2026-11-20-opencode-opencode-big-pickle.json` and
`skills/motion-experiences/evals/results/2026-11-20.json`.

## What the numbers mean

The agents detect skills differently: Claude Code's `stream-json` records the skill tool call, while
Codex and OpenCode print text, so a run counts as triggered when the transcript contains that
skill's `SKILL.md` path. A miss can be a false negative on a text CLI, and a hit can be a model
opening the file to check whether the skill applies. The trigger numbers are not directly
comparable across agents.

The two 2026-11-16 Claude misses were description misses, not harness errors: "Which native stack
should I use, Kotlin or Swift first?" and "Take this app idea to a shippable release plan for iOS
and Android" did not fire the mobile skill; four motion prompts (reveal-on-scroll, GSAP ScrollTrigger,
GSAP replay on route change, Compose list animation) did not fire the motion skill. Both descriptions
were widened afterwards. The 2026-11-17 Codex run fired on all ten positives for both skills; its one
false positive was motion on "Animate this SVG logo in After Effects", which is not a supported
target.

**Quality is a real gap, not a green tick.** In 2026-11-17 every motion case failed at least one
named-API assertion. On 2026-11-20 a free model passed 12 of 19 mobile cases and 3 of 4 completed
motion cases, so the assertions are achievable but not routinely met. The mobile misses cluster in
compliance-heavy work: `store-readiness`, `rebuild-listing-continuity`, `billing-subscription`,
`billing-revenuecat`, `push-priming`, `localization-rtl` and `account-deletion` wrote prose instead
of the artifact the assertion names. The one deterministic remedy shipped after that run is
`references/artifact-recipes.md` plus `lint-artifacts.mjs`, which fails a build whose artifacts are
missing or inconsistent. `push-priming` failed both repeats, so it is a genuine instruction gap, not
flakiness.

## Harness controls

Two harness bugs surfaced on 2026-11-18 and are fixed: a timed-out case is scored from disk instead
of discarded, and only the CLI's own last lines are scanned for quota words (an app design that
mentioned rate limiting used to abort the run). The runner now has:

| Flag | Does |
|---|---|
| `--repeat N` | runs each case N times; passes only when every repeat passes; records `repeat_summary` min/max |
| `--concurrency N` | keeps several cases in flight |
| `--resume <checkpoint>` | keeps passed repeats after a quota stop |
| `--only <case>` | runs one case and writes a separate `-only-<case>` result |
| `timeout_s` per case | a heavy case can have its own limit; default 360s |
| `--shard i/n`, `--merge` | split a set and reassemble one dated result |

## Quota reality

Both paid CLI quotas were exhausted during the 2026-11-17 run: Claude Code returned
`429 usage_limit_reached` and Codex returned a usage-limit message, both resetting on 20 November.
The 2026-11-18 and 2026-11-20 quality runs used OpenCode's free `big-pickle` model, invoking the real
binary directly: the `.cmd` shim truncates a multi-line prompt at the first newline.

Re-run one case first when a CLI has quota:

```bash
node skills/mobile-app-factory/scripts/run-evals.mjs --quality --skill mobile-app-factory \
  --only idea-to-prd --agent codex --repeat 3
```

The on-demand workflow (`.github/workflows/evals.yml`) runs the same runner under Claude Code with
an `ANTHROPIC_API_KEY` secret. The runner refuses to write a results file after a quota error, so a
`SKIP` or `ABORTED` line means no number, not a zero.
