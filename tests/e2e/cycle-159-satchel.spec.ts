import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { FOODS } from '../../game/src/world/foods';
import { FOUNDING_SATCHEL } from '../../game/src/world/satchel';
import { plaqueLines } from '../../game/src/ui/plaque';

type W = Record<string, unknown>;
type Pile = Record<string, number>;
type FoodInPlay = { tileX: number; tileY: number; foodId: string | null } | null;

const satchel = (p: Page) => p.evaluate(() => ((window as W).__satchel as () => Pile)());
const setSatchel = (p: Page, pile: Pile) =>
  p.evaluate((x) => ((window as W).__setSatchel as (v: Pile) => Pile)(x), pile);
const foodInPlay = (p: Page) => p.evaluate(() => ((window as W).__food as () => FoodInPlay)());
const drop = (p: Page) => p.evaluate(() => ((window as W).__dropFood as (c?: number) => unknown)());
const loaded = (p: Page) => p.evaluate(() => ((window as W).__loadedFeed as () => string)());
const cycle = (p: Page, dir = 1) =>
  p.evaluate((d) => ((window as W).__cycleFeed as (n: number) => string)(d), dir);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__events as () => string[])());

/** Clear whatever is on the ground so the next drop is not swallowed by "a piece is already in play". */
const clearGround = (p: Page) => p.evaluate(() => ((window as W).__clearFood as (() => void) | undefined)?.());

const load = async (p: Page, id: string) => {
  for (let i = 0; i <= FOODS.length + 1; i++) {
    if ((await loaded(p)) === id) return;
    await cycle(p, 1);
  }
  throw new Error(`never reached ${id}`);
};

/**
 * BACKLOG-546 — the hatch draws on something.
 *
 * `dropFood` conjured a piece out of nothing from cycle 59 to tonight, and it was the only food in this
 * park that did. These specs are about the keeper's `H` finally costing the keeper something.
 */
test('a fresh park ships the founding satchel, uneven and stocked', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const pile = await satchel(page);
  expect(pile).toEqual(FOUNDING_SATCHEL);
  const counts = Object.values(pile);
  expect(Math.min(...counts), 'one food thin enough to run out in a sitting').toBeLessThanOrEqual(2);
  expect(new Set(counts).size, 'not a flat handful of everything').toBeGreaterThan(1);
});

test('the brass engraves what the keeper is holding', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const stats = await page.evaluate(() => ((window as W).__plaque as () => { satchel?: string })());
  expect(plaqueLines(stats as never).join('\n')).toContain('Satchel · ');
});

test('the keeper drop spends the satchel, one piece at a time', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await load(page, 'meat');
  const before = (await satchel(page)).meat;
  await drop(page);
  expect((await foodInPlay(page))?.foodId).toBe('meat');
  expect((await satchel(page)).meat ?? 0).toBe(before - 1);
});

test('an empty stock drops nothing, and says so out loud', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await setSatchel(page, { greens: 3 });
  await load(page, 'meat');
  await drop(page);

  expect(await foodInPlay(page), 'nothing came out of the hatch').toBeNull();
  const log = (await ticker(page)).join('\n');
  expect(log, 'and the keeper was told which food ran out').toMatch(/satchel has no .*meat/i);
  expect((await satchel(page)).greens, 'and nothing else was spent for it').toBe(3);
});

test('the random handful only rolls what the keeper actually has', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await setSatchel(page, { greens: 8 });
  expect(await loaded(page), 'the fresh save is on the auto slot').toBe('auto');

  for (let i = 0; i < 6; i++) {
    await clearGround(page);
    await drop(page);
    expect((await foodInPlay(page))?.foodId, `roll ${i}`).toBe('greens');
  }
});

test('an empty satchel makes the random handful empty-handed too', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await setSatchel(page, {});
  await drop(page);

  expect(await foodInPlay(page)).toBeNull();
  expect((await ticker(page)).join('\n')).toMatch(/satchel is empty/i);
});

test('a harvest is not a hatch key — the explicit drop spends nothing', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const before = await satchel(page);
  await page.evaluate(() =>
    ((window as W).__dropFood as (c?: number, id?: string) => unknown)(undefined, 'roots'),
  );
  expect((await foodInPlay(page))?.foodId).toBe('roots');
  expect(await satchel(page), 'the keeper paid for nothing it did not choose').toEqual(before);
});

test('the satchel is what you left it at', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await setSatchel(page, { fish: 2, seeds: 5 });
  const saved = await page.evaluate(async () =>
    ((window as W).__saveNow as () => Promise<{ satchel?: Pile }>)(),
  );
  expect(saved.satchel).toEqual({ fish: 2, seeds: 5 });

  await page.reload();
  await boot(page);
  expect(await satchel(page)).toEqual({ fish: 2, seeds: 5 });
});
