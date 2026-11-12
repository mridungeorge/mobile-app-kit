#!/usr/bin/env node
/**
 * Screenshot the *real* generated preview page for the README.
 *
 *   node promo/shot-preview.mjs
 *   node promo/shot-preview.mjs --idea "a marketplace for local dog walkers"
 *   node promo/shot-preview.mjs --out docs/preview.png --width 1400 --height 1000 --scale 2
 *
 * It runs the skill's own questionnaire and preview generator into a throwaway
 * directory, opens the resulting `.mobile/preview/index.html` in headless Chrome
 * and captures the top of the page. Nothing is hand-edited: if the preview UI
 * changes, re-running this keeps `docs/preview.png` honest.
 *
 * Requires the same toolchain as render.mjs (puppeteer-core + Chrome), but no ffmpeg.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SKILL = path.join(ROOT, 'skills', 'mobile-app-factory');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const IDEA = arg('idea', 'a sleep tracker that plays white noise and shows weekly trends');
const OUT = path.resolve(ROOT, arg('out', 'docs/preview.png'));
const WIDTH = Number(arg('width', 1400));
const HEIGHT = Number(arg('height', 1000));
const SCALE = Number(arg('scale', 2));
const CHROME = arg('chrome', undefined);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'maf-preview-shot-'));

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(SKILL, 'scripts', script), ...args], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed:\n${result.stderr || result.stdout}`);
  }
}

try {
  run('questionnaire.mjs', [
    '--out', dir,
    '--non-interactive',
    '--idea', IDEA,
    '--platforms', 'both',
    '--monetisation', 'subscription',
    '--accounts', 'yes',
  ]);
  run('generate-preview.mjs', ['--dir', dir]);

  const pageUrl = pathToFileURL(path.join(dir, 'preview', 'index.html')).href;
  const browser = await launch({ chrome: CHROME });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE });
    await page.goto(pageUrl, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // The preview hydrates its screen list on load; give it a frame to settle.
    await new Promise((resolve) => setTimeout(resolve, 400));

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    await page.screenshot({ path: OUT, type: 'png' });
    console.log(`preview shot → ${OUT} (${WIDTH}x${HEIGHT} @${SCALE}x)`);
  } finally {
    await browser.close();
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
