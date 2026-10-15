import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-603 — the shed skin is a drawn rig, and the molt lays it as an image. */

type W = Record<string, any>;

test('the shed skin ships as pixel art and the molt lays it (BACKLOG-603)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => (window as W).__hasPropArt('molt'))).toBe(true);
  await page.evaluate(() => (window as W).__moltNow('Pip'));
  expect(await page.evaluate(() => (window as W).__moltHusks())).toBe(1);
});
