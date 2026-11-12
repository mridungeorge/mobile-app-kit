#!/usr/bin/env node
/**
 * Render the promo animation to video / stills.
 *
 *   node promo/render.mjs --still 3.6 --name beat.png   # one PNG at t=3.6s
 *   node promo/render.mjs --banner                      # docs/banner.png
 *   node promo/render.mjs                               # full MP4 + poster + GIF
 *   node promo/render.mjs --fps 30 --width 1080 --height 1350
 *
 * Requires: puppeteer-core + a Chrome/Chromium binary, and ffmpeg with libx264.
 * `cd promo && npm install` provides the first two; ffmpeg-static provides ffmpeg.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WIN, launch, settle } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const has = (name) => process.argv.includes(`--${name}`);

const FPS = Number(arg('fps', 30));
const WIDTH = Number(arg('width', 1080));
const HEIGHT = Number(arg('height', 1350));
const OUT_DIR = path.resolve(ROOT, arg('out', 'docs'));
const BUILD_DIR = path.join(HERE, '.build');
const FRAME_DIR = path.join(BUILD_DIR, 'frames');
const CHROME = arg('chrome', undefined);

function resolveFfmpeg() {
  const explicit = arg('ffmpeg', process.env.FFMPEG);
  if (explicit) return explicit;
  const bin = WIN ? 'ffmpeg.exe' : 'ffmpeg';
  const candidates = [
    path.join(HERE, 'node_modules', 'ffmpeg-static', bin),
    path.join(ROOT, 'node_modules', 'ffmpeg-static', bin),
    path.join(process.env.TEMP || '/tmp', 'opencode', 'promo-tools', 'node_modules', 'ffmpeg-static', bin),
    '/tmp/opencode/promo-tools/node_modules/ffmpeg-static/ffmpeg',
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  return bin;
}
const FFMPEG = resolveFfmpeg();

function sh(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

/** Inline the Inter subset so a file:// page never blocks on a local font fetch. */
function buildPage(templateName) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  const font = fs.readFileSync(path.join(HERE, 'fonts', 'Inter-latin.woff2'));
  const href = `data:font/woff2;base64,${font.toString('base64')}`;
  const css = fs.readFileSync(path.join(HERE, 'promo.css'), 'utf8').replaceAll('__FONT__', href);
  fs.writeFileSync(path.join(BUILD_DIR, 'promo.css'), css);

  const html = fs.readFileSync(path.join(HERE, templateName), 'utf8');
  const target = path.join(BUILD_DIR, templateName);
  fs.writeFileSync(target, html);
  return pathToFileURL(target).href;
}

async function renderBanner() {
  const url = buildPage('banner.html');
  const browser = await launch({ chrome: CHROME });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 800, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 150));
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const out = path.join(OUT_DIR, 'banner.png');
    await page.screenshot({ path: out, type: 'png' });
    console.log(`banner → ${out}`);
  } finally {
    await browser.close();
  }
}

async function pageStill(t, out) {
  // A fresh page keeps stills independent of the frame loop.
  const url = buildPage('index.html');
  const browser = await launch({ chrome: CHROME });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);
    await page.evaluate((tt) => window.__seek(tt), t);
    await new Promise((r) => setTimeout(r, 150));
    await page.screenshot({ path: out, type: 'png' });
    console.log(`still → ${out} (t=${t}s)`);
  } finally {
    await browser.close();
  }
}

async function renderVideo() {
  const url = buildPage('index.html');
  const browser = await launch({ chrome: CHROME });
  let duration = 0;

  try {
    const page = await browser.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') console.error('[page]', m.text());
    });
    page.on('pageerror', (e) => console.error('[page error]', e.message));

    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);

    duration = await page.evaluate(() => window.__duration);

    if (has('still')) {
      const t = Number(arg('still', 0));
      const out = path.resolve(OUT_DIR, arg('name', 'still.png'));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await page.evaluate((tt) => window.__seek(tt), t);
      await new Promise((r) => setTimeout(r, 120));
      await page.screenshot({ path: out, type: 'png' });
      console.log(`still → ${out} (t=${t}s)`);
      return;
    }

    fs.rmSync(FRAME_DIR, { recursive: true, force: true });
    fs.mkdirSync(FRAME_DIR, { recursive: true });

    const total = Math.round(duration * FPS);
    console.log(`rendering ${total} frames @ ${FPS}fps (${WIDTH}x${HEIGHT}, ${duration}s)`);

    for (let i = 0; i < total; i++) {
      const t = i / FPS;
      await page.evaluate((tt) => window.__seek(tt), t);
      await page.screenshot({
        path: path.join(FRAME_DIR, `${String(i).padStart(4, '0')}.png`),
        type: 'png',
        optimizeForSpeed: true,
      });
      if (i % 30 === 0) process.stdout.write(`\r  frame ${i}/${total}`);
    }
    process.stdout.write(`\r  frame ${total}/${total}\n`);
  } finally {
    await browser.close();
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const mp4 = path.join(OUT_DIR, 'promo.mp4');

  sh(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-i', path.join(FRAME_DIR, '%04d.png'),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-level', '4.0',
    '-movflags', '+faststart',
    '-r', String(FPS),
    mp4,
  ]);
  console.log(`mp4   → ${mp4}`);

  await pageStill(duration - 0.2, path.join(OUT_DIR, 'poster.png'));

  const gif = path.join(OUT_DIR, 'promo.gif');
  sh(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-i', mp4,
    '-vf',
    'fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop', '0',
    gif,
  ]);
  console.log(`gif   → ${gif}`);
}

async function main() {
  if (has('banner')) {
    await renderBanner();
    return;
  }
  await renderVideo();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
