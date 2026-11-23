#!/usr/bin/env node
// Trigger and quality evals for the skills in this repo, against a real agent CLI.
//
//   node scripts/run-evals.mjs                     # every skill, trigger + quality
//   node scripts/run-evals.mjs --trigger           # trigger sets only (fast, cheap)
//   node scripts/run-evals.mjs --skill mobile-app-factory --trigger
//   node scripts/run-evals.mjs --quality --only idea-to-prd
//   node scripts/run-evals.mjs --agent opencode    # claude (default) | opencode | codex
//   node scripts/run-evals.mjs --quality --shard 0/4  # one quarter of the quality cases, for parallel runs
//   node scripts/run-evals.mjs --quality --concurrency 3  # three cases in flight at once
//   node scripts/run-evals.mjs --quality --repeat 3      # flakiness: min/max across three runs
//   node scripts/run-evals.mjs --quality --resume [file]  # keep passed runs, finish the rest
//   node scripts/run-evals.mjs --merge             # combine today's shard files into one result
//   node scripts/run-evals.mjs --validate          # check the eval files, call nothing
//   node scripts/run-evals.mjs --dry-run           # print the plan, call nothing
//   node scripts/run-evals.mjs --self-test         # check the agent adapters, call nothing
//
// How it works: each prompt runs in a fresh temp directory with this repo's skills copied into the
// agent's own skills directory, so the only thing the model can invoke is this kit. A trigger pass
// means the skill was actually invoked (a skill call, or a Read of its SKILL.md). A quality pass
// means every assertion in `evals/quality.json` held.
//
// These are SKILL.md skills, not a Claude product: --agent picks a known CLI and --cli-args passes
// any other command template ({prompt} is substituted). No API key is needed if the CLI is already
// signed in to whatever model it uses.
//
// Results go to `skills/<skill>/evals/results/<YYYY-MM-DD>.json` (plus a `.md` summary).
// Exit codes: 0 all requested evals passed, 1 a failure, 2 could not run (no CLI, no auth).

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, cpSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(here, "..");
const repoRoot = resolve(skillRoot, "..", "..");

let evalConfigDir = null;

const opts = {
  skills: [],
  trigger: false,
  quality: false,
  validate: false,
  selfTest: false,
  dryRun: false,
  only: null,
  merge: false,
  // Six minutes: the 2026-11-18 run showed a slow free CLI spending 228s on one compliance
  // case before writing anything, so 240s measured the timeout rather than the skill.
  timeoutMs: 360_000,
  concurrency: 1,
  repeat: 1,
  resume: null,
  maxTurns: null,
  model: null,
  reasoning: null,
  keep: false,
  debug: false,
  cli: null,
  agent: "claude",
  cliArgs: null,
};

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--skill") opts.skills.push(process.argv[++i]);
  else if (arg === "--trigger") opts.trigger = true;
  else if (arg === "--quality") opts.quality = true;
  else if (arg === "--validate") opts.validate = true;
  else if (arg === "--self-test") opts.selfTest = true;
  else if (arg === "--dry-run") opts.dryRun = true;
  else if (arg === "--only") opts.only = process.argv[++i];
  else if (arg === "--merge") opts.merge = true;
  else if (arg === "--shard") {
    const [index, count] = String(process.argv[++i] ?? "").split("/").map(Number);
    if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index >= count) {
      console.error("--shard expects <index>/<count>, e.g. 0/4");
      process.exit(2);
    }
    opts.shard = { index, count };
  }
  else if (arg === "--timeout") opts.timeoutMs = Number(process.argv[++i]) * 1000;
  else if (arg === "--concurrency") opts.concurrency = Math.min(16, Math.max(1, Number(process.argv[++i]) || 1));
  else if (arg === "--repeat") opts.repeat = Math.min(10, Math.max(1, Number(process.argv[++i]) || 1));
  else if (arg === "--resume") opts.resume = process.argv[++i];
  else if (arg === "--max-turns") opts.maxTurns = Number(process.argv[++i]);
  else if (arg === "--model") opts.model = process.argv[++i];
  else if (arg === "--reasoning") opts.reasoning = process.argv[++i];
  else if (arg === "--keep") opts.keep = true;
  else if (arg === "--debug") opts.debug = true;
  else if (arg === "--cli") opts.cli = process.argv[++i];
  else if (arg === "--agent") opts.agent = process.argv[++i];
  else if (arg === "--cli-args") opts.cliArgs = process.argv[++i];
  else if (arg === "--help" || arg === "-h") {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 28).join("\n").replace(/^\/\/ ?/gm, ""));
    process.exit(0);
  } else {
    console.error(`unknown flag: ${arg}`);
    process.exit(2);
  }
}
if (!opts.trigger && !opts.quality) opts.trigger = opts.quality = true;

// ---------------------------------------------------------------------------
// Eval files
// ---------------------------------------------------------------------------

function discoverSkills() {
  const dir = join(repoRoot, "skills");
  return readdirSync(dir)
    .filter((name) => existsSync(join(dir, name, "evals", "trigger.json")))
    .filter((name) => !opts.skills.length || opts.skills.includes(name));
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function validate() {
  const problems = [];
  const skills = discoverSkills();
  if (!skills.length) problems.push("no skills with evals/trigger.json found");

  for (const skill of skills) {
    const trigger = loadJson(join(repoRoot, "skills", skill, "evals", "trigger.json"));
    if (trigger.skill !== skill) problems.push(`${skill}: trigger.json skill is "${trigger.skill}"`);
    if (!Array.isArray(trigger.prompts) || !trigger.prompts.length) {
      problems.push(`${skill}: trigger.json has no prompts`);
      continue;
    }
    const pos = trigger.prompts.filter((p) => p.should_trigger === true).length;
    const neg = trigger.prompts.filter((p) => p.should_trigger === false).length;
    if (pos !== neg) problems.push(`${skill}: trigger set is not 50/50 (${pos} positive, ${neg} negative)`);
    if (trigger.prompts.length < 20) problems.push(`${skill}: only ${trigger.prompts.length} trigger prompts, target is 20`);
    const seen = new Set();
    for (const item of trigger.prompts) {
      if (typeof item.prompt !== "string" || !item.prompt.trim()) problems.push(`${skill}: a trigger prompt is empty`);
      else if (seen.has(item.prompt)) problems.push(`${skill}: duplicate trigger prompt "${item.prompt.slice(0, 40)}"`);
      seen.add(item.prompt);
      if (typeof item.should_trigger !== "boolean") problems.push(`${skill}: "${item.prompt.slice(0, 40)}" has no boolean should_trigger`);
      if (!item.why) problems.push(`${skill}: "${item.prompt.slice(0, 40)}" has no why`);
    }

    const qualityPath = join(repoRoot, "skills", skill, "evals", "quality.json");
    if (!existsSync(qualityPath)) {
      problems.push(`${skill}: evals/quality.json is missing`);
      continue;
    }
    const quality = loadJson(qualityPath);
    if (quality.skill !== skill) problems.push(`${skill}: quality.json skill is "${quality.skill}"`);
    const ids = new Set();
    for (const testCase of quality.cases ?? []) {
      if (!testCase.id) problems.push(`${skill}: a quality case has no id`);
      else if (ids.has(testCase.id)) problems.push(`${skill}: duplicate quality id "${testCase.id}"`);
      ids.add(testCase.id);
      if (!testCase.prompt) problems.push(`${skill}/${testCase.id}: no prompt`);
      if (testCase.timeout_s != null && !(Number(testCase.timeout_s) > 0)) {
        problems.push(`${skill}/${testCase.id}: timeout_s must be a positive number of seconds`);
      }
      if (!Array.isArray(testCase.assertions) || !testCase.assertions.length) {
        problems.push(`${skill}/${testCase.id}: no checkable assertions`);
      }
      if (testCase.fixture && !existsSync(join(repoRoot, "test-fixtures", testCase.fixture))) {
        problems.push(`${skill}/${testCase.id}: fixture ${testCase.fixture} does not exist`);
      }
      for (const assertion of testCase.assertions ?? []) {
        const types = ["file_exists", "file_absent", "file_matches", "mentions_all", "mentions_any", "json_equals", "json_max", "response_matches", "response_mentions_all"];
        if (!types.includes(assertion.type)) problems.push(`${skill}/${testCase.id}: unknown assertion type "${assertion.type}"`);
        if (["file_exists", "file_absent", "file_matches", "mentions_all", "mentions_any", "json_equals", "json_max"].includes(assertion.type) && !assertion.path) {
          problems.push(`${skill}/${testCase.id}: ${assertion.type} has no path`);
        }
        if (assertion.type === "file_matches" || assertion.type === "response_matches") {
          try { toRegExp(assertion.pattern); } catch (error) { problems.push(`${skill}/${testCase.id}: bad pattern "${assertion.pattern}" (${error.message})`); }
        }
      }
    }
  }

  for (const problem of problems) console.log(`  x ${problem}`);
  console.log(`\n${problems.length ? "FAIL" : "PASS"} — ${skills.length} skill(s) validated, ${problems.length} problem(s)`);
  return problems.length;
}

// Mechanical checks for the agent adapters: no model, no CLI, no network. `check-skill.mjs`
// runs this so a broken adapter fails the repo audit instead of only showing up in a live run.
function selfTest() {
  const problems = [];
  const expect = (label, condition) => { if (!condition) problems.push(label); };

  const viaSkill = detectInText('Skill "mobile-app-factory"');
  expect('detects an OpenCode-style `Skill "<id>"` line',
    viaSkill.some((hit) => hit.skill === "mobile-app-factory" && hit.via === "Skill"));

  const viaOpenCodePath = detectInText("Read .opencode/skills/motion-experiences/SKILL.md");
  expect("detects a `.opencode/skills/<id>/SKILL.md` path",
    viaOpenCodePath.some((hit) => hit.skill === "motion-experiences" && hit.via === "path"));

  const viaClaudePath = detectInText("/home/me/.claude/skills/mobile-app-factory/SKILL.md");
  expect("detects a `.claude/skills/<id>/SKILL.md` path",
    viaClaudePath.some((hit) => hit.skill === "mobile-app-factory" && hit.via === "path"));

  const viaEscapedWindowsPath = detectInText(
    "Get-Content C:\\\\sandbox\\\\.agents\\\\skills\\\\motion-experiences\\\\SKILL.md");
  expect("detects a JSON-escaped Windows path with doubled separators",
    viaEscapedWindowsPath.some((hit) => hit.skill === "motion-experiences" && hit.via === "path"));

  expect("does not fire on text with no skill mention",
    detectInText("I built a habit tracker and never loaded a skill.").length === 0);

  const known = ["claude", "opencode", "codex"].map((name) => AGENTS[name]);
  expect("every known agent has at least one skills directory",
    known.every((agent) => Array.isArray(agent.skillsDirs) && agent.skillsDirs.length > 0));
  expect("the known agents do not all share one skills directory",
    new Set(known.map((agent) => agent.skillsDirs[0])).size === known.length);

  const baseline = {
    quality: {
      total: 2, passed: 1,
      cases: [{ id: "a", passed: true }, { id: "b", passed: false }],
      repeat_summary: { repeats: 3, min: 1, max: 1 },
    },
  };
  const probe = {
    quality: {
      total: 1, passed: 1,
      cases: [{ id: "b", passed: true }],
      repeat_summary: { repeats: 1, min: 1, max: 1 },
    },
  };
  const mergedProbe = mergeRecords(baseline, probe);
  expect("a one-case run merges into the day's file instead of replacing it",
    mergedProbe.quality.total === 2 && mergedProbe.quality.passed === 2);
  expect("a partial run drops the repeat summary it cannot describe",
    mergedProbe.quality.repeat_summary === null);
  expect("a complete rerun keeps its repeat summary",
    mergeRecords(baseline, { quality: { ...baseline.quality } }).quality.repeat_summary !== null);
  expect("probe filenames are filesystem-safe", slug("store-readiness") === "store-readiness" && slug("???") === "run");

  for (const problem of problems) console.log(`  x ${problem}`);
  console.log(`\n${problems.length ? "FAIL" : "PASS"} - runner self-test, ${problems.length} problem(s)`);
  return problems.length;
}

// ---------------------------------------------------------------------------
// CLI detection
// ---------------------------------------------------------------------------

// Each agent is a CLI plus the project directory it reads SKILL.md skills from.
// Claude Code uses `.claude/skills`. OpenCode reads `.opencode/skills`, and also `.claude/skills`
// and `.agents/skills` for compatibility. Codex reads `.agents/skills` at repo scope
// (and `$HOME/.agents/skills` at user scope). None of them need a Claude account.
const AGENTS = {
  claude: {
    label: "Claude Code",
    bin: "claude",
    skillsDirs: [".claude/skills"],
    format: "stream-json",
    isolateConfig: true,
    keys: ["ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN"],
    command: (prompt, { quality }) => {
      const tools = quality
        ? ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "TodoWrite", "WebSearch", "WebFetch"]
        : ["Skill", "Read", "Glob", "Grep"];
      const args = ["-p", prompt, "--output-format", "stream-json", "--verbose"];
      for (const tool of tools) args.push("--allowedTools", tool);
      if (opts.maxTurns) args.push("--max-turns", String(opts.maxTurns));
      if (opts.model) args.push("--model", opts.model);
      return args;
    },
  },
  opencode: {
    label: "OpenCode",
    bin: "opencode",
    skillsDirs: [".opencode/skills"],
    format: "text",
    isolateConfig: false,
    keys: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    command: (prompt, { quality } = {}) => {
      // --standalone keeps the eval off the authoring session's background server, which
      // otherwise restarts mid-run. Plan mode is read-only, so a trigger prompt cannot turn
      // into a build; quality cases get build + auto-approved tools inside their sandbox.
      const args = ["run", "--standalone"];
      if (!quality) args.push("--agent", "plan", "--format", "json");
      else args.push("--agent", "build", "--auto");
      if (opts.model) args.push("--model", opts.model);
      args.push(prompt);
      return args;
    },
  },
  codex: {
    label: "Codex CLI",
    bin: "codex",
    skillsDirs: [".agents/skills"],
    format: "text",
    isolateConfig: false,
    keys: ["OPENAI_API_KEY"],
    command: (prompt, { quality } = {}) => {
      // A trigger prompt only asks the model to choose a skill; letting it write files makes it
      // start building the app and blow through the timeout before it prints anything useful.
      // Quality cases do need to scaffold, so they get write access to the sandbox only.
      const args = ["exec", "--skip-git-repo-check", "-s", quality ? "workspace-write" : "read-only"];
      if (opts.model) args.push("-m", opts.model);
      if (opts.reasoning) args.push("-c", `model_reasoning_effort=${opts.reasoning}`);
      args.push(prompt);
      return args;
    },
  },
  custom: {
    label: "custom command",
    bin: null,
    // No documented convention, so write both shared locations.
    skillsDirs: [".agents/skills", ".claude/skills"],
    format: "text",
    isolateConfig: false,
    keys: [],
    command: null,
  },
};

function resolveAgent() {
  if (opts.cliArgs) return AGENTS.custom;
  const agent = AGENTS[opts.agent];
  if (!agent) {
    const known = Object.keys(AGENTS).filter((name) => name !== "custom").join(", ");
    console.error(`unknown --agent "${opts.agent}" — use ${known}, or --cli-args "<command> {prompt}"`);
    process.exit(2);
  }
  return agent;
}

function findCli(agent) {
  if (opts.cli) return opts.cli;
  if (!agent.bin) return null;
  const probe = process.platform === "win32"
    ? ["where", [agent.bin]]
    : ["which", [agent.bin]];
  try {
    const out = execFileSync(probe[0], probe[1], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const candidates = out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (process.platform !== "win32") return candidates[0] ?? null;
    // `where` lists the extensionless npm shim first, which spawn() cannot execute.
    const rank = (path) => (/\.exe$/i.test(path) ? 0 : /\.(cmd|bat)$/i.test(path) ? 1 : 2);
    // npm installs the real binary beside the shim, not on PATH. A `.cmd` shim routes arguments
    // through cmd.exe and truncates a multi-line prompt at the first newline, so reach for the
    // packaged .exe first: that is what the 2026-11-18 quality run had to do by hand.
    const shimDir = dirname(candidates.sort((a, b) => rank(a) - rank(b))[0] ?? "");
    for (const relative of [
      ["node_modules", "@opencode", "cli", "bin", "opencode.exe"],
    ]) {
      const packaged = join(shimDir, ...relative);
      if (existsSync(packaged)) return packaged;
    }
    return candidates.sort((a, b) => rank(a) - rank(b))[0] ?? null;
  } catch {
    return null;
  }
}

function hasAuth(agent) {
  for (const key of agent.keys ?? []) if (process.env[key]) return key;
  return null;
}

// A logged-in CLI is auth too. Probe once with the cheapest possible request rather than
// guessing from config files, so the message we print is true.
async function cliIsLoggedIn(cli) {
  return new Promise((resolveProbe) => {
    const child = spawn(cli, ["-p", "ok", "--output-format", "json", "--max-turns", "1"], {
      stdio: ["ignore", "pipe", "ignore"],
      env: evalConfigDir
        ? { ...process.env, CLAUDE_CONFIG_DIR: evalConfigDir.config, HOME: evalConfigDir.home, USERPROFILE: evalConfigDir.home }
        : process.env,
    });
    const timer = setTimeout(() => { child.kill(); resolveProbe({ ok: false, limit: null }); }, 60_000);
    let out = "";
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.on("error", () => { clearTimeout(timer); resolveProbe({ ok: false, limit: null }); });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        const payload = JSON.parse(out);
        if (code === 0 && payload.is_error === false) return resolveProbe({ ok: true, limit: null });
        const message = String(payload.result ?? "");
        if (/limit|quota|credit balance/i.test(message)) return resolveProbe({ ok: false, limit: message.trim().slice(0, 200) });
        return resolveProbe({ ok: false, limit: null });
      } catch { resolveProbe({ ok: false, limit: null }); }
    });
  });
}

// ---------------------------------------------------------------------------
// Running one prompt
// ---------------------------------------------------------------------------

function cleanup(dir) {
  // Windows keeps handles briefly after the CLI exits; retry rather than failing the run.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      return;
    } catch {
      if (attempt === 2) console.warn(`  could not remove ${dir} — remove it by hand`);
    }
  }
}

// %TEMP% on Windows is often the 8.3 alias `C:\Users\GEORGE~1\...`. Claude Code's write tool
// rejects that as a suspicious path and the sandbox cannot be written at all, so realpath it
// before anything is created under it.
function longPath(path) {
  try { return realpathSync.native(path); } catch { return path; }
}

function makeWorkspace(skill, agent) {
  const dir = mkdtempSync(join(longPath(tmpdir()), `maf-evals-${skill}-`));
  const skillsDir = join(repoRoot, "skills");
  const sources = readdirSync(skillsDir).filter((name) => existsSync(join(skillsDir, name, "SKILL.md")));
  for (const target of agent.skillsDirs) {
    const dest = join(dir, target);
    mkdirSync(dest, { recursive: true });
    for (const name of sources) {
      cpSync(join(skillsDir, name), join(dest, name), {
        recursive: true,
        filter: (source) => !/[\\/](node_modules|results|\.git)([\\/]|$)/.test(source),
      });
    }
  }
  // A bare project, so the model has nothing else to read.
  writeFileSync(join(dir, "README.md"), "# Sandbox\n\nThis directory is empty on purpose: an eval harness.\n");
  return dir;
}

// The real `~/.claude` holds ~150 unrelated skills, so running there would measure the whole
// marketplace instead of this kit. Point the CLI at a throwaway config dir that carries only the
// login, and the sandbox holds only these skills. Credentials are copied, never modified.
function makeEvalConfig() {
  const source = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude");
  const dir = mkdtempSync(join(longPath(tmpdir()), "maf-evals-config-"));
  const home = join(dir, "home");
  const config = join(home, ".claude");
  mkdirSync(config, { recursive: true });
  for (const file of [".credentials.json", "settings.json"]) {
    const from = join(source, file);
    if (!existsSync(from)) continue;
    try { copyFileSync(from, join(config, file)); } catch { /* settings are optional */ }
  }
  return { dir, home, config };
}

// Text-only CLIs do not expose structured tool calls, so look for the skill's own file path in the
// transcript. A miss is a false negative, not proof the skill was not used, and the results record
// `detection: "path"` so nobody reads more into it than that.
function detectInText(text) {
  const hits = [];
  // Some text CLIs print a JSON-escaped Windows path, so a separator can appear as
  // one backslash or as two. Accept either without widening the skill-name capture.
  const pathPattern = /(?:^|[\\/\s"'`])skills(?:\\|\/)+([^\\/\s"'`]+)(?:\\|\/)+SKILL\.md/gi;
  let match;
  while ((match = pathPattern.exec(text)) !== null) hits.push({ skill: match[1], via: "path" });
  // OpenCode prints `Skill "<id>"` when it loads one.
  const skillPattern = /\bSkill\s+["'`]([a-z0-9-]+)["'`]/gi;
  while ((match = skillPattern.exec(text)) !== null) hits.push({ skill: match[1], via: "Skill" });
  return hits;
}

function runPrompt(agent, cli, prompt, cwd, { quality, timeoutMs = opts.timeoutMs } = {}) {
  return new Promise((resolveRun) => {
    const usesCmdShim = process.platform === "win32" && /\.(cmd|bat)$/i.test(cli);
    // A cmd.exe shim treats a newline as the end of the command. Flatten the prompt rather than
    // silently sending only its first line (the bug behind the 2026-11-18 generic answers).
    const args = (opts.cliArgs
      ? opts.cliArgs.trim().split(/\s+/).map((part) => part.replace("{prompt}", prompt))
      : agent.command(prompt, { quality }))
      .map((part) => (usesCmdShim ? part.replace(/\r?\n+/g, " ") : part));

    const started = Date.now();
    const env = { ...process.env };
    if (agent.isolateConfig && evalConfigDir) {
      env.CLAUDE_CONFIG_DIR = evalConfigDir.config;
      env.HOME = evalConfigDir.home;
      env.USERPROFILE = evalConfigDir.home;
      if (opts.debug) console.log(`    · env HOME=${env.HOME} CONFIG=${env.CLAUDE_CONFIG_DIR}`);
    }
    // Windows cannot spawn the npm .cmd shim directly; go through cmd.exe so the quoting of
    // prompts (apostrophes, question marks, commas) is handled by the shell that owns the shim.
    const [command, commandArgs] = process.platform === "win32" && /\.(cmd|bat)$/i.test(cli)
      ? ["cmd.exe", ["/c", cli, ...args]]
      : [cli, args];
    const child = spawn(command, commandArgs, { cwd, stdio: ["ignore", "pipe", "pipe"], env });
    const invoked = [];
    let response = "";
    let stderr = "";
    let timedOut = false;
    let skillCount = null;
    let limitHit = null;
    let buffer = "";
    let raw = "";

    const handleLine = (line) => {
      if (!line.trim()) return;
      let event;
      try { event = JSON.parse(line); } catch { return; }

      const walk = (node) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) { for (const item of node) walk(item); return; }
        if (node.type === "tool_use" && typeof node.name === "string") {
          if (opts.debug) console.log(`    · tool_use ${node.name} ${JSON.stringify(node.input ?? {}).slice(0, 120)}`);
          if (node.name === "Skill") {
            const target = node.input?.skill ?? node.input?.name ?? node.input?.command;
            if (typeof target === "string") invoked.push({ skill: basename(String(target).replace(/\\/g, "/")), via: "Skill" });
          } else if (node.name === "Read" && typeof node.input?.file_path === "string") {
            const match = node.input.file_path.replace(/\\/g, "/").match(/(?:^|\/)skills\/([^/]+)\/SKILL\.md$/);
            if (match) invoked.push({ skill: match[1], via: "Read" });
          }
        }
        for (const value of Object.values(node)) walk(value);
      };
      walk(event);

      if (event.type === "result" && typeof event.result === "string") response += `\n${event.result}`;
      // A subscription usage limit is not a skill failure. Record it so the run can stop
      // instead of writing a results file full of "the skill did not trigger".
      if (event.type === "result" && event.is_error && /limit|quota|credit balance/i.test(String(event.result ?? ""))) {
        limitHit = String(event.result).trim().slice(0, 200);
      }
      if (event.type === "result" && event.permission_denials?.length && opts.debug) {
        console.log(`    · permission_denials ${JSON.stringify(event.permission_denials).slice(0, 300)}`);
      }
      if (event.type === "system" && event.subtype === "init") {
        skillCount = (event.skills ?? event.slash_commands ?? []).length;
        if (opts.debug) console.log(`    · init skills=${JSON.stringify(event.skills ?? event.slash_commands ?? []).slice(0, 400)}`);
      }
      if (opts.debug && event.type === "tool_result") {
        console.log(`    · tool_result ${JSON.stringify(event.content ?? event).slice(0, 200)}`);
      }
      if (event.type === "assistant") {
        for (const block of event.message?.content ?? []) {
          if (block?.type === "text" && typeof block.text === "string") response += `\n${block.text}`;
        }
      }
    };

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      raw += text;
      if (agent.format !== "stream-json") return;
      buffer += text;
      let index;
      while ((index = buffer.indexOf("\n")) !== -1) {
        handleLine(buffer.slice(0, index));
        buffer = buffer.slice(index + 1);
      }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      timedOut = true;
      // On Windows the child is cmd.exe wrapping the real CLI; kill the tree or the pipes stay
      // open and the run hangs past its own timeout.
      if (process.platform === "win32" && child.pid) {
        try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); return; } catch { /* fall through */ }
      }
      child.kill();
    }, timeoutMs);
    // Belt and braces: if the process tree survives the kill and never closes its pipes, resolve
    // anyway so the harness cannot hang forever.
    const hardStop = setTimeout(() => {
      resolveRun({ invoked, response: raw, error: `timed out after ${timeoutMs / 1000}s`, timedOut: true, skillCount, limit: limitHit, ms: Date.now() - started });
    }, timeoutMs + 15_000);
    child.on("error", (error) => {
      clearTimeout(timer);
      clearTimeout(hardStop);
      resolveRun({ invoked, response, error: error.message, spawnError: error.code ?? "spawn", skillCount, limit: limitHit, ms: Date.now() - started });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      clearTimeout(hardStop);
      if (agent.format === "stream-json") {
        if (buffer.trim()) handleLine(buffer);
      } else {
        response = raw;
        if (!invoked.length) invoked.push(...detectInText(`${raw}\n${stderr}`));
      }
      const error = timedOut ? `timed out after ${opts.timeoutMs / 1000}s` : code === 0 ? null : `exit ${code}: ${stderr.trim().split("\n").slice(-2).join(" ").slice(0, 200)}`;
      // A text CLI that is not signed in looks exactly like a skill that did not trigger.
      // Treat auth and quota messages as "could not run", so no misleading results file is written.
      // Only the CLI's own last lines count, and only recognised auth/quota wording: scanning the
      // whole transcript aborts the run when a model writes about rate limiting in an app design.
      if (!limitHit && code !== 0 && !invoked.length) {
        const tail = stderr.trim().split("\n").filter(Boolean).slice(-12).join("\n");
        if (/usage limit|quota exceeded|quota reached|credit balance|not logged in|unauthori[sz]ed|authenticat\w* (failed|required|expired)|invalid api key|rate limit exceeded/i.test(tail)) {
          limitHit = tail.split("\n").slice(-2).join(" ").slice(0, 200);
          if (opts.debug) console.log(`    · quota/auth pattern matched in CLI stderr`);
        }
      }
      resolveRun({ invoked, response, error, timedOut, skillCount, limit: limitHit, ms: Date.now() - started });
    });
  });
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

function toRegExp(pattern) {
  let source = String(pattern);
  let flags = "";
  const inline = source.match(/^\(\?([ims]+)\)/);
  if (inline) { flags = inline[1]; source = source.slice(inline[0].length); }
  return new RegExp(source, flags);
}

function pointer(value, path) {
  return String(path).split(".").reduce((node, key) => (node == null ? node : node[key]), value);
}

function readText(workspace, path) {
  const full = join(workspace, path);
  if (!existsSync(full)) throw new Error(`${path} does not exist`);
  return readFileSync(full, "utf8");
}

function checkAssertion(assertion, workspace, response) {
  const label = assertion.label ?? assertion.type;
  const pass = (detail) => ({ label, pass: true, detail });
  const fail = (detail) => ({ label, pass: false, detail });

  try {
    switch (assertion.type) {
      case "file_exists":
        return existsSync(join(workspace, assertion.path)) ? pass(`${assertion.path} exists`) : fail(`${assertion.path} missing`);
      case "file_absent":
        return existsSync(join(workspace, assertion.path)) ? fail(`${assertion.path} should not exist`) : pass(`${assertion.path} absent`);
      case "file_matches": {
        const text = readText(workspace, assertion.path);
        const found = text.match(toRegExp(assertion.pattern));
        return found ? pass(`matched ${found[0].slice(0, 60)}`) : fail(`${assertion.path} does not match /${assertion.pattern}/`);
      }
      case "mentions_all": {
        const text = readText(workspace, assertion.path).toLowerCase();
        const missing = assertion.terms.filter((term) => !text.includes(term.toLowerCase()));
        return missing.length ? fail(`${assertion.path} missing ${missing.join(", ")}`) : pass(`mentions ${assertion.terms.join(", ")}`);
      }
      case "mentions_any": {
        const text = readText(workspace, assertion.path).toLowerCase();
        const hit = assertion.terms.find((term) => text.includes(term.toLowerCase()));
        return hit ? pass(`mentions "${hit}"`) : fail(`${assertion.path} mentions none of ${assertion.terms.join(", ")}`);
      }
      case "json_equals": {
        const value = pointer(JSON.parse(readText(workspace, assertion.path)), assertion.pointer);
        return JSON.stringify(value) === JSON.stringify(assertion.value)
          ? pass(`${assertion.pointer} = ${JSON.stringify(value)}`)
          : fail(`${assertion.pointer} is ${JSON.stringify(value)}, expected ${JSON.stringify(assertion.value)}`);
      }
      case "json_max": {
        const value = pointer(JSON.parse(readText(workspace, assertion.path)), assertion.pointer);
        const size = Array.isArray(value) ? value.length : typeof value === "number" ? value : NaN;
        return Number.isFinite(size) && size <= assertion.max
          ? pass(`${assertion.pointer} = ${size} (<= ${assertion.max})`)
          : fail(`${assertion.pointer} is ${JSON.stringify(value)}, expected <= ${assertion.max}`);
      }
      case "response_matches":
        return toRegExp(assertion.pattern).test(response) ? pass(`response matches /${assertion.pattern}/`) : fail(`response does not match /${assertion.pattern}/`);
      case "response_mentions_all": {
        const text = response.toLowerCase();
        const missing = assertion.terms.filter((term) => !text.includes(term.toLowerCase()));
        return missing.length ? fail(`response missing ${missing.join(", ")}`) : pass(`response mentions ${assertion.terms.join(", ")}`);
      }
      default:
        return fail(`unknown assertion type ${assertion.type}`);
    }
  } catch (error) {
    return fail(error.message);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function metrics(cases) {
  const positive = cases.filter((c) => c.should_trigger);
  const negative = cases.filter((c) => !c.should_trigger);
  const tp = positive.filter((c) => c.triggered).length;
  const fn = positive.length - tp;
  const fp = negative.filter((c) => c.triggered).length;
  const tn = negative.length - fp;
  const ratio = (a, b) => (b === 0 ? null : Number((a / b).toFixed(3)));
  return {
    total: cases.length,
    positive: positive.length,
    negative: negative.length,
    tp, fp, fn, tn,
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
    accuracy: ratio(tp + tn, cases.length),
  };
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "run";
}

// A same-day run must never erase a different run's cases. Quality cases are merged by id, so
// `--only` / `--resume` / a trigger-only rerun add evidence instead of replacing the set.
function mergeRecords(previous, current) {
  const record = { ...previous, ...current };
  record.trigger = current.trigger ?? previous.trigger;
  if (!current.quality) {
    record.quality = current.quality ?? previous.quality ?? null;
    return record;
  }
  if (!previous.quality?.cases?.length) {
    record.quality = current.quality;
    return record;
  }
  const byId = new Map(previous.quality.cases.map((item) => [item.id, item]));
  const previousIds = [...byId.keys()];
  const currentIds = new Set(current.quality.cases.map((item) => item.id));
  for (const item of current.quality.cases) byId.set(item.id, item);
  const cases = [...byId.values()];
  record.quality = {
    ...previous.quality,
    ...current.quality,
    cases,
    total: cases.length,
    passed: cases.filter((item) => item.passed).length,
  };
  // A repeat summary only describes the cases that ran together. A union of two partial runs
  // has no single min/max, so drop it rather than print a number that cannot be reproduced.
  const sameSet = previousIds.length === currentIds.size && previousIds.every((id) => currentIds.has(id));
  if (!sameSet) {
    record.quality.repeats = null;
    record.quality.repeat_summary = null;
  }
  return record;
}

function mdSummary(result) {
  const lines = [`# ${result.skill} evals — ${result.date}`, "", `model: ${result.model ?? "CLI default"}`, ""];
  if (result.trigger) {
    const t = result.trigger.metrics;
    lines.push(`## Trigger set`, "", `precision ${t.precision} · recall ${t.recall} · accuracy ${t.accuracy}`, "", "| prompt | expected | triggered | pass |", "|---|---|---|---|");
    for (const testCase of result.trigger.cases) {
      lines.push(`| ${testCase.prompt.replace(/\|/g, "\\|")} | ${testCase.should_trigger ? "yes" : "no"} | ${testCase.triggered ? "yes" : "no"} | ${testCase.pass ? "pass" : "FAIL"} |`);
    }
    lines.push("");
  }
  if (result.quality) {
    const repeats = result.quality.repeat_summary;
    lines.push(`## Quality set`, "",
      `passed ${result.quality.passed}/${result.quality.total}${repeats ? ` · repeats ${repeats.repeats} · range ${repeats.min}–${repeats.max}` : ""}`, "",
      "| case | pass rate | pass | failed assertion |", "|---|---|---|---|");
    for (const testCase of result.quality.cases) {
      const failed = testCase.assertions.find((a) => !a.pass);
      lines.push(`| ${testCase.id} | ${testCase.pass_rate ?? (testCase.passed ? 1 : 0)}/${repeats?.repeats ?? 1} | ${testCase.passed ? "pass" : "FAIL"} | ${failed ? failed.label : ""} |`);
    }
    if (repeats) {
      lines.push("", `Per repeat: ${repeats.per_repeat.map((r) => `run ${r.repeat} ${r.passed}/${r.total}`).join(" · ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function mergeShards(skills, date) {
  let merged = 0;
  for (const skill of skills) {
    const dir = join(repoRoot, "skills", skill, "evals", "results");
    if (!existsSync(dir)) continue;
    const shardFiles = readdirSync(dir)
      .filter((name) => name.startsWith(`${date}.shard-`) && name.endsWith(".json"))
      .sort();
    if (shardFiles.length < 2) continue;

    const records = shardFiles.map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")));
    const { agent, model = null } = records[0];
    const mismatch = records.find((record) => record.agent !== agent || (record.model ?? null) !== model);
    if (mismatch) {
      console.error(`SKIP — ${skill}: shards came from different agents (${agent}/${model} vs ${mismatch.agent}/${mismatch.model ?? "default"}). Merge them by hand or rerun the odd shard.`);
      process.exitCode = 2;
      continue;
    }

    const quality = loadJson(join(repoRoot, "skills", skill, "evals", "quality.json"));
    const byId = new Map();
    for (const record of records) for (const testCase of record.quality?.cases ?? []) byId.set(testCase.id, testCase);
    // Keep the eval file's order, so the merged record reads like a single run.
    const cases = quality.cases.map((testCase) => byId.get(testCase.id)).filter(Boolean);
    if (cases.length !== quality.cases.length) {
      console.error(`SKIP — ${skill}: shards cover ${cases.length}/${quality.cases.length} cases. Run the missing shard first.`);
      process.exitCode = 2;
      continue;
    }

    const record = {
      ...records[0],
      quality: {
        total: cases.length,
        passed: cases.filter((testCase) => testCase.passed).length,
        cases,
        harness: records[0].quality?.harness,
      },
    };

    // A trigger run on the same day is a separate command with its own record; keep it.
    const outJson = join(dir, `${date}.json`);
    if (existsSync(outJson)) {
      try {
        const previous = JSON.parse(readFileSync(outJson, "utf8"));
        if (previous.agent === record.agent && (previous.model ?? null) === record.model) record.trigger = previous.trigger ?? record.trigger;
      } catch { /* an unreadable file is replaced */ }
    }

    writeFileSync(outJson, `${JSON.stringify(record, null, 2)}\n`);
    writeFileSync(join(dir, `${date}.md`), `${mdSummary(record)}\n`);
    for (const name of shardFiles) {
      rmSync(join(dir, name), { force: true });
      rmSync(join(dir, name.replace(/\.json$/, ".md")), { force: true });
    }
    console.log(`${skill}: merged ${shardFiles.length} shard(s) — quality ${record.quality.passed}/${record.quality.total}`);
    merged++;
  }
  if (!merged) console.error(`No ${date} shard files to merge.`);
  return merged;
}

async function main() {
  if (opts.validate) process.exit(validate() ? 1 : 0);
  if (opts.selfTest) process.exit(selfTest() ? 1 : 0);

  const skills = discoverSkills();
  if (!skills.length) {
    console.error("No skills with evals/trigger.json. Nothing to run.");
    process.exit(2);
  }

  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (opts.merge) process.exit(mergeShards(skills, date) ? 0 : 2);

  if (opts.dryRun) {
    for (const skill of skills) {
      const trigger = loadJson(join(repoRoot, "skills", skill, "evals", "trigger.json"));
      const quality = loadJson(join(repoRoot, "skills", skill, "evals", "quality.json"));
      console.log(`${skill}: ${trigger.prompts.length} trigger prompt(s), ${quality.cases.length} quality case(s)${opts.repeat > 1 ? ` × ${opts.repeat} repeats` : ""}`);
      if (opts.trigger) for (const p of trigger.prompts) console.log(`  [${p.should_trigger ? "+" : "-"}] ${p.prompt}`);
      if (opts.quality) for (const c of quality.cases) console.log(`  [q] ${c.id}${c.timeout_s ? ` (${c.timeout_s}s)` : ""}`);
    }
    process.exit(0);
  }

  const agent = resolveAgent();
  const cli = findCli(agent);
  if (!cli) {
    const hint = agent.bin
      ? `\`${agent.bin}\` is not on PATH. Install ${agent.label}, or pass --cli <path>.`
      : "no command to run. Pass --cli <path> together with --cli-args.";
    console.error(`SKIP — ${hint}`);
    process.exit(2);
  }
  if (agent.isolateConfig) evalConfigDir = makeEvalConfig();
  const auth = hasAuth(agent);
  // Only the Claude adapter can be probed cheaply in its own config dir; the others are
  // checked on the first prompt, where an auth message aborts the run without a results file.
  if (!auth && agent.isolateConfig) {
    const probe = await cliIsLoggedIn(cli);
    if (probe.limit) {
      if (evalConfigDir) cleanup(evalConfigDir.dir);
      console.error(`SKIP — the CLI is logged in but refused to run: ${probe.limit}`);
      process.exit(2);
    }
    if (!probe.ok) {
      if (evalConfigDir) cleanup(evalConfigDir.dir);
      console.error("SKIP — no ANTHROPIC_API_KEY / CLAUDE_CODE_OAUTH_TOKEN and the `claude` CLI is not logged in.");
      process.exit(2);
    }
  }
  console.log(`agent:  ${agent.label}${opts.cliArgs ? ` (${opts.cliArgs})` : ""}`);
  console.log(`cli:    ${cli}`);
  console.log(`auth:   ${auth ?? "existing CLI login"}`);
  if (evalConfigDir) console.log(`config: ${evalConfigDir.dir} (isolated home: only this kit's skills are visible)`);
  console.log(`skills: ${agent.skillsDirs.join(", ")} in each sandbox`);
  if (!auth) console.log("note:   no API key in the environment; evals will use the CLI's own login.");

  const results = [];
  let failures = 0;
  let aborted = null;
  let wroteAny = false;

  for (const skill of skills) {
    const trigger = loadJson(join(repoRoot, "skills", skill, "evals", "trigger.json"));
    const quality = loadJson(join(repoRoot, "skills", skill, "evals", "quality.json"));
    const result = { skill, date, agent: agent.label, cli_format: agent.format, model: opts.model ?? null, auth: auth ?? "cli-login", environment: null, trigger: null, quality: null };
    const workspace = makeWorkspace(skill, agent);
    console.log(`\n${skill} — sandbox ${workspace}`);

    try {
      if (opts.trigger) {
        const cases = [];
        for (const item of trigger.prompts) {
          if (opts.only && !item.prompt.includes(opts.only)) continue;
          const run = await runPrompt(agent, cli, item.prompt, workspace, { quality: false });
          if (run.spawnError) { aborted = `could not start ${cli}: ${run.error}`; break; }
          // A text CLI can load the skill, start building and never exit. The trigger already
          // happened, so score it and say so instead of discarding the whole run.
          const hit = run.invoked.find((entry) => entry.skill === skill);
          if (run.timedOut && !hit) { aborted = `${cli} did not answer within ${opts.timeoutMs / 1000}s — raise --timeout or check the CLI`; break; }
          if (run.limit) { aborted = run.limit; break; }
          const triggered = Boolean(hit);
          const pass = triggered === item.should_trigger;
          if (!pass) failures++;
          const note = run.timedOut && hit ? `timed out after ${opts.timeoutMs / 1000}s but the skill was already loaded` : run.error ?? null;
          cases.push({
            prompt: item.prompt,
            why: item.why,
            should_trigger: item.should_trigger,
            triggered,
            via: hit?.via ?? null,
            invoked: [...new Set(run.invoked.map((entry) => entry.skill))],
            pass,
            skills_visible: run.skillCount,
            ms: run.ms,
            error: note,
          });
          console.log(`  ${pass ? "PASS" : "FAIL"} [${item.should_trigger ? "yes" : "no "} -> ${triggered ? "yes" : "no "}] ${item.prompt.slice(0, 72)}${note ? ` (${note})` : ""}`);
        }
        if (cases.length) {
          result.trigger = { metrics: metrics(cases), cases };
          result.environment = {
            skills_visible: cases[0].skills_visible,
            skills_dir: agent.skillsDirs.join(", "),
            detection: agent.format === "stream-json" ? "tool-call" : "path-in-transcript",
            note: `${agent.label} in a temp project; a positive counts only when this skill is the one invoked. ${
              agent.format === "stream-json"
                ? "The CLI may still expose account-synced skills."
                : "Text output is scanned for the skill's SKILL.md path, so a miss can be a false negative."
            }`,
          };
        }
      }

      if (opts.quality) {
        const suffix = opts.shard ? `.shard-${opts.shard.index}` : opts.only ? `-only-${slug(opts.only)}` : "";
        const checkpointPath = resolve(opts.resume ?? join(
          repoRoot, "skills", skill, "evals", "results",
          `.progress-${skill}${suffix}.json`
        ));

        // Resume keeps the repeats that already passed. A case only counts as passed when every
        // requested repeat passed, so a flaky case cannot hide behind one lucky run.
        let previous = new Map();
        if (opts.resume) {
          try {
            const saved = loadJson(checkpointPath);
            const savedCases = saved.quality?.cases ?? saved.cases ?? [];
            for (const item of savedCases) {
              if (Array.isArray(item.repeats)) {
                for (const repeat of item.repeats) if (repeat.passed) previous.set(`${item.id}#${repeat.repeat - 1}`, repeat);
              } else if (item.passed) {
                previous.set(`${item.id}#${item.repeat ?? 0}`, item);
              }
            }
            console.log(`  resume: ${previous.size} passed run(s) kept from ${checkpointPath}`);
          } catch (error) {
            console.error(`--resume could not read ${checkpointPath}: ${error.message}`);
            process.exit(2);
          }
        } else {
          rmSync(checkpointPath, { force: true });
        }

        const selected = [];
        for (const [caseIndex, testCase] of quality.cases.entries()) {
          if (opts.only && testCase.id !== opts.only) continue;
          if (opts.shard && caseIndex % opts.shard.count !== opts.shard.index) continue;
          selected.push({ caseIndex, testCase });
        }

        // One task per (case, repeat). A crash or a quota stop leaves the checkpoint behind,
        // so the next command pays only for the runs that are still missing.
        const queue = [];
        for (const task of selected) {
          for (let repeat = 0; repeat < opts.repeat; repeat++) queue.push({ ...task, repeat });
        }

        const collected = new Map();
        for (const task of selected) collected.set(task.caseIndex, new Map());
        for (const task of queue) {
          const kept = previous.get(`${task.testCase.id}#${task.repeat}`);
          if (kept) collected.get(task.caseIndex).set(task.repeat, { ...kept, resumed: true });
        }
        const pending = queue.filter((task) => !previous.has(`${task.testCase.id}#${task.repeat}`));
        if (previous.size) console.log(`  resume: ${queue.length - pending.length}/${queue.length} run(s) kept, ${pending.length} to run`);
        console.log(`  checkpoint: ${checkpointPath}${opts.repeat > 1 ? ` · ${opts.repeat} repeats` : ""}`);

        const saveCheckpoint = () => {
          const cases = [];
          for (const [caseIndex, repeats] of [...collected.entries()].sort((a, b) => a[0] - b[0])) {
            const testCase = quality.cases[caseIndex];
            for (const [repeat, item] of repeats) cases.push({ id: testCase.id, repeat, ...item });
          }
          mkdirSync(dirname(checkpointPath), { recursive: true });
          writeFileSync(checkpointPath, `${JSON.stringify({
            skill, date, agent: agent.label, model: opts.model ?? null, checkpoint: true,
            quality: { cases },
          }, null, 2)}\n`);
        };

        let nextTask = 0;
        const worker = async () => {
          while (!aborted) {
            const index = nextTask++;
            if (index >= pending.length) return;
            const { caseIndex, testCase, repeat } = pending[index];
            const caseWorkspace = makeWorkspace(skill, agent);
            // A case can declare its own budget; a slow model on one prompt should not force
            // every other case to wait that long.
            const caseTimeout = Number(testCase.timeout_ms ?? testCase.timeoutMs ?? (testCase.timeout_s ? testCase.timeout_s * 1000 : 0)) || opts.timeoutMs;
            try {
              // A case may describe a project it expects to exist ("a live app in ./existing-app").
              // Copy the fixture in under the name the prompt uses so the test measures the skill,
              // not whether the model can invent a codebase from a path that is not there.
              if (testCase.fixture) {
                cpSync(join(repoRoot, "test-fixtures", testCase.fixture), join(caseWorkspace, testCase.fixture_path ?? "existing-app"), { recursive: true });
              }
              // Quality cases are automated: there is no human to answer the skill's intake
              // questions, so say so once. Without this the model correctly asks its five
              // questions and writes nothing, and the case measures the harness, not the skill.
              const prompt = `Automated evaluation — there is no human to answer questions. State your assumptions briefly and complete the task.\n\n${testCase.prompt}`;
              const run = await runPrompt(agent, cli, prompt, caseWorkspace, { quality: true, timeoutMs: caseTimeout });
              if (run.spawnError) { aborted = `could not start ${cli}: ${run.error}`; return; }
              if (run.limit) { aborted = run.limit; return; }
              const assertions = testCase.assertions.map((assertion) => checkAssertion(assertion, caseWorkspace, run.response));
              // A timeout is a harness limit, not proof the task failed: if the artifacts are on
              // disk, score them. Record the timeout on the case so nobody reads it as fast.
              if (run.error && !run.timedOut) assertions.push({ label: "run completed", pass: false, detail: run.error });
              const passed = assertions.every((a) => a.pass);
              collected.get(caseIndex).set(repeat, {
                repeat, passed, assertions, ms: run.ms, timed_out: run.timedOut,
                timeout_s: Math.round(caseTimeout / 1000), response: run.response.slice(0, 4000),
              });
              saveCheckpoint();
              const failed = assertions.filter((a) => !a.pass);
              const label = opts.repeat > 1 ? `${testCase.id} (run ${repeat + 1}/${opts.repeat})` : testCase.id;
              console.log(`  ${passed ? "PASS" : "FAIL"} [quality] ${label}${failed.length ? ` — ${failed.map((a) => a.label).join("; ")}` : ""}${run.timedOut ? ` (timed out at ${caseTimeout / 1000}s; assertions still checked)` : ""}`);
            } finally {
              if (!opts.keep) cleanup(caseWorkspace);
            }
          }
        };
        const workers = Math.max(1, Math.min(opts.concurrency, pending.length || 1));
        await Promise.all(Array.from({ length: workers }, () => worker()));

        const cases = selected.map(({ caseIndex, testCase }) => {
          const repeats = [...collected.get(caseIndex).entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, item]) => item);
          const passCount = repeats.filter((item) => item.passed).length;
          const passed = repeats.length === opts.repeat && passCount === opts.repeat;
          const firstFailure = repeats.find((item) => !item.passed);
          const first = repeats[0];
          if (!repeats.length) return null;
          return {
            id: testCase.id,
            prompt: testCase.prompt,
            passed,
            // Divide by the runs that happened, not the runs requested: an aborted run must not
            // report 0/3 for a case it never started.
            pass_rate: Number((passCount / repeats.length).toFixed(3)),
            assertions: (firstFailure ?? first)?.assertions ?? [],
            judgement: testCase.judgement ?? [],
            ms: repeats.reduce((total, item) => total + (item.ms ?? 0), 0),
            timed_out: repeats.some((item) => item.timed_out),
            timeout_s: first?.timeout_s ?? Math.round(opts.timeoutMs / 1000),
            response: first?.response ?? "",
            repeats: repeats.map((item) => ({
              repeat: item.repeat + 1,
              passed: item.passed,
              assertions: item.assertions,
              ms: item.ms,
              timed_out: item.timed_out,
              response: (item.response ?? "").slice(0, 1000),
            })),
          };
        }).filter(Boolean);
        if (cases.length) {
          const perRepeat = Array.from({ length: opts.repeat }, (_, index) => ({
            repeat: index + 1,
            passed: cases.filter((item) => item.repeats.find((r) => r.repeat === index + 1)?.passed).length,
            total: cases.length,
          }));
          result.quality = {
            total: cases.length,
            passed: cases.filter((c) => c.passed).length,
            cases,
            repeats: opts.repeat,
            complete: !aborted,
            aborted: aborted ?? null,
            repeat_summary: {
              repeats: opts.repeat,
              per_repeat: perRepeat,
              min: Math.min(...perRepeat.map((r) => r.passed)),
              max: Math.max(...perRepeat.map((r) => r.passed)),
            },
            checkpoint: checkpointPath,
            harness: "prefixed with: no human to answer questions — state assumptions and complete the task",
          };
          if (opts.resume) result.quality.resumed_from = checkpointPath;
          failures += cases.filter((c) => !c.passed).length;
          if (!aborted) rmSync(checkpointPath, { force: true });
        }
      }
    } finally {
      if (!opts.keep) cleanup(workspace);
      else console.log(`  kept sandbox: ${workspace}`);
    }

    const outDir = join(repoRoot, "skills", skill, "evals", "results");
    const produced = Boolean(result.quality?.cases?.length || result.trigger?.cases?.length);
    if (!produced) {
      // A probe that matched nothing in this skill is not a result. Writing an empty file would
      // read as "zero cases passed" and would sit next to the real file for the same day.
      console.log(`  no ${opts.only ? `case matching --only "${opts.only}"` : "cases selected"} in ${skill}; nothing written`);
      if (aborted) break;
      continue;
    }
    wroteAny = true;
    mkdirSync(outDir, { recursive: true });
    // A one-case probe is evidence, not the day's result: keep it out of the canonical file.
    let suffix = opts.shard ? `.shard-${opts.shard.index}` : opts.only ? `-only-${slug(opts.only)}` : "";
    // Trigger and quality runs are separate commands, often on the same day. Merge rather
    // than replace, so the second run cannot erase the first run's numbers.
    let outJson = join(outDir, `${date}${suffix}.json`);
    let record = result;
    if (!suffix && existsSync(outJson)) {
      try {
        const previous = JSON.parse(readFileSync(outJson, "utf8"));
        if (previous.agent === result.agent && (previous.model ?? null) === (result.model ?? null)) {
          record = mergeRecords(previous, result);
        } else {
          // Two models on one day are two results. Never let the second silently replace the first.
          suffix = `-${slug(`${result.agent}-${result.model ?? "default"}`)}`;
          outJson = join(outDir, `${date}${suffix}.json`);
        }
      } catch { /* an unreadable file is replaced, not merged */ }
    }
    writeFileSync(outJson, `${JSON.stringify(record, null, 2)}\n`);
    writeFileSync(join(outDir, `${date}${suffix}.md`), `${mdSummary(record)}\n`);
    results.push(record);
    console.log(`  wrote skills/${skill}/evals/results/${date}${suffix}.json`);
    if (aborted) break;
  }

  if (opts.only && !wroteAny) {
    console.error(`No case with id "${opts.only}" in ${skills.join(", ")}. Check the id with --dry-run --quality.`);
    process.exit(2);
  }

  if (aborted) {
    if (evalConfigDir) cleanup(evalConfigDir.dir);
    console.error(`\nABORTED — could not finish the evals: ${aborted}`);
    console.error("Partial results were written if any case completed; re-run with --resume <file> to keep them.");
    process.exit(2);
  }

  console.log("\nSummary");
  for (const result of results) {
    if (result.trigger) {
      const t = result.trigger.metrics;
      console.log(`  ${result.skill}: precision ${t.precision} recall ${t.recall} accuracy ${t.accuracy} (tp ${t.tp}, fp ${t.fp}, fn ${t.fn}, tn ${t.tn})`);
    }
    if (result.quality) {
      const repeat = result.quality.repeat_summary;
      console.log(`  ${result.skill}: quality ${result.quality.passed}/${result.quality.total}${repeat ? ` (${repeat.repeats} repeats, range ${repeat.min}–${repeat.max})` : ""}`);
    }
  }
  if (evalConfigDir) cleanup(evalConfigDir.dir);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exit(1);
});
