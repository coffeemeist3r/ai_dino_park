import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { FOODS } from '../../game/src/world/foods';

type W = Record<string, unknown>;
type FoodInPlay = { tileX: number; tileY: number; foodId: string | null } | null;

const loaded = (p: Page) => p.evaluate(() => ((window as W).__loadedFeed as () => string)());
const cycle = (p: Page, dir = 1) =>
  p.evaluate((d) => ((window as W).__cycleFeed as (n: number) => string)(d), dir);
const foodInPlay = (p: Page) => p.evaluate(() => ((window as W).__food as () => FoodInPlay)());

/** Load a named food by cycling until it is the one in the hatch — the same walk a player does. */
const load = async (p: Page, id: string) => {
  for (let i = 0; i <= FOODS.length + 1; i++) {
    if ((await loaded(p)) === id) return;
    await cycle(p, 1);
  }
  throw new Error(`never reached ${id}`);
};

/**
 * BACKLOG-067 — the keeper-loaded hatch.
 *
 * `dropFood` has rolled its food since cycle 59, and seven systems downstream read one question off that
 * roll — *was this its favorite?* These specs are about the player finally being allowed to call it.
 */
test('a fresh park is loaded with the random handful, and says so', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await loaded(page)).toBe('auto');
});

test('the keeper loads a food and that food is what comes out', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await load(page, 'meat');
  // The real key, not `__dropFood` — the binding is part of what ships.
  await page.keyboard.press('KeyH');
  await page.waitForTimeout(800); // the fall tween

  expect((await foodInPlay(page))?.foodId).toBe('meat');
});

test('the comma steps back off the front and wraps to the last food', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect(await loaded(page)).toBe('auto');
  await page.keyboard.press('Comma');
  expect(await loaded(page)).toBe(FOODS[FOODS.length - 1].id);
  await page.keyboard.press('Period');
  expect(await loaded(page), 'and the period brings it back round').toBe('auto');
});

test('the random handful still rolls — the as-shipped path is alive, not bypassed', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect(await loaded(page)).toBe('auto');
  await page.evaluate(() => ((window as W).__dropFood as (c?: number) => unknown)());
  const dropped = (await foodInPlay(page))?.foodId;
  expect(FOODS.map((f) => f.id)).toContain(dropped);
});

test('a harvested crop still drops itself — the explicit argument outranks the selector', async ({
  page,
}) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await load(page, 'meat');
  await page.evaluate(() =>
    ((window as W).__dropFood as (c?: number, id?: string) => unknown)(undefined, 'roots'),
  );
  expect((await foodInPlay(page))?.foodId, 'the plot drops what it grew').toBe('roots');
});

test('the hatch is still loaded with what you left in it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await load(page, 'fish');
  const saved = await page.evaluate(async () =>
    ((window as W).__saveNow as () => Promise<{ loadedFood?: string }>)(),
  );
  expect(saved.loadedFood).toBe('fish');

  await page.reload();
  await boot(page);
  expect(await loaded(page)).toBe('fish');
});

test('the held gift is untouched by any of this', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const held = await page.evaluate(() => ((window as W).__heldItem as () => string)());
  await cycle(page, 1);
  await cycle(page, 1);
  expect(await page.evaluate(() => ((window as W).__heldItem as () => string)())).toBe(held);
});

/**
 * The reason this is a lore item and not a HUD one: the keeper aims a meal at an individual.
 *
 * Cycle 157 taught a dino to name its favorite food out loud. This asserts the other end — that loading
 * the food a *named* dino loves puts that dino's favorite on the ground, which is the input every one of
 * the seven downstream systems reads. The rush itself is `reactionToFood`'s and is unit-tested there;
 * what was never reachable before tonight is the keeper choosing which dino that question is asked about.
 */
test('the keeper can aim a meal at one dino', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const names = await page.evaluate(() => ((window as W).__dinoNames as () => string[])());
  const target = names[0];
  expect(target, 'the founding park has a cast').toBeTruthy();

  const fav = await page.evaluate(
    (n) => ((window as W).__favoriteFood as (name: string) => { id: string } | null)(n),
    target,
  );
  expect(fav, 'every dino has a favorite').not.toBeNull();

  await load(page, fav!.id);
  await page.evaluate(() => ((window as W).__dropFood as (c?: number) => unknown)());

  expect(
    (await foodInPlay(page))?.foodId,
    `${target}'s favorite is what landed`,
  ).toBe(fav!.id);
});
