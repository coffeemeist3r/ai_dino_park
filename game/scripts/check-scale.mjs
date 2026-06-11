/**
 * BACKLOG-188 verification — screenshot the game at phone viewports and report
 * the canvas bounding box vs the viewport. Throwaway-ish; rerun after scale changes.
 *
 * Run from repo root with the dev server up:  node game/scripts/check-scale.mjs
 */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const shots = [
  { name: 'phone-landscape', width: 915, height: 412 },
  { name: 'phone-portrait', width: 412, height: 915 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const { name, width, height } of shots) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(1500);
  const box = await page.locator('canvas').boundingBox();
  console.log(
    `${name} ${width}x${height} -> canvas ${Math.round(box.width)}x${Math.round(box.height)} at (${Math.round(box.x)},${Math.round(box.y)})`,
  );
  await page.screenshot({ path: `game/scripts/scale-${name}.png` });
  await page.close();
}

// Rotation: load portrait, flip to landscape without reload — canvas must refit
// and stay inside the new viewport (the phone-rotation cut-off, BACKLOG-188).
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
await page.goto('http://127.0.0.1:5173/');
await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
await page.waitForTimeout(1500);
await page.setViewportSize({ width: 915, height: 412 });
await page.waitForTimeout(500);
const box = await page.locator('canvas').boundingBox();
const fits = box.width <= 915 && box.height <= 412.5;
console.log(
  `rotate 412x915 -> 915x412: canvas ${Math.round(box.width)}x${Math.round(box.height)} at (${Math.round(box.x)},${Math.round(box.y)}) — ${fits ? 'FITS' : 'CUT OFF'}`,
);
await page.close();
await browser.close();
if (!fits) process.exit(1);
