#!/usr/bin/env node
// Generates an illustrative, interactive HTML app preview for user approval.
// Reads .mobile/00-intake.json and .mobile/00-profile.json and writes .mobile/preview/index.html
//
//   node scripts/generate-preview.mjs --dir .mobile
//   node scripts/generate-preview.mjs --dir .mobile --app-name "Night Notes"
//
// The preview is illustrative: screen structure, flow and tone, not the final UI.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const opts = { dir: ".mobile" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") opts.dir = argv[++i];
    else if (argv[i] === "--app-name") opts.appName = argv[++i];
  }
  return opts;
}

const esc = (value) => String(value == null ? "" : value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const titleize = (value) => String(value || "")
  .replace(/[-_]/g, " ")
  .replace(/\b\w/g, (c) => c.toUpperCase());

const STOPWORDS = new Set(["a", "an", "the", "that", "which", "with", "for", "and", "or", "my", "our", "to", "of", "in", "on", "app"]);

function deriveAppName(idea) {
  const words = String(idea || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
  if (!words.length) return "Your App";
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function classifyScreen(name) {
  const n = String(name || "").toLowerCase();
  if (/(onboarding|consent|disclosure|parent-gate|privacy-notice)/.test(n)) return "onboarding";
  if (/(auth|login|sso|sign-in|signup|sign-up)/.test(n)) return "auth";
  if (/(paywall|subscription|usage-limits)/.test(n)) return "paywall";
  if (/(checkout|cart|basket|payment|confirmation)/.test(n)) return /confirmation/.test(n) ? "confirmation" : "checkout";
  if (/(camera|capture|scan)/.test(n)) return "camera";
  if (/(map|track|route|itinerary|saved)/.test(n)) return "map";
  if (/(chat|assistant|messages|comments)/.test(n)) return "chat";
  if (/(player|reader|now-playing)/.test(n)) return "player";
  if (/(gallery|library|downloads)/.test(n)) return "gallery";
  if (/(trends|dashboard|stats|analytics|budget|reward-progress|sync-status)/.test(n)) return "dashboard";
  if (/(form|entry|compose|edit|create|log|job-detail)/.test(n)) return "form";
  if (/(settings|profile|account|security|addresses)/.test(n)) return "settings";
  if (/(detail|product|place|post|report-block|support|job)/.test(n)) return "detail";
  if (/(feed|list|history|search|discover|orders|saved|notifications|assignments|category|collections)/.test(n)) return "list";
  if (/(confirmation|success)/.test(n)) return "confirmation";
  return "home";
}

const ARCHETYPE_COPY = {
  "health-fitness": { heroTitle: "Morning check-in", heroBody: "Log sleep, mood and energy in under a minute.", cta: "Log today", rows: ["Sleep · 7h 42m", "Energy · Good", "Weekly trend · +6%"], statLabels: ["Days", "Score", "Streak"] },
  "commerce-marketplace": { heroTitle: "Picked for you", heroBody: "New arrivals from the categories you follow.", cta: "Browse new", rows: ["Everyday tote · $48", "Desk lamp · $62", "Order #1042 · Shipped"], statLabels: ["Saved", "Orders", "Deals"] },
  "social-ugc": { heroTitle: "Your feed", heroBody: "Fresh posts from people you follow.", cta: "Create post", rows: ["Maya · 2h", "Sam · 4h", "3 new comments"], statLabels: ["Posts", "Following", "Likes"] },
  "media": { heroTitle: "Continue listening", heroBody: "Pick up where you left off.", cta: "Resume", rows: ["Episode 12 · 24 min left", "Saved for later · 8", "New this week · 3"], statLabels: ["Hours", "Saved", "New"] },
  "ai-assistant": { heroTitle: "What do you need?", heroBody: "Ask, generate or summarise in one place.", cta: "Start a chat", rows: ["Weekly summary · ready", "Draft reply · 2", "Usage · 64% of plan"], statLabels: ["Chats", "Saved", "Credits"] },
  "fintech": { heroTitle: "Total balance", heroBody: "All accounts, one calm view.", cta: "Move money", rows: ["Checking · $4,210", "Savings · $12,880", "Coffee · -$4.50"], statLabels: ["Balance", "Spent", "Saved"] },
  "kids-family": { heroTitle: "Today's activity", heroBody: "A short, calm session for little ones.", cta: "Start", rows: ["Phonics · 10 min", "Story time · 8 min", "Sticker earned"], statLabels: ["Stars", "Days", "Stickers"] },
  "travel-maps": { heroTitle: "Near you", heroBody: "Places worth the detour, saved offline.", cta: "Explore map", rows: ["Harbour walk · 1.2 km", "Cafe Norte · Open", "Saved · 6 places"], statLabels: ["Saved", "Offline", "Trips"] },
  "b2b-field": { heroTitle: "Today's jobs", heroBody: "3 assignments, 1 needs sync.", cta: "Start next job", rows: ["Site A · Due 10:00", "Site B · Due 13:30", "Sync · 1 pending"], statLabels: ["Open", "Done", "Sync"] },
  "camera-photo": { heroTitle: "Capture", heroBody: "Point, shoot, and keep the detail.", cta: "Open camera", rows: ["Last shot · 2 min ago", "Edited · 4", "Storage · 62%"], statLabels: ["Shots", "Edited", "Saved"] },
  "game": { heroTitle: "Continue", heroBody: "Your last run is waiting.", cta: "Play", rows: ["Level 7 · 82%", "Daily challenge · ready", "New best · 4,120"], statLabels: ["Level", "Score", "Streak"] },
  "dating": { heroTitle: "New matches", heroBody: "People who liked you back.", cta: "Start swiping", rows: ["Alex · 2 km", "Jordan · 5 km", "3 new likes"], statLabels: ["Likes", "Matches", "Chats"] },
  "delivery-logistics": { heroTitle: "Next delivery", heroBody: "On route, 8 minutes away.", cta: "Open route", rows: ["Order #7781 · 8 min", "Stop 2 of 6", "Customer notified"], statLabels: ["Stops", "Done", "ETA"] },
  "utility": { heroTitle: "Ready when you are", heroBody: "One job, done fast.", cta: "Start", rows: ["Recent · 3", "Saved presets · 2", "Last used · today"], statLabels: ["Uses", "Saved", "Time"] }
};

function copyFor(archetype) {
  return ARCHETYPE_COPY[archetype] || {
    heroTitle: "Your core loop",
    heroBody: "One clear next action, everything else supports it.",
    cta: "Get started",
    rows: ["Recent item · today", "Saved · 2", "New · 1"],
    statLabels: ["Today", "Saved", "New"]
  };
}

function rows(count, labels) {
  const items = (labels || []).slice(0, count);
  while (items.length < count) items.push("Item " + (items.length + 1));
  return items.map((label, i) => `
    <div class="row">
      <div class="thumb t${i % 3}"></div>
      <div class="row-body">
        <div class="line">${esc(label)}</div>
        <div class="line short muted">Supporting detail</div>
      </div>
      <div class="chev">›</div>
    </div>`).join("");
}

function chrome(title, body, opts) {
  const o = opts || {};
  return `
    <div class="sb"><span>9:41</span><span class="sb-right"><i></i><i></i><i></i><b></b></span></div>
    <div class="appbar">
      <span class="nav-back">${o.back ? "‹" : ""}</span>
      <span class="nav-title">${esc(title)}</span>
      <span class="nav-action">${o.action ? esc(o.action) : ""}</span>
    </div>
    <div class="content">${body}</div>`;
}

function renderScreen(kind, screen, ctx) {
  const t = titleize(screen);
  const c = ctx.copy;

  if (kind === "onboarding") {
    return chrome(t, `
      <div class="art onb"></div>
      <div class="h1">${esc(ctx.appName)}</div>
      <div class="body">A short, honest explanation of what this app does and what data it needs — before any permission prompt.</div>
      <div class="dots"><i class="on"></i><i></i><i></i></div>
      <div class="btn">Continue</div>
      <div class="link muted">Not now</div>
    `, { action: "Skip" });
  }

  if (kind === "auth") {
    return chrome(t, `
      <div class="brand-mark"></div>
      <div class="h1">Welcome back</div>
      <div class="body muted">Sign in to sync your data across devices.</div>
      <div class="field"><span>Email</span><div class="input">you@example.com</div></div>
      <div class="field"><span>Password</span><div class="input">••••••••</div></div>
      <div class="btn">Sign in</div>
      <div class="link muted">Forgot password?</div>
      <div class="divider"><span>or</span></div>
      <div class="btn ghost">Continue with Apple</div>
      <div class="link muted">Create an account</div>
    `);
  }

  if (kind === "home") {
    return chrome(t, `
      <div class="card hero">
        <div class="eyebrow">TODAY</div>
        <div class="h1">${esc(c.heroTitle)}</div>
        <div class="muted">${esc(c.heroBody)}</div>
        <div class="btn">${esc(c.cta)}</div>
      </div>
      <div class="stats">
        <div class="stat"><b>12</b><span>${esc(c.statLabels[0])}</span></div>
        <div class="stat"><b>4.8</b><span>${esc(c.statLabels[1])}</span></div>
        <div class="stat"><b>7</b><span>${esc(c.statLabels[2])}</span></div>
      </div>
      <div class="section-title">Recent <span>See all</span></div>
      ${rows(3, c.rows)}
    `, { action: "+" });
  }

  if (kind === "list") {
    return chrome(t, `
      <div class="search">Search ${esc(ctx.appName)}</div>
      <div class="chips"><span class="on">All</span><span>Recent</span><span>Saved</span></div>
      ${rows(5, c.rows)}
    `, { action: "Filter" });
  }

  if (kind === "detail") {
    return chrome(t, `
      <div class="media"></div>
      <div class="h1">${esc(c.rows[0] || "Detail")}</div>
      <div class="meta muted">Updated today · 4 min read</div>
      <div class="body">The key facts, one primary action, and the context needed to decide. Long copy is readable at 200% text size.</div>
      <div class="action-row"><div class="btn">Primary action</div><div class="btn ghost">Share</div></div>
      <div class="section-title">Related</div>
      ${rows(2, c.rows.slice(1))}
    `, { back: true, action: "⋯" });
  }

  if (kind === "form") {
    return chrome(t, `
      <div class="field"><span>Title</span><div class="input">Add a short title</div></div>
      <div class="field"><span>Notes</span><div class="input tall">What happened?</div></div>
      <div class="field"><span>Category</span><div class="seg"><span class="on">One</span><span>Two</span><span>Three</span></div></div>
      <div class="toggle-row"><span>Remind me</span><i class="toggle on"></i></div>
      <div class="btn">Save</div>
      <div class="link muted">Cancel</div>
    `, { back: true, action: "Save" });
  }

  if (kind === "settings") {
    return chrome(t, `
      <div class="profile">
        <div class="avatar"></div>
        <div><div class="line">Your account</div><div class="line short muted">Signed in</div></div>
      </div>
      <div class="group">
        <div class="group-row"><span>Notifications</span><i class="toggle on"></i></div>
        <div class="group-row"><span>Appearance</span><span class="muted">System ›</span></div>
        <div class="group-row"><span>Privacy</span><span class="muted">›</span></div>
      </div>
      <div class="group">
        <div class="group-row"><span>Help & support</span><span class="muted">›</span></div>
        <div class="group-row"><span>Delete account</span><span class="danger">›</span></div>
      </div>
      <div class="link muted">Version 0.1.0</div>
    `, { action: "Done" });
  }

  if (kind === "paywall") {
    return chrome(t, `
      <div class="close">×</div>
      <div class="art pay"></div>
      <div class="h1">Go further with Pro</div>
      <div class="body muted">Everything in the free plan, plus the things that save real time.</div>
      <ul class="checks-view">
        <li>Unlimited history</li>
        <li>Advanced insights</li>
        <li>Priority support</li>
      </ul>
      <div class="price-row">
        <div class="price"><span>Monthly</span><b>$4.99</b></div>
        <div class="price on"><span>Yearly</span><b>$39.99</b><i>Save 33%</i></div>
      </div>
      <div class="btn">Start free trial</div>
      <div class="fine">Restore purchase · Terms · Privacy</div>
    `, { action: "×" });
  }

  if (kind === "checkout") {
    return chrome(t, `
      <div class="group">
        <div class="group-row"><span>Item</span><span class="muted">$24.00</span></div>
        <div class="group-row"><span>Delivery</span><span class="muted">$4.00</span></div>
        <div class="group-row"><span>Tax</span><span class="muted">$2.10</span></div>
      </div>
      <div class="total"><span>Total</span><b>$30.10</b></div>
      <div class="field"><span>Payment</span><div class="input">•••• 4242</div></div>
      <div class="btn">Pay $30.10</div>
      <div class="fine">Secured by the platform payment sheet. No card data is stored by the app.</div>
    `, { back: true, action: "Pay" });
  }

  if (kind === "camera") {
    return `
      <div class="camera">
        <div class="cam-top"><span class="pill-dark">HDR</span><span class="pill-dark">1×</span><span class="pill-dark">⚡</span></div>
        <div class="cam-grid"></div>
        <div class="cam-focus"></div>
        <div class="cam-bottom">
          <div class="cam-thumb"></div>
          <div class="shutter"></div>
          <div class="cam-flip">⟳</div>
        </div>
        <div class="cam-hint">Tap to focus · Swipe for modes</div>
      </div>`;
  }

  if (kind === "map") {
    return chrome(t, `
      <div class="map">
        <div class="map-grid"></div>
        <div class="map-road r1"></div>
        <div class="map-road r2"></div>
        <div class="pin"><i></i></div>
        <div class="map-controls"><span>+</span><span>−</span></div>
      </div>
      <div class="sheet">
        <div class="grab"></div>
        <div class="h1 small">${esc(c.rows[0] || "Nearby")}</div>
        <div class="muted">1.2 km · Open now</div>
        <div class="btn">Directions</div>
      </div>
    `, { action: "Search", scroll: false });
  }

  if (kind === "chat") {
    return chrome(t, `
      <div class="chat">
        <div class="bubble left">Here's a summary of your week.</div>
        <div class="bubble right">Make it shorter.</div>
        <div class="bubble left">Three wins, one blocker, next step.</div>
      </div>
      <div class="composer"><div class="composer-box">Message…</div><div class="send">↑</div></div>
    `, { back: true, action: "⋯" });
  }

  if (kind === "player") {
    return chrome(t, `
      <div class="artwork"></div>
      <div class="h1 small center">Episode title</div>
      <div class="muted center">Show name · 24 min left</div>
      <div class="progress"><i style="width:38%"></i></div>
      <div class="times"><span>12:04</span><span>-24:00</span></div>
      <div class="controls"><span>⏮</span><span class="play">▶</span><span>⏭</span></div>
    `, { back: true, action: "⋯" });
  }

  if (kind === "gallery") {
    return chrome(t, `
      <div class="chips"><span class="on">All</span><span>Favourites</span><span>Recent</span></div>
      <div class="tiles">
        ${Array.from({ length: 9 }).map((_, i) => `<div class="tile g${i % 4}"></div>`).join("")}
      </div>
    `, { action: "Select" });
  }

  if (kind === "dashboard") {
    return chrome(t, `
      <div class="seg"><span class="on">Week</span><span>Month</span><span>Year</span></div>
      <div class="chart">
        ${[38, 62, 48, 74, 56, 82, 66].map((h, i) => `<div class="bar${i === 5 ? " on" : ""}" style="height:${h}%"></div>`).join("")}
      </div>
      <div class="stats">
        <div class="stat"><b>+12%</b><span>Trend</span></div>
        <div class="stat"><b>4.8</b><span>Average</span></div>
        <div class="stat"><b>7</b><span>Best</span></div>
      </div>
      <div class="section-title">Insights</div>
      ${rows(2, c.rows)}
    `, { action: "Export" });
  }

  if (kind === "confirmation") {
    return chrome(t, `
      <div class="success"><i>✓</i></div>
      <div class="h1 center">All done</div>
      <div class="body center muted">Your changes are saved and synced. You can come back to this any time.</div>
      <div class="btn">Continue</div>
      <div class="btn ghost">View details</div>
    `, { action: "Done" });
  }

  return chrome(t, `
    ${rows(4, c.rows)}
    <div class="btn">Primary action</div>
  `, { back: true });
}

const META = {
  onboarding: { purpose: "Explain the value and the data ask before any permission prompt.", items: ["Value proposition in one line", "Permission pre-prompt with a real reason", "Skip path"] },
  auth: { purpose: "Get the user in with the least friction the store allows.", items: ["Email/password or platform sign-in", "Forgot-password path", "Demo account note for App Review"] },
  home: { purpose: "Orient the user and expose the single core action.", items: ["Primary action above the fold", "Status summary readable in 3 seconds", "First-run empty state"] },
  list: { purpose: "Scan, filter and reach an item quickly.", items: ["Search and filter", "Empty / loading / error states", "Row tap → detail"] },
  detail: { purpose: "Show the facts and the one action that matters.", items: ["Readable at 200% text", "Share or save action", "Back path always visible"] },
  form: { purpose: "Capture input with validation that helps rather than blocks.", items: ["Inline validation", "Keyboard types per field", "Save disabled until valid"] },
  settings: { purpose: "Make privacy, appearance and account control findable.", items: ["Delete account (in-app + web link)", "Support contact", "Version and legal links"] },
  paywall: { purpose: "Present the paid value honestly and recoverably.", items: ["Price, period and renewal terms", "Restore purchase", "Terms + privacy links"] },
  checkout: { purpose: "Take payment with platform-native trust signals.", items: ["Line items and total before pay", "Platform payment sheet", "Failure and retry path"] },
  camera: { purpose: "Capture with minimal chrome and clear permission fallback.", items: ["Denied-permission fallback to import", "Orientation and EXIF handling", "Shutter reachable one-handed"] },
  map: { purpose: "Place the user in space and surface the next action.", items: ["Location denied → manual search", "Loading and no-results state", "Bottom sheet is dismissible"] },
  chat: { purpose: "Keep the conversation legible and the input always reachable.", items: ["Streaming and error states", "Copy / retry message", "Keyboard avoidance"] },
  player: { purpose: "Control media with visible position and no surprises.", items: ["Lock-screen / background controls", "Scrub target ≥ 44pt", "State survives interruption"] },
  gallery: { purpose: "Browse a dense set without losing place.", items: ["Lazy grid", "Selection mode", "Empty state"] },
  dashboard: { purpose: "Turn data into a decision, not decoration.", items: ["Values readable as text", "Range switch", "Export or share"] },
  confirmation: { purpose: "Close the loop and offer the next step.", items: ["Specific success message", "No dead end", "Receipt or detail link"] }
};

function metaFor(kind) {
  return META[kind] || META.home;
}

function stackLabel(stack) {
  const labels = {
    "kotlin-jetpack-compose": "Kotlin + Jetpack Compose",
    "swift-swiftui": "Swift + SwiftUI",
    "compose-multiplatform": "Compose Multiplatform",
    "react-native": "React Native",
    "flutter": "Flutter",
    "unity": "Unity"
  };
  return [stack.android, stack.ios].filter(Boolean).map((value) => labels[value] || value).join(" · ")
    || labels[stack.primary] || stack.primary || "native";
}

function buildPreviewHtml(intake, profile, opts) {
  const options = opts || {};
  const screens = (profile.screens || []).slice(0, 12);
  const idea = intake.idea || profile.idea || "Your app";
  const appName = options.appName || intake.appName || deriveAppName(idea);
  const arch = profile.archetypeLabel || profile.archetype || "App";
  const stack = profile.stack || {};
  const stackText = stackLabel(stack);
  const copy = copyFor(profile.archetype);
  const ctx = { appName, copy };

  const screenCards = screens.map((screen, index) => {
    const kind = classifyScreen(screen);
    const meta = metaFor(kind);
    return `<section class="screen" data-i="${index}" ${index === 0 ? "" : "hidden"}>
      <div class="phone-wrap">
        <div class="phone">
          <div class="notch"></div>
          <div class="ui">${renderScreen(kind, screen, ctx)}</div>
        </div>
        <div class="phone-caption">Illustrative — final UI is built natively</div>
      </div>
      <div class="meta">
        <div class="screen-kicker">Screen ${index + 1} of ${screens.length} · ${kind}</div>
        <h3>${esc(titleize(screen))}</h3>
        <p class="purpose">${esc(meta.purpose)}</p>
        <ul>${meta.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        <div class="states">
          <span>empty</span><span>loading</span><span>error</span><span>offline</span><span>denied</span>
        </div>
      </div>
    </section>`;
  }).join("\n");

  const nav = screens.map((screen, index) =>
    `<button class="navbtn ${index === 0 ? "active" : ""}" data-i="${index}"><b>${index + 1}</b><span>${esc(titleize(screen))}</span></button>`
  ).join("");

  const chips = screens.map((screen) => `<span class="chip">${esc(titleize(screen))}</span>`).join("");

  const screenOptions = screens.map((screen) => `<option value="${esc(screen)}">${esc(titleize(screen))}</option>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>App Preview &amp; Approval — ${esc(appName)}</title>
<style>
:root{
  --bg:#0d1016;--bg2:#121722;--card:#171a21;--card2:#1d212b;--text:#eef2ff;--muted:#a7b0c3;
  --line:#2a3140;--accent:#6ea8fe;--ok:#3ddc97;--warn:#ffcf5c;--danger:#ff7b7b;
  --phone-bg:#f3f5f9;--phone-ink:#111318;--phone-muted:#6b7280;--phone-card:#ffffff;--phone-line:#e4e8f0;
}
*{box-sizing:border-box}
html,body{margin:0}
body{font-family:Inter,Segoe UI,system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,var(--bg),var(--bg2));color:var(--text);-webkit-font-smoothing:antialiased}
.wrap{max-width:1240px;margin:0 auto;padding:28px 20px 48px}
header.top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:18px}
h1{margin:0 0 6px;font-size:28px;letter-spacing:-.02em}
.sub{color:var(--muted);margin:0;max-width:760px;line-height:1.55}
.top-actions{display:flex;gap:8px;flex-wrap:wrap}
.tool{all:unset;cursor:pointer;border:1px solid var(--line);background:var(--card2);color:#dbe4f5;font-size:12px;padding:8px 12px;border-radius:999px}
.tool:hover{border-color:#3a5ea8}
.grid{display:grid;grid-template-columns:320px 1fr;gap:18px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.panel h2,.box h2{font-size:12px;margin:0 0 10px;color:#c8d5ee;text-transform:uppercase;letter-spacing:.08em}
.kv{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:4px}
.kv b{color:var(--text);font-weight:600}
.flow{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 2px}
.chip{font-size:11px;padding:5px 9px;border-radius:999px;border:1px solid var(--line);background:var(--card2);color:#d9e3f5}
.nav{display:flex;flex-direction:column;gap:6px;max-height:360px;overflow:auto;padding-right:4px;margin-top:6px}
.navbtn{all:unset;cursor:pointer;display:flex;gap:10px;align-items:center;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--card2);font-size:13px;color:#d8e1f2}
.navbtn b{font-size:11px;color:var(--muted);min-width:16px}
.navbtn.active{border-color:#3a5ea8;background:#172033;box-shadow:inset 0 0 0 1px #2a4f96}
.navbtn.active b{color:var(--accent)}
.stage{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;min-height:560px}
.screen{display:grid;grid-template-columns:340px 1fr;gap:26px;align-items:center}
.screen[hidden]{display:none}
.stage.all{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:22px}
.stage.all .screen{grid-template-columns:1fr;align-items:start}
.stage.all .phone-caption{display:none}
.phone-wrap{display:flex;flex-direction:column;align-items:center;gap:8px}
.phone{width:300px;height:600px;border-radius:38px;background:#0b0d12;border:1px solid #333b4d;padding:12px;position:relative;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.notch{width:118px;height:22px;background:#0b0d12;border-radius:0 0 14px 14px;position:absolute;left:50%;transform:translateX(-50%);top:8px;z-index:3}
.ui{height:100%;border-radius:27px;background:var(--phone-bg);color:var(--phone-ink);overflow:hidden;display:flex;flex-direction:column;position:relative}
.phone.dark{--phone-bg:#121314;--phone-ink:#f2f4f8;--phone-muted:#a5acb8;--phone-card:#1c1d20;--phone-line:#2a2c31}
.phone-caption{font-size:11px;color:var(--muted);letter-spacing:.02em}
.sb{display:flex;justify-content:space-between;align-items:center;padding:12px 18px 4px;font-size:11px;font-weight:600;color:var(--phone-ink)}
.sb-right{display:flex;gap:3px;align-items:center}
.sb-right i{width:5px;height:5px;border-radius:50%;background:var(--phone-ink);opacity:.75;display:block}
.sb-right b{width:16px;height:7px;border-radius:2px;border:1px solid var(--phone-ink);display:block;margin-left:3px;opacity:.8}
.appbar{display:flex;align-items:center;justify-content:space-between;padding:6px 14px 8px;min-height:36px}
.nav-title{font-size:14px;font-weight:650;color:var(--phone-ink);text-align:center;flex:1}
.nav-back,.nav-action{font-size:15px;color:var(--phone-muted);min-width:40px}
.nav-action{text-align:right;font-size:12px;font-weight:500}
.content{flex:1;overflow:auto;padding:4px 14px 18px;display:flex;flex-direction:column;gap:10px}
.content::-webkit-scrollbar{width:0}
.card{background:var(--phone-card);border:1px solid var(--phone-line);border-radius:16px;padding:14px}
.card.hero{background:linear-gradient(135deg,#e6ecff,#f4f6ff);border-color:#dbe3f7}
.phone.dark .card.hero{background:linear-gradient(135deg,#1c2438,#181c26);border-color:#2a3550}
.eyebrow{font-size:10px;letter-spacing:.12em;color:var(--phone-muted);font-weight:700;margin-bottom:6px}
.h1{font-size:22px;line-height:1.2;font-weight:700;letter-spacing:-.03em;color:var(--phone-ink);margin:2px 0 6px}
.h1.small{font-size:18px}
.center{text-align:center}
.body{font-size:13px;line-height:1.5;color:var(--phone-ink)}
.muted{color:var(--phone-muted)}
.btn{background:var(--phone-ink);color:var(--phone-bg);border-radius:12px;padding:12px 14px;text-align:center;font-size:13px;font-weight:650;margin-top:8px;cursor:default}
.btn.ghost{background:transparent;color:var(--phone-ink);border:1px solid var(--phone-line);font-weight:550}
.link{font-size:12px;text-align:center;margin-top:6px;text-decoration:underline;text-underline-offset:2px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.stat{background:var(--phone-card);border:1px solid var(--phone-line);border-radius:12px;padding:10px;text-align:center}
.stat b{display:block;font-size:17px;color:var(--phone-ink);letter-spacing:-.02em}
.stat span{font-size:10px;color:var(--phone-muted)}
.section-title{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;font-weight:650;color:var(--phone-ink);margin-top:4px}
.section-title span{font-size:11px;font-weight:500;color:var(--phone-muted)}
.row{display:flex;align-items:center;gap:10px;background:var(--phone-card);border:1px solid var(--phone-line);border-radius:12px;padding:10px}
.thumb{width:38px;height:38px;border-radius:10px;flex:0 0 38px;background:#dfe5f2}
.thumb.t1{background:#e6e2f7}.thumb.t2{background:#e2f0e9}
.phone.dark .thumb{background:#2a2f3a}.phone.dark .thumb.t1{background:#2c2940}.phone.dark .thumb.t2{background:#233029}
.row-body{flex:1;min-width:0}
.line{font-size:12.5px;font-weight:600;color:var(--phone-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.line.short{font-size:11px;font-weight:400}
.chev{color:var(--phone-muted);font-size:16px}
.search{background:var(--phone-card);border:1px solid var(--phone-line);border-radius:10px;padding:9px 12px;font-size:12px;color:var(--phone-muted)}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chips span{font-size:11px;padding:5px 9px;border-radius:999px;border:1px solid var(--phone-line);color:var(--phone-muted);background:var(--phone-card)}
.chips span.on{background:var(--phone-ink);color:var(--phone-bg);border-color:var(--phone-ink)}
.media{height:130px;border-radius:14px;background:linear-gradient(135deg,#cdd9f2,#e9eefb)}
.phone.dark .media{background:linear-gradient(135deg,#25304a,#1b2130)}
.meta-line{font-size:11px;color:var(--phone-muted)}
.action-row{display:flex;gap:8px}.action-row .btn{flex:1;margin-top:2px}
.field{display:flex;flex-direction:column;gap:5px}
.field>span{font-size:11px;font-weight:600;color:var(--phone-muted)}
.input{background:var(--phone-card);border:1px solid var(--phone-line);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--phone-muted)}
.input.tall{padding:22px 12px}
.seg{display:flex;background:var(--phone-card);border:1px solid var(--phone-line);border-radius:10px;padding:2px;gap:2px}
.seg span{flex:1;text-align:center;font-size:11px;padding:6px;border-radius:8px;color:var(--phone-muted)}
.seg span.on{background:var(--phone-ink);color:var(--phone-bg)}
.toggle-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--phone-ink);padding:2px 2px}
.toggle{width:34px;height:20px;border-radius:999px;background:var(--phone-line);position:relative;display:block}
.toggle.on{background:#3f6fe0}
.toggle::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}
.toggle.on::after{left:16px}
.profile{display:flex;gap:10px;align-items:center;background:var(--phone-card);border:1px solid var(--phone-line);border-radius:14px;padding:12px}
.avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#c9d6f4,#e7ecfb)}
.group{background:var(--phone-card);border:1px solid var(--phone-line);border-radius:14px;overflow:hidden}
.group-row{display:flex;justify-content:space-between;align-items:center;padding:12px;font-size:12.5px;color:var(--phone-ink);border-bottom:1px solid var(--phone-line)}
.group-row:last-child{border-bottom:0}
.danger{color:#e05a5a}
.checks-view{list-style:none;padding:0;margin:2px 0;display:grid;gap:7px}
.checks-view li{font-size:12px;color:var(--phone-ink);padding-left:20px;position:relative}
.checks-view li::before{content:"✓";position:absolute;left:0;color:#3f6fe0;font-weight:700}
.price-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.price{border:1px solid var(--phone-line);border-radius:12px;padding:10px;text-align:center;background:var(--phone-card);position:relative}
.price span{display:block;font-size:10px;color:var(--phone-muted)}
.price b{font-size:16px;color:var(--phone-ink)}
.price i{position:absolute;top:-8px;right:6px;background:#3f6fe0;color:#fff;font-size:9px;font-style:normal;padding:2px 6px;border-radius:999px}
.price.on{border-color:#3f6fe0}
.fine{font-size:10px;color:var(--phone-muted);text-align:center;line-height:1.5}
.total{display:flex;justify-content:space-between;align-items:center;padding:4px 2px;font-size:14px;font-weight:650;color:var(--phone-ink)}
.art{height:120px;border-radius:16px;background:linear-gradient(135deg,#c9d6f4,#eef2ff)}
.art.onb{height:220px;background:radial-gradient(circle at 50% 40%,#dbe6ff,#eef2fb 70%)}
.art.pay{height:130px;background:linear-gradient(135deg,#1f2a44,#3a4f7d)}
.phone.dark .art{background:linear-gradient(135deg,#25304a,#1b2130)}
.dots{display:flex;gap:6px;justify-content:center;margin:6px 0}
.dots i{width:6px;height:6px;border-radius:50%;background:var(--phone-line);display:block}
.dots i.on{background:#3f6fe0;width:16px;border-radius:999px}
.brand-mark{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#3f6fe0,#7aa2ff);margin:10px auto 4px}
.divider{display:flex;align-items:center;gap:8px;color:var(--phone-muted);font-size:10px;margin:4px 0}
.divider::before,.divider::after{content:"";height:1px;background:var(--phone-line);flex:1}
.camera{position:absolute;inset:0;background:#0a0c10;display:flex;flex-direction:column;justify-content:space-between;padding:42px 14px 18px;color:#fff}
.cam-top{display:flex;gap:6px;justify-content:center}
.pill-dark{background:rgba(255,255,255,.14);border-radius:999px;padding:3px 8px;font-size:10px}
.cam-grid{position:absolute;inset:42px 14px 96px;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:33.33% 33.33%;border-radius:10px}
.cam-focus{position:absolute;left:50%;top:42%;width:58px;height:58px;border:1px solid rgba(255,255,255,.7);border-radius:8px;transform:translate(-50%,-50%)}
.cam-bottom{display:flex;justify-content:space-between;align-items:center}
.cam-thumb{width:38px;height:38px;border-radius:9px;background:#2a2f3a;border:1px solid #444c5e}
.shutter{width:62px;height:62px;border-radius:50%;background:#fff;border:4px solid rgba(255,255,255,.35)}
.cam-flip{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:18px}
.cam-hint{text-align:center;font-size:10px;color:rgba(255,255,255,.65)}
.map{height:330px;border-radius:14px;position:relative;overflow:hidden;background:#e7edf6}
.phone.dark .map{background:#1a2230}
.map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(120,140,180,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(120,140,180,.18) 1px,transparent 1px);background-size:28px 28px}
.map-road{position:absolute;background:#fff;opacity:.9}
.phone.dark .map-road{background:#2c3648;opacity:1}
.map-road.r1{height:10px;left:-20%;right:-20%;top:52%;transform:rotate(-14deg)}
.map-road.r2{width:10px;top:-20%;bottom:-20%;left:38%;transform:rotate(8deg)}
.pin{position:absolute;left:52%;top:44%;width:22px;height:22px;background:#e05a5a;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.25)}
.pin i{position:absolute;inset:6px;background:#fff;border-radius:50%}
.map-controls{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:6px}
.map-controls span{width:28px;height:28px;border-radius:8px;background:var(--phone-card);display:grid;place-items:center;font-size:15px;color:var(--phone-ink);border:1px solid var(--phone-line)}
.sheet{background:var(--phone-card);border:1px solid var(--phone-line);border-radius:16px;padding:12px;margin-top:-28px;position:relative;z-index:2}
.grab{width:34px;height:4px;border-radius:999px;background:var(--phone-line);margin:0 auto 8px}
.chat{flex:1;display:flex;flex-direction:column;gap:8px;justify-content:flex-end;padding-bottom:6px}
.bubble{max-width:78%;padding:9px 12px;border-radius:14px;font-size:12px;line-height:1.45}
.bubble.left{background:var(--phone-card);border:1px solid var(--phone-line);color:var(--phone-ink);align-self:flex-start;border-bottom-left-radius:4px}
.bubble.right{background:#3f6fe0;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.composer{display:flex;gap:8px;align-items:center;padding-top:8px;border-top:1px solid var(--phone-line)}
.composer-box{flex:1;background:var(--phone-card);border:1px solid var(--phone-line);border-radius:999px;padding:9px 12px;font-size:12px;color:var(--phone-muted)}
.send{width:34px;height:34px;border-radius:50%;background:var(--phone-ink);color:var(--phone-bg);display:grid;place-items:center;font-size:15px}
.artwork{width:170px;height:170px;border-radius:18px;margin:12px auto 4px;background:linear-gradient(135deg,#3f6fe0,#8fb0ff)}
.progress{height:4px;border-radius:999px;background:var(--phone-line);margin:10px 2px 4px;overflow:hidden}
.progress i{display:block;height:100%;background:#3f6fe0}
.times{display:flex;justify-content:space-between;font-size:10px;color:var(--phone-muted);padding:0 2px}
.controls{display:flex;justify-content:center;align-items:center;gap:26px;font-size:20px;color:var(--phone-ink);padding:10px 0}
.controls .play{width:52px;height:52px;border-radius:50%;background:var(--phone-ink);color:var(--phone-bg);display:grid;place-items:center;font-size:18px}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.tile{aspect-ratio:1;border-radius:8px;background:#dfe5f2}
.tile.g1{background:#e6e2f7}.tile.g2{background:#e2f0e9}.tile.g3{background:#f4e8dc}
.phone.dark .tile{background:#2a2f3a}.phone.dark .tile.g1{background:#2c2940}.phone.dark .tile.g2{background:#233029}.phone.dark .tile.g3{background:#332b24}
.chart{height:190px;display:flex;align-items:flex-end;gap:8px;background:var(--phone-card);border:1px solid var(--phone-line);border-radius:14px;padding:14px}
.bar{flex:1;background:#d5deef;border-radius:6px 6px 3px 3px}
.phone.dark .bar{background:#2b3446}
.bar.on{background:#3f6fe0}
.success{display:grid;place-items:center;margin:18px 0 4px}
.success i{width:68px;height:68px;border-radius:50%;background:#e3f7ec;color:#1f9d5f;display:grid;place-items:center;font-size:30px;font-style:normal}
.phone.dark .success i{background:#1d3528}
.close{position:absolute;right:18px;top:44px;font-size:16px;color:var(--phone-muted);z-index:4}
.meta h3{margin:4px 0 6px;font-size:24px;letter-spacing:-.01em}
.screen-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent)}
.meta .purpose{color:var(--muted);margin:0 0 12px;line-height:1.55}
.meta ul{margin:0 0 14px;padding-left:18px;color:#d9e3f5;line-height:1.7;font-size:13.5px}
.states{display:flex;gap:6px;flex-wrap:wrap}
.states span{font-size:11px;padding:4px 8px;border-radius:999px;border:1px dashed var(--line);color:var(--muted)}
.approval{margin-top:18px;display:grid;grid-template-columns:1.15fr .85fr;gap:18px}
.box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.checks{list-style:none;padding:0;margin:0 0 12px;display:grid;gap:8px}
.checks li{display:flex;gap:9px;align-items:flex-start;color:#dce6f8;font-size:13px;line-height:1.45}
.checks input{margin-top:2px;accent-color:var(--accent)}
.decision{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 12px}
.decision label{display:flex;gap:7px;align-items:center;font-size:13px;color:#dce6f8;border:1px solid var(--line);background:var(--card2);padding:8px 12px;border-radius:10px;cursor:pointer}
.decision input{accent-color:var(--accent)}
textarea,input.text{width:100%;background:var(--card2);border:1px solid var(--line);border-radius:10px;color:var(--text);padding:10px 12px;font:inherit;font-size:13px}
textarea{min-height:92px;resize:vertical}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.field-row label{display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
select.text{width:100%;background:var(--card2);border:1px solid var(--line);border-radius:10px;color:var(--text);padding:9px 10px;font:inherit;font-size:12px}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.primary{all:unset;cursor:pointer;background:var(--accent);color:#08111f;font-weight:700;font-size:13px;padding:10px 16px;border-radius:10px}
.secondary{all:unset;cursor:pointer;border:1px solid var(--line);background:var(--card2);color:#dbe4f5;font-size:13px;padding:10px 16px;border-radius:10px}
.ok{color:var(--ok)} .warn{color:var(--warn)}
.note{color:var(--muted);font-size:12.5px;line-height:1.6;margin:8px 0 0}
.howto{margin:0;padding-left:18px;color:#d9e3f5;font-size:12.5px;line-height:1.7}
code{background:#0c111b;border:1px solid var(--line);border-radius:6px;padding:1px 5px;font-size:12px;color:#cfe0ff}
@media (max-width:1000px){.grid,.approval{grid-template-columns:1fr}.screen{grid-template-columns:1fr}.phone{width:280px;height:560px}}
@media print{body{background:#fff;color:#111}.top-actions,.panel,.approval .box:last-child,.actions,.nav{display:none}.wrap{max-width:none;padding:0}.stage,.screen{border:0;padding:0}.screen{display:grid !important;grid-template-columns:320px 1fr;page-break-after:always}.meta h3,.meta .purpose,.meta ul{color:#111}.phone{box-shadow:none}}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div>
      <h1>App Preview &amp; Approval — ${esc(appName)}</h1>
      <p class="sub">Illustrative preview generated from your questionnaire and profile. Review the screen flow and tone, then approve or request changes before build. Final screens are implemented natively with real states, navigation, accessibility and motion.</p>
    </div>
    <div class="top-actions">
      <button class="tool" id="toggle-all">Show all screens</button>
      <button class="tool" id="toggle-theme">Dark phone</button>
      <button class="tool" onclick="window.print()">Print / save PDF</button>
    </div>
  </header>

  <div class="grid">
    <aside class="panel">
      <h2>App summary</h2>
      <div class="kv"><b>Idea:</b> ${esc(idea)}</div>
      <div class="kv"><b>Archetype:</b> ${esc(arch)}</div>
      <div class="kv"><b>Platforms:</b> ${esc(intake.platforms || "both")}</div>
      <div class="kv"><b>Stack:</b> ${esc(stackText)}</div>
      <div class="kv"><b>Monetisation:</b> ${esc(profile.monetisation || intake.monetisation || "free")}</div>
      <div class="kv"><b>Accounts:</b> ${profile.accounts ? "yes" : "no"} · <b>Motion:</b> ${esc(profile.motionBudget || "standard")}</div>
      <div class="flow">${chips || "<span class='chip'>No screens in profile</span>"}</div>
      <h2 style="margin-top:16px">Screens</h2>
      <div class="nav">${nav}</div>
    </aside>

    <main class="stage" id="stage">
      ${screenCards || "<p>No screens in profile. Run the questionnaire or route-idea first.</p>"}
    </main>
  </div>

  <div class="approval">
    <section class="box">
      <h2>Approval checklist</h2>
      <ul class="checks">
        <li><input type="checkbox" data-id="idea" id="c1"/><label for="c1">Core idea and target audience are correct</label></li>
        <li><input type="checkbox" data-id="flow" id="c2"/><label for="c2">Screen list and flow cover the must-have features</label></li>
        <li><input type="checkbox" data-id="stack" id="c3"/><label for="c3">Platforms and stack are correct (native Kotlin/Compose + SwiftUI)</label></li>
        <li><input type="checkbox" data-id="data" id="c4"/><label for="c4">Accounts, permissions, payments and data needs look right</label></li>
        <li><input type="checkbox" data-id="design" id="c5"/><label for="c5">Design direction and tone are acceptable to proceed</label></li>
      </ul>

      <h2 style="margin-top:14px">Decision</h2>
      <div class="decision">
        <label><input type="radio" name="decision" value="approved"/> Approve — start the build</label>
        <label><input type="radio" name="decision" value="changes" checked/> Request changes</label>
      </div>

      <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Change requests / notes</label>
      <textarea id="changes" placeholder="e.g. Add a settings screen, drop the paywall for v1, make the home screen calmer, add offline mode..."></textarea>

      <div class="field-row">
        <label>Add screens (comma separated)
          <input class="text" id="addScreens" placeholder="settings, export"/>
        </label>
        <label>Remove screens
          <select class="text" id="removeScreens">
            <option value="">— none —</option>
            ${screenOptions}
          </select>
        </label>
      </div>
      <div class="field-row">
        <label>Platforms
          <select class="text" id="platforms">
            <option value="both" ${intake.platforms === "both" ? "selected" : ""}>Android + iOS</option>
            <option value="android" ${intake.platforms === "android" ? "selected" : ""}>Android only</option>
            <option value="ios" ${intake.platforms === "ios" ? "selected" : ""}>iOS only</option>
          </select>
        </label>
        <label>Monetisation
          <select class="text" id="money">
            <option value="free" ${(intake.monetisation || "") === "free" ? "selected" : ""}>Free</option>
            <option value="subscription" ${(intake.monetisation || "") === "subscription" ? "selected" : ""}>Subscription</option>
            <option value="iap" ${(intake.monetisation || "") === "iap" ? "selected" : ""}>One-time IAP</option>
            <option value="ads" ${(intake.monetisation || "") === "ads" ? "selected" : ""}>Ads</option>
            <option value="none" ${(intake.monetisation || "") === "none" ? "selected" : ""}>No monetisation</option>
          </select>
        </label>
      </div>
      <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:10px 0 5px">Design notes</label>
      <input class="text" id="design" placeholder="Colour, vibe, reference apps" value="${esc(intake.design || "")}"/>

      <div class="actions">
        <button class="primary" id="download">Download feedback.json</button>
        <button class="secondary" id="copy">Copy feedback</button>
      </div>
      <p class="note" id="status">Feedback stays in this file until you run the review command. Nothing is uploaded.</p>
    </section>

    <section class="box">
      <h2>How to close the loop</h2>
      <ol class="howto">
        <li>Fill the checklist, choose <b>Approve</b> or <b>Request changes</b>, add notes.</li>
        <li>Click <b>Download feedback.json</b> and save it to <code>.mobile/preview/feedback.json</code>.</li>
        <li>Run:</li>
      </ol>
      <p class="note"><code>node scripts/review-preview.mjs --dir .mobile --from-feedback .mobile/preview/feedback.json</code></p>
      <p class="note">Changes are applied to the intake and profile, and a new preview is generated for re-approval. Approval writes <code>.mobile/00-approval.json</code> and unlocks Phase 1.</p>

      <h2 style="margin-top:16px">What this preview is</h2>
      <p class="note">An <b>illustrative approval-stage preview</b> of structure, flow and tone — not the final production UI. Final screens are implemented in the selected native stack with real data, states, accessibility and motion.</p>
      <p class="note"><b>Still external:</b> developer accounts, signing keys/certificates, CI secrets, backend/services, real-device testing, store submission and review.</p>
      <p class="note">Concept/architecture diagrams are a different job: <a href="https://github.com/wheresryan22/anatomy" style="color:#9ec1ff">Anatomy</a> can draw interactive explanatory figures; it does not replace app UI previews.</p>
    </section>
  </div>
</div>

<script>
(function () {
  var KEY = 'maf-preview-feedback-v1';
  var btns = Array.prototype.slice.call(document.querySelectorAll('.navbtn'));
  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var stage = document.getElementById('stage');

  function show(i) {
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.i === String(i)); });
    screens.forEach(function (s) { s.hidden = s.dataset.i !== String(i); });
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      stage.classList.remove('all');
      show(b.dataset.i);
    });
  });

  document.getElementById('toggle-all').addEventListener('click', function () {
    var all = stage.classList.toggle('all');
    this.textContent = all ? 'Single screen' : 'Show all screens';
    if (all) screens.forEach(function (s) { s.hidden = false; });
    else show(0);
  });

  document.getElementById('toggle-theme').addEventListener('click', function () {
    var dark = document.querySelector('.phone').classList.toggle('dark');
    document.querySelectorAll('.phone').forEach(function (p) { p.classList.toggle('dark', dark); });
    this.textContent = dark ? 'Light phone' : 'Dark phone';
  });

  function splitCsv(value) {
    return String(value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function collect() {
    var checks = Array.prototype.slice.call(document.querySelectorAll('.checks input')).map(function (input) {
      return { id: input.dataset.id, checked: input.checked };
    });
    var decision = (document.querySelector('input[name=decision]:checked') || {}).value || 'changes';
    return {
      schema: 'mobile-app-factory/preview-feedback@1',
      generatedAt: new Date().toISOString(),
      decision: decision,
      checklist: checks,
      changeRequests: document.getElementById('changes').value.trim(),
      addScreens: splitCsv(document.getElementById('addScreens').value),
      removeScreens: splitCsv(document.getElementById('removeScreens').value),
      platforms: document.getElementById('platforms').value,
      monetisation: document.getElementById('money').value,
      designNotes: document.getElementById('design').value.trim()
    };
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(collect())); } catch (e) {}
  }

  function restore() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved) return;
      (saved.checklist || []).forEach(function (item) {
        var input = document.querySelector('.checks input[data-id="' + item.id + '"]');
        if (input) input.checked = !!item.checked;
      });
      if (saved.decision) {
        var radio = document.querySelector('input[name=decision][value="' + saved.decision + '"]');
        if (radio) radio.checked = true;
      }
      if (saved.changeRequests) document.getElementById('changes').value = saved.changeRequests;
      if (saved.addScreens) document.getElementById('addScreens').value = saved.addScreens.join(', ');
      if (saved.removeScreens && saved.removeScreens.length) document.getElementById('removeScreens').value = saved.removeScreens[0];
      if (saved.platforms) document.getElementById('platforms').value = saved.platforms;
      if (saved.monetisation) document.getElementById('money').value = saved.monetisation;
      if (saved.designNotes) document.getElementById('design').value = saved.designNotes;
    } catch (e) {}
  }

  document.querySelectorAll('.checks input, input[name=decision], #changes, #addScreens, #removeScreens, #platforms, #money, #design').forEach(function (el) {
    el.addEventListener('change', persist);
    el.addEventListener('input', persist);
  });

  document.getElementById('download').addEventListener('click', function () {
    var data = collect();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'feedback.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    var status = document.getElementById('status');
    status.textContent = 'feedback.json downloaded. Save it to .mobile/preview/ and run review-preview.mjs.';
    status.className = 'note ok';
  });

  document.getElementById('copy').addEventListener('click', function () {
    var text = JSON.stringify(collect(), null, 2);
    var status = document.getElementById('status');
    var done = function () { status.textContent = 'Feedback copied to the clipboard.'; status.className = 'note ok'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { status.textContent = 'Copy failed — use Download instead.'; });
    } else {
      status.textContent = 'Clipboard unavailable — use Download instead.';
    }
  });

  restore();
  persist();
})();
</script>
</body>
</html>`;
}

function writePreview(dir, opts) {
  const options = opts || {};
  const intakePath = join(dir, "00-intake.json");
  const profilePath = join(dir, "00-profile.json");
  if (!existsSync(profilePath)) {
    throw new Error(`Missing ${profilePath}. Run the questionnaire or route-idea first.`);
  }
  const intake = existsSync(intakePath) ? JSON.parse(readFileSync(intakePath, "utf8")) : { idea: "" };
  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  const outDir = join(dir, "preview");
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "index.html");
  writeFileSync(out, buildPreviewHtml(intake, profile, options));
  return out;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const dir = resolve(opts.dir);
  try {
    const out = writePreview(dir, opts);
    console.log(`Wrote preview: ${out}`);
    console.log("Open this file, fill the checklist, then download feedback.json and run review-preview.mjs.");
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("generate-preview.mjs")) main();

export { buildPreviewHtml, writePreview, classifyScreen, deriveAppName };
