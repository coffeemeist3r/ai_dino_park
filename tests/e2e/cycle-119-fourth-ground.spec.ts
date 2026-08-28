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
  // Nobody has founded anything on a fresh save — the cast began in the bowl, it did not arrive there.
  expect(await pioneers(page)).toEqual({});

  await page.evaluate(() => (window as W).__migrate('Twitch', 'hollow'));
  expect((await pioneers(page)).hollow).toBe('Twitch');
  expect((await events(page)).join('\n')).toMatch(/🚩 Twitch is the first ever to set foot in The Hollow/);

  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain('first across into The Hollow');

  // A second arrival never takes the founding, and posts no second beat.
  await page.evaluate(() => (window as W).__migrate('Sunny', 'hollow'));
  expect((await pioneers(page)).hollow).toBe('Twitch');
  const beats = (await events(page)).filter((e) => e.includes('first ever to set foot in The Hollow'));
  expect(beats).toHaveLength(1);
});
