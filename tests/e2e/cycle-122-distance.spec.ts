import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Distance on the chain (BACKLOG-475) — Milestone 11's spine. The park's two migration *pulls* used to
 * compute what a dino wanted and then discard the answer when it wasn't next door, so nothing at the far
 * end of a four-long chain could ever be wanted. These prove the pull survives the distance and is answered
 * one ground at a time, and that a pull toward the ground next door is unchanged.
 */

type W = Record<string, any>;

const yearnDest = (p: Page, n: string) => p.evaluate((x) => (window as W).__yearnDest(x) as string | null, n);
const yearnTarget = (p: Page, n: string) => p.evaluate((x) => (window as W).__yearnTarget(x) as string | null, n);
const plentyDest = (p: Page, n: string) => p.evaluate((x) => (window as W).__plentyDest(x) as string | null, n);
const plentyTarget = (p: Page, n: string) => p.evaluate((x) => (window as W).__plentyTarget(x) as string | null, n);
const homeZone = (p: Page, n: string) => p.evaluate((x) => (window as W).__homeZone(x) as string, n);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const setDay = (p: Page, d: number) => p.evaluate((dd) => (window as W).__setClock(dd, 8, 0), d);
const day = (p: Page) => p.evaluate(() => (window as W).__clockNow().day as number);

/**
 * Walk Mossback out to the far end of the chain and home again, leaving each ground on a *different* day.
 * `yearnedZone` picks the ground left longest ago, so a same-day round trip would tie on every stamp and
 * the tie-break (chain order) would hand back the nearest ground — which proves nothing about distance.
 * After this the Hollow is the ground it left first, and so the one it misses most.
 */
async function walkTheChainAndBack(p: Page): Promise<void> {
  const start = await day(p);
  for (const z of ['grove', 'fernreach', 'hollow']) {
    await p.evaluate((zz) => (window as W).__migrate('Mossback', zz), z);
  }
  const back = ['fernreach', 'grove', 'bowl'];
  for (let i = 0; i < back.length; i++) {
    await setDay(p, start + 5 * (i + 1));
    await p.evaluate((zz) => (window as W).__migrate('Mossback', zz), back[i]);
  }
  await setDay(p, start + 20);
}

test('a ground three hops away can be missed, and is answered one ground at a time', async ({ page }) => {
  await boot(page);
  // The Hollow is a ground it has stood on and left first — three hops from where it now stands.
  await walkTheChainAndBack(page);

  expect(await yearnTarget(page, 'Mossback')).toBe('hollow'); // pre-475 this was simply null
  expect(await yearnDest(page, 'Mossback')).toBe('grove'); // one ground closer, not a teleport

  // step it along and the pull re-reads: the walk emerges from the same per-roll decision
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  expect(await yearnDest(page, 'Mossback')).toBe('fernreach');
  await page.evaluate(() => (window as W).__migrate('Mossback', 'fernreach'));
  expect(await yearnDest(page, 'Mossback')).toBe('hollow');
  await page.evaluate(() => (window as W).__migrate('Mossback', 'hollow'));
  expect(await yearnTarget(page, 'Mossback')).not.toBe('hollow'); // standing in it — you cannot miss it
});

test('a longing for the ground next door is unchanged', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  await setDay(page, (await day(page)) + 4);
  expect(await yearnTarget(page, 'Mossback')).toBe('bowl');
  expect(await yearnDest(page, 'Mossback')).toBe('bowl'); // the step *is* the target
});

test('the ticker names the ground it wants, not the one it steps into', async ({ page }) => {
  await boot(page);
  await walkTheChainAndBack(page);
  await page.evaluate(() => (window as W).__scarcityMigrate('Mossback'));

  const log = (await events(page)).join('\n');
  expect(log).toMatch(/💭 Mossback misses The Hollow — heads back/);
  expect(log).not.toMatch(/misses The Grove/); // the grove is the road, not the destination
});

test('word of a thriving ground two hops off now moves a body toward it', async ({ page }) => {
  await boot(page);
  // Sunny stands in the bowl and hears the Fernreach — two hops east — is thriving.
  await page.evaluate(() => (window as W).__remember('Sunny', '🌾 The Fernreach is thriving — saw it yourself'));

  expect(await plentyTarget(page, 'Sunny')).toBe('fernreach');
  expect(await plentyDest(page, 'Sunny')).toBe('grove'); // pre-475: null, and the news died in its head

  await page.evaluate(() => (window as W).__migrate('Sunny', 'grove'));
  expect(await plentyDest(page, 'Sunny')).toBe('fernreach'); // the next roll finishes the journey
});

test('hearsay about the ground next door is unchanged', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__remember('Sunny', '🌾 The Grove is thriving — saw it yourself'));
  expect(await plentyDest(page, 'Sunny')).toBe('grove');
  expect(await plentyTarget(page, 'Sunny')).toBe('grove');
});

test('every destination a crossing starts from is still a neighbour of home', async ({ page }) => {
  await boot(page);
  const NEIGHBOURS: Record<string, string[]> = {
    bowl: ['grove'],
    grove: ['bowl', 'fernreach'],
    fernreach: ['grove', 'hollow'],
    hollow: ['fernreach'],
  };
  // A dino carrying a longing for the far end must never be handed a non-adjacent destination — that would
  // fall through `startMigration`'s edge lookup to `neighbors[0]` and cross the wrong way.
  await walkTheChainAndBack(page);
  for (const stand of ['bowl', 'grove', 'fernreach']) {
    await page.evaluate((zz) => (window as W).__migrate('Mossback', zz), stand);
    const dest = await yearnDest(page, 'Mossback');
    expect(await homeZone(page, 'Mossback')).toBe(stand);
    if (dest) expect(NEIGHBOURS[stand]).toContain(dest);
  }
});

test('the demand read asks the nearest grower, not the biggest one across the park', async ({ page }) => {
  await boot(page);
  // Grow one crop in the grove (1 hop from the bowl) and four in the Hollow (3 hops).
  await page.evaluate(() => (window as W).__setHarvests({ grove: 1, hollow: 4 }));
  const map = await page.evaluate(
    () => (window as W).__zoneMap() as Array<{ id: string; want: { from: string; hops?: number } | null }>,
  );
  const bowl = map.find((z) => z.id === 'bowl')!;
  expect(bowl.want?.from).toBe('grove');
  expect(bowl.want?.hops).toBe(1);
});
