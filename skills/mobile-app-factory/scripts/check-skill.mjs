#!/usr/bin/env node
// Self-audit for the Mobile App Factory skill. Dependency-free.
//
//   node scripts/check-skill.mjs
//
// Checks structure, frontmatter, referenced paths, archetype/vocabulary drift,
// agent numbering, and the metadata template. Exit code 1 means the skill is broken;
// warnings do not fail the build.

import { readFileSync, existsSync, mkdtempSync, copyFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const ok = [];

const must = (path, label = path) => {
  if (!existsSync(join(root, path))) errors.push(`missing ${label}`);
};

const required = [
  "SKILL.md",
  "QUICKSTART.md",
  "references/idea-router.md",
  "references/design-language.md",
  "references/component-map.md",
  "references/adaptive-ui.md",
  "references/ux-checklist.md",
  "references/screen-patterns.md",
  "references/stacks-and-repos.md",
  "references/ios-app-store.md",
  "references/google-play.md",
  "references/metadata-and-assets.md",
  "references/orchestration.md",
  "assets/design-tokens.json",
  "assets/project-profile.template.json",
  "assets/store-metadata.template.json",
  "assets/rn/theme.ts",
  "assets/rn/motion.ts",
  "assets/rn/components/Surface.tsx",
  "assets/rn/components/Button.tsx",
  "assets/rn/components/ListRow.tsx",
  "assets/rn/components/Sheet.tsx",
  "assets/rn/components/Reveal.tsx",
  "assets/rn/components/TextField.tsx",
  "assets/rn/components/Switch.tsx",
  "assets/rn/components/SegmentedControl.tsx",
  "assets/rn/components/EmptyState.tsx",
  "assets/web/tokens.css",
  "assets/ios/PrivacyInfo.xcprivacy",
  "assets/android/data-safety-worksheet.md",
  "assets/ci/expo-eas.json",
  "scripts/route-idea.mjs",
  "scripts/validate-metadata.mjs",
  "scripts/new-app.sh",
  "evals/prompts.md"
];
for (const path of required) must(path);

const agents = Array.from({ length: 7 }, (_, i) => `agents/0${i + 1}-`);
for (const prefix of agents) {
  const found = ["product-architect", "design-director", "ui-builder", "motion-director", "store-compliance", "release-engineer", "reviewer"];
  const index = Number(prefix.slice(7, 9)) - 1;
  must(`${prefix}${found[index]}.md`, `agent ${index + 1}`);
}
if (errors.length === 0) ok.push("structure: required files and all 7 agent briefs present");

// Frontmatter
const skill = readFileSync(join(root, "SKILL.md"), "utf8");
const match = skill.match(/^---\n([\s\S]*?)\n---/);
if (!match) errors.push("SKILL.md has no YAML frontmatter");
else {
  const name = match[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = match[1].match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
  if (name !== "mobile-app-factory") errors.push(`frontmatter name is "${name}", expected mobile-app-factory`);
  if (description.length < 200) warnings.push(`description is short (${description.length} chars)`);
  if (description.length > 1024) errors.push(`description is ${description.length} chars; keep it under 1024`);
  if (!errors.some((e) => e.startsWith("frontmatter") || e.startsWith("SKILL"))) {
    ok.push(`frontmatter: name matches, description ${description.length} chars`);
  }
}

// Referenced paths in markdown (ignore runtime outputs and bare filenames)
const mdFiles = readdirSync(root, { recursive: true })
  .filter((f) => typeof f === "string" && f.endsWith(".md") && !f.split("/").includes("node_modules"));
const seen = new Set();
const broken = [];
for (const file of mdFiles) {
  const text = readFileSync(join(root, file), "utf8");
  for (const m of text.matchAll(/`([A-Za-z0-9_./-]+\.(?:md|json|sh|mjs|ts|tsx|css|xcprivacy))`/g)) {
    const ref = m[1];
    if (seen.has(ref)) continue;
    seen.add(ref);
    if (ref.startsWith(".mobile/") || ref.includes("<") || ref.startsWith("http")) continue;
    if (!ref.includes("/")) continue; // bare filename, usually an output artifact
    if (!existsSync(join(root, ref)) && !existsSync(resolve(root, "..", ref))) broken.push(`${file} → ${ref}`);
  }
}
if (broken.length) errors.push(...broken.map((b) => `broken reference: ${b}`));
else ok.push(`references: ${seen.size} unique paths checked, all resolve`);

// Archetype vocabulary must match the router
const { ARCHETYPE_ORDER } = await import("./route-idea.mjs");
const routerRef = readFileSync(join(root, "references/idea-router.md"), "utf8");
const headings = [...routerRef.matchAll(/^### ([a-z0-9-]+)$/gm)].map((m) => m[1]);
const missingInDoc = ARCHETYPE_ORDER.filter((a) => !headings.includes(a));
const missingInScript = headings.filter((a) => !ARCHETYPE_ORDER.includes(a));
if (missingInDoc.length) errors.push(`archetypes in script but not idea-router.md: ${missingInDoc.join(", ")}`);
if (missingInScript.length) errors.push(`archetypes in idea-router.md but not script: ${missingInScript.join(", ")}`);
if (!missingInDoc.length && !missingInScript.length) ok.push(`archetypes: ${ARCHETYPE_ORDER.length} match between router and reference`);

// Metadata template must validate clean
const temp = mkdtempSync(join(tmpdir(), "maf-check-"));
try {
  copyFileSync(join(root, "assets/store-metadata.template.json"), join(temp, "metadata.json"));
  execFileSync(process.execPath, [join(root, "scripts/validate-metadata.mjs"), temp], { stdio: "pipe" });
  ok.push("metadata template: validates clean");
} catch (error) {
  errors.push(`metadata template does not validate: ${String(error.stdout || error.message).trim().split("\n").slice(0, 4).join(" ")}`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

// Router smoke tests
try {
  const { routeIdea } = await import("./route-idea.mjs");
  const cases = [
    ["a sleep tracker with white noise", "health-fitness"],
    ["marketplace for local dog walkers", "commerce-marketplace"],
    ["kids phonics and bedtime stories", "kids-family"],
    ["AI journal that summarises my week", "ai-assistant"],
    ["offline bird identifier with photos", "camera-photo"],
    ["b2b field inspections with offline mode", "b2b-field"],
    ["courier app with live tracking", "delivery-logistics"],
    ["a unit converter", "utility"]
  ];
  const wrong = cases.filter(([idea, expected]) => routeIdea(idea).archetype !== expected);
  if (wrong.length) errors.push(...wrong.map(([idea, expected]) => `router misclassified "${idea}" (expected ${expected})`));
  else ok.push(`router: ${cases.length}/${cases.length} smoke cases classified correctly`);

  const profiles = ARCHETYPE_ORDER.map((a) => routeIdea("test", { archetype: a }));
  const invalid = profiles.filter((p) => p.screens.length > 12 || !p.coreLoop || !p.qaFocus.length);
  if (invalid.length) errors.push(`profiles invalid for: ${invalid.map((p) => p.archetype).join(", ")}`);
  else ok.push("profiles: all archetypes emit a complete profile with ≤ 12 screens");
} catch (error) {
  errors.push(`router import failed: ${error.message}`);
}

// Report
console.log(`Mobile App Factory — skill audit\nroot: ${root}\n`);
for (const line of ok) console.log(`  ✓ ${line}`);
for (const line of warnings) console.log(`  ! ${line}`);
for (const line of errors) console.log(`  ✗ ${line}`);
console.log(`\n${errors.length ? "FAIL" : "PASS"} — ${ok.length} checks passed, ${warnings.length} warnings, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
