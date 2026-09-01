import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * The sleeping pose (BACKLOG-522). Like the dream spec, this one deliberately never sets the clock: the
 * whole point is what the opening frame looks like. Rex is a triceratops and a night-owl, so on a fresh
 * save at 08:00 it is down — and now it is drawn down, rather than ambling on the spot.
 */

type W = Record<string, any>;

test('the dino asleep on frame one is drawn asleep, and gets up when its hours say so', async ({ page }) => {
  await boot(page);

  const resting = await page.evaluate(() => (window as W).__resting() as string[]);
  expect(resting).toContain('Rex');
  expect(await page.evaluate(() => (window as W).__downPose() as string[])).toContain('Rex');

  // Mid-afternoon both chronotypes are up, so nobody is drawn down.
  await page.evaluate(() => {
    const w = window as W;
    w.__setClock(1, 15, 0);
    for (let i = 0; i < 3; i++) w.__stepWorld();
  });
  expect(await page.evaluate(() => (window as W).__downPose() as string[])).not.toContain('Rex');
});

test('a species nobody has drawn asleep still renders — the fallback is live', async ({ page }) => {
  await boot(page);
  // Every resting dino is a rendered sprite whether or not its species has a down pose; the pose is a
  // texture swap on an existing sprite, never a second rendering path that can fail on its own.
  const drawn = await page.evaluate(() => (window as W).__downPose() as string[]);
  const resting = await page.evaluate(() => (window as W).__resting() as string[]);
  expect(resting.length).toBeGreaterThanOrEqual(drawn.length);
  expect(await page.evaluate(() => (window as W).__hasArt('parasaurolophus'))).toBe(true);
});
