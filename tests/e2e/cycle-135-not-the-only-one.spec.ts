import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Not the only one (BACKLOG-416) — two solitary dinos ticcing in sight of each other.
 *
 * Every other beat in the ritual thread needed a channel: a sting, a friend close enough to learn from, the
 * keeper walking over. This one has none. Both dinos are at their own ritual, both are inside 407's band,
 * neither crosses, no bond is required and none moves.
 *
 * The scan is driven through `__kinTic`, which calls the very `kinTic` that `performTic` calls from its
 * invention branch (the `__watchTic` / `__noticeTraces` precedent) — the spec drives the game's path, not a
 * second one.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const memoryOf = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory()[nn] ?? []).join(' | ') as string, n);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const tic = (p: Page, n: string) =>
  p.evaluate((nn) => (window as W).__tic(nn) as { solo: number; invented: boolean } | null, n);
const echo = (p: Page, n: string) => p.evaluate((nn) => (window as W).__ticEcho(nn), n);
const kinPass = (p: Page, n: string) => p.evaluate((nn) => (window as W).__kinTic(nn) as string[], n);
/** Reads the pairwise bond via `__bondPair`'s return, adding zero — the repo has no read-only bond hook. */
const bondOf = (p: Page, a: string, b: string) =>
  p.evaluate(([aa, bb]) => (window as W).__bondPair(aa, bb, 0) as number, [a, b]);

const PHRASE = 'not the only one out here';

/** Put a pair in one zone at a chosen separation with everyone else parked out of the band. */
async function stage(page: Page, gap: number) {
  const names = await roster(page);
  const [a, b, ...rest] = names;
  await page.evaluate(
    ({ a, b, rest, gap }) => {
      const w = window as W;
      w.__placeDino(a, 3, 6);
      w.__placeDino(b, 3 + gap, 6);
      rest.forEach((n: string, i: number) => w.__placeDino(n, 1 + i, 1));
      w.__bondPair(a, b, 0); // no bond added — 416 asks for none, and the pair stays whatever they were
    },
    { a, b, rest, gap },
  );
  return { a, b, rest };
}

/** Both dinos mid-ritual, without waiting out two 20-step solitary stretches. */
async function bothTiccing(page: Page, a: string, b: string) {
  await page.evaluate(([aa, bb]) => {
    const w = window as W;
    w.__inventTic(aa);
    w.__inventTic(bb);
  }, [a, b]);
}

test('two loners in sight of each other are each less alone for it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { a, b } = await stage(page, 5); // inside the band (3 < 5 <= 8)
  await bothTiccing(page, a, b);
  expect(await kinPass(page, a)).toEqual([b]);

  // Both file, not just the one whose ritual formed second.
  expect(await memoryOf(page, a)).toContain(PHRASE);
  expect(await memoryOf(page, a)).toContain(b);
  expect(await memoryOf(page, b)).toContain(PHRASE);
  expect(await memoryOf(page, b)).toContain(a);

  const log = await ticker(page);
  expect(log).toContain('keep to their own rituals, in sight of each other');
  expect(log).toContain(a);
  expect(log).toContain(b);

  expect(errors).toEqual([]);
});

test('no bond is required, and none is moved', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { a, b } = await stage(page, 5);
  const before = await bondOf(page, a, b);
  expect(before).toBeLessThan(8); // under ECHO_BOND_FLOOR — 407 would refuse this pair, and 416 does not

  await bothTiccing(page, a, b);
  await kinPass(page, a);

  expect(await memoryOf(page, a)).toContain(PHRASE);
  expect(await bondOf(page, a, b)).toBe(before); // ...and nothing about them has changed

  expect(errors).toEqual([]);
});

test('company is not kinship — inside company range there is no ritual to share', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { a, b } = await stage(page, 2); // inside TIC_COMPANY_RANGE
  await bothTiccing(page, a, b); // forced, so the band gate is what has to hold
  expect(await kinPass(page, a)).toEqual([]);

  expect(await memoryOf(page, a)).not.toContain(PHRASE);
  expect(await memoryOf(page, b)).not.toContain(PHRASE);

  expect(errors).toEqual([]);
});

test('out of sight is out of mind', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { a, b } = await stage(page, 10); // past ECHO_WATCH_RANGE
  await bothTiccing(page, a, b);
  expect(await kinPass(page, a)).toEqual([]);

  expect(await memoryOf(page, a)).not.toContain(PHRASE);
  expect(await memoryOf(page, b)).not.toContain(PHRASE);

  expect(errors).toEqual([]);
});

test('filed once per solitary stretch, however long the two stand there', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { a, b } = await stage(page, 5);
  await bothTiccing(page, a, b);
  for (let i = 0; i < 4; i++) await kinPass(page, a);

  for (const n of [a, b]) {
    const ring = await memoryOf(page, n);
    expect(ring.split(PHRASE).length - 1).toBe(1);
  }

  expect(errors).toEqual([]);
});

test('neither ritual is interrupted, and 407’s tallies are untouched', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { a, b } = await stage(page, 5);
  await bothTiccing(page, a, b);
  await kinPass(page, a);

  // Still ticcing — the beat is wordless and does not break a solitude.
  expect((await tic(page, a))?.invented).toBe(true);
  expect((await tic(page, b))?.invented).toBe(true);
  // ...and nobody picked anybody's ritual up: 416 reads the band, it does not teach through it.
  expect(await echo(page, a)).toBeNull();
  expect(await echo(page, b)).toBeNull();

  expect(errors).toEqual([]);
});
