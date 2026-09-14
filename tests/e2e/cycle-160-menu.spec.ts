import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { FOODS } from '../../game/src/world/foods';
import { MENU_GLYPH, MENU_BLANK, FAVORITE_UNKNOWN } from '../../game/src/world/menu';

type W = Record<string, unknown>;
type FoodInPlay = { tileX: number; tileY: number; foodId: string | null } | null;

const bookText = (p: Page) => p.evaluate(() => ((window as W).__bookText as () => string)());
const tasted = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__tasted as (a: string) => string[])(n), name);
const favoriteOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__favoriteFood as (a: string) => { id: string } | null)(n), name);
const names = (p: Page) => p.evaluate(() => ((window as W).__dinoNames as () => string[])());

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

/** The one block of the book that belongs to `name` — up to the next dino's header line. */
function blockOf(text: string, name: string, roster: string[]): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`${name}  (`));
  expect(start, `${name} has a block in the book`).toBeGreaterThan(-1);
  const end = lines.findIndex((l, i) => i > start && roster.some((n) => l.startsWith(`${n}  (`)));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}

/** Drop a named food and feed it to one dino, with nobody else close enough to take it first. */
async function feed(p: Page, eater: string, foodId: string): Promise<void> {
  const roster = await names(p);
  for (const [i, n] of roster.filter((n) => n !== eater).entries()) await place(p, n, i % 5, 14);
  const food = await p.evaluate(
    (id) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, id),
    foodId,
  );
  // Hungry, so 070's refusal can never be what this spec is measuring.
  await setNeed(p, eater, 1);
  await place(p, eater, food!.tileX, food!.tileY);
  await p.evaluate((n) => ((window as W).__eat as (a: string) => void)(n), eater);
}

/**
 * BACKLOG-069 — the menu in the book.
 *
 * Every dino has had a favorite food since cycle 25 and the book, whose whole job is "what I have learned
 * about this dino", never carried it. Now it does, blank first.
 */
test('a fresh save opens with every menu blank', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const text = await bookText(page);
  const roster = await names(page);
  const menus = text.split('\n').filter((l) => l.includes(`${MENU_GLYPH} menu:`));

  expect(menus, 'one menu line per dino').toHaveLength(roster.length);
  for (const line of menus) {
    expect(line).toContain(FAVORITE_UNKNOWN);
    expect([...line].filter((c) => c === MENU_BLANK)).toHaveLength(FOODS.length);
  }
});

test('feeding one dino fills in one slot — for that dino only', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await feed(page, 'Rex', 'greens');

  expect(await tasted(page, 'Rex')).toEqual(['greens']);

  const roster = await names(page);
  const text = await bookText(page);
  const rex = blockOf(text, 'Rex', roster);
  expect(rex).toContain('🌿');

  const other = roster.find((n) => n !== 'Rex')!;
  expect([...blockOf(text, other, roster).split('\n').find((l) => l.includes('menu:'))!]
    .filter((c) => c === MENU_BLANK)).toHaveLength(FOODS.length);
});

test('the favorite is named only once that dino has eaten it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const roster = await names(page);
  const fav = (await favoriteOf(page, 'Rex'))!.id;
  const notFav = FOODS.find((f) => f.id !== fav)!.id;

  await feed(page, 'Rex', notFav);
  expect(blockOf(await bookText(page), 'Rex', roster), 'a wrong dinner is no answer').toContain(
    FAVORITE_UNKNOWN,
  );

  await feed(page, 'Rex', fav);
  const rex = blockOf(await bookText(page), 'Rex', roster);
  expect(rex).toContain('loves ');
  expect(rex).not.toContain(FAVORITE_UNKNOWN);
});

test('the menu survives a reload — it is a lifetime record, not a memory', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await feed(page, 'Rex', 'greens');
  await page.evaluate(() => ((window as W).__saveNow as (() => Promise<void>) | undefined)?.());

  await boot(page);
  await expect.poll(() => tasted(page, 'Rex')).toEqual(['greens']);
  expect(blockOf(await bookText(page), 'Rex', await names(page))).toContain('🌿');
});

test('a refusal records nothing — the menu is what went down, not what was offered', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const roster = await names(page);
  for (const [i, n] of roster.filter((n) => n !== 'Mossback').entries()) await place(page, n, i % 5, 14);
  const food = await p_drop(page, 'greens');
  await setTrait(page, 'Mossback', 'agreeableness', 0);
  await setNeed(page, 'Mossback', 0);
  await place(page, 'Mossback', food!.tileX, food!.tileY);
  await page.evaluate(() => {
    const step = (window as W).__stepWorld as () => void;
    step();
  });

  expect(await page.evaluate(() => ((window as W).__refused as () => unknown)())).not.toBeNull();
  expect(await tasted(page, 'Mossback'), 'it looked at it and learned the keeper nothing').toEqual([]);
});

function p_drop(p: Page, id: string): Promise<FoodInPlay> {
  return p.evaluate(
    (foodId) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, foodId),
    id,
  );
}

/**
 * The scan decision, made explicit in the design and pinned here.
 *
 * LUMEN-3's field scan has printed the favorite unconditionally since BACKLOG-157 and still does — it is
 * the one ability in this game that reads a mind, and a Scholar who has to guess like everybody else is a
 * worse roster, not a fairer one. What changes tonight is that the scan **counts**: what LUMEN-3 reads,
 * the book keeps. Two routes to the same menu, and the keeper roster finally means something at the
 * collection layer.
 */
test('what LUMEN-3 reads, the book keeps', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.locator('canvas').focus();

  expect(await tasted(page, 'Rex')).toEqual([]);

  await page.evaluate(() => ((window as W).__pickKeeper as (i: string) => string)('lumen'));
  await page.keyboard.press('KeyE'); // close the pick confirmation
  await page.evaluate(() => ((window as W).__warpTo as (x: string) => boolean)('Rex'));
  await page.keyboard.press('KeyB');
  await expect.poll(() => page.evaluate(() => ((window as W).__scanOpen as () => boolean)())).toBe(true);

  const fav = (await favoriteOf(page, 'Rex'))!.id;
  expect(await tasted(page, 'Rex'), 'the scan filled the slot it just read').toEqual([fav]);
  expect(blockOf(await bookText(page), 'Rex', await names(page))).toContain('loves ');
});
