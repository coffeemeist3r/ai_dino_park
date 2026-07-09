import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Homesick sooner (BACKLOG-410) — a dino freshly moved *alone* into a friendless zone (not yet settled, 341,
 * with no bonded friend residing in its zone) falls into its signature tic (405) quicker than one on home
 * ground. The onset threshold drops to TIC_AFTER_STEPS_HOMESICK (12) from the plain 20; a settled dino keeps
 * the full stretch.
 *
 * `alone` is migrated into the empty grove (tenure resets to 0 there → deterministically "fresh, friendless")
 * and pinned each step, while every other dino is parked in a bowl corner far from its pixel — so no stray
 * cross-zone meet bonds it and only 410 (not the 393 solitary shortener, pinned off via a non-solitary intent)
 * shapes the onset.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const tic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tic(nn), n);

// One undisturbed force-step: `alone` fed + pinned in the grove interior, everyone else parked in a bowl
// corner (a distinct pixel), so the lone dino accrues its solitary streak without company or a stray bond.
const soloStep = (p: Page, alone: string, others: string[]) =>
  p.evaluate(
    ({ alone, others }) => {
      const w = window as W;
      w.__setNeed(alone, 'hunger', 0);
      w.__setNeed(alone, 'thirst', 0);
      w.__placeDino(alone, 10, 7);
      others.forEach((n: string, i: number) => w.__placeDino(n, 1 + i, 1));
      w.__stepWorld();
    },
    { alone, others },
  );

test('a fresh dino alone in a friendless zone invents its tic by the homesick threshold, before the plain 20', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const friend = roster[1];
  const others = roster.slice(1);

  // Bond `alone`↔`friend` (so it's not a moping loner) but leave the friend in the bowl — its only friend is a
  // zone away, so `alone`, freshly in the grove, is friendless *there*. Non-solitary intent + zero curiosity so
  // only 410 can shorten the onset and nothing else competes with the ritual.
  await page.evaluate(
    ({ alone, friend }) => {
      const w = window as W;
      w.__bondPair(alone, friend, 50);
      w.__migrate(alone, 'grove');
      w.__setTrait(alone, 'curiosity', 0);
      w.__setIntent(alone, 'restless');
    },
    { alone, friend },
  );

  expect((await tic(page, alone)).strange).toBe(true);

  // Eleven undisturbed steps: still one short of the homesick threshold (12), so not yet ticcing.
  for (let i = 0; i < 11; i++) await soloStep(page, alone, others);
  expect((await tic(page, alone)).invented).toBe(false);

  // The twelfth crosses TIC_AFTER_STEPS_HOMESICK — it falls into its ritual, well before the plain 20.
  await soloStep(page, alone, others);
  const t = await tic(page, alone);
  expect(t.invented).toBe(true);
  expect(t.solo).toBeLessThan(20);

  expect(errors).toEqual([]);
});

test('a settled dino keeps the full stretch — 410 only shortens the fresh newcomer (control)', async ({ page }) => {
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const friend = roster[1];
  const others = roster.slice(1);

  await page.evaluate(
    ({ alone, friend }) => {
      const w = window as W;
      w.__bondPair(alone, friend, 50);
      w.__migrate(alone, 'grove');
      w.__setTrait(alone, 'curiosity', 0);
      w.__setIntent(alone, 'restless');
    },
    { alone, friend },
  );

  // Settle it in the grove (tenure ≥ SETTLE_ROLLS) — now it's on home ground, so 410 does not fire.
  for (let i = 0; i < 5; i++) await page.evaluate(() => (window as W).__settleTick());
  expect(await page.evaluate((n) => (window as W).__settled(n) as boolean, alone)).toBe(true);
  expect((await tic(page, alone)).strange).toBe(false);

  // Twelve steps: a strange dino would have ticced by now; a settled one still needs the full stretch.
  for (let i = 0; i < 12; i++) await soloStep(page, alone, others);
  expect((await tic(page, alone)).invented).toBe(false);

  // Driven the rest of the way, it still invents (the gate only *shortens*, never disables the ritual).
  for (let i = 0; i < 9; i++) await soloStep(page, alone, others);
  expect((await tic(page, alone)).invented).toBe(true);
});
