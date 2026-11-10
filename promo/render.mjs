#!/usr/bin/env node
/**
 * Render the promo animation to video / stills.
 *
 *   node promo/render.mjs --still 7.4          # one PNG at t=7.4s
 *   node promo/render.mjs                      # full 1080x1350 MP4 + poster + GIF
 *   node promo/render.mjs --fps 30 --width 1080 --height 1350
 *
 * Requires: puppeteer-core (global is fine), ffmpeg with libx264.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const require = createRequire(import.meta.url);

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

function resolveFfmpeg() {
  const explicit = arg('ffmpeg', process.env.FFMPEG);
  if (explicit) return explicit;
  const candidates = [
    '/tmp/opencode/promo-tools/node_modules/ffmpeg-static/ffmpeg',
    path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return 'ffmpeg';
}
const FFMPEG = resolveFfmpeg();

const CHROME = arg(
  'chrome',
  process.env.CHROME_PATH ||
    path.join(
      process.env.HOME,
      '.cache',
      'ms-playwright',
      'chromium-1248',
      'chrome-linux64',
      'chrome',
    ),
);

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: 'inherit', ...opts });
}

function loadPuppeteer() {
  const candidates = [
    'puppeteer-core',
    path.join(process.env.NPM_GLOBAL_ROOT || '', 'puppeteer-core'),
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try next */
    }
  }
  // Fall back to the global root reported by npm, if this script was not given NODE_PATH.
  const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
  return require(path.join(globalRoot, 'puppeteer-core'));
}

function buildPage(templateName, outName) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // The font is inlined so a file:// page never blocks on a local font fetch.
  const font = fs.readFileSync(path.join(HERE, 'fonts', 'Inter-latin.woff2'));
  const href = `data:font/woff2;base64,${font.toString('base64')}`;
  const css = fs
    .readFileSync(path.join(HERE, 'promo.css'), 'utf8')
    .replaceAll('__FONT__', href);
  fs.writeFileSync(path.join(BUILD_DIR, 'promo.css'), css);

  const html = fs.readFileSync(path.join(HERE, templateName), 'utf8');
  const target = path.join(BUILD_DIR, outName);
  fs.writeFileSync(target, html);
  return `file://${target}`;
}

async function main() {
  const puppeteer = loadPuppeteer();

  if (has('banner')) {
    const url = buildPage('banner.html', 'banner.html');
    const browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 800, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 150));
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const out = path.join(OUT_DIR, 'banner.png');
    await page.screenshot({ path: out, type: 'png' });
    console.log(`banner → ${out}`);
    await browser.close();
    return;
  }

  const url = buildPage('index.html', 'index.html');
  const w = WIDTH;
  const h = HEIGHT;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      '--font-render-hinting=none',
    ],
  });

  const page = await browser.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('[page]', m.text());
  });
  page.on('pageerror', (e) => console.error('[page error]', e.message));

  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__ready);

  const duration = await page.evaluate(() => window.__duration);

  if (has('still')) {
    const t = Number(arg('still', 0));
    const out = path.resolve(OUT_DIR, arg('name', 'still.png'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.evaluate((tt) => window.__seek(tt), t);
    await new Promise((r) => setTimeout(r, 120));
    await page.screenshot({ path: out, type: 'png' });
    console.log(`still → ${out} (t=${t}s)`);
    await browser.close();
    return;
  }

  fs.rmSync(FRAME_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAME_DIR, { recursive: true });

  const total = Math.round(duration * FPS);
  console.log(`rendering ${total} frames @ ${FPS}fps (${w}x${h}, ${duration}s)`);

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

  await browser.close();

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

  // Poster: the settled frame, used as the cover image.
  const posterT = duration - 0.2;
  await pageStill(posterT, path.join(OUT_DIR, 'poster.png'));

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

async function pageStill(t, out) {
  // A fresh page keeps stills independent of the frame loop.
  const puppeteer = loadPuppeteer();
  const url = buildPage('index.html', 'index.html');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__ready);
  await page.evaluate((tt) => window.__seek(tt), t);
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log(`poster → ${out} (t=${t}s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
