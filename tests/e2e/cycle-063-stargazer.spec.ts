import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Stargazer's awe varies by temperament (BACKLOG-150). The cycle-36 sky event pulled every dino onto
 * the same tile; now each presses in only to its own gaze ring — bold/curious crowd under it (ring 0),
 * timid ones halt at the cluster's edge (ring 2). Pure logic, so it drives headless via the dev hooks.
 */

type W = Record<string, any>;
const GATHER = { tileX: 10, tileY: 7 }; // SKY_GATHER_TILE
const cheby = (r: { tileX: number; tileY: number }) =>
  Math.max(Math.abs(r.tileX - GATHER.tileX), Math.abs(r.tileY - GATHER.tileY));

const advance = (page: import('@playwright/test').Page, n: number) =>
  page.evaluate((m) => (window as W).__advanceMinutes(m) as { hour: number }, n);
const stepWorld = (page: import('@playwright/test').Page) => page.evaluate(() => (window as W).__stepWorld());
const skyGazers = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__skyGazers() as string[]);
const skyRings = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__skyRings() as { name: string; ring: number; tileX: number; tileY: number }[]);
const dinoCount = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__dinoCount() as number);

async function toNight(page: import('@playwright/test').Page) {
  const t = await advance(page, 14 * 60); // 08:00 → 22:00
  expect(t.hour).toBe(22);
}

test('rings span the roster — bold pull in, timid hang back', async ({ page }) => {
  await boot(page);
  const rings = await skyRings(page);
  const values = rings.map((r) => r.ring);
  // The seeded roster is diverse enough to produce a spread (not everyone on the same ring).
  expect(Math.min(...values)).toBeLessThanOrEqual(1); // at least one presses in
  expect(Math.max(...values)).toBe(2); // at least one hangs back at the edge
  for (const r of values) expect(r).toBeGreaterThanOrEqual(0), expect(r).toBeLessThanOrEqual(2);
});

test('every dino gathers but each settles at its own ring', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await toNight(page);
  await page.evaluate(() => (window as W).__triggerSky('meteors'));

  for (let i = 0; i < 25; i++) await stepWorld(page);

  // Everyone watches (the timid from the edge), so the gazer count still equals the cast.
  expect((await skyGazers(page)).length).toBe(await dinoCount(page));

  const rings = await skyRings(page);
  // Core invariant: no dino sits beyond its ring — it halts as it reaches its viewing distance.
  for (const r of rings) expect(cheby(r)).toBeLessThanOrEqual(r.ring);

  // The cluster visibly spreads by temperament: the farthest watcher sits exactly at the outer ring,
  // and the boldest presses onto the gather tile (cheby 0).
  const maxCheby = Math.max(...rings.map(cheby));
  expect(maxCheby).toBe(Math.max(...rings.map((r) => r.ring)));
  expect(rings.some((r) => cheby(r) === 0)).toBe(true);
  expect(errors).toEqual([]);
});
