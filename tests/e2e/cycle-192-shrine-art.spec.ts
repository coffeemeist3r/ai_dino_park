import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-617 — the shrine is a drawn rig, and it stands where the sermon was given once raised. */

type W = Record<string, any>;

test('the shrine ships as pixel art at the sermon spot (BACKLOG-617)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => (window as W).__hasPropArt('shrine'))).toBe(true);
  await page.evaluate(() => { (window as W).__setClock(1, 10, 0); (window as W).__checkFestival(); (window as W).__closeFestival(); });
  for (let i = 0; i < 40 && (await page.evaluate(() => (window as W).__festival())); i++) await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => { (window as W).__setZonePile('bowl', { stone: 2 }); (window as W).__setClock(1, 16, 0); (window as W).__holdService(); });
  const f = await page.evaluate(() => (window as W).__faith());
  expect(f.shrine).toBeTruthy();
  expect(await page.evaluate(() => (window as W).__faithMark())).toMatchObject({ tileX: f.tileX, tileY: f.tileY, visible: true, shrine: true });
});
