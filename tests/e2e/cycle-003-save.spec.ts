import { test, expect } from '@playwright/test';

// Each Playwright test gets an isolated browser context, so IndexedDB starts
// empty per test and does not bleed between tests. Within a test, page.reload()
// keeps the same origin/context, so a save written before reload survives it.

type GameTime = { day: number; hour: number; minute: number };

import { boot as bootedCanvas } from './helpers';

test('fresh boot with no save starts at Day 1 08:00', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await bootedCanvas(page);
  await page.waitForTimeout(300); // allow the async load attempt to settle
  const now = await page.evaluate(() => ((window as Record<string, unknown>).__clockNow as () => GameTime)());
  expect(now.day).toBe(1);
  expect(now.hour).toBe(8);
  expect(errors).toEqual([]);
});

test('auto-save on the hour survives reload', async ({ page }) => {
  await bootedCanvas(page);
  // Cross 09:00 — onHour fires an auto-save.
  await page.evaluate(() => ((window as Record<string, unknown>).__advanceMinutes as (n: number) => GameTime)(65));
  await page.waitForTimeout(500); // let the async IndexedDB write flush
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const f = (window as Record<string, unknown>).__clockNow as undefined | (() => GameTime);
      return !!f && f().hour === 9;
    },
    { timeout: 8_000 },
  );
});

test('player position survives reload', async ({ page }) => {
  await bootedCanvas(page);
  await page.locator('canvas').focus();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');

  const before = await page.evaluate(() =>
    ((window as Record<string, unknown>).__playerPos as () => { x: number; y: number })(),
  );
  await page.evaluate(() => ((window as Record<string, unknown>).__saveNow as () => Promise<unknown>)());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    (bx) => {
      const f = (window as Record<string, unknown>).__playerPos as undefined | (() => { x: number; y: number });
      return !!f && Math.abs(f().x - bx) <= 1;
    },
    before.x,
    { timeout: 8_000 },
  );
});

test('export returns a well-formed JSON string', async ({ page }) => {
  await bootedCanvas(page);
  const json = await page.evaluate(() =>
    ((window as Record<string, unknown>).__exportSave as () => string)(),
  );
  const parsed = JSON.parse(json);
  expect(typeof parsed.version).toBe('number');
  expect(typeof parsed.time).toBe('object');
  expect(typeof parsed.player).toBe('object');
});

test('restore into a night hour re-tints the overlay', async ({ page }) => {
  await bootedCanvas(page);
  // 08:00 + 840 min = 22:00 (night). Force a save at that time.
  await page.evaluate(() => ((window as Record<string, unknown>).__advanceMinutes as (n: number) => GameTime)(840));
  await page.evaluate(() => ((window as Record<string, unknown>).__saveNow as () => Promise<unknown>)());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const f = (window as Record<string, unknown>).__readTint as undefined | (() => { alpha: number });
      return !!f && f().alpha >= 0.45;
    },
    { timeout: 8_000 },
  );
});
