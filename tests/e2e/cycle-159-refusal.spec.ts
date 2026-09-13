import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type FoodInPlay = { tileX: number; tileY: number; foodId: string | null } | null;
type Refusal = { name: string; foodId: string } | null;

const foodInPlay = (p: Page) => p.evaluate(() => ((window as W).__food as () => FoodInPlay)());
const refused = (p: Page) => p.evaluate(() => ((window as W).__refused as () => Refusal)());
const ticker = (p: Page) => p.evaluate(() => ((window as W).__events as () => string[])());
const memoryOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory as () => Record<string, string[]>)()[n] ?? [], name);
const friendship = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__friendship as () => Record<string, number>)()[n] ?? 0, name);

const setTrait = (p: Page, name: string, key: string, v: number) =>
  p.evaluate(
    ([n, k, val]) => ((window as W).__setTrait as (a: string, b: string, c: number) => boolean)(n as string, k as string, val as number),
    [name, key, v] as const,
  );
const place = (p: Page, name: string, tileX: number, tileY: number) =>
  p.evaluate(
    ([n, x, y]) => ((window as W).__placeDino as (a: string, b: number, c: number) => boolean)(n as string, x as number, y as number),
    [name, tileX, tileY] as const,
  );
const setNeed = (p: Page, name: string, v: number) =>
  p.evaluate(
    ([n, val]) => ((window as W).__setNeed as (a: string, b: 'hunger' | 'thirst', c: number) => unknown)(n as string, 'hunger', val as number),
    [name, v] as const,
  );

async function driveSteps(p: Page, n: number): Promise<void> {
  await p.evaluate((count) => {
    const step = (window as W).__stepWorld as () => void;
    for (let i = 0; i < count; i += 1) step();
  }, n);
}

/**
 * Clear the hatch of everybody but `keep` — the founding bowl stands three dinos deep around the feeding
 * row, `checkFeeding` takes the first one in roster order that has reached the piece, and without this a
 * spec about Mossback is really a spec about Rex.
 */
async function clearTheHatch(p: Page, keep: string): Promise<void> {
  const names = await p.evaluate(() => ((window as W).__dinoNames as () => string[])());
  for (const [i, n] of names.filter((n) => n !== keep).entries()) await place(p, n, i % 5, 14);
}

/**
 * Drop a named food on the hatch row and park a dino right on top of it, prickly and unhungry — the
 * dino that will turn it down. The drop goes through the explicit-`foodId` path so the keeper's satchel
 * (546) is not what this spec is measuring.
 */
async function stageRefusal(p: Page, refuser: string, foodId: string): Promise<FoodInPlay> {
  await boot(p);
  await foundingState(p, 'as-shipped');
  const food = await p.evaluate(
    (id) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, id),
    foodId,
  );
  await clearTheHatch(p, refuser);
  await setTrait(p, refuser, 'agreeableness', 0);
  await setNeed(p, refuser, 0);
  await place(p, refuser, food!.tileX, food!.tileY);
  return food;
}

/**
 * BACKLOG-070 — the dish turned down.
 *
 * Until tonight, a dino that reached a piece of food ate it. Every one of the six feeding branches this
 * park has built — rush, escort, yield, mercy, gobble, stand — decides *who* eats, never *whether*.
 */
test('a prickly, unhungry dino reaches the food and leaves it lying there', async ({ page }) => {
  // Mossback's favorite is not greens; forced prickly and fed, it wants nothing to do with them.
  await stageRefusal(page, 'Mossback', 'greens');
  await driveSteps(page, 1);

  expect(await refused(page), 'it turned the dish down').toEqual({ name: 'Mossback', foodId: 'greens' });
  expect(await foodInPlay(page), 'and the food is still on the ground').not.toBeNull();
  expect((await ticker(page)).join('\n')).toMatch(/Mossback looked at the .* and walked away/);
});

test('it remembers the dish it walked away from', async ({ page }) => {
  await stageRefusal(page, 'Mossback', 'greens');
  await driveSteps(page, 1);

  expect((await memoryOf(page, 'Mossback')).join('\n')).toMatch(/left it where it fell/);
});

test('it does not refuse the same piece over and over — a decision, not a tic', async ({ page }) => {
  await stageRefusal(page, 'Mossback', 'greens');
  await driveSteps(page, 10);

  const lines = (await ticker(page)).filter((l) => /Mossback looked at the/.test(l));
  expect(lines, 'one refusal for one piece').toHaveLength(1);
});

test('somebody less fussy comes along and eats the very same piece', async ({ page }) => {
  const food = await stageRefusal(page, 'Mossback', 'greens');
  await driveSteps(page, 1);
  expect(await foodInPlay(page)).not.toBeNull();

  // Twitch is the warm end of the founding bowl; it eats what it is given.
  await setTrait(page, 'Twitch', 'agreeableness', 1);
  await setNeed(page, 'Twitch', 0);
  await place(page, 'Twitch', food!.tileX, food!.tileY);
  const before = await friendship(page, 'Twitch');
  await driveSteps(page, 1);

  expect(await foodInPlay(page), 'the refused piece got eaten').toBeNull();
  expect(await friendship(page, 'Twitch')).toBeGreaterThan(before);
});

test('a hungry dino eats what it is given, however prickly', async ({ page }) => {
  const food = await stageRefusal(page, 'Mossback', 'greens');
  await setNeed(page, 'Mossback', 1); // starving
  await place(page, 'Mossback', food!.tileX, food!.tileY);
  await driveSteps(page, 1);

  expect(await refused(page), 'hunger outranks fussiness').toBeNull();
  expect(await foodInPlay(page)).toBeNull();
});

test('nobody refuses their own favorite', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  // No forced trait here, deliberately. A dino's favorite is *derived from* its traits (`giftScore`), so
  // forcing agreeableness to 0 after reading the favorite would move the favorite out from under the
  // read — which is the bug this test would otherwise be asserting. Mossback is already prickly enough
  // (0.216, under PICKY_AGREE) on the seeded roster, and the season is read live for the same reason.
  const fav = await page.evaluate(() => {
    const season = ((window as W).__season as () => string)();
    return ((window as W).__favoriteFood as (n: string, s?: string) => { id: string } | null)(
      'Mossback',
      season,
    );
  });
  const food = await page.evaluate(
    (id) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, id),
    fav!.id,
  );
  await clearTheHatch(page, 'Mossback');
  await setNeed(page, 'Mossback', 0);
  await place(page, 'Mossback', food!.tileX, food!.tileY);
  await driveSteps(page, 1);

  expect(await refused(page)).toBeNull();
  expect(await foodInPlay(page), 'it ate its favorite').toBeNull();
});

test('a new drop is a fresh decision — the refuser gets asked again', async ({ page }) => {
  await stageRefusal(page, 'Mossback', 'greens');
  await driveSteps(page, 1);
  expect(await refused(page)).not.toBeNull();

  await page.evaluate(() => ((window as W).__clearFood as () => void)());
  const food = await page.evaluate(
    () => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, 'greens'),
  );
  await place(page, 'Mossback', food!.tileX, food!.tileY);
  await driveSteps(page, 1);

  const lines = (await ticker(page)).filter((l) => /Mossback looked at the/.test(l));
  expect(lines, 'a second piece earns a second refusal').toHaveLength(2);
});
