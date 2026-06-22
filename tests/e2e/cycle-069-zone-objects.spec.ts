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

test('the plot draws in the bowl only (BACKLOG-308)', async ({ page }) => {
  await boot(page);

  expect((await objVisible(page)).plot).toBe(true);
  await setZone(page, 'grove');
  expect((await objVisible(page)).plot).toBe(false);
  await setZone(page, 'bowl');
  expect((await objVisible(page)).plot).toBe(true);
});

test('a resource is gatherable only in its own zone (BACKLOG-308)', async ({ page }) => {
  const TILE = 32;
  await boot(page);

  // Migrate a dino into the grove, then spawn a grove resource right on it.
  const name = (await page.evaluate(() => (window as W).__dinoPositions()))[0].name as string;
  await page.evaluate((n) => (window as W).__migrate(n, 'grove'), name);
  await setZone(page, 'grove');
  const pos = (await page.evaluate(() => (window as W).__dinoPositions())).find(
    (d: { name: string }) => d.name === name,
  );
  await page.evaluate(
    ({ tx, ty }) => (window as W).__spawnResource('branch', tx, ty),
    { tx: Math.floor(pos.x / TILE), ty: Math.floor(pos.y / TILE) },
  );
  expect((await resource(page)).zone).toBe('grove');

  // From the bowl, the grove resource must NOT be gathered (zone mismatch gates checkGather).
  await setZone(page, 'bowl');
  await page.evaluate(() => (window as W).__stepWorld());
  expect(await resource(page)).not.toBeNull();

  // Back in the grove, the grove dino picks it up.
  await setZone(page, 'grove');
  await page.evaluate(() => (window as W).__stepWorld());
  expect(await resource(page)).toBeNull();
});
