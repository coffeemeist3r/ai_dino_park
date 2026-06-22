import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Populate the grove (BACKLOG-274). A dino can migrate between the bowl and the grove; the keeper can
 * only interact with the zone it's standing in (the proximity filter on `nearestDino`); and a migrated
 * home zone persists across a reload. Spawn is unchanged — the whole roster starts in the bowl.
 */

type W = Record<string, any>;
const visible = (p: import('@playwright/test').Page) =>
  p.evaluate(() => (window as W).__visibleDinos() as string[]);
const nearest = (p: import('@playwright/test').Page) =>
  p.evaluate(() => (window as W).__nearestDino() as string | null);

test('a migrated dino leaves the bowl and is only interactable in its own zone', async ({ page }) => {
  await boot(page);

  // The whole roster starts in the bowl (spawn byte-identical).
  expect(await visible(page)).toContain('Mossback');

  // Migrate Mossback into the grove while the keeper stays in the bowl.
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  expect(await visible(page)).not.toContain('Mossback');

  // Standing on Mossback's spot in the bowl, it is NOT the nearest interactable dino (off-zone).
  await page.evaluate(() => (window as W).__warpTo('Mossback'));
  expect(await nearest(page)).not.toBe('Mossback');

  // Cross into the grove: Mossback is now the only dino drawn, and it's interactable there.
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await visible(page)).toEqual(['Mossback']);
  await page.evaluate(() => (window as W).__warpTo('Mossback'));
  expect(await nearest(page)).toBe('Mossback');
});

test('a migrated home zone persists across a save/reload', async ({ page }) => {
  await boot(page);

  await page.evaluate(async () => {
    (window as W).__migrate('Glade', 'grove');
    await (window as W).__saveNow();
  });

  await page.reload();
  await boot(page);

  // After reload, Glade is in the grove: hidden in the bowl, drawn once the keeper crosses over.
  expect(await visible(page)).not.toContain('Glade');
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await visible(page)).toContain('Glade');
});
