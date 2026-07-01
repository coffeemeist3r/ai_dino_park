import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Edge-meet barter (BACKLOG-358). Two dinos from different zones meeting at their shared edge swap the kind
 * each other's zone is short of — the first two-way inter-zone exchange (carry, 329, is one-way). Conserved,
 * cap-safe, no bond change. Driven here both by the ambient scan and the deterministic __edgeBarter hook.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const pile = (p: Page, z: string) => p.evaluate((zz) => (window as W).__zoneStockpile(zz) as Record<string, number>, z);
const setPile = (p: Page, z: string, pl: Record<string, number>) =>
  p.evaluate(({ z, pl }) => (window as W).__setZonePile(z, pl), { z, pl });

test('two dinos at the shared bowl–grove edge barter what each other needs (ambient scan)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const inBowl = roster[0];
  const inGrove = roster[1];

  // A branch-rich bowl and a stone-rich grove: each short of the other's kind for its next structure.
  await setPile(page, 'bowl', { branch: 2 });
  await setPile(page, 'grove', { stone: 2 });

  // Park one dino at the bowl's east edge and one at the grove's west edge — the shared boundary. The ambient
  // scan needs them to *linger* (a meet, not a crosser passing through), so run it twice: the first call banks
  // the dwell, the second fires the trade.
  await page.evaluate((b) => (window as W).__migrate(b, 'grove'), inGrove);
  await page.evaluate(
    ({ a, b }) => {
      const w = window as W;
      w.__placeDino(a, 19, 7); // bowl east edge (COLS-1)
      w.__placeDino(b, 0, 7); // grove west edge
    },
    { a: inBowl, b: inGrove },
  );
  await page.evaluate(() => (window as W).__maybeBarter()); // dwell → 1 (no trade yet)
  await page.evaluate(() => (window as W).__maybeBarter()); // dwell → 2 (barter fires)

  const bowl = await pile(page, 'bowl');
  const grove = await pile(page, 'grove');
  // Bowl handed the grove a branch (grove's shortfall) and got a stone back; conserved both ways.
  expect(grove.branch).toBe(1);
  expect(bowl.stone).toBe(1);
  expect((bowl.branch ?? 0) + (grove.branch ?? 0)).toBe(2); // branch conserved
  expect((bowl.stone ?? 0) + (grove.stone ?? 0)).toBe(2); // stone conserved

  expect(errors).toEqual([]);
});

test('__edgeBarter swaps deterministically, and a nothing-to-trade meet is a no-op', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const a = roster[0];
  const b = roster[1];
  await page.evaluate((bb) => (window as W).__migrate(bb, 'grove'), b);

  // Seed asymmetric piles and fire the trade directly.
  await setPile(page, 'bowl', { branch: 3 });
  await setPile(page, 'grove', { stone: 3 });
  const res = await page.evaluate(({ a, b }) => (window as W).__edgeBarter(a, b), { a, b });
  expect(res.traded).toBe(true);
  expect(res.a.stone).toBe(1); // bowl received a stone
  expect(res.b.branch).toBe(1); // grove received a branch

  // Empty both piles: a meet with nothing tradeable does nothing (no phantom beat).
  await setPile(page, 'bowl', {});
  await setPile(page, 'grove', {});
  const noop = await page.evaluate(({ a, b }) => (window as W).__edgeBarter(a, b), { a, b });
  expect(noop.traded).toBe(false);

  expect(errors).toEqual([]);
});
