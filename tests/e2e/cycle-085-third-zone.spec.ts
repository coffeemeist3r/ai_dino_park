import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Third zone spine (BACKLOG-378). The Fernreach sits east of the grove — the first zone reachable only
 * *through* another. The keeper walks grove→Fernreach→grove; a dino migrates east into the Fernreach
 * (migration generalized past the single primary neighbour); the plaque tally shows all three zones.
 * Grid: 20×15 tiles of 32px (W = 640).
 */

type W = Record<string, any>;
const W_PX = 640;

const zone = (p: Page) => p.evaluate(() => (window as W).__zone() as string);
const plaque = (p: Page) => p.evaluate(() => (window as W).__plaque() as { zone: string; zoneTally: string });
const visible = (p: Page) => p.evaluate(() => (window as W).__visibleDinos() as string[]);
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const xOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__dinoPositions() as { name: string; x: number }[]).find((d) => d.name === n)!.x, name);

test('the keeper walks grove → Fernreach → grove off the grove east edge', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  // Stand the keeper in the grove, then step off its east edge → into the Fernreach (the third zone).
  // Set the player past the edge and cross in ONE evaluate so the update loop can't clamp it back first.
  await page.evaluate(() => (window as W).__setZone('grove'));
  const crossedEast = await page.evaluate((w) => {
    (window as W).__setPlayer(w, 240); // past the east edge
    return (window as W).__tryCross() as boolean;
  }, W_PX);
  expect(crossedEast).toBe(true);
  expect(await zone(page)).toBe('fernreach');
  expect((await plaque(page)).zone).toBe('The Fernreach');

  // Step off the Fernreach's west edge → back into the grove.
  const crossedWest = await page.evaluate(() => {
    (window as W).__setPlayer(0, 240); // past the west edge
    return (window as W).__tryCross() as boolean;
  });
  expect(crossedWest).toBe(true);
  expect(await zone(page)).toBe('grove');
  expect(errors).toEqual([]);
});

test('a grove dino migrates EAST into the Fernreach — migration generalized past two', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  // Put Rex in the grove and watch from the grove so its walk is in view.
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await visible(page)).toContain('Rex');

  // Begin a deterministic crossing toward the Fernreach (not the grove's primary neighbour, the bowl).
  await page.evaluate(() => (window as W).__startMigrationTo('Rex', 'fernreach'));
  expect(await migrating(page)).toContain('Rex');

  // It walks east to the grove's edge and crosses — not a teleport.
  let crossed = false;
  for (let i = 0; i < 30; i++) {
    await step(page);
    if (!(await migrating(page)).includes('Rex')) {
      crossed = true;
      break;
    }
  }
  expect(crossed).toBe(true);

  // Home flipped to the Fernreach: gone from the grove view, present + near the west entry once we look there.
  expect(await visible(page)).not.toContain('Rex');
  await page.evaluate(() => (window as W).__setZone('fernreach'));
  expect(await visible(page)).toContain('Rex');
  expect(await xOf(page, 'Rex')).toBeLessThan(96); // col 1 ≈ 48px — the Fernreach's west entry, not a random tile

  expect(errors).toEqual([]);
});

test('the plaque tally lists all three zones', async ({ page }) => {
  await boot(page);
  const tally = (await plaque(page)).zoneTally;
  expect(tally).toContain('Pocket Cretaceous');
  expect(tally).toContain('The Grove');
  expect(tally).toContain('The Fernreach');
});
