import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, any>;

/**
 * BACKLOG-509 — the tithe.
 *
 * The reachability floor for this track, and the reason it is a lens read rather than a walk: the climb
 * itself depends on a ground banking the rest of its recipe first, which is timing-dependent and would make
 * this spec a race. What is *not* timing-dependent is that on the first frame of a fresh park, every ground
 * but the Ridge says out loud that nothing goes up here until somebody makes the climb.
 */
test.describe('BACKLOG-509 — nothing goes up without the climb', () => {
  test('every ground but the Ridge says what it is waiting on, on frame one', async ({ page }) => {
    await boot(page);

    const map: Array<{ id: string; short?: string }> = await page.evaluate(() => (window as W).__zoneMap());
    const byId = new Map(map.map((e) => [e.id, e]));

    const bowl = byId.get('bowl')!;
    expect(bowl.short).toBeTruthy();
    expect(bowl.short).toContain('🌑');
    expect(bowl.short).toContain('Sunward Ridge');

    // The source ground owes nobody, so it never names the shard as coming from anywhere.
    expect(byId.get('ridge')!.short ?? '').not.toContain('Sunward Ridge');
  });

  test('a fresh park is not seeded with black glass anywhere but where it falls', async ({ page }) => {
    await boot(page);
    const piles: Record<string, Record<string, number>> = await page.evaluate(() => (window as W).__pilesByZone?.() ?? {});
    for (const [zone, pile] of Object.entries(piles)) {
      if (zone === 'ridge') continue;
      expect(pile.obsidian ?? 0).toBe(0);
    }
  });
});
