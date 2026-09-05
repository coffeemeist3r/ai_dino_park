import { test, expect } from '@playwright/test';
import { boot, settle, foundingState, FOUNDING_FIXTURES } from './helpers';
import { FOUNDING_PILE_STEPS, FOUNDING_RUIN } from '../../game/src/world/founding';
import { SALTPAN_ID } from '../../game/src/world/zones';

type W = Window & Record<string, any>;

/**
 * BACKLOG-495 — the declared founding fixture, and the founding constant it exists to absorb.
 *
 * Two halves. The first proves the seam: each name puts the park into the state it claims and *verifies*
 * that it got there, so a fixture can no longer fail silently the way three of them did between cycles
 * 135 and 142. The second is what a player sees for it — the founding piles now reach every step
 * BACKLOG-504 drew, so a fresh park shows a heap on three grounds instead of one.
 */
test.describe('the founding fixture has a name (BACKLOG-495)', () => {
  test("'as-shipped' holds on a fresh park", async ({ page }) => {
    await boot(page);
    await foundingState(page, 'as-shipped');
  });

  test("'all-bowl' puts the whole cast on one ground", async ({ page }) => {
    await boot(page);
    await foundingState(page, 'all-bowl');
    const zones = await page.evaluate(() =>
      ((window as W).__dinoPositions() as Array<{ name: string }>).map((d) => (window as W).__homeZone(d.name)),
    );
    expect(new Set(zones)).toEqual(new Set(['bowl']));
  });

  test("'empty-grounds' clears every pile and the founding ruin", async ({ page }) => {
    await boot(page);
    await foundingState(page, 'empty-grounds');
    const state = await page.evaluate((ruin) => {
      const w = window as W;
      const piles = w.__pilesByZone() as Record<string, Record<string, number>>;
      return {
        totals: Object.values(piles).map((p) => Object.values(p).reduce((a, b) => a + b, 0)),
        ruinStanding: (w.__cairns() as Array<{ zone: string; tileX: number; tileY: number }>).some(
          (c) => c.zone === ruin.zone && c.tileX === ruin.tileX && c.tileY === ruin.tileY,
        ),
      };
    }, FOUNDING_RUIN);
    expect(state.totals.every((t) => t === 0)).toBe(true);
    expect(state.ruinStanding).toBe(false);
  });

  test("'bare' is both, in one call", async ({ page }) => {
    await boot(page);
    await foundingState(page, 'bare');
    expect(await FOUNDING_FIXTURES['all-bowl'].verify(page)).toBeNull();
    expect(await FOUNDING_FIXTURES['empty-grounds'].verify(page)).toBeNull();
  });

  /**
   * The point of the seam. A fixture that does not land has to say so, naming itself — otherwise it is the
   * same unwritten assumption in a nicer coat. Broken here by moving one dino back off the bowl *after*
   * the fixture applied, which is the shape of every real failure: something else in the spec undid it.
   */
  test('a fixture that does not hold throws, naming itself and the reason', async ({ page }) => {
    await boot(page);
    await foundingState(page, 'all-bowl');
    await page.evaluate(() => (window as W).__migrate('Bramble', 'grove'));
    const reason = await FOUNDING_FIXTURES['all-bowl'].verify(page);
    expect(reason).toContain('Bramble');
    expect(reason).toContain('grove');
  });
});

/**
 * The reachable half: what a player sees for the seam, in a fresh save, inside ten minutes.
 *
 * Before this cycle exactly one ground booted with anything in its pile, so of the three heap rigs the
 * studio drew a new park exercised one, and `pile_3` had never existed on a first frame in the park's
 * history. Walk the fresh park and count them.
 */
test.describe('a fresh park shows every heap the studio drew (BACKLOG-495/504)', () => {
  test('each stocked ground carries its heap, and the frontier carries none', async ({ page }) => {
    await boot(page);
    const seen: number[] = [];
    for (const [zone, step] of Object.entries(FOUNDING_PILE_STEPS)) {
      await page.evaluate((z) => (window as W).__setZone(z), zone);
      await settle(page);
      const bank = await page.evaluate((z) => (window as W).__bank(z), zone);
      expect(bank.step, `${zone} heap step`).toBe(step);
      expect(bank.visible, `${zone} heap visible`).toBe(true);
      seen.push(bank.step);
    }
    // Every drawn step, exactly once — the claim `reachability.ts` holds the constants to.
    expect(new Set(seen)).toEqual(new Set([1, 2, 3]));

    await page.evaluate((z) => (window as W).__setZone(z), SALTPAN_ID);
    await settle(page);
    const frontier = await page.evaluate((z) => (window as W).__bank(z), SALTPAN_ID);
    expect(frontier.step).toBe(0);
    expect(frontier.visible).toBe(false);
  });
});
