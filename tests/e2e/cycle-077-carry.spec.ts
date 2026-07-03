import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Carry between zones (BACKLOG-329). A dino completing a visible crossing ferries one banked resource
 * from the zone it leaves into the zone it enters — the first link between the two per-zone piles (328).
 * Conserved (source −1 / dest +1); an empty source carries nothing.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const zonePile = (p: Page, z: string) => p.evaluate((zz) => (window as W).__zoneStockpile(zz) as Record<string, number>, z);
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

/** Bank one resource into the *active* (bowl) zone pile by dropping it on a dino's tile and stepping. */
async function bankOn(p: Page, name: string, kind: string) {
  const d = (await dinos(p)).find((x) => x.name === name)!;
  const tx = Math.floor(d.x / TILE);
  const ty = Math.floor(d.y / TILE);
  await p.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await step(p);
}

/** Drive a started migration to completion (the dino walks to its edge and crosses). */
async function crossOnce(p: Page, name: string) {
  await p.evaluate((n) => (window as W).__startMigration(n), name);
  for (let i = 0; i < 40; i++) {
    await step(p);
    if (!(await migrating(p)).includes(name)) return;
  }
  throw new Error(`${name} never finished crossing`);
}

test('a crossing dino ferries one banked resource to the zone it enters; an empty pile carries nothing', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Pin every dino's day-intent to 'social' (BACKLOG-393): a seeded 'forage' day widens resource
  // notice enough that an organic grove spawn (which leans branch, 348) gets gathered and banked
  // mid-test, double-counting the very pile this spec pins. Carry conservation is what's under
  // test, not the day's mood — so hold the mood still.
  await page.evaluate(() => {
    const w = window as W;
    for (const n of w.__visibleDinos() as string[]) w.__setIntent(n, 'social');
  });

  // Bank a branch in the bowl pile (active zone at boot).
  await bankOn(page, 'Rex', 'branch');
  expect((await zonePile(page, 'bowl')).branch).toBe(1);
  expect(await zonePile(page, 'grove')).toEqual({});

  // Rex crosses bowl → grove, carrying the branch with him: bowl −1, grove +1 (conserved).
  await crossOnce(page, 'Rex');
  expect((await zonePile(page, 'bowl')).branch ?? 0).toBe(0);
  expect((await zonePile(page, 'grove')).branch).toBe(1);

  // A second bowl dino crosses out of the now-empty bowl pile — nothing to carry, grove unchanged.
  await crossOnce(page, 'Mossback');
  expect((await zonePile(page, 'grove')).branch).toBe(1);

  expect(errors).toEqual([]);
});
