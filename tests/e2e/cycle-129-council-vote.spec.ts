import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The council actually decides (BACKLOG-481 / BACKLOG-031). 479 seated the deciders; this is the first
 * thing in this park's life they decide. What is asserted is the production read — `__workPriority(zone)`
 * is the same call the landmark defer, the granary gate and the regrowth multiplier consult — and not a
 * re-derivation of the vote in the spec.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const councils = (p: Page) => p.evaluate(() => (window as W).__councils() as Record<string, string[]>);
const zoneOfDino = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homeZone(nn) as string, n);
const votes = (p: Page, z: string) => p.evaluate((zz) => (window as W).__councilVotes(zz), z);
const call = (p: Page, z: string) => p.evaluate((zz) => (window as W).__workPriority(zz), z);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const bank = (p: Page, n: string, k: number) => p.evaluate(([nn, kk]) => (window as W).__creditBank(nn, kk), [n, k]);
const energy = (p: Page, n: string, v: number) =>
  p.evaluate(([nn, vv]) => (window as W).__setTrait(nn, 'energy', vv), [n, v]);

test('a fresh park holds no vote — the whole feature is inert until somebody banks', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const seats = await councils(page);
  expect(Object.values(seats).every((s) => s.length === 0)).toBe(true);

  const [first] = await roster(page);
  const zone = await zoneOfDino(page, first);
  expect((await votes(page, zone)).seats).toEqual([]);
  expect(await call(page, zone)).toBeNull(); // no council, no provider, no policy — exactly as before 481

  await step(page);
  expect(await ticker(page)).not.toContain('council calls it');
  expect(errors).toEqual([]);
});

/**
 * Six residents seat three voices (479's one-per-two-heads rule, capped at three). The park starts with
 * five, so the sixth is hatched — the same path the game itself grows on.
 */
async function seatThree(page: Page): Promise<{ zone: string; seats: string[] }> {
  const names = await roster(page);
  await page.evaluate(([a, b]) => (window as W).__layEgg(a, b), [names[0], names[1]]);
  await page.evaluate(() => (window as W).__forceHatch());
  const grown = await roster(page);
  const zone = await zoneOfDino(page, grown[0]);
  const here: string[] = [];
  for (const n of grown) if ((await zoneOfDino(page, n)) === zone) here.push(n);
  expect(here.length).toBeGreaterThanOrEqual(6); // ...so the ground seats the full three
  // Bank three of them, most first, so the seating order is known.
  await bank(page, here[0], 6);
  await bank(page, here[1], 4);
  await bank(page, here[2], 2);
  return { zone, seats: here.slice(0, 3) };
}

test('the majority carries the ground, over its own top banker', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { zone, seats } = await seatThree(page);
  await energy(page, seats[0], 0.9); // the top banker — and the provider — wants the walls up
  await energy(page, seats[1], 0.1); // outvoted by the two who want the stores filled
  await energy(page, seats[2], 0.1);

  const v = await votes(page, zone);
  expect(v.seats).toEqual(seats); // most-banked first (479's order)
  expect(v.votes).toEqual(['build', 'gather', 'gather']);
  expect(v.tieBreak).toBe('build'); // the provider would have said otherwise...
  expect(v.call).toBe('gather'); // ...and is outvoted, which is the whole item
  expect(await call(page, zone)).toBe('gather'); // the hooks read the same answer

  expect(errors).toEqual([]);
});

test('a flipped vote is announced once, in the legend’s own words', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { zone, seats } = await seatThree(page);
  for (const n of seats) await energy(page, n, 0.1); // a unanimously gather-minded council
  await step(page); // the first seating is not a turnover — it is recorded silently
  expect(await ticker(page)).not.toContain('council calls it');
  expect(await call(page, zone)).toBe('gather');

  // Two members change their minds; the ground's call turns over.
  await energy(page, seats[0], 0.9);
  await energy(page, seats[1], 0.9);
  await step(page);

  const line = 'council calls it: raises its walls first';
  const log = await ticker(page);
  expect(log).toContain(line);
  expect(log.split(line).length - 1).toBe(1);
  expect(await call(page, zone)).toBe('build');

  // Nothing changed this step, so nothing is said.
  await step(page);
  expect((await ticker(page)).split(line).length - 1).toBe(1);

  expect(errors).toEqual([]);
});
