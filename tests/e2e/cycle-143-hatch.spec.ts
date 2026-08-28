import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The hatch gets a mouth (BACKLOG-510).
 *
 * `H` is the most-pressed key in this game and until tonight the food it dropped fell out of the sky — the
 * piece was spawned above the top of the world and landed on a uniformly random column, marked by nothing
 * before or after. The event line has said "food dropped from the hatch" since cycle 59 about a thing that
 * did not exist. These specs pin the two halves of the fix: the hatch is on the ground before the player
 * presses anything, and what comes out of it comes out of *it*.
 */

type W = Record<string, any>;

const hatch = (p: Page) =>
  p.evaluate(() => (window as W).__hatch() as { tile: { tileX: number; tileY: number }; scatter: number; visible: boolean; art: boolean });

test('the hatch is standing on the ground before anybody presses anything', async ({ page }) => {
  await boot(page);
  const h = await hatch(page);
  expect(h.visible).toBe(true);
  // The wiring shipped on the glyph fallback in the morning (490/494/496/504's per-item seam) and
  // BACKLOG-502 drew the rig the same night, which is the bit that flipped this assertion from
  // `typeof h.art === 'boolean'` to the real one. A baked pixel rig is standing on the ground.
  expect(h.art).toBe(true);
});

test('food comes out of the hatch instead of out of the sky', async ({ page }) => {
  await boot(page);
  const h = await hatch(page);
  const landing = await page.evaluate(() => (window as W).__dropFood() as { tileX: number; tileY: number });
  expect(Math.abs(landing.tileX - h.tile.tileX)).toBeLessThanOrEqual(h.scatter);
  expect(landing.tileY).toBe(h.tile.tileY);
});

test('the hatch is on every ground the keeper walks to', async ({ page }) => {
  await boot(page);
  const before = await hatch(page);
  for (const zone of ['grove', 'fernreach', 'hollow', 'saltpan', 'ridge']) {
    await page.evaluate((z) => (window as W).__setZone(z), zone);
    const h = await hatch(page);
    expect(h.visible, `${zone} has no hatch`).toBe(true);
    expect(h.tile).toEqual(before.tile); // one key everywhere, so one place everywhere
  }
});

test('the crop harvest still drops at its own plot, not at the hatch', async ({ page }) => {
  await boot(page);
  const h = await hatch(page);
  // The explicit-column path is the one BACKLOG-510 deliberately left alone: a ripe crop falls where it
  // grew. Pick a column outside the scatter band so passing it through is provable.
  const col = h.tile.tileX + h.scatter + 3;
  const landing = await page.evaluate((c) => (window as W).__dropFood(c) as { tileX: number }, col);
  expect(landing.tileX).toBe(col);
});
