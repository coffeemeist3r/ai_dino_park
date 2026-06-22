import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Lingering lift (BACKLOG-325). After a recovery flourish (318), a dino stays in a perk window for a
 * short while; its idle quirk reads brightened during it. Driven via the __liftMood dev hook.
 */

type W = Record<string, any>;

test('a recovered dino enters a perk window', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const name = await page.evaluate(() => (window as W).__dinoPositions()[0].name as string);

  // Nothing has recovered yet.
  expect(await page.evaluate((n) => (window as W).__lifted(n), name)).toBe(false);

  // Force a recovery: the flourish fires and the perk window opens.
  const flourish = await page.evaluate((n) => (window as W).__liftMood(n), name);
  expect(flourish.endsWith('✨')).toBe(true);
  expect(await page.evaluate((n) => (window as W).__lifted(n), name)).toBe(true);

  expect(errors).toEqual([]);
});
