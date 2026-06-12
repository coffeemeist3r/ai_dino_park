import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Keeper avatars, 3/3 (BACKLOG-158 COMPLETE, cycle 047-art) — LUMEN-3 "Lux" goes
 * pixel and the whole observer roster renders. The rectangle-fallback control now
 * stands on a genuine no-art id (cycle-045-art-keeper.spec.ts holds that pin).
 */

type W = Window & Record<string, any>;

test('LUMEN-3 renders as a baked, playing pixel sprite after a pick (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);

  await page.evaluate(() => (window as W).__pickKeeper('lumen'));
  expect(await page.evaluate(() => (window as W).__keeper())).toBe('lumen');
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_lumen_walk');
  expect(errors).toEqual([]);
});

test('the full roster sweep: every observer is sprite-backed, no survivor on the square', async ({ page }) => {
  await boot(page);

  const arts = await page.evaluate(() => {
    const w = window as W;
    const out: Record<string, string | null> = {};
    for (const k of w.__keepers() as Array<{ id: string }>) {
      w.__pickKeeper(k.id);
      out[k.id] = w.__keeperArt();
    }
    return out;
  });

  expect(arts).toEqual({
    aether: 'keeper_aether_walk',
    vanta: 'keeper_vanta_walk',
    lumen: 'keeper_lumen_walk',
  });
});
