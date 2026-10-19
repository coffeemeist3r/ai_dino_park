import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-616 — the faith stone is a drawn rig, and it stands where the sermon was given. */

type W = Record<string, any>;

test('the faith stone ships as pixel art at the sermon spot (BACKLOG-616)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => (window as W).__hasPropArt('faith-stone'))).toBe(true);
  await page.evaluate(() => { (window as W).__setClock(1, 10, 0); (window as W).__checkFestival(); (window as W).__closeFestival(); });
  const f = await page.evaluate(() => (window as W).__faith());
  expect(await page.evaluate(() => (window as W).__faithMark())).toEqual({ tileX: f.tileX, tileY: f.tileY, visible: true });
});
