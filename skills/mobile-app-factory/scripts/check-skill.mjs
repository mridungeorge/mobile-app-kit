#!/usr/bin/env node
// Self-audit for the Mobile App Factory skill. Dependency-free.
//
//   node scripts/check-skill.mjs
//
// Checks structure, frontmatter, referenced paths, archetype/vocabulary drift,
// agent numbering, and the metadata template. Exit code 1 means the skill is broken;
// warnings do not fail the build.

import { readFileSync, existsSync, mkdtempSync, copyFileSync, rmSync, readdirSync, statSync } from "node:fs";
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
  "references/archetypes.md",
  "references/definition-of-done.md",
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
  "references/gap-closure.md",
  "references/mobile-testing.md",
  "references/native-android-release.md",
  "references/native-ios-release.md",
  "assets/design-tokens.json",
  "assets/project-profile.template.json",
  "assets/store-metadata.template.json",
  "assets/android/project/settings.gradle.kts",
  "assets/android/project/app/build.gradle.kts",
  "assets/android/project/gradle/libs.versions.toml",
  "assets/android/project/gradlew",
  "assets/android/project/gradlew.bat",
  "assets/android/project/gradle/wrapper/gradle-wrapper.jar",
  "assets/android/project/gradle/wrapper/gradle-wrapper.properties",
  "assets/ios/project/project.yml",
  "assets/ios/project/Sources/App.swift",
  "assets/ios/project/Resources/PrivacyInfo.xcprivacy",
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
  "scripts/questionnaire.mjs",
  "scripts/generate-preview.mjs",
  "scripts/review-preview.mjs",
  "scripts/scaffold-native.mjs",
  "scripts/readiness-report.mjs",
  "scripts/new-app.sh",
  "scripts/new-android-app.sh",
  "scripts/new-ios-app.sh",
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
const routerRef = readFileSync(join(root, "references/archetypes.md"), "utf8");
const headings = [...routerRef.matchAll(/^### ([a-z0-9-]+)$/gm)].map((m) => m[1]);
const missingInDoc = ARCHETYPE_ORDER.filter((a) => !headings.includes(a));
const missingInScript = headings.filter((a) => !ARCHETYPE_ORDER.includes(a));
if (missingInDoc.length) errors.push(`archetypes in script but not references/archetypes.md: ${missingInDoc.join(", ")}`);
if (missingInScript.length) errors.push(`archetypes in references/archetypes.md but not script: ${missingInScript.join(", ")}`);
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

// End-to-end pipeline smoke test: intake -> preview -> changes -> approval -> readiness report.
try {
  const temp = mkdtempSync(join(tmpdir(), "maf-pipeline-"));
  const run = (script, args) => execFileSync(process.execPath, [join(root, "scripts", script), ...args], { stdio: "pipe" });

  run("questionnaire.mjs", ["--out", temp, "--non-interactive", "--idea", "a sleep tracker with white noise", "--platforms", "both", "--monetisation", "subscription"]);
  run("generate-preview.mjs", ["--dir", temp]);

  const preview = readFileSync(join(temp, "preview", "index.html"), "utf8");
  if (!preview.includes("feedback.json") || !preview.includes("Approval checklist")) {
    throw new Error("preview is missing the feedback/approval UI");
  }

  run("review-preview.mjs", ["--dir", temp, "--request-changes", "Add settings and drop the paywall", "--add-screen", "settings", "--remove-screen", "paywall", "--no-regenerate"]);
  const changed = JSON.parse(readFileSync(join(temp, "00-profile.json"), "utf8"));
  if (!changed.screens.includes("settings")) throw new Error("--add-screen was not applied");
  if (changed.screens.includes("paywall")) throw new Error("--remove-screen was not applied");

  run("review-preview.mjs", ["--dir", temp, "--approve"]);
  const approval = JSON.parse(readFileSync(join(temp, "00-approval.json"), "utf8"));
  if (approval.status !== "approved") throw new Error("approval was not recorded");
  if (!approval.history || !approval.history.length) throw new Error("approval history was not kept");

  const report = JSON.parse(execFileSync(process.execPath, [join(root, "scripts", "readiness-report.mjs"), "--dir", temp, "--json"], { stdio: "pipe" }).toString());
  if (!report.ai.some((item) => item.name === "Preview approved" && item.status === "pass")) {
    throw new Error("readiness report does not see the approval");
  }
  if (!report.human.length) throw new Error("readiness report has no human/external items");

  ok.push("pipeline: intake → preview → changes → approval → readiness report");
  rmSync(temp, { recursive: true, force: true });
} catch (error) {
  errors.push(`pipeline smoke test failed: ${String(error.stdout || error.message).trim().split("\n").slice(0, 3).join(" ")}`);
}

// Native starter smoke test: both templates copy, substitute and leave no placeholders.
try {
  const temp = mkdtempSync(join(tmpdir(), "maf-native-"));
  const run = (args) => execFileSync(process.execPath, [join(root, "scripts", "scaffold-native.mjs"), ...args], { stdio: "pipe" });
  run(["--platform", "android", "--name", "Smoke App", "--package", "com.example.smoke", "--out", join(temp, "android")]);
  run(["--platform", "ios", "--name", "Smoke App", "--bundle-id", "com.example.smoke", "--out", join(temp, "ios")]);

  const androidMain = join(temp, "android", "app", "src", "main", "java", "com", "example", "smoke", "MainActivity.kt");
  const iosProject = join(temp, "ios", "project.yml");
  if (!existsSync(androidMain)) throw new Error("Android package path was not substituted");
  if (!existsSync(iosProject)) throw new Error("iOS project.yml was not generated");
  if (!existsSync(join(temp, "ios", "Resources", "PrivacyInfo.xcprivacy"))) throw new Error("iOS PrivacyInfo missing");

  // The Gradle wrapper is the only binary in either template. If the scaffolder ever
  // decoded the .jar as UTF-8 it would be silently corrupted, and the project would
  // fail with a confusing "invalid or corrupt jarfile". Compare bytes, not existence.
  const wrapperDir = join(temp, "android", "gradle", "wrapper");
  const wrapperJar = join(wrapperDir, "gradle-wrapper.jar");
  const wrapperProps = join(wrapperDir, "gradle-wrapper.properties");
  if (!existsSync(wrapperJar)) throw new Error("Gradle wrapper jar was not copied");
  if (!existsSync(join(temp, "android", "gradlew"))) throw new Error("gradlew was not copied");
  if (!existsSync(join(temp, "android", "gradlew.bat"))) throw new Error("gradlew.bat was not copied");
  if (!existsSync(wrapperProps)) throw new Error("gradle-wrapper.properties was not copied");

  const templateJar = readFileSync(join(root, "assets", "android", "project", "gradle", "wrapper", "gradle-wrapper.jar"));
  if (Buffer.compare(templateJar, readFileSync(wrapperJar)) !== 0) {
    throw new Error("Gradle wrapper jar changed during scaffolding — binary was not preserved");
  }

  const props = readFileSync(wrapperProps, "utf8");
  if (!/^distributionUrl=https\\:\/\/services\.gradle\.org\/distributions\/gradle-[\d.]+-bin\.zip$/m.test(props)) {
    throw new Error("gradle-wrapper.properties has no valid distributionUrl");
  }

  const gradlew = readFileSync(join(temp, "android", "gradlew"), "utf8");
  if (!gradlew.startsWith("#!/bin/sh")) throw new Error("gradlew lost its shebang");
  if (gradlew.includes("\r")) throw new Error("gradlew has CRLF line endings (breaks on Linux/macOS/CI)");

  // XcodeGen fails late and confusingly on a malformed spec, so assert the keys the
  // generated project actually depends on after substitution.
  const projectYml = readFileSync(iosProject, "utf8");
  const ymlExpectations = [
    ["project name", "name: SmokeApp"],
    ["bundle id", "PRODUCT_BUNDLE_IDENTIFIER: com.example.smoke"],
    ["display name", "INFOPLIST_KEY_CFBundleDisplayName: Smoke App"],
    ["app target", "type: application"],
    ["test target", "type: bundle.unit-test"],
    ["app icon", "ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon"],
  ];
  for (const [label, needle] of ymlExpectations) {
    if (!projectYml.includes(needle)) throw new Error(`iOS project.yml missing ${label} (${needle})`);
  }
  for (const asset of ["AppIcon.appiconset", "AccentColor.colorset"]) {
    if (!existsSync(join(temp, "ios", "Resources", "Assets.xcassets", asset, "Contents.json"))) {
      throw new Error(`iOS asset catalog missing ${asset}`);
    }
  }

  const placeholders = ["__PROJECT_NAME__", "__APP_NAME__", "__APP_SLUG__", "__PACKAGE__", "__PACKAGE_PATH__", "__BUNDLE_ID__"];
  const files = readdirSync(temp, { recursive: true }).filter((entry) => typeof entry === "string")
    .map((entry) => join(temp, entry));
  for (const file of files) {
    let stat;
    try { stat = statSync(file); } catch { continue; }
    if (!stat.isFile()) continue;
    const content = readFileSync(file);
    if (content.includes(0)) continue;
    const text = content.toString("utf8");
    const left = placeholders.find((token) => text.includes(token));
    if (left) throw new Error(`placeholder ${left} left in ${file.replace(temp, "")}`);
  }

  ok.push("native templates: Android + iOS scaffold, substitute and keep the Gradle wrapper binary intact");
  rmSync(temp, { recursive: true, force: true });
} catch (error) {
  errors.push(`native template smoke test failed: ${String(error.stdout || error.message).trim().split("\n").slice(0, 3).join(" ")}`);
}

// README artwork: every image the repo README references must exist on disk, so the
// hero banner and the animation cannot silently rot when the artwork is re-rendered.
// Installed copies live at ~/.claude/skills/mobile-app-factory, where there is no repo
// README — that is a normal install, not a warning worth showing to the user.
try {
  const repoRoot = resolve(root, "..", "..");
  const readmePath = join(repoRoot, "README.md");
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, "utf8");
    const assets = [...readme.matchAll(/src="((?:docs|promo)\/[^"]+\.(?:png|gif|jpg|jpeg|webp|svg|mp4))"/g)]
      .map((m) => m[1]);
    const missing = [...new Set(assets)].filter((asset) => !existsSync(join(repoRoot, asset)));
    if (missing.length) errors.push(...missing.map((a) => `README references missing artwork: ${a}`));
    else if (!assets.length) warnings.push("README references no artwork");
    else ok.push(`readme: ${new Set(assets).size} referenced image(s) exist`);
  } else {
    ok.push("readme: installed copy, no repo README to check");
  }
} catch (error) {
  errors.push(`README artwork check failed: ${error.message}`);
}

// Report
console.log(`Mobile App Factory — skill audit\nroot: ${root}\n`);
for (const line of ok) console.log(`  ✓ ${line}`);
for (const line of warnings) console.log(`  ! ${line}`);
for (const line of errors) console.log(`  ✗ ${line}`);
console.log(`\n${errors.length ? "FAIL" : "PASS"} — ${ok.length} checks passed, ${warnings.length} warnings, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
