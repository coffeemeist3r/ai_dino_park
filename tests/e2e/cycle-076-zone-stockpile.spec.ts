import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Per-zone stockpile (BACKLOG-328). Each zone banks, caps, and spends its own gathering — a grove branch
 * no longer lands in the same pile as a bowl one. The plaque Stores line shows the keeper's active zone.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const zonePile = (p: Page, z: string) => p.evaluate((zz) => (window as W).__zoneStockpile(zz) as Record<string, number>, z);

/** Drop a resource on a named dino's tile in the *active* zone and step so it banks immediately. */
async function bankOn(p: Page, name: string, kind: string) {
  const d = (await dinos(p)).find((x) => x.name === name)!;
  const tx = Math.floor(d.x / TILE);
  const ty = Math.floor(d.y / TILE);
  await p.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await p.evaluate(() => (window as W).__stepWorld());
}

test('a zone banks into its own pile; the other zone is untouched', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Bank a branch in the bowl (active zone at boot).
  const bowlDino = (await dinos(page))[0].name;
  await bankOn(page, bowlDino, 'branch');
  expect((await zonePile(page, 'bowl')).branch).toBe(1);
  expect(await zonePile(page, 'grove')).toEqual({}); // the grove pile is still empty

  // Put a dino in the grove and cross to it, then bank there.
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));
  await page.evaluate(() => (window as W).__setZone('grove'));
  await bankOn(page, 'Rex', 'stone');
  expect((await zonePile(page, 'grove')).stone).toBe(1); // banked into the grove's own pile
  expect((await zonePile(page, 'bowl')).branch).toBe(1); // the bowl pile is unchanged
  expect((await zonePile(page, 'bowl')).stone ?? 0).toBe(0);

  // The active-zone readout follows the keeper.
  const activeInGrove = await page.evaluate(() => (window as W).__stockpile() as Record<string, number>);
  expect(activeInGrove.stone).toBe(1);
  await page.evaluate(() => (window as W).__setZone('bowl'));
  const activeInBowl = await page.evaluate(() => (window as W).__stockpile() as Record<string, number>);
  expect(activeInBowl.branch).toBe(1);

  expect(errors).toEqual([]);
});
