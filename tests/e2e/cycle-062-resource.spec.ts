import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Resource gathering spine (BACKLOG-146). A raw resource appears; the first dino to reach it picks it
 * up — its tally rises and the resource is gone. We spawn deterministically via __spawnResource (no
 * reliance on the random roll) right on a dino, then run one world step.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const gathered = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__gathered() as Record<string, number>);
const resource = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__resource() as { kind: string } | null);

test('a dino picks up a resource, raising its tally and clearing the resource', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await resource(page)).toBeNull();
  expect(Object.values(await gathered(page)).reduce((a, b) => a + b, 0)).toBe(0);

  // Spawn a branch right on the first dino's tile.
  const ds = await dinos(page);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ tx, ty }) => (window as W).__spawnResource('branch', tx, ty), { tx, ty });
  expect((await resource(page))?.kind).toBe('branch');

  // One world step: the dino on (or beside) it picks it up.
  await page.evaluate(() => (window as W).__stepWorld());

  expect(await resource(page)).toBeNull();
  expect(Object.values(await gathered(page)).reduce((a, b) => a + b, 0)).toBe(1);
  expect(errors).toEqual([]);
});

test('only one resource exists at a time', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__spawnResource('stone', 5, 5));
  await page.evaluate(() => (window as W).__spawnResource('branch', 9, 9));
  // The second spawn replaces the first (one sprite/handle) — still exactly one in play.
  expect((await resource(page))?.kind).toBe('branch');
});
