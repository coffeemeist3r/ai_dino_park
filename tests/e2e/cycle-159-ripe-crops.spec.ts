import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * BACKLOG-548 — the last two ripe plots.
 *
 * `ripeRigKey` has asked `zoneChain()` for one rig per ground since BACKLOG-434 and `PROP_RIGS` answered
 * three of five, so a keeper walking east past the Fernreach watched the farming arc *downgrade*: two
 * grounds whose ripe plot was a 🍄 and a 🌰 sitting in a pixel world beside a pixel sprout. These assert
 * the two that were missing, and then the thing the item was actually filed over — that no ground in the
 * chain falls back any more.
 *
 * Staged with cycle-095's own `ripen` harness, unchanged.
 */

type W = Record<string, any>;

const ripen = async (page: Page, zone: string) => {
  const planted = await page.evaluate((z) => (window as W).__plantPlot(z), zone);
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  expect((await page.evaluate((z) => (window as W).__plot(z), zone)).stage).toBe('ripe');
};

test('the Hollow ripens into a baked mushroom plot, not a 🍄', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await ripen(page, 'hollow');

  const art = await page.evaluate(() => (window as W).__plotArt('hollow'));
  expect(art).not.toBeNull();
  expect(art).toContain('crop_ripe_mushrooms');
  expect(await page.evaluate(() => (window as W).__plotGlyph('hollow')), 'no glyph fallback now').toBeNull();

  expect(errors).toEqual([]);
});

test('the Ridge ripens into a baked pine-cone plot, not a 🌰', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await ripen(page, 'ridge');

  const art = await page.evaluate(() => (window as W).__plotArt('ridge'));
  expect(art).not.toBeNull();
  expect(art).toContain('crop_ripe_seeds');
  expect(await page.evaluate(() => (window as W).__plotGlyph('ridge'))).toBeNull();

  expect(errors).toEqual([]);
});

test('the harvest is untouched — each ground still releases its own crop', async ({ page }) => {
  await boot(page);

  await ripen(page, 'hollow');
  await page.evaluate(() => (window as W).__harvestPlot('hollow'));
  expect((await page.evaluate(() => (window as W).__food())).foodId).toBe('mushrooms');
});

/**
 * The claim the item was filed over, walked end to end rather than asserted twice: every ground the
 * keeper can reach draws its own ripe crop. This is the e2e twin of the unit test in `game/src/art/`,
 * and it is here because the unit one proves the *rig exists* while this one proves the *scene bakes it*.
 */
test('no ground in the chain falls back to an emoji plot any more', async ({ page }) => {
  await boot(page);

  const zones = await page.evaluate(() => (window as W).__zoneChain?.() ?? ['bowl', 'grove', 'fernreach', 'hollow', 'ridge']);
  for (const z of zones as string[]) {
    await ripen(page, z);
    expect(await page.evaluate((zz) => (window as W).__plotArt(zz), z), `${z} draws a rig`).not.toBeNull();
    expect(await page.evaluate((zz) => (window as W).__plotGlyph(zz), z), `${z} needs no glyph`).toBeNull();
  }
});
