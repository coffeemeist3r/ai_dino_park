import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The dry season (BACKLOG-466) — the year's grip on drinking. 461 gave the season a grip on the pantry;
 * this is its water twin: summer builds thirst faster and a summer drink doesn't hold.
 *
 * The assertions are numeric on purpose. Thirst builds at 0.005/step, so twenty steps at 1.5× is 0.15 —
 * real, and nowhere near the 0.6 threshold that shows the 💧. A spec written as "the mark appears" would
 * pass or fail for reasons that have nothing to do with the season.
 *
 * The season is landed by computing the day from SEASON_LENGTH_DAYS rather than hard-coding one, so the
 * spec survives the year changing length.
 */

type W = Record<string, any>;

const SEASON_LENGTH_DAYS = 7; // world/seasons.ts — the one constant a spec has to mirror
const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;

/** Land on the first day of a named season (hour 8, well clear of the dawn/dusk boundaries). */
const setSeason = (p: Page, season: (typeof SEASONS)[number]) =>
  p.evaluate(
    ({ idx, len }) => (window as W).__setClock(idx * len + 1, 8, 0),
    { idx: SEASONS.indexOf(season), len: SEASON_LENGTH_DAYS },
  );

const thirst = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__needs() as Record<string, { thirst: number }>)[n]?.thirst ?? 0, name);
const hunger = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__needs() as Record<string, { hunger: number }>)[n]?.hunger ?? 0, name);
const setNeed = (p: Page, name: string, which: 'hunger' | 'thirst', v: number) =>
  p.evaluate(({ name, which, v }) => (window as W).__setNeed(name, which, v), { name, which, v });
const advance = (p: Page, steps: number) => p.evaluate((s) => (window as W).__advanceNeeds(s), steps);
const place = (p: Page, name: string, x: number, y: number) =>
  p.evaluate(({ name, x, y }) => (window as W).__placeDino(name, x, y), { name, x, y });
const checkNeeds = (p: Page) => p.evaluate(() => (window as W).__checkNeeds());
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));

test('the heat is felt — thirst builds faster in the dry season than in the cold', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const run = async (season: (typeof SEASONS)[number]) => {
    await setSeason(page, season);
    await setNeed(page, 'Rex', 'thirst', 0);
    await setNeed(page, 'Rex', 'hunger', 0);
    await advance(page, 20);
    return { thirst: await thirst(page, 'Rex'), hunger: await hunger(page, 'Rex') };
  };

  const summer = await run('summer');
  const spring = await run('spring');
  const winter = await run('winter');

  expect(summer.thirst).toBeGreaterThan(spring.thirst);
  expect(spring.thirst).toBeGreaterThan(winter.thirst);
  // ...and the grip reaches drinking only: the same twenty steps left the same hunger behind.
  expect(summer.hunger).toBeCloseTo(spring.hunger, 10);
  expect(summer.hunger).toBeCloseTo(winter.hunger, 10);

  expect(errors).toEqual([]);
});

test("a summer drink doesn't hold — the waterhole slakes short of full", async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const drinkIn = async (season: (typeof SEASONS)[number]) => {
    await setSeason(page, season);
    await place(page, 'Rex', 3, 2); // the bowl's NW waterhole block (445)
    await setNeed(page, 'Rex', 'thirst', 0.9);
    await checkNeeds(page);
    return thirst(page, 'Rex');
  };

  const dry = await drinkIn('summer');
  expect(dry).toBeGreaterThan(0); // it drank, but the heat took some straight back
  expect(dry).toBeLessThan(0.9); // ...and it *did* drink

  expect(await drinkIn('spring')).toBe(0); // the hinge of the year: exactly as it was before 466
  expect(errors).toEqual([]);
});

test('the turn says so — the dry season announces itself, the hinges stay quiet', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // __setClock is a restore sync (no beat) — the turn beat rides the live hour tick, so cross the boundary
  // the way cycle-118 does: park just before midnight of the season's last day and advance the wall clock.
  const crossInto = async (season: (typeof SEASONS)[number]) => {
    await page.evaluate(
      ({ idx, len }) => (window as W).__setClock(idx * len, 23, 59),
      { idx: SEASONS.indexOf(season), len: SEASON_LENGTH_DAYS },
    );
    await page.evaluate(() => (window as W).__advanceWall(120_000)); // over midnight
  };

  await crossInto('summer');
  expect(await ticker(page)).toContain('dry season');

  await crossInto('fall'); // a hinge — nothing to say about drinking
  const log = await ticker(page);
  expect(log.split('dry season').length - 1).toBe(1); // still just the one
  expect(errors).toEqual([]);
});
