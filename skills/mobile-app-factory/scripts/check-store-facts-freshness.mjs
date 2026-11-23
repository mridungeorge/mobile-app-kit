#!/usr/bin/env node
/**
 * Fail when references/store-facts.md is older than its own review interval.
 *
 *   node scripts/check-store-facts-freshness.mjs
 *   node scripts/check-store-facts-freshness.mjs --today 2026-12-01   # test a date
 *
 * Writes a reminder to $GITHUB_STEP_SUMMARY so the job page says what to do.
 */
import { readFileSync, appendFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "references", "store-facts.md");
const text = readFileSync(file, "utf8");
const front = text.match(/^---\n([\s\S]*?)\n---/);
if (!front) {
  console.error("FAIL — references/store-facts.md has no frontmatter with verified_on/review_every_days");
  process.exit(1);
}
const field = (name, fallback) => {
  const match = front[1].match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : fallback;
};
const verifiedOn = field("verified_on", null);
const interval = Number(field("review_every_days", "90"));
const argToday = process.argv.indexOf("--today");
const today = argToday !== -1 ? new Date(process.argv[argToday + 1]) : new Date();
if (!verifiedOn || Number.isNaN(new Date(verifiedOn).getTime())) {
  console.error(`FAIL — verified_on is not a date: ${verifiedOn}`);
  process.exit(1);
}
const age = Math.floor((today - new Date(verifiedOn)) / 86_400_000);
const due = new Date(new Date(verifiedOn).getTime() + interval * 86_400_000).toISOString().slice(0, 10);
const message = age > interval
  ? `FAIL — store-facts.md verified ${verifiedOn}, ${age} days ago (limit ${interval}, was due ${due}). Re-verify every changed row by web search, update verified_on, and list what changed.`
  : `PASS — store-facts.md verified ${verifiedOn}, ${age} days ago; next review due ${due}.`;
console.log(message);
const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary && age > interval) {
  appendFileSync(summary, `## Store facts are stale\n\n${message}\n\nRows to check: Apple/Play fee and policy changes, target API, 16 KB pages, privacy manifests and data safety, account deletion.\n`);
}
process.exit(age > interval ? 1 : 0);
