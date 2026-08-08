import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Lonely lean on the keeper (BACKLOG-370). `edgeTarget` has sent a moping loner to its own nearest wall
 * since cycle 80. A loner with deep keeper-hearts has one relationship left, and it had no bearing on
 * where the dino withdrew to. Now it does: that dino mopes at the wall the *keeper* is by.
 */

type W = Record<string, any>;
const TILE = 32;

const leanTarget = (p: Page, name: string) =>
  p.evaluate((n) => (window as W).__leanTarget(n) as { tileX: number; tileY: number } | null, name);
const setFriendship = (p: Page, name: string, points: number) =>
  p.evaluate(({ n, v }) => (window as W).__setFriendship(n, v), { n: name, v: points });
const playerTile = (p: Page) => p.evaluate(() => (window as W).__playerTile?.() ?? null);
const memory = (p: Page) => p.evaluate(() => (window as W).__memory() as Record<string, string[]>);

test('a fresh park leans on nobody — every dino is 0 hearts', async ({ page }) => {
  await boot(page);
  // Every dino is a loner at spawn (no bonds) and every dino is at 0 hearts, so the branch is inert.
  const names = await page.evaluate(() => (window as W).__visibleDinos() as string[]);
  for (const n of names) expect(await leanTarget(page, n)).toBeNull();
  const mem = await memory(page);
  for (const n of names) expect((mem[n] ?? []).join(' ')).not.toContain('waited by the glass');
});

test('a well-befriended loner aims at the wall the keeper is by; a barely-known one does not', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__holdAmbient()); // BACKLOG-456: no meeting lifts Rex out of loner status

  // Below the floor (3 hearts = 39 points): still the cycle-80 behaviour, nearest wall, hook returns null.
  await setFriendship(page, 'Rex', 39);
  expect(await leanTarget(page, 'Rex')).toBeNull();

  // At the floor (4 hearts = 40 points): the keeper's wall.
  await setFriendship(page, 'Rex', 40);
  const target = await leanTarget(page, 'Rex');
  expect(target).not.toBeNull();

  // And it is genuinely the keeper's wall, not Rex's: it sits on a border and shares a row/column with
  // the keeper's own tile.
  const keeper = await playerTile(page);
  if (keeper) {
    const onBorder =
      target!.tileX === 0 || target!.tileY === 0 || target!.tileX === keeper.tileX || target!.tileY === keeper.tileY;
    expect(onBorder).toBe(true);
  }
  await page.evaluate(() => (window as W).__releaseAmbient());
});

test('a dino in another zone takes its own nearest wall whatever its hearts', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__holdAmbient());
  await setFriendship(page, 'Rex', 90); // 9 hearts — far past the floor
  expect(await leanTarget(page, 'Rex')).not.toBeNull();
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove')); // out of the keeper's view
  expect(await leanTarget(page, 'Rex')).toBeNull();
  await page.evaluate(() => (window as W).__releaseAmbient());
});

test('a dino that is not a loner never leans, however many hearts it has', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__holdAmbient());
  await setFriendship(page, 'Rex', 100);
  // Put Rex and Mossback on one tile and let a meeting build a real bond — Rex stops being a loner.
  await page.evaluate(() => (window as W).__releaseAmbient());
  const rex = (await page.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]))
    .find((d) => d.name === 'Rex')!;
  const tx = Math.floor(rex.x / TILE);
  const ty = Math.floor(rex.y / TILE);
  for (let i = 0; i < 12; i++) {
    await page.evaluate(({ tx, ty }) => (window as W).__placeDino('Mossback', tx, ty), { tx, ty });
    await page.evaluate(({ tx, ty }) => (window as W).__placeDino('Rex', tx, ty), { tx, ty });
    await page.evaluate(() => (window as W).__stepWorld());
  }
  expect(await leanTarget(page, 'Rex')).toBeNull(); // bonded now — not a loner, so not a leaner
});

test('the waiting is remembered, once per bout of loneliness', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__holdAmbient());
  await setFriendship(page, 'Rex', 100);
  // Drive enough steps for the mope roll (MOPE_CHANCE 0.5) to walk Rex the width of the bowl to the
  // keeper's wall — the withdrawal is deliberately probabilistic so a loner still mills enough to meet.
  for (let i = 0; i < 200; i++) await page.evaluate(() => (window as W).__stepWorld());
  const filed = (await memory(page)).Rex ?? [];
  const waits = filed.filter((m) => m.includes('waited by the glass')).length;
  expect(waits).toBe(1); // it happened, and it happened exactly once
  expect(await page.evaluate(() => (window as W).__leanFiled() as string[])).toContain('Rex');
  await page.evaluate(() => (window as W).__releaseAmbient());
});
