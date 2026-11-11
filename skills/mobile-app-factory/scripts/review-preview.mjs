#!/usr/bin/env node
// Preview change-request loop. Records approval or applies change requests, then
// regenerates the profile and preview for re-approval.
//
//   node scripts/review-preview.mjs --dir .mobile --approve
//   node scripts/review-preview.mjs --dir .mobile --request-changes "Calmer home screen"
//   node scripts/review-preview.mjs --dir .mobile --from-feedback .mobile/preview/feedback.json
//   node scripts/review-preview.mjs --dir .mobile --add-screen settings --remove-screen paywall
//
// Writes .mobile/00-approval.json, updates intake/profile, appends to .mobile/STATE.md,
// and regenerates .mobile/preview/index.html when changes were requested.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { routeIdea } from "./route-idea.mjs";
import { writePreview } from "./generate-preview.mjs";

function parseArgs(argv) {
  const opts = { dir: ".mobile", addScreens: [], removeScreens: [], regenerate: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--dir") opts.dir = next();
    else if (a === "--approve") opts.approve = true;
    else if (a === "--request-changes") opts.requestChanges = next();
    else if (a === "--from-feedback") opts.fromFeedback = next();
    else if (a === "--add-screen") opts.addScreens.push(next());
    else if (a === "--add-screens") opts.addScreens.push(...String(next()).split(","));
    else if (a === "--remove-screen") opts.removeScreens.push(next());
    else if (a === "--remove-screens") opts.removeScreens.push(...String(next()).split(","));
    else if (a === "--platforms") opts.platforms = next();
    else if (a === "--monetisation" || a === "--monetization") opts.monetisation = next();
    else if (a === "--design") opts.design = next();
    else if (a === "--no-regenerate") opts.regenerate = false;
    else if (a === "--help" || a === "-h") opts.help = true;
  }
  return opts;
}

function usage() {
  return `Usage:
  node scripts/review-preview.mjs --dir .mobile --approve
  node scripts/review-preview.mjs --dir .mobile --request-changes "text" [options]
  node scripts/review-preview.mjs --dir .mobile --from-feedback .mobile/preview/feedback.json

Options:
  --approve                 record approval (unlocks Phase 1)
  --request-changes <text>  record change requests without a feedback file
  --from-feedback <file>    read feedback.json exported by the preview
  --add-screen <name>       add a screen (repeatable or comma separated with --add-screens)
  --remove-screen <name>    remove a screen (repeatable or comma separated with --remove-screens)
  --platforms <both|android|ios>
  --monetisation <free|subscription|iap|ads|none>
  --design <notes>
  --no-regenerate           do not rewrite the preview after changes
  --help`;
}

const slugify = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const unique = (values) => [...new Set(values.filter(Boolean))];

function trimScreens(list) {
  return unique(list.map(slugify)).slice(0, 12);
}

function stackFor(platforms) {
  if (platforms === "android") return "android-native";
  if (platforms === "ios") return "ios-native";
  return "native";
}

function intakeToMarkdown(intake) {
  return `# App Intake (Questionnaire)

- **Created:** ${intake.createdAt}
- **Idea:** ${intake.idea}
- **Audience:** ${intake.audience}
- **Problem/Outcome:** ${intake.problem}
- **Platforms:** ${intake.platforms}
- **Monetisation:** ${intake.monetisation}
- **Accounts/Login:** ${intake.accounts ? "yes" : "no"}
- **User-generated content:** ${intake.ugc ? "yes" : "no"}
- **AI features:** ${intake.ai ? "yes" : "no"}
- **Sensitive data:** ${intake.sensitiveData}
- **Permissions/features:** ${(intake.permissions || []).join(", ") || "none"}
- **Offline required:** ${intake.offline ? "yes" : "no"}
- **Backend:** ${intake.backend}
- **Design/brand:** ${intake.design}
- **Build/maintain:** ${intake.team}
- **Timeline/priority:** ${intake.timeline}
- **Must-have:** ${intake.mustHave}
- **Notes:** ${intake.notes}
- **Change requests:** ${(intake.changeRequests || []).join(" | ") || "none"}

## Next steps (automated pipeline)
1. Generate profile: \`.mobile/00-profile.json\` (route idea + apply answers)
2. Produce PRD, design spec, and **illustrative app preview** for approval
3. Build native app (Android: Kotlin/Jetpack Compose in Android Studio; iOS: Swift/SwiftUI in Xcode), motion, compliance, release artifacts
4. Run review and prepare store submission package (metadata, privacy/data safety, checklists)

> External actions still required: developer accounts, signing keys/certificates, CI secrets, real-device testing, and store uploads/review.
`;
}

function updateState(dir, status, detail) {
  const path = join(dir, "STATE.md");
  const stamp = new Date().toISOString();
  let text = existsSync(path) ? readFileSync(path, "utf8") : "# State\n";
  const stage = status === "approved" ? "APPROVED" : "CHANGES_REQUESTED";
  if (/^stage:/m.test(text)) text = text.replace(/^stage:.*$/m, `stage: ${stage}`);
  else text += `\nstage: ${stage}\n`;
  if (/^updated:/m.test(text)) text = text.replace(/^updated:.*$/m, `updated: ${stamp}`);
  else text += `updated: ${stamp}\n`;
  const next = status === "approved"
    ? "next: product-architect — write .mobile/01-prd.md"
    : "next: review changes, regenerate preview, and re-approve";
  if (/^next:/m.test(text)) text = text.replace(/^next:.*$/m, next);
  else text += `${next}\n`;
  text += `\n- ${stamp} — gate P ${status === "approved" ? "passed" : "changes requested"}: ${detail}\n`;
  writeFileSync(path, text.endsWith("\n") ? text : `${text}\n`);
}

function loadFeedback(opts, dir) {
  if (opts.fromFeedback) {
    const path = resolve(opts.fromFeedback);
    if (!existsSync(path)) throw new Error(`feedback file not found: ${path}`);
    return { data: JSON.parse(readFileSync(path, "utf8")), source: `feedback:${path}` };
  }
  const fallback = join(dir, "preview", "feedback.json");
  if (!opts.approve && !opts.requestChanges && !opts.addScreens.length && !opts.removeScreens.length
    && !opts.platforms && !opts.monetisation && !opts.design && existsSync(fallback)) {
    return { data: JSON.parse(readFileSync(fallback, "utf8")), source: `feedback:${fallback}` };
  }
  return { data: null, source: "cli" };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(usage());
    return;
  }

  const dir = resolve(opts.dir);
  const profilePath = join(dir, "00-profile.json");
  if (!existsSync(profilePath)) {
    console.error(`Missing ${profilePath}. Run the questionnaire or route-idea first.`);
    process.exit(2);
  }

  const intakePath = join(dir, "00-intake.json");
  const intake = existsSync(intakePath)
    ? JSON.parse(readFileSync(intakePath, "utf8"))
    : { version: 1, createdAt: new Date().toISOString(), idea: "", platforms: "both", changeRequests: [] };

  let profile;
  try {
    profile = JSON.parse(readFileSync(profilePath, "utf8"));
  } catch (error) {
    console.error(`Could not parse ${profilePath}: ${error.message}`);
    process.exit(2);
  }

  const { data: feedback, source } = loadFeedback(opts, dir);

  const decision = opts.approve
    ? "approved"
    : (feedback && feedback.decision) || (opts.requestChanges ? "changes" : null);
  if (!decision) {
    console.error("No decision supplied. Use --approve, --request-changes, or --from-feedback.\n");
    console.error(usage());
    process.exit(2);
  }
  if (!["approved", "changes"].includes(decision)) {
    console.error(`Unknown decision "${decision}". Use approved or changes.`);
    process.exit(2);
  }

  const addScreens = unique([...(feedback && feedback.addScreens) || [], ...opts.addScreens]).map(slugify);
  const removeScreens = unique([...(feedback && feedback.removeScreens) || [], ...opts.removeScreens]).map(slugify);
  const platforms = (feedback && feedback.platforms) || opts.platforms || intake.platforms || "both";
  const monetisation = (feedback && feedback.monetisation) || opts.monetisation || intake.monetisation || "free";
  const designNotes = (feedback && feedback.designNotes) || opts.design || "";
  const changeText = [
    (feedback && feedback.changeRequests) || "",
    opts.requestChanges || ""
  ].filter(Boolean).join("\n").trim();

  const hasChanges = decision === "changes" && (changeText || addScreens.length || removeScreens.length
    || platforms !== intake.platforms || monetisation !== intake.monetisation || designNotes);

  const applied = { addScreens, removeScreens, platforms, monetisation, designNotes: designNotes || null };

  if (hasChanges) {
    if (!Array.isArray(intake.changeRequests)) intake.changeRequests = [];
    if (changeText) intake.changeRequests.push(changeText);
    if (designNotes) intake.design = designNotes;
    intake.platforms = platforms;
    intake.monetisation = monetisation;

    const baseScreens = (profile.screens || []).filter((s) => !removeScreens.includes(slugify(s)));
    profile.screens = trimScreens([...baseScreens, ...addScreens]);
    const previousScreens = baseScreens.slice();

    try {
      const overrides = {
        accounts: intake.accounts,
        ugc: intake.ugc,
        ai: intake.ai,
        offline: intake.offline,
        monetisation,
        stack: stackFor(platforms)
      };
      const rerouted = routeIdea(`${intake.idea} ${intake.mustHave || ""}`.trim(), overrides);
      rerouted.screens = trimScreens([
        ...rerouted.screens,
        ...previousScreens,
        ...addScreens
      ].filter((s) => !removeScreens.includes(slugify(s))));
      rerouted.intake = profile.intake || {
        audience: intake.audience, problem: intake.problem, platforms,
        backend: intake.backend, design: intake.design, team: intake.team,
        timeline: intake.timeline, mustHave: intake.mustHave, notes: intake.notes,
        sensitiveData: intake.sensitiveData, permissions: intake.permissions
      };
      rerouted.intake.platforms = platforms;
      rerouted.intake.design = intake.design;
      profile = rerouted;
    } catch (error) {
      console.warn(`warning: could not re-route the profile (${error.message}); applied screen/platform changes only.`);
      profile.stack = profile.stack || {};
      if (platforms === "android") Object.assign(profile.stack, { primary: "android-native", android: "kotlin-jetpack-compose" });
      if (platforms === "ios") Object.assign(profile.stack, { primary: "ios-native", ios: "swift-swiftui" });
      if (platforms === "both") Object.assign(profile.stack, { primary: "native", android: "kotlin-jetpack-compose", ios: "swift-swiftui" });
      profile.monetisation = monetisation;
    }

    writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
    writeFileSync(intakePath, `${JSON.stringify(intake, null, 2)}\n`);
    writeFileSync(join(dir, "00-intake.md"), intakeToMarkdown(intake));
  }

  // Approval record (keeps history across review rounds).
  const approvalPath = join(dir, "00-approval.json");
  const prior = existsSync(approvalPath) ? JSON.parse(readFileSync(approvalPath, "utf8")) : null;
  const record = {
    schema: "mobile-app-factory/approval@1",
    status: decision === "approved" ? "approved" : "changes-requested",
    decidedAt: new Date().toISOString(),
    source,
    appName: (feedback && feedback.appName) || intake.appName || null,
    checklist: (feedback && feedback.checklist) || [],
    changeRequests: changeText || null,
    appliedChanges: hasChanges ? applied : null,
    history: [...(prior && prior.history ? prior.history : []), ...(prior ? [{ status: prior.status, decidedAt: prior.decidedAt }] : [])]
  };
  writeFileSync(approvalPath, `${JSON.stringify(record, null, 2)}\n`);

  const detail = decision === "approved"
    ? `approved from ${source}`
    : `${changeText ? `"${changeText.split("\n")[0]}"` : "changes applied"}${addScreens.length ? ` (+${addScreens.join(", ")})` : ""}${removeScreens.length ? ` (-${removeScreens.join(", ")})` : ""}`;
  updateState(dir, decision, detail);

  let previewPath = null;
  if (hasChanges && opts.regenerate) {
    try {
      previewPath = writePreview(dir, { appName: intake.appName });
    } catch (error) {
      console.warn(`warning: preview was not regenerated (${error.message})`);
    }
  }

  console.log(`Recorded: ${record.status}`);
  console.log(`Wrote: ${approvalPath}`);
  if (hasChanges) {
    console.log(`Screens now: ${(profile.screens || []).join(", ") || "none"}`);
    console.log(`Stack now: ${profile.stack && profile.stack.primary ? profile.stack.primary : "unchanged"}`);
    if (previewPath) console.log(`Regenerated preview: ${previewPath}`);
    console.log("\nNext: re-open the preview, review the changes, then run --approve.");
  } else if (decision === "approved") {
    console.log("\nPhase P gate passed. Continue with Phase 1 (product-architect -> .mobile/01-prd.md).");
  } else {
    console.log("\nNo concrete changes supplied. Add --request-changes text or --add-screen/--remove-screen, then re-run.");
  }
}

main();
