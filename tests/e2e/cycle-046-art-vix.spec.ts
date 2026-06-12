import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Keeper avatars, 2/3 (BACKLOG-158, cycle 046-art) — VANTA-9 "Vix" goes pixel.
 * LUMEN-3 stays on the amber square and is now the rectangle-fallback control
 * (cycle-045-art-keeper.spec.ts holds that pin).
 */

type W = Window & Record<string, any>;

test('VANTA-9 renders as a baked, playing pixel sprite after a pick', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);

  await page.evaluate(() => (window as W).__pickKeeper('vanta'));
  expect(await page.evaluate(() => (window as W).__keeper())).toBe('vanta');
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_vanta_walk');
  expect(errors).toEqual([]);
});

test('drawn observers swap sprite↔sprite, never a square between', async ({ page }) => {
  await boot(page);

  // aether (drawn, default) → vanta (drawn): sprite to sprite
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_aether_walk');
  await page.evaluate(() => (window as W).__pickKeeper('vanta'));
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_vanta_walk');

  // lumen drawn in cycle 047-art — the fallback control moved to a no-art id ('vex-0',
  // pinned in cycle-045-art-keeper.spec.ts); the round trip stays sprite-backed
  await page.evaluate(() => (window as W).__pickKeeper('lumen'));
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_lumen_walk');
  await page.evaluate(() => (window as W).__pickKeeper('vanta'));
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_vanta_walk');
});
