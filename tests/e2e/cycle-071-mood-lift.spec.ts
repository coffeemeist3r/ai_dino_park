import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Mood lifts the motion (BACKLOG-318). When a funk clears (a sulk repaired / a cold thawed), the dino
 * flashes a brightened flourish of its signature quirk (310). Verified through the real build via the
 * __moodLift passthrough (the live fire reuses flashFeed at the proven repair/thaw seams).
 */

type W = Record<string, any>;

test('a recovering dino flourishes its signature quirk', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const name = await page.evaluate(() => (window as W).__dinoPositions()[0].name as string);
  const sig = await page.evaluate((n) => (window as W).__fidget(n), name);
  const lift = await page.evaluate((n) => (window as W).__moodLift(n), name);

  expect(lift.startsWith(sig.glyph)).toBe(true);
  expect(lift.endsWith('✨')).toBe(true);

  // Nothing has recovered yet, so no flourish has fired.
  expect(await page.evaluate(() => (window as W).__lastMoodLift())).toBeNull();

  expect(errors).toEqual([]);
});
