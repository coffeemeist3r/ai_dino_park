import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Realtime liveliness (BACKLOG-333). Wander + migration are paced off real time, not the in-game clock,
 * so the park mills about at any scale (at the 1× default an in-game minute is 60 real seconds, which made
 * the old in-game-gated cadences glacial). Regression guard: the cadences are small real-time values and
 * stepping still moves dinos.
 */

type W = Record<string, any>;

test('wander + migration run on real-time cadences', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Real-time cadences, not in-game-clock-gated.
  expect(await page.evaluate(() => (window as W).__wanderStepMs())).toBeLessThanOrEqual(5000);
  expect(await page.evaluate(() => (window as W).__migrateCooldownMs())).toBeLessThanOrEqual(300000);

  // forceStep body is intact — stepping the world still moves the cast.
  const before = await page.evaluate(() => (window as W).__dinoPositions());
  for (let i = 0; i < 6; i++) await page.evaluate(() => (window as W).__stepWorld());
  const after = await page.evaluate(() => (window as W).__dinoPositions());
  const moved = before.some(
    (b: { name: string; x: number; y: number }) => {
      const a = after.find((x: { name: string }) => x.name === b.name);
      return a && (a.x !== b.x || a.y !== b.y);
    },
  );
  expect(moved).toBe(true);

  expect(errors).toEqual([]);
});
