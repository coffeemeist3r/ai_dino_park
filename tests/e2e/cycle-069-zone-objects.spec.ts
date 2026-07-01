import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Zone-scoped world objects (BACKLOG-308). Resources, cairns, and the plot belong to a home zone and
 * draw + interact only there, so the grove's own floor (294) isn't overlaid with bowl-built props seen
 * through the zone switch. 274 gated which *dino* is interactable; 308 gates where *objects* live.
 */

type W = Record<string, any>;

const objVisible = (p: Page) => p.evaluate(() => (window as W).__objVisible());
const resource = (p: Page) => p.evaluate(() => (window as W).__resource());
const setZone = (p: Page, id: string) => p.evaluate((z) => (window as W).__setZone(z), id);
const spawn = (p: Page) =>
  p.evaluate(() => (window as W).__spawnResource('branch', 5, 5, true));

test('a resource dropped in the bowl belongs to the bowl and hides in the grove (BACKLOG-308)', async ({
  page,
}) => {
  await boot(page);

  await spawn(page);
  expect((await resource(page)).zone).toBe('bowl');
  expect((await objVisible(page)).resource).toBe(true);

  // Cross to the grove: the bowl resource is still in play but no longer drawn.
  await setZone(page, 'grove');
  expect((await resource(page)).zone).toBe('bowl');
  expect((await objVisible(page)).resource).toBe(false);

  // Back in the bowl, it's visible again.
  await setZone(page, 'bowl');
  expect((await objVisible(page)).resource).toBe(true);
});

test("each zone's plot draws only in its own zone (BACKLOG-308/349)", async ({ page }) => {
  await boot(page);

  // In the bowl: the bowl plot is drawn, the grove plot (349) is hidden.
  let v = await objVisible(page);
  expect(v.plotByZone.bowl).toBe(true);
  expect(v.plotByZone.grove).toBe(false);

  // Cross to the grove: now the grove's own plot draws and the bowl's is hidden.
  await setZone(page, 'grove');
  v = await objVisible(page);
  expect(v.plotByZone.grove).toBe(true);
  expect(v.plotByZone.bowl).toBe(false);

  // Back in the bowl, the bowl plot is visible again.
  await setZone(page, 'bowl');
  v = await objVisible(page);
  expect(v.plotByZone.bowl).toBe(true);
  expect(v.plotByZone.grove).toBe(false);
});

test('a resource is gatherable only in its own zone (BACKLOG-308)', async ({ page }) => {
  const TILE = 32;
  await boot(page);

  // Migrate a dino into the grove and make it curious enough to lock onto a resource (the `gathering`
  // branch), so it stays glued within reach every step. Without this the dino wanders and the 3s
  // background step timer can drift it >1 tile off before the pickup — a ~30% flake (reachedFood is ≤1).
  const name = (await page.evaluate(() => (window as W).__dinoPositions()))[0].name as string;
  await page.evaluate((n) => (window as W).__migrate(n, 'grove'), name);
  await page.evaluate((n) => (window as W).__setTrait(n, 'curiosity', 1), name);

  // Spawn the grove resource on the dino's tile while the view stays in the bowl, so no background step
  // can gather it before the deliberate cross-and-gather below.
  const pos = (await page.evaluate(() => (window as W).__dinoPositions())).find(
    (d: { name: string }) => d.name === name,
  );
  await page.evaluate(
    ({ tx, ty }) => (window as W).__spawnResource('branch', tx, ty, false, 'grove'),
    { tx: Math.floor(pos.x / TILE), ty: Math.floor(pos.y / TILE) },
  );
  expect((await resource(page)).zone).toBe('grove');

  // From the bowl, the grove resource must NOT be gathered (zone mismatch gates checkGather).
  await page.evaluate(() => (window as W).__stepWorld());
  expect(await resource(page)).not.toBeNull();

  // Back in the grove, the curious grove dino is on/beside it and picks it up. Assert via the gather
  // tally (not the resource slot): ambient spawns can drop a *bowl* resource meanwhile, which the
  // __resource() cross-zone fallback would surface — the tally rising proves the grove pickup directly.
  const before = (await page.evaluate((n) => (window as W).__gathered()[n] ?? 0, name)) as number;
  await setZone(page, 'grove');
  await page.evaluate(() => (window as W).__stepWorld());
  const after = (await page.evaluate((n) => (window as W).__gathered()[n] ?? 0, name)) as number;
  expect(after).toBeGreaterThan(before);
});
