import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Resource stockpile (BACKLOG-285). Each 146 pickup banks into a shared per-kind park stockpile,
 * shown on the plaque and persisted in the save. Spawn deterministically on a dino, step, watch it bank.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const stockpile = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__stockpile() as Record<string, number>);
const plaque = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__plaque() as { stockpile: string });
const exportSave = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__exportSave() as string);

async function dropOnFirstDinoAndStep(page: import('@playwright/test').Page, kind: string) {
  const ds = await dinos(page);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await page.evaluate(() => (window as W).__stepWorld());
}

test('a pickup banks into the shared park stockpile and shows on the plaque', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await stockpile(page)).toEqual({});
  expect((await plaque(page)).stockpile).toBe(''); // no stores line while empty

  await dropOnFirstDinoAndStep(page, 'branch');
  expect((await stockpile(page)).branch).toBe(1);

  await dropOnFirstDinoAndStep(page, 'stone');
  const pile = await stockpile(page);
  expect(pile.stone).toBe(1);
  expect(pile.branch).toBe(1);

  // The plaque readout reflects the live counts…
  const line = (await plaque(page)).stockpile;
  expect(line).toContain('🪵 1');
  expect(line).toContain('🪨 1');

  // …and the stockpile persists into the exported save (additive, still v2 — no version bump).
  const save = JSON.parse(await exportSave(page));
  expect(save.version).toBe(2);
  expect(save.stockpile.branch).toBeGreaterThanOrEqual(1);
  expect(errors).toEqual([]);
});
