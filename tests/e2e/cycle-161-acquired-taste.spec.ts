import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { FOODS } from '../../game/src/world/foods';
import { WARMED_CLAUSE } from '../../game/src/world/menu';
import { WARM_AT } from '../../game/src/world/palate';

type W = Record<string, unknown>;
type FoodInPlay = { tileX: number; tileY: number; foodId: string | null } | null;

const bookText = (p: Page) => p.evaluate(() => ((window as W).__bookText as () => string)());
const palate = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__palate as (a: string) => Record<string, number>)(n), name);
const tasted = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__tasted as (a: string) => string[])(n), name);
const favoriteOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__favoriteFood as (a: string) => { id: string } | null)(n), name);
const names = (p: Page) => p.evaluate(() => ((window as W).__dinoNames as () => string[])());
const foodInPlay = (p: Page) => p.evaluate(() => ((window as W).__food as () => FoodInPlay)());
const log = (p: Page) => p.evaluate(() => ((window as W).__events as () => string[])());

const place = (p: Page, name: string, tileX: number, tileY: number) =>
  p.evaluate(
    ([n, x, y]) =>
      ((window as W).__placeDino as (a: string, b: number, c: number) => boolean)(n as string, x as number, y as number),
    [name, tileX, tileY] as const,
  );
const setTrait = (p: Page, name: string, key: string, v: number) =>
  p.evaluate(
    ([n, k, val]) =>
      ((window as W).__setTrait as (a: string, b: string, c: number) => boolean)(n as string, k as string, val as number),
    [name, key, v] as const,
  );
const setNeed = (p: Page, name: string, v: number) =>
  p.evaluate(
    ([n, val]) =>
      ((window as W).__setNeed as (a: string, b: 'hunger' | 'thirst', c: number) => unknown)(n as string, 'hunger', val as number),
    [name, v] as const,
  );

/** The one block of the book that belongs to `name` — `cycle-160-menu.spec.ts`'s helper, same subject. */
function blockOf(text: string, name: string, roster: string[]): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`${name}  (`));
  expect(start, `${name} has a block in the book`).toBeGreaterThan(-1);
  const end = lines.findIndex((l, i) => i > start && roster.some((n) => l.startsWith(`${n}  (`)));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}

/**
 * Drop a named food and feed it to one dino, with nobody else close enough to take it first.
 *
 * Hunger is pinned high on purpose: 070's refusal must never be what confounds a count. Spec 4 is the
 * one that cares about refusal and drives it deliberately, on a sated dino, after the warming is done.
 */
async function feed(p: Page, eater: string, foodId: string): Promise<void> {
  const roster = await names(p);
  for (const [i, n] of roster.filter((n) => n !== eater).entries()) await place(p, n, i % 5, 14);
  const food = await p.evaluate(
    (id) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, id),
    foodId,
  );
  await setNeed(p, eater, 1);
  await place(p, eater, food!.tileX, food!.tileY);
  await p.evaluate((n) => ((window as W).__eat as (a: string) => void)(n), eater);
}

/** A food this dino was *not* born liking — the only kind that can be warmed to. */
async function wrongDinner(p: Page, name: string): Promise<string> {
  const fav = (await favoriteOf(p, name))!.id;
  return FOODS.find((f) => f.id !== fav)!.id;
}

/**
 * BACKLOG-068 — acquired taste.
 *
 * For a hundred and thirty cycles a dino's palate was a constant the keeper slowly discovered. Feed one
 * the same wrong dinner often enough and it comes round: the keeper's own repetition is finally a cause.
 */
test('three of the same wrong dinner and the dino comes round', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const roster = await names(page);
  const food = await wrongDinner(page, 'Rex');
  const label = FOODS.find((f) => f.id === food)!.label;

  for (let i = 0; i < WARM_AT; i++) await feed(page, 'Rex', food);

  expect((await palate(page, 'Rex'))[food]).toBe(WARM_AT);
  const warmedLines = (await log(page)).filter((l) => l.includes('has come round to'));
  expect(warmedLines, 'it comes round once, not once per meal').toHaveLength(1);
  expect(warmedLines[0]).toContain('Rex');
  expect(warmedLines[0]).toContain(label);
  expect(blockOf(await bookText(page), 'Rex', roster)).toContain(`${WARMED_CLAUSE} `);
});

test('two is not enough — a palate does not move on a whim', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const roster = await names(page);
  const food = await wrongDinner(page, 'Rex');

  for (let i = 0; i < WARM_AT - 1; i++) await feed(page, 'Rex', food);

  expect((await palate(page, 'Rex'))[food]).toBe(WARM_AT - 1);
  expect((await log(page)).filter((l) => l.includes('has come round to'))).toHaveLength(0);
  expect(blockOf(await bookText(page), 'Rex', roster)).not.toContain(WARMED_CLAUSE);
});

test('the scan is a read, not a dinner — LUMEN-3 cannot warm a dino by looking at it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.locator('canvas').focus();

  await page.evaluate(() => ((window as W).__pickKeeper as (i: string) => string)('lumen'));
  await page.keyboard.press('KeyE'); // close the pick confirmation
  await page.evaluate(() => ((window as W).__warpTo as (x: string) => boolean)('Rex'));
  for (let i = 0; i < WARM_AT; i++) {
    await page.keyboard.press('KeyB');
    await page.keyboard.press('KeyB'); // open, close, so the next press is another scan
  }

  expect(await tasted(page, 'Rex'), 'the scan still fills the 069 slot it reads').not.toEqual([]);
  expect(await palate(page, 'Rex'), 'but nothing went down a throat').toEqual({});
});

test('a warmed food is no longer refused — the same dino, the same dish, the opposite answer', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const roster = await names(page);
  // Prickly enough to turn a dish down (070) — and set *before* the favorite is read, because
  // `favoriteFood` is `giftScore` over the traits: flattening agreeableness to 0 zeroes the two foods
  // that appeal to it and can hand the favorite to the very food this spec wanted to be the wrong one.
  await setTrait(page, 'Mossback', 'agreeableness', 0);
  const food = await wrongDinner(page, 'Mossback');

  // Before: sated and prickly, it walks away from this dish. Staged in `cycle-159-refusal.spec.ts`'s
  // exact order — drop, *then* clear the hatch — because the drop picks a column and the cleared dinos
  // are parked on the feeding row; clearing first can park somebody on top of the piece.
  const first = await page.evaluate(
    (id) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, id),
    food,
  );
  for (const [i, n] of roster.filter((n) => n !== 'Mossback').entries()) await place(page, n, i % 5, 14);
  await setNeed(page, 'Mossback', 0);
  await place(page, 'Mossback', first!.tileX, first!.tileY);
  await page.evaluate(() => ((window as W).__stepWorld as () => void)());
  expect(await page.evaluate(() => ((window as W).__refused as () => unknown)())).not.toBeNull();
  expect(await foodInPlay(page), 'it left the dish lying where it fell').not.toBeNull();

  // The keeper keeps offering it, and it eats when hungry — which is how a palate moves.
  await page.evaluate(() => ((window as W).__clearFood as (() => void) | undefined)?.());
  for (let i = 0; i < WARM_AT; i++) await feed(page, 'Mossback', food);
  expect((await palate(page, 'Mossback'))[food]).toBe(WARM_AT);

  // After: sated and just as prickly, it eats it anyway. Read off the dish rather than the ticker —
  // the event log rolls, and three feeds is enough to push the first refusal off the end of it.
  const again = await page.evaluate(
    (id) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, id),
    food,
  );
  for (const [i, n] of roster.filter((n) => n !== 'Mossback').entries()) await place(page, n, i % 5, 14);
  await setNeed(page, 'Mossback', 0);
  await place(page, 'Mossback', again!.tileX, again!.tileY);
  await page.evaluate(() => ((window as W).__stepWorld as () => void)());
  expect(await foodInPlay(page), 'and this time it ate the very dish it once walked away from').toBeNull();
});

test('a moved palate survives a reload — it is a lifetime record, not a mood', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const food = await wrongDinner(page, 'Rex');
  for (let i = 0; i < WARM_AT; i++) await feed(page, 'Rex', food);
  await page.evaluate(() => ((window as W).__saveNow as (() => Promise<void>) | undefined)?.());

  await boot(page);
  await expect.poll(() => palate(page, 'Rex').then((p) => p[food])).toBe(WARM_AT);
  expect(blockOf(await bookText(page), 'Rex', await names(page))).toContain(WARMED_CLAUSE);
});
