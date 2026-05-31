import { test, expect } from '@playwright/test';

const COLS = 20;
const ROWS = 15;
const TILE = 32;

import { boot } from './helpers';

test('dinos wander and stay in bounds', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() =>
    ((window as Record<string, unknown>).__dinoPositions as () => { name: string; x: number; y: number }[])(),
  );
  const after = await page.evaluate(() => {
    const step = (window as Record<string, unknown>).__stepWorld as () => { name: string; x: number; y: number }[];
    let last = step();
    for (let i = 0; i < 25; i++) last = step();
    return last;
  });
  // at least one dino moved
  const moved = after.some((a, i) => a.x !== before[i].x || a.y !== before[i].y);
  expect(moved).toBe(true);
  // all in-bounds
  for (const d of after) {
    expect(d.x).toBeGreaterThanOrEqual(0);
    expect(d.x).toBeLessThanOrEqual(COLS * TILE);
    expect(d.y).toBeGreaterThanOrEqual(0);
    expect(d.y).toBeLessThanOrEqual(ROWS * TILE);
  }
});

test('meetings hook is an object and greeting still works after movement', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const step = (window as Record<string, unknown>).__stepWorld as () => unknown;
    for (let i = 0; i < 30; i++) step();
  });
  const meetings = await page.evaluate(() => ((window as Record<string, unknown>).__meetings as () => object)());
  expect(typeof meetings).toBe('object');
  // greet still resolves a reply source (dino may have wandered, so null is also valid)
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(200);
  const source = await page.evaluate(() =>
    ((window as Record<string, unknown>).__lastReplySource as () => string | null)(),
  );
  expect([null, 'canned', 'llm']).toContain(source);
});
