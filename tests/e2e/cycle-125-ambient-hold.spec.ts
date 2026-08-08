import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The parallel-load e2e seam (BACKLOG-456). 431's `__pauseAmbient` freezes the wall-clock *timers*; it
 * does nothing about the ambient work that rides a `forceStep` a spec drives itself — the pairwise meeting
 * loop, resource spawn, and gathering. Four catalogued specs pin a pile or a bond graph and then drive a
 * crossing over dozens of steps, and lose the thing they pinned to that ambient work.
 *
 * This pins the seam itself: the hold holds those three and *only* those three, it releases, and the
 * separate save-flush closes the reload race that is a different failure wearing the same item number.
 */

type W = Record<string, any>;
const TILE = 32;

const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const held = (p: Page) => p.evaluate(() => (window as W).__ambientHeld() as boolean);
const hold = (p: Page) => p.evaluate(() => (window as W).__holdAmbient());
const release = (p: Page) => p.evaluate(() => (window as W).__releaseAmbient());
const bonds = (p: Page) => p.evaluate(() => (window as W).__bonds() as Record<string, unknown>);
const pile = (p: Page, z: string) => p.evaluate((zz) => (window as W).__zoneStockpile(zz) as Record<string, number>, z);
const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const total = (pile: Record<string, number>) => Object.values(pile).reduce((s, n) => s + n, 0);

test('the hold is off by default and toggles', async ({ page }) => {
  await boot(page);
  expect(await held(page)).toBe(false);
  await hold(page);
  expect(await held(page)).toBe(true);
  await release(page);
  expect(await held(page)).toBe(false);
});

test('the hold is independent of the 431 timer pause', async ({ page }) => {
  await boot(page); // boot() calls __pauseAmbient
  expect(await page.evaluate(() => (window as W).__ambientPaused() as boolean)).toBe(true);
  expect(await held(page)).toBe(false); // paused ≠ held — the two flags are separate seams
  await hold(page);
  expect(await page.evaluate(() => (window as W).__ambientPaused() as boolean)).toBe(true); // unchanged
  await release(page);
});

test('held, two dinos on the same tile record no meeting and no bond change', async ({ page }) => {
  await boot(page);
  // Park Mossback on Rex's tile: without the hold this is a guaranteed meet on the next step.
  const rex = (await dinos(page)).find((d) => d.name === 'Rex')!;
  const tx = Math.floor(rex.x / TILE);
  const ty = Math.floor(rex.y / TILE);
  await page.evaluate(({ tx, ty }) => (window as W).__placeDino('Mossback', tx, ty), { tx, ty });

  await hold(page);
  const before = JSON.stringify(await bonds(page));
  for (let i = 0; i < 10; i++) await step(page);
  expect(JSON.stringify(await bonds(page))).toBe(before);
  await release(page);
});

test('released, meetings resume — the hold is a hold, not a disable', async ({ page }) => {
  await boot(page);
  await hold(page);
  const before = JSON.stringify(await bonds(page));
  for (let i = 0; i < 6; i++) await step(page);
  expect(JSON.stringify(await bonds(page))).toBe(before);

  await release(page);
  // Re-park them (the held steps still moved bodies) and step: bonds move again.
  const rex = (await dinos(page)).find((d) => d.name === 'Rex')!;
  await page.evaluate(
    ({ tx, ty }) => (window as W).__placeDino('Mossback', tx, ty),
    { tx: Math.floor(rex.x / TILE), ty: Math.floor(rex.y / TILE) },
  );
  await step(page);
  expect(JSON.stringify(await bonds(page))).not.toBe(before);
});

test('held, a pinned pile survives ten driven steps', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setZonePile('bowl', { branch: 3 }));
  await hold(page);
  for (let i = 0; i < 10; i++) await step(page);
  expect(total(await pile(page, 'bowl'))).toBe(3); // nothing spawned, nothing gathered, nothing re-banked
  await release(page);
});

test('held, a driven crossing still completes — movement is not frozen', async ({ page }) => {
  await boot(page);
  await hold(page);
  await page.evaluate(() => (window as W).__startMigration('Rex'));
  let done = false;
  for (let i = 0; i < 40; i++) {
    await step(page);
    if (!(await migrating(page)).includes('Rex')) { done = true; break; }
  }
  await release(page);
  expect(done).toBe(true);
});

test('a flushed save survives a reload', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setFriendship('Rex', 47));
  await page.evaluate(() => (window as W).__flushSave());
  await page.reload();
  await page.waitForFunction(() => (window as Record<string, unknown>).__ready === true);
  expect(await page.evaluate(() => ((window as W).__friendship() as Record<string, number>).Rex)).toBe(47);
});
