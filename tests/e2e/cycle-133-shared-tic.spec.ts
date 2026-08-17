import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * A ritual that spreads (BACKLOG-407) — the first behaviour in this park's life to travel sideways between
 * two living dinos. A close friend watching from the band (further than company range, so it did not break
 * the solitude, and no further than 8 tiles) picks the ritual up after three of the performer's solitary
 * stretches.
 *
 * The watch scan is driven through `__watchTic`, which calls the very `watchTic` that `performTic` calls
 * from its invention branch (the `__noticeTraces` precedent) — the spec drives the game's path, not a
 * second one. `__ticEcho` is the production read every tic reader goes through.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const echo = (p: Page, n: string) =>
  p.evaluate(
    (nn) => (window as W).__ticEcho(nn) as { axis: string; tic: { glyph: string; label: string } } | null,
    n,
  );
const watches = (p: Page, a: string, b: string) =>
  p.evaluate(([aa, bb]) => (window as W).__ticWatches(aa, bb) as number, [a, b]);
const watchPass = (p: Page, n: string) =>
  p.evaluate((nn) => (window as W).__watchTic(nn) as Array<{ name: string; watches: number; echoed: boolean }>, n);
const tic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tic(nn), n);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const memoryOf = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory()[nn] ?? []).join(' | ') as string, n);

/** Put the pair in one zone at a chosen separation, bonded (or not), with everyone else out of the way. */
async function stage(page: Page, gap: number, bond: number) {
  const names = await roster(page);
  const [performer, watcher, ...rest] = names;
  await page.evaluate(
    ({ performer, watcher, rest, gap, bond }) => {
      const w = window as W;
      w.__placeDino(performer, 4, 6);
      w.__placeDino(watcher, 4 + gap, 6);
      rest.forEach((n: string, i: number) => w.__placeDino(n, 1 + i, 1));
      w.__bondPair(performer, watcher, bond);
    },
    { performer, watcher, rest, gap, bond },
  );
  return { performer, watcher, rest };
}

/** Three of the performer's solitary stretches, each seen once by whoever is in the band. */
async function threeRituals(page: Page, performer: string) {
  for (let i = 0; i < 3; i++) await watchPass(page, performer);
}

test('a fresh park has picked nothing up — every dino performs the ritual it was born with', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  for (const n of await roster(page)) expect(await echo(page, n)).toBeNull();
  expect(errors).toEqual([]);
});

test('a close friend watching from the band picks the ritual up on the third stretch', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { performer, watcher } = await stage(page, 5, 50);
  const theirs = (await tic(page, performer)).tic as { glyph: string; label: string };

  // Two stretches build the tally and nothing else — the beat is not fired early.
  for (let i = 0; i < 2; i++) await watchPass(page, performer);
  expect(await watches(page, watcher, performer)).toBe(2);
  expect(await echo(page, watcher)).toBeNull();

  const pass = await watchPass(page, performer);
  expect(pass.find((r) => r.name === watcher)?.echoed).toBe(true);
  expect(await watches(page, watcher, performer)).toBe(3);

  // It performs the friend's ritual now — the same mark the friend floats.
  const picked = await echo(page, watcher);
  expect(picked).not.toBeNull();
  expect(picked!.tic.glyph).toBe(theirs.glyph);
  expect(picked!.tic.label).toContain(theirs.label);
  expect(picked!.tic.label).not.toBe(theirs.label); // it reads as borrowed

  // Every reader goes through the same place: the tic dev hook reports the picked-up ritual, not the native one.
  expect(((await tic(page, watcher)).tic as { glyph: string }).glyph).toBe(theirs.glyph);

  // And it is legible to the player and in the dino's own memory.
  expect(await ticker(page)).toContain(`${watcher} has picked up ${performer}'s little ritual`);
  const mem = await memoryOf(page, watcher);
  expect(mem).toContain(performer);
  expect(mem).toContain('caught it off');

  expect(errors).toEqual([]);
});

test('too close is not watching — a dino inside company range learns nothing (it would have broken the ritual)', async ({
  page,
}) => {
  await boot(page);
  const { performer, watcher } = await stage(page, 2, 50);
  await threeRituals(page, performer);
  expect(await watches(page, watcher, performer)).toBe(0);
  expect(await echo(page, watcher)).toBeNull();
});

test('too far is not watching either — the band has an outer edge', async ({ page }) => {
  await boot(page);
  const { performer, watcher } = await stage(page, 12, 50);
  await threeRituals(page, performer);
  expect(await watches(page, watcher, performer)).toBe(0);
  expect(await echo(page, watcher)).toBeNull();
});

test('a near-stranger does not pick it up, however often it watches', async ({ page }) => {
  await boot(page);
  const { performer, watcher } = await stage(page, 5, 2); // below the close-friend floor
  await threeRituals(page, performer);
  expect(await echo(page, watcher)).toBeNull();
});

test('one echo per dino — a ritual already picked up is not overwritten by a second friend', async ({ page }) => {
  await boot(page);
  const names = await roster(page);
  const [first, watcher, second] = names;

  await stage(page, 5, 50);
  await threeRituals(page, first);
  const picked = await echo(page, watcher);
  expect(picked).not.toBeNull();

  // A second bonded friend performs its own ritual in the band, three times over.
  await page.evaluate(
    ({ second, watcher }) => {
      const w = window as W;
      w.__placeDino(second, 4, 6);
      w.__placeDino(watcher, 9, 6);
      w.__bondPair(second, watcher, 50);
    },
    { second, watcher },
  );
  await threeRituals(page, second);

  expect((await echo(page, watcher))!.axis).toBe(picked!.axis);
  expect(await watches(page, watcher, second)).toBe(0); // it stopped counting once it had a ritual
});

test('the ritual survives a reload — a learned habit is a fact about who you are', async ({ page }) => {
  await boot(page);
  const { performer, watcher } = await stage(page, 5, 50);
  await threeRituals(page, performer);
  const picked = await echo(page, watcher);
  expect(picked).not.toBeNull();

  await page.evaluate(() => (window as W).__flushSave());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction((n) => {
    const f = (window as W).__ticEcho as undefined | ((x: string) => unknown);
    return !!f && f(n) !== null;
  }, watcher, { timeout: 8_000 });

  const after = await echo(page, watcher);
  expect(after).not.toBeNull();
  expect(after!.axis).toBe(picked!.axis);
  expect(after!.tic.glyph).toBe(picked!.tic.glyph);
});
