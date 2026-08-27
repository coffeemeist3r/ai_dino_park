import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The branch gets a stake (BACKLOG-503).
 *
 * The Ridge is the only ground in this park a player reaches by *deciding* to rather than by continuing to
 * walk east, and until this cycle it grew what the line grew and banked what the line banked. Now the black
 * glass falls there and nowhere else, the Ridge raises a landmark made of it, and a ground that has none
 * sends somebody up for it.
 *
 * CHARTER v7: every assertion here goes through the production bundle's own hooks, so what is proved is
 * what a player standing on that ground would see fall.
 */

type W = Record<string, any>;

const biasKind = (p: Page, zone: string, r: number) =>
  p.evaluate(([z, rr]) => (window as W).__biasKind(z, rr) as string, [zone, r] as [string, number]);
const zoneStructure = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__zoneStructure(z) as string, zone);
const quarryDest = (p: Page, name: string) =>
  p.evaluate((n) => (window as W).__quarryDest(n) as string | null, name);
const setZonePile = (p: Page, zone: string, pile: Record<string, number>) =>
  p.evaluate(([z, pp]) => (window as W).__setZonePile(z, pp), [zone, pile] as [string, Record<string, number>]);
const dinoNames = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const beacons = (p: Page) => p.evaluate(() => (window as W).__beacons() as unknown[]);
const scarcityDest = (p: Page, name: string) =>
  p.evaluate((n) => (window as W).__scarcityDest(n) as string | null, name);

// The whole stream, not a convenient midpoint: 0.75 is exactly where the pre-503 lean flips.
const RANDS = [0, 0.25, 0.5, 0.74, 0.75, 0.9, 0.999];
const OTHER_GROUNDS = ['bowl', 'grove', 'fernreach', 'hollow'];

test('the black glass falls on the Ridge and on no other ground', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  for (const r of RANDS) expect(await biasKind(page, 'ridge', r)).toBe('obsidian');

  for (const ground of OTHER_GROUNDS) {
    for (const r of RANDS) expect(await biasKind(page, ground, r)).not.toBe('obsidian');
  }

  expect(errors).toEqual([]);
});

test('the Ridge rolls nothing but obsidian — an exclusivity, not a lean', async ({ page }) => {
  await boot(page);

  const rolled = new Set<string>();
  for (const r of RANDS) rolled.add(await biasKind(page, 'ridge', r));
  expect([...rolled]).toEqual(['obsidian']);

  // The three biased grounds still turn up their off-kind past BIAS_WEIGHT — a lean is still a lean.
  expect(await biasKind(page, 'bowl', 0.9)).not.toBe(await biasKind(page, 'bowl', 0));
});

test('the Ridge raises a beacon, and it is the only ground that does', async ({ page }) => {
  await boot(page);

  expect(await zoneStructure(page, 'ridge')).toBe('beacon');
  expect(await zoneStructure(page, 'bowl')).toBe('cairn');
  expect(await zoneStructure(page, 'grove')).toBe('shelter');
  expect(await zoneStructure(page, 'fernreach')).toBe('thatch');

  // A fresh park has raised none yet — the beacon is something the Ridge earns, not something it ships with.
  expect(await beacons(page)).toEqual([]);
});

test('a ground with no black glass sends somebody up for it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [who] = await dinoNames(page);

  // A fresh bowl holds nothing at all, let alone obsidian: the errand is live from the first frame.
  const hop = await quarryDest(page, who);
  expect(hop).not.toBeNull();
  expect(hop).toBe('grove'); // the first step of the walk — the Ridge hangs north off the Grove

  // One shard in the ground's pile and the errand is over. Nobody climbs for what is already home.
  await setZonePile(page, 'bowl', { obsidian: 1 });
  expect(await quarryDest(page, who)).toBeNull();

  // A pile full of everything else is not a substitute — this is the point of an exclusive resource.
  await setZonePile(page, 'bowl', { branch: 8, stone: 8, frond: 8 });
  expect(await quarryDest(page, who)).toBe('grove');

  expect(errors).toEqual([]);
});

test('a neighbour that is genuinely better off still outranks the errand', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The Grove is the only ground with a real choice to make: bowl to the west, Fernreach to the east, and
  // the Ridge north. It is where this ordering can actually be observed.
  const [who] = await dinoNames(page);
  await page.evaluate((n) => (window as W).__migrate(n, 'grove'), who);

  // Nothing pulling: the Grove is comfortably the best-off ground of the four, and it holds no black glass,
  // so the walk may as well fetch some. Every kind but the one it cannot have.
  await setZonePile(page, 'grove', { branch: 6, stone: 6 });
  await setZonePile(page, 'fernreach', {});
  await setZonePile(page, 'bowl', {});
  await setZonePile(page, 'ridge', {});
  expect(await quarryDest(page, who)).toBe('ridge');
  expect(await scarcityDest(page, who)).toBe('ridge');

  // Now make the Fernreach genuinely better off. Mouths still move toward plenty — 450's whole claim — and
  // the errand waits. Putting the errand *above* this read instead made every migration an errand and took
  // the scarcity system dormant, which is CHARTER v7's corollary arrived at from the other side.
  await setZonePile(page, 'fernreach', { branch: 8, stone: 8, frond: 8 });
  expect(await quarryDest(page, who)).toBe('ridge'); // the errand is still *live*
  expect(await scarcityDest(page, who)).toBe('fernreach'); // it is simply not what wins

  // Take the plenty away again and the errand is what is left.
  await setZonePile(page, 'fernreach', {});
  await setZonePile(page, 'grove', { branch: 6, stone: 6 });
  expect(await scarcityDest(page, who)).toBe('ridge');

  expect(errors).toEqual([]);
});
