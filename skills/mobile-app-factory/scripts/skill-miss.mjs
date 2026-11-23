#!/usr/bin/env node
/**
 * Record a prompt that did not trigger the skill it should have.
 *
 *   node scripts/skill-miss.mjs "take my app idea to the store" --expected mobile-app-factory
 *   node scripts/skill-miss.mjs "my scroll animations replay" --expected motion-experiences --agent codex --model gpt-6.1-sol
 *
 * Appends to skill-misses.md in the current directory and prints a prefilled GitHub issue URL.
 * No network, no secrets: the prompt is echoed back, so do not paste credentials.
 */
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const known = new Set(["expected", "agent", "model", "out"]);
const words = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) {
    if (known.has(argv[i].slice(2))) i += 1;
    continue;
  }
  words.push(argv[i]);
}
const prompt = words.join(" ").trim();
if (!prompt) {
  console.error('usage: node scripts/skill-miss.mjs "the prompt" --expected mobile-app-factory|motion-experiences');
  process.exit(2);
}
const expected = flag("expected", null);
if (expected && !["mobile-app-factory", "motion-experiences"].includes(expected)) {
  console.error(`unknown --expected "${expected}"`);
  process.exit(2);
}
const agent = flag("agent", "unknown");
const model = flag("model", "unknown");
const out = resolve(flag("out", "skill-misses.md"));

// Cheap, explainable guess: which skill's trigger vocabulary the prompt uses. This is a hint for
// the report, not a replacement for the agent's actual choice.
const mobile = ["app", "ios", "android", "kotlin", "swift", "swiftui", "compose", "app store", "play store",
  "privacy manifest", "subscription", "onboarding", "metadata", "scaffold", "expo", "native"];
const motion = ["animation", "animate", "motion", "gsap", "scrolltrigger", "reveal", "spring", "reanimated",
  "transition", "parallax", "reduced motion", "scroll"];
const text = prompt.toLowerCase();
const score = (terms) => terms.filter((term) => text.includes(term)).length;
const mobileScore = score(mobile);
const motionScore = score(motion);
const guess = mobileScore === motionScore ? "neither / ambiguous" : mobileScore > motionScore ? "mobile-app-factory" : "motion-experiences";

const date = new Date().toISOString().slice(0, 10);
const entry = [
  `## ${date} — ${expected ?? "unknown"} expected`,
  "",
  `- **Prompt:** ${prompt.replace(/\s+/g, " ")}`,
  `- **Expected:** ${expected ?? "not stated"}`,
  `- **Vocabulary guess:** ${guess} (mobile ${mobileScore}, motion ${motionScore})`,
  `- **Agent:** ${agent} / ${model}`,
  ""
].join("\n");
if (!existsSync(out)) writeFileSync(out, "# Skill misses\n\nReported prompts that did not fire the skill they should have.\n\n");
appendFileSync(out, `${entry}\n`);
console.log(`Recorded in ${out}\n`);

const title = encodeURIComponent(`Skill miss: ${expected ?? "unknown"} did not fire`);
const body = encodeURIComponent(
  `**Prompt**\n\n${prompt}\n\n**Expected:** ${expected ?? "not stated"}\n\n**Vocabulary guess:** ${guess}\n\n**Agent:** ${agent} / ${model}\n\n**What fired:** \n\n**Transcript**\n\n`
);
console.log(`Open an issue with this prefilled report:\nhttps://github.com/mridungeorge/mobile-app-kit/issues/new?template=skill-miss.yml&title=${title}&body=${body}`);
