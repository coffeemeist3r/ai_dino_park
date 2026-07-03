import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Resource regrowth (BACKLOG-384). A zone starts at full yield; working it (a pickup) thins that yield, so
 * over-gathering slows a zone's future spawns until it regrows. We drive a real gather (spawn on a dino + one
 * world step, exactly like cycle-062) and watch the bowl's yield drop below full.
 */

type W = Record<string, any>;
const TILE = 32;

const yieldOf = (p: Page, zone: string) => p.evaluate((z) => (window as W).__yield(z) as number, zone);
const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { x: number; y: number }[]);

test('gathering thins a zone yield below full', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // A fresh zone starts full (back-compat: spawns at the base rate).
  expect(await yieldOf(page, 'bowl')).toBe(1);

  // Spawn a resource right on the first dino and run one world step — it picks it up.
  const ds = await dinos(page);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ tx, ty }) => (window as W).__spawnResource('branch', tx, ty), { tx, ty });
  await page.evaluate(() => (window as W).__stepWorld());

  // Working the bowl thinned its yield: below full, but only one depletion's worth.
  const y = await yieldOf(page, 'bowl');
  expect(y).toBeLessThan(1);
  expect(y).toBeGreaterThan(0.6);

  expect(errors).toEqual([]);
});
