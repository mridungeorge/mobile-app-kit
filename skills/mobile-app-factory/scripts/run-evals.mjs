#!/usr/bin/env node
// Trigger and quality evals for the skills in this repo, against a real agent CLI.
//
//   node scripts/run-evals.mjs                     # every skill, trigger + quality
//   node scripts/run-evals.mjs --trigger           # trigger sets only (fast, cheap)
//   node scripts/run-evals.mjs --skill mobile-app-factory --trigger
//   node scripts/run-evals.mjs --quality --only idea-to-prd
//   node scripts/run-evals.mjs --agent opencode    # claude (default) | opencode | codex
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

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, cpSync, writeFileSync, copyFileSync } from "node:fs";
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
  timeoutMs: 240_000,
  maxTurns: null,
  model: null,
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
  else if (arg === "--timeout") opts.timeoutMs = Number(process.argv[++i]) * 1000;
  else if (arg === "--max-turns") opts.maxTurns = Number(process.argv[++i]);
  else if (arg === "--model") opts.model = process.argv[++i];
  else if (arg === "--keep") opts.keep = true;
  else if (arg === "--debug") opts.debug = true;
  else if (arg === "--cli") opts.cli = process.argv[++i];
  else if (arg === "--agent") opts.agent = process.argv[++i];
  else if (arg === "--cli-args") opts.cliArgs = process.argv[++i];
  else if (arg === "--help" || arg === "-h") {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 23).join("\n").replace(/^\/\/ ?/gm, ""));
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
      if (!Array.isArray(testCase.assertions) || !testCase.assertions.length) {
        problems.push(`${skill}/${testCase.id}: no checkable assertions`);
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

  expect("does not fire on text with no skill mention",
    detectInText("I built a habit tracker and never loaded a skill.").length === 0);

  const known = ["claude", "opencode", "codex"].map((name) => AGENTS[name]);
  expect("every known agent has at least one skills directory",
    known.every((agent) => Array.isArray(agent.skillsDirs) && agent.skillsDirs.length > 0));
  expect("the known agents do not all share one skills directory",
    new Set(known.map((agent) => agent.skillsDirs[0])).size === known.length);

  for (const problem of problems) console.log(`  x ${problem}`);
  console.log(`\n${problems.length ? "FAIL" : "PASS"} — runner self-test, ${problems.length} problem(s)`);
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
    command: (prompt) => ["run", prompt],
  },
  codex: {
    label: "Codex CLI",
    bin: "codex",
    skillsDirs: [".agents/skills"],
    format: "text",
    isolateConfig: false,
    keys: ["OPENAI_API_KEY"],
    command: (prompt) => ["exec", prompt],
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

function makeWorkspace(skill, agent) {
  const dir = mkdtempSync(join(tmpdir(), `maf-evals-${skill}-`));
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
  const dir = mkdtempSync(join(tmpdir(), "maf-evals-config-"));
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
  const pathPattern = /(?:^|[\\/\s"'`])skills[\\/]([^\\/\s"'`]+)[\\/]SKILL\.md/gi;
  let match;
  while ((match = pathPattern.exec(text)) !== null) hits.push({ skill: match[1], via: "path" });
  // OpenCode prints `Skill "<id>"` when it loads one.
  const skillPattern = /\bSkill\s+["'`]([a-z0-9-]+)["'`]/gi;
  while ((match = skillPattern.exec(text)) !== null) hits.push({ skill: match[1], via: "Skill" });
  return hits;
}

function runPrompt(agent, cli, prompt, cwd, { quality }) {
  return new Promise((resolveRun) => {
    const args = opts.cliArgs
      ? opts.cliArgs.trim().split(/\s+/).map((part) => part.replace("{prompt}", prompt))
      : agent.command(prompt, { quality });

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
    }, opts.timeoutMs);
    // Belt and braces: if the process tree survives the kill and never closes its pipes, resolve
    // anyway so the harness cannot hang forever.
    const hardStop = setTimeout(() => {
      resolveRun({ invoked, response: raw, error: `timed out after ${opts.timeoutMs / 1000}s`, timedOut: true, skillCount, limit: limitHit, ms: Date.now() - started });
    }, opts.timeoutMs + 15_000);
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
      if (!limitHit && code !== 0 && !invoked.length) {
        const message = `${raw}\n${stderr}`.trim();
        if (/not logged in|authenticat|unauthori[sz]ed|credit balance|quota|usage limit|rate limit|api key/i.test(message)) {
          limitHit = message.split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 200);
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
    lines.push(`## Quality set`, "", "| case | pass | failed assertion |", "|---|---|---|");
    for (const testCase of result.quality.cases) {
      const failed = testCase.assertions.find((a) => !a.pass);
      lines.push(`| ${testCase.id} | ${testCase.passed ? "pass" : "FAIL"} | ${failed ? failed.label : ""} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  if (opts.validate) process.exit(validate() ? 1 : 0);
  if (opts.selfTest) process.exit(selfTest() ? 1 : 0);

  const skills = discoverSkills();
  if (!skills.length) {
    console.error("No skills with evals/trigger.json. Nothing to run.");
    process.exit(2);
  }

  if (opts.dryRun) {
    for (const skill of skills) {
      const trigger = loadJson(join(repoRoot, "skills", skill, "evals", "trigger.json"));
      const quality = loadJson(join(repoRoot, "skills", skill, "evals", "quality.json"));
      console.log(`${skill}: ${trigger.prompts.length} trigger prompt(s), ${quality.cases.length} quality case(s)`);
      if (opts.trigger) for (const p of trigger.prompts) console.log(`  [${p.should_trigger ? "+" : "-"}] ${p.prompt}`);
      if (opts.quality) for (const c of quality.cases) console.log(`  [q] ${c.id}`);
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

  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const results = [];
  let failures = 0;
  let aborted = null;

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
          if (run.timedOut) { aborted = `${cli} did not answer within ${opts.timeoutMs / 1000}s — raise --timeout or check the CLI`; break; }
          if (run.limit) { aborted = run.limit; break; }
          const hit = run.invoked.find((entry) => entry.skill === skill);
          const triggered = Boolean(hit);
          const pass = triggered === item.should_trigger;
          if (!pass) failures++;
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
            error: run.error ?? null,
          });
          console.log(`  ${pass ? "PASS" : "FAIL"} [${item.should_trigger ? "yes" : "no "} -> ${triggered ? "yes" : "no "}] ${item.prompt.slice(0, 72)}${run.error ? ` (${run.error})` : ""}`);
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
        const cases = [];
        for (const testCase of quality.cases) {
          if (opts.only && testCase.id !== opts.only) continue;
          const caseWorkspace = makeWorkspace(skill, agent);
          try {
            const run = await runPrompt(agent, cli, testCase.prompt, caseWorkspace, { quality: true });
            if (run.spawnError) { aborted = `could not start ${cli}: ${run.error}`; break; }
            if (run.timedOut) { aborted = `${cli} did not answer within ${opts.timeoutMs / 1000}s — raise --timeout or check the CLI`; break; }
            if (run.limit) { aborted = run.limit; break; }
            const assertions = testCase.assertions.map((assertion) => checkAssertion(assertion, caseWorkspace, run.response));
            if (run.error) assertions.push({ label: "run completed", pass: false, detail: run.error });
            const passed = assertions.every((a) => a.pass);
            if (!passed) failures++;
            cases.push({ id: testCase.id, prompt: testCase.prompt, passed, assertions, judgement: testCase.judgement ?? [], ms: run.ms });
            const failed = assertions.filter((a) => !a.pass);
            console.log(`  ${passed ? "PASS" : "FAIL"} [quality] ${testCase.id}${failed.length ? ` — ${failed.map((a) => a.label).join("; ")}` : ""}`);
          } finally {
            if (!opts.keep) cleanup(caseWorkspace);
          }
        }
        if (cases.length) {
          result.quality = { total: cases.length, passed: cases.filter((c) => c.passed).length, cases };
        }
      }
    } finally {
      if (!opts.keep) cleanup(workspace);
      else console.log(`  kept sandbox: ${workspace}`);
    }

    const outDir = join(repoRoot, "skills", skill, "evals", "results");
    if (aborted) break;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, `${date}.json`), `${JSON.stringify(result, null, 2)}\n`);
    writeFileSync(join(outDir, `${date}.md`), `${mdSummary(result)}\n`);
    results.push(result);
    console.log(`  wrote skills/${skill}/evals/results/${date}.json`);
  }

  if (aborted) {
    if (evalConfigDir) cleanup(evalConfigDir.dir);
    console.error(`\nABORTED — could not run the evals: ${aborted}`);
    console.error("No results file was written. Sign the CLI in, raise its limit, or pass --cli/--agent.");
    process.exit(2);
  }

  console.log("\nSummary");
  for (const result of results) {
    if (result.trigger) {
      const t = result.trigger.metrics;
      console.log(`  ${result.skill}: precision ${t.precision} recall ${t.recall} accuracy ${t.accuracy} (tp ${t.tp}, fp ${t.fp}, fn ${t.fn}, tn ${t.tn})`);
    }
    if (result.quality) console.log(`  ${result.skill}: quality ${result.quality.passed}/${result.quality.total}`);
  }
  if (evalConfigDir) cleanup(evalConfigDir.dir);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exit(1);
});
