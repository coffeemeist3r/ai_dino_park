import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Legible gathering (BACKLOG-297). A freshly fallen resource lingers a grace window before any dino
 * fetches it, so the player catches it appearing. A resource spawned "ready" (the default dev path the
 * older specs use) is still picked up immediately — the gate only delays a genuinely fresh drop.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const stockpile = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__stockpile() as Record<string, number>);
const resourcePresent = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__resource() !== null);
const step = (page: import('@playwright/test').Page) => page.evaluate(() => (window as W).__stepWorld());

async function spawnOnFirstDino(page: import('@playwright/test').Page, kind: string, fresh: boolean) {
  const ds = await dinos(page);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ kind, tx, ty, fresh }) => (window as W).__spawnResource(kind, tx, ty, fresh), {
    kind,
    tx,
    ty,
    fresh,
  });
}

test('a fresh resource lingers a grace window before it can be banked', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Fresh drop on a dino: one step must NOT bank it — the grace holds it on the ground to be seen.
  await spawnOnFirstDino(page, 'branch', true);
  await step(page);
  expect(await resourcePresent(page)).toBe(true);
  expect(await stockpile(page)).toEqual({});

  // A "ready" drop (the default path the older specs use) is banked on the very next step.
  await spawnOnFirstDino(page, 'branch', false);
  await step(page);
  expect((await stockpile(page)).branch).toBe(1);
  expect(errors).toEqual([]);
});
