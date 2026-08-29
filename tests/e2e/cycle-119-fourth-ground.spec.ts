import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The fourth ground (BACKLOG-472) + first across (BACKLOG-343). The pure halves are unit-covered; this
 * proves the integration the item exists to prove — that a zone added as data arrives in the *running*
 * park with its terrain, its crop, its box on the lens and its founding beat, with nothing written for it.
 */

type W = Record<string, any>;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const pioneers = (p: Page) => p.evaluate(() => (window as W).__pioneers() as Record<string, string>);
const zoneMap = (p: Page) => p.evaluate(() => (window as W).__zoneMap() as Array<{ id: string; name: string }>);

test('the chain runs four grounds deep, ending in The Hollow', async ({ page }) => {
  await boot(page);
  const model = await zoneMap(page);
  // BACKLOG-478: the Ridge follows the trunk as the appended branch.
  // BACKLOG-505: the trunk no longer ends in the Hollow — the Saltpan is one further east.
  expect(model.map((e) => e.id)).toEqual(['bowl', 'grove', 'fernreach', 'hollow', 'saltpan', 'ridge']);
  expect(model[3].name).toBe('The Hollow');
});

test('the Hollow farms its own crop through the existing plot path', async ({ page }) => {
  await boot(page);
  const planted = await page.evaluate(() => (window as W).__plantPlot('hollow'));
  expect(planted).toBeTruthy();
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('hollow'));
  expect((await events(page)).join('\n')).toMatch(/mushroom/i);
});

test('the first dino into a ground is remembered as its pioneer, in the ticker and the book', async ({ page }) => {
  await boot(page);
  // BACKLOG-512: a fresh save is no longer founding-blank. Every ground the roster wakes on records who
  // founded it, and the Hollow — where Murk lives from the first frame — is one of them. The subject of this
  // spec (a *first arrival* takes a founding, once) needs a ground nobody has founded, which since
  // BACKLOG-505 is the Saltpan.
  expect((await pioneers(page)).hollow).toBe('Murk');
  expect((await pioneers(page)).saltpan).toBeUndefined();

  await page.evaluate(() => (window as W).__migrate('Twitch', 'saltpan'));
  expect((await pioneers(page)).saltpan).toBe('Twitch');
  expect((await events(page)).join('\n')).toMatch(/🚩 Twitch is the first ever to set foot in the Saltpan/);

  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain('first across into the Saltpan');

  // A second arrival never takes the founding, and posts no second beat.
  await page.evaluate(() => (window as W).__migrate('Sunny', 'saltpan'));
  expect((await pioneers(page)).saltpan).toBe('Twitch');
  const beats = (await events(page)).filter((e) => e.includes('first ever to set foot in the Saltpan'));
  expect(beats).toHaveLength(1);
});
