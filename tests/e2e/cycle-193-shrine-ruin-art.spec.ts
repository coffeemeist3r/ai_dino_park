import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, any>;

/** BACKLOG-619 (cycle 193-art): the lapsed shrine's ruin rig bakes like every other `<name>_derelict`. */
test('the lapsed shrine ships as pixel art (BACKLOG-619)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => (window as W).__hasPropArt('shrine_derelict'))).toBe(true);
});
