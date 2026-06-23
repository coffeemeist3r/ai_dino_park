import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Visible zone crossing (BACKLOG-334). The ambient migrant no longer teleports: it walks to its zone's
 * linked edge and crosses, appearing at the far edge. The deterministic `__migrate` hook stays instant
 * (cycle-068/069 parity); only the walk is new.
 */

type W = Record<string, any>;

const xOf = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate(
    (n) => ((window as W).__dinoPositions() as { name: string; x: number }[]).find((d) => d.name === n)!.x,
    name,
  );
const migrating = (p: import('@playwright/test').Page) =>
  p.evaluate(() => (window as W).__migrating() as string[]);
const visible = (p: import('@playwright/test').Page) =>
  p.evaluate(() => (window as W).__visibleDinos() as string[]);
const step = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__stepWorld());

test('a migrating bowl dino walks east to the edge then crosses into the grove — no teleport', async ({
  page,
}) => {
  await boot(page);

  // Rex starts in the bowl and is drawn there.
  expect(await visible(page)).toContain('Rex');

  // Begin a visible crossing — Rex is now migrating but still HOME in the bowl (visible, no jump yet).
  await page.evaluate(() => (window as W).__startMigration('Rex'));
  expect(await migrating(page)).toContain('Rex');
  expect(await visible(page)).toContain('Rex');

  // Each step walks Rex monotonically toward the east edge — it does not teleport — until it crosses.
  let prev = await xOf(page, 'Rex');
  let crossed = false;
  for (let i = 0; i < 30; i++) {
    await step(page);
    if (!(await migrating(page)).includes('Rex')) {
      crossed = true;
      break;
    }
    const x = await xOf(page, 'Rex');
    expect(x).toBeGreaterThanOrEqual(prev); // monotone east, never a jump backward
    prev = x;
  }

  // It crossed: no longer migrating, gone from the bowl view, and waiting at the grove's west edge.
  expect(crossed).toBe(true);
  expect(await migrating(page)).not.toContain('Rex');
  expect(await visible(page)).not.toContain('Rex');
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await visible(page)).toContain('Rex');
  expect(await xOf(page, 'Rex')).toBeLessThan(96); // near the west entry (col 1 ≈ 48px), not a random tile
});

test('the deterministic __migrate hook still teleports instantly (cycle-068 parity)', async ({ page }) => {
  await boot(page);
  const zone = await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  expect(zone).toBe('grove');
  expect(await migrating(page)).not.toContain('Mossback'); // instant, not a walk
  expect(await visible(page)).not.toContain('Mossback');
});
