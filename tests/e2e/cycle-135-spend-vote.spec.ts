import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The other call goes to the council (BACKLOG-487) — Milestone 14's last arc.
 *
 * 481 handed the ground's *labour* call to its seats and left the *pantry* call with the provider on purpose,
 * as a live control. This retires the control. What is asserted is the production read — `__spendPriority(zone)`
 * is the same call `feedReserve` (444) and `granaryDeferredForFeeding` (454) consult — and never a
 * re-derivation of the vote inside the spec.
 *
 * The default five-dino park is bit-identical after this change (a council of one is the provider, and
 * `councilSeats` needs six residents for a second seat), which is why the interesting cases deliberately grow
 * a ground first — the cycle-129 `seatThree` pattern, lifted.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const councils = (p: Page) => p.evaluate(() => (window as W).__councils() as Record<string, string[]>);
const zoneOfDino = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homeZone(nn) as string, n);
const votes = (p: Page, z: string) =>
  p.evaluate(
    (zz) =>
      (window as W).__councilVotes(zz) as {
        seats: string[];
        call: string | null;
        spendVotes: string[];
        spendTieBreak: string | null;
        spendCall: string | null;
      },
    z,
  );
const spend = (p: Page, z: string) => p.evaluate((zz) => (window as W).__spendPriority(zz), z);
const work = (p: Page, z: string) => p.evaluate((zz) => (window as W).__workPriority(zz), z);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const bank = (p: Page, n: string, k: number) => p.evaluate(([nn, kk]) => (window as W).__creditBank(nn, kk), [n, k]);
const warmth = (p: Page, n: string, v: number) =>
  p.evaluate(([nn, vv]) => (window as W).__setTrait(nn, 'agreeableness', vv), [n, v]);

test('a fresh park has decided nothing — the whole feature is inert until somebody banks', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const seats = await councils(page);
  expect(Object.values(seats).every((s) => s.length === 0)).toBe(true);

  const [first] = await roster(page);
  const zone = await zoneOfDino(page, first);
  expect(await spend(page, zone)).toBeNull(); // no council, no provider, no policy — exactly as before 487

  await step(page);
  expect(await ticker(page)).not.toContain('council calls it');
  expect(errors).toEqual([]);
});

/** Six residents seat three voices (479's one-per-two-heads rule, capped at three); the park starts with five. */
async function seatThree(page: Page): Promise<{ zone: string; seats: string[] }> {
  const names = await roster(page);
  await page.evaluate(([a, b]) => (window as W).__layEgg(a, b), [names[0], names[1]]);
  await page.evaluate(() => (window as W).__forceHatch());
  const grown = await roster(page);
  const zone = await zoneOfDino(page, grown[0]);
  const here: string[] = [];
  for (const n of grown) if ((await zoneOfDino(page, n)) === zone) here.push(n);
  expect(here.length).toBeGreaterThanOrEqual(6);
  await bank(page, here[0], 6);
  await bank(page, here[1], 4);
  await bank(page, here[2], 2);
  return { zone, seats: here.slice(0, 3) };
}

test('the majority carries the pantry, over its own top banker', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { zone, seats } = await seatThree(page);
  await warmth(page, seats[0], 0.9); // the top banker — and the provider — would feed its own first
  await warmth(page, seats[1], 0.1); // outvoted by two who would bank toward plenty
  await warmth(page, seats[2], 0.1);

  const v = await votes(page, zone);
  expect(v.seats).toEqual(seats); // most-banked first (479's order)
  expect(v.spendVotes).toEqual(['feed', 'bank', 'bank']);
  expect(v.spendTieBreak).toBe('feed'); // the provider would have said otherwise...
  expect(v.spendCall).toBe('bank'); // ...and is outvoted, on the older and more player-visible call
  expect(await spend(page, zone)).toBe('bank'); // the two spend hooks read the same answer

  expect(errors).toEqual([]);
});

test('a council of one is still that one dino — the compatibility control', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // One banker only: `zoneCouncil` seats it alone, and its comparator is byte-identical to `zoneProvider`'s,
  // so the seat and the say are the same dino and the answer must be exactly the pre-487 provider rule.
  const names = await roster(page);
  const zone = await zoneOfDino(page, names[0]);
  const here: string[] = [];
  for (const n of names) if ((await zoneOfDino(page, n)) === zone) here.push(n);
  await bank(page, here[0], 6);

  await warmth(page, here[0], 0.9);
  expect(await spend(page, zone)).toBe('feed');
  await warmth(page, here[0], 0.1);
  expect(await spend(page, zone)).toBe('bank');

  expect(errors).toEqual([]);
});

test('a flipped pantry call is announced once, in the legend’s own words', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { zone, seats } = await seatThree(page);
  for (const n of seats) await warmth(page, n, 0.9); // a unanimously feed-minded council
  await step(page); // the first call a ground records is not a turnover — recorded silently
  expect(await ticker(page)).not.toContain('banks toward plenty');
  expect(await spend(page, zone)).toBe('feed');

  // Two members change their minds; the ground's pantry call turns over.
  await warmth(page, seats[0], 0.1);
  await warmth(page, seats[1], 0.1);
  await step(page);

  const line = 'council calls it: banks toward plenty';
  const log = await ticker(page);
  expect(log).toContain(line);
  expect(log.split(line).length - 1).toBe(1);
  expect(await spend(page, zone)).toBe('bank');

  // Nothing changed this step, so nothing is said.
  await step(page);
  expect((await ticker(page)).split(line).length - 1).toBe(1);

  expect(errors).toEqual([]);
});

test('the labour call is untouched — 481 still decides its own half', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { zone, seats } = await seatThree(page);
  // Warmth decides the pantry; energy decides the labour. Set them in opposition to prove the generic
  // did not accidentally couple the two calls to one axis.
  for (const n of seats) await warmth(page, n, 0.9); // unanimously feed
  for (const n of seats) {
    await page.evaluate(([nn]) => (window as W).__setTrait(nn, 'energy', 0.1), [n]); // unanimously gather
  }

  expect(await spend(page, zone)).toBe('feed');
  expect(await work(page, zone)).toBe('gather');

  expect(errors).toEqual([]);
});
