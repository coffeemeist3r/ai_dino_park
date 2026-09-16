import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { FOODS } from '../../game/src/world/foods';
import { WARM_AT } from '../../game/src/world/palate';
import { ENVY_GLYPH, ENVY_POINTS_CEILING, wistfulGreetLine } from '../../game/src/world/envy';

type W = Record<string, unknown>;
type FoodInPlay = { tileX: number; tileY: number; foodId: string | null } | null;
type Pending = Record<string, { eater: string; at: number }>;

const envy = (p: Page) => p.evaluate(() => ((window as W).__envy as () => Pending)());
const log = (p: Page) => p.evaluate(() => ((window as W).__events as () => string[])());
const bubbles = (p: Page) => p.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
const memoryOf = (p: Page, name: string) =>
  p.evaluate((n) => (((window as W).__memory as () => Record<string, string[]>)()[n as string] ?? []), name);
const names = (p: Page) => p.evaluate(() => ((window as W).__dinoNames as () => string[])());
const favoriteOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__favoriteFood as (a: string) => { id: string } | null)(n), name);
const points = (p: Page) => p.evaluate(() => ((window as W).__friendshipPoints as () => Record<string, number>)());
const setHearts = (p: Page, name: string, h: number) =>
  p.evaluate(([n, v]) => ((window as W).__setHearts as (a: string, b: number) => number)(n as string, v as number), [name, h] as const);

const place = (p: Page, name: string, tileX: number, tileY: number) =>
  p.evaluate(
    ([n, x, y]) =>
      ((window as W).__placeDino as (a: string, b: number, c: number) => boolean)(n as string, x as number, y as number),
    [name, tileX, tileY] as const,
  );
const setNeed = (p: Page, name: string, v: number) =>
  p.evaluate(
    ([n, val]) =>
      ((window as W).__setNeed as (a: string, b: 'hunger' | 'thirst', c: number) => unknown)(n as string, 'hunger', val as number),
    [name, v] as const,
  );

/**
 * Feed `eater` the named food with `watcher` standing close enough to see it, and everyone else parked
 * far away on the bottom row.
 *
 * The watcher is placed **three tiles off** rather than on top of the meal: inside `ENVY_WATCH_TILES`,
 * but never nearer the food than the eater, or it takes the meal itself and the spec proves nothing.
 */
async function feedWatched(p: Page, eater: string, watcher: string, foodId: string): Promise<void> {
  const roster = await names(p);
  for (const [i, n] of roster.filter((n) => n !== eater && n !== watcher).entries()) await place(p, n, i % 5, 14);
  const food = await p.evaluate(
    (id) => ((window as W).__dropFood as (c?: number, f?: string) => FoodInPlay)(undefined, id),
    foodId,
  );
  await setNeed(p, eater, 1);
  await place(p, eater, food!.tileX, food!.tileY);
  await place(p, watcher, food!.tileX + 3, food!.tileY);
  await p.evaluate((n) => ((window as W).__eat as (a: string) => void)(n), eater);
}

/**
 * Say hello, through the door a player actually uses.
 *
 * `E` on a dino opens the **tone menu** (142) and the greet resolves in `recordTone` — `recordGreet` is
 * only reachable from a dev hook. Both doors carry this beat, and `plainGreet` below drives the other one,
 * so the spec proves the pair rather than assuming they agree.
 */
const greet = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__pickTone as (a: string, b: string) => Promise<string>)(n, 'warm'), name);

/** The other door — `recordGreet`, the one the tone menu replaced. */
const plainGreet = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__greet as (a: string) => number)(n), name);

/**
 * BACKLOG-126 — eavesdropping envy.
 *
 * Milestone 20's last arc, and the first time its machinery is read by somebody it was not built for:
 * the favorite (025), the book's `loves` line (069) and the warmed clause (068) have all been facts
 * about the dino being fed. Here they are a fact about the dino *watching*.
 */
test('somebody watched the good dinner, and says so next time you say hello', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const roster = await names(page);
  const fav = (await favoriteOf(page, 'Rex'))!.id;
  const label = FOODS.find((f) => f.id === fav)!.label;

  await feedWatched(page, 'Rex', 'Glade', fav);

  // the slight is filed, on the watcher, about the eater
  expect((await envy(page)).Glade?.eater).toBe('Rex');
  const line = (await log(page)).filter((l) => l.includes(ENVY_GLYPH));
  expect(line, 'the ticker carries the moment once').toHaveLength(1);
  expect(line[0]).toContain('Glade');
  expect(line[0]).toContain('Rex');
  expect(line[0]).toContain(label);

  // both halves of the thought are filed: what it saw, and what it concluded
  const mem = await memoryOf(page, 'Glade');
  expect(mem).toContain('the keeper likes Rex more');
  expect(mem).toContain(`you watched the keeper give Rex the ${label}`);
  expect(roster).toContain('Glade');

  // and the payoff: the next hello is not the ordinary one
  await greet(page, 'Glade');
  expect(await bubbles(page)).toContain(wistfulGreetLine('Glade', 'Rex'));

  // said once. the second hello is ordinary again. Counted rather than absence-checked, because
  // `__bubbleTexts` is the *live* list and the first one is still on screen — a second would make two.
  expect(await envy(page)).toEqual({});
  await greet(page, 'Glade');
  const said = (await bubbles(page)).filter((b) => b === wistfulGreetLine('Glade', 'Rex'));
  expect(said, 'a slight is said once, not every time you come back').toHaveLength(1);
});

test('a warmed food is a good dinner too — the keeper can cause the envy as well as find it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const fav = (await favoriteOf(page, 'Rex'))!.id;
  const wrong = FOODS.find((f) => f.id !== fav)!.id;

  // the first two meals are ordinary: nothing to envy yet.
  for (let i = 0; i < WARM_AT - 1; i++) await feedWatched(page, 'Rex', 'Glade', wrong);
  expect(await envy(page), 'an ordinary dinner is lunch, not a slight').toEqual({});
  expect((await log(page)).filter((l) => l.includes(ENVY_GLYPH))).toHaveLength(0);

  // the third crosses 068's line, and that is a good dinner.
  await feedWatched(page, 'Rex', 'Glade', wrong);
  expect((await envy(page)).Glade?.eater).toBe('Rex');
});

test('a dino the keeper already likes is not insecure about anything', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const fav = (await favoriteOf(page, 'Rex'))!.id;

  // put Glade above the ceiling before the meal happens — it is not insecure any more.
  await setHearts(page, 'Glade', 5);
  expect((await points(page)).Glade).toBeGreaterThan(ENVY_POINTS_CEILING);

  await feedWatched(page, 'Rex', 'Glade', fav);
  expect(await envy(page)).toEqual({});
});

test('a slight nobody came back for goes unsaid', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const fav = (await favoriteOf(page, 'Rex'))!.id;
  await feedWatched(page, 'Rex', 'Glade', fav);
  expect((await envy(page)).Glade?.eater).toBe('Rex');

  // ENVY_FADES_AFTER_STEPS ambient steps later there is nothing left to say. Stepped through the
  // production tick rather than by editing the record, so the expiry is proven where it actually runs.
  await page.evaluate(async (n) => {
    const s = (window as Record<string, unknown>).__stepWorld as () => unknown;
    for (let i = 0; i < n; i++) s();
  }, 101);
  expect(await envy(page)).toEqual({});

  await greet(page, 'Glade');
  expect(await bubbles(page)).not.toContain(wistfulGreetLine('Glade', 'Rex'));
});

test('envy colours what a dino says and does not charge the keeper for a hello', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const fav = (await favoriteOf(page, 'Rex'))!.id;

  // one plain greet with no slight pending, to learn what an ordinary hello is worth
  const before = (await points(page)).Glade ?? 0;
  await plainGreet(page, 'Glade');
  const plainGain = ((await points(page)).Glade ?? 0) - before;
  expect(plainGain).toBeGreaterThan(0);

  await feedWatched(page, 'Rex', 'Glade', fav);
  const beforeWistful = (await points(page)).Glade ?? 0;
  await plainGreet(page, 'Glade');
  const wistfulGain = ((await points(page)).Glade ?? 0) - beforeWistful;

  // two identical greets, two identical gains — the second one just had more to say.
  expect(wistfulGain).toBe(plainGain);
  expect(await bubbles(page)).toContain(wistfulGreetLine('Glade', 'Rex'));
});
