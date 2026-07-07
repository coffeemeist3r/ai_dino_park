import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * A ritual for the missing friend (BACKLOG-414). When a dino's closest friend crosses to another zone, its
 * solitary tic (405) stops being aimless: it walks to the edge that friend left by and rituals there, filing a
 * memory that names the friend. A dino whose closest friend shares its zone keeps the plain in-place ritual.
 *
 * The lone dino is pinned each step (away from every other dino's tile) so it forms no *accidental* cross-zone
 * bond — meets key on pixel proximity, not zone — and its only friend is the one this test bonds it to. That
 * keeps *which* friend it grieves deterministic.
 */

const COLS = 20;
type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const tic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tic(nn), n);
const griefTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__griefTic(nn), n);
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);

test('a dino grieving a friend gone east aims its tic at the east edge and names them', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const friend = roster[1];
  const rest = roster.slice(2);

  // A real bond alone↔friend (its only friend), then send the friend — and everyone else — into the grove
  // (east). The target's closest friend now lives one zone east.
  await page.evaluate(
    ({ alone, friend, rest }) => {
      const w = window as W;
      w.__bondPair(alone, friend, 50);
      w.__migrate(friend, 'grove');
      for (const n of rest) w.__migrate(n, 'grove');
      w.__setTrait(alone, 'curiosity', 0); // never fetches — nothing but wandering competes with the ritual
    },
    { alone, friend, rest },
  );

  let invented = false;
  for (let i = 0; i < 80 && !invented; i++) {
    await page.evaluate(
      ({ alone, friend, rest }) => {
        const w = window as W;
        w.__setNeed(alone, 'hunger', 0);
        w.__setNeed(alone, 'thirst', 0);
        w.__placeDino(alone, 10, 7); // pin the lone dino; never aligns with the grove cast (no stray bond)
        w.__placeDino(friend, 2, 2);
        rest.forEach((n: string, idx: number) => w.__placeDino(n, 4 + idx, 2));
      },
      { alone, friend, rest },
    );
    await page.evaluate(() => (window as W).__stepWorld());
    invented = (await tic(page, alone)).invented;
  }
  expect(invented).toBe(true);

  // The ritual is aimed at the east edge (the way the friend crossed): anchor on the last column, grieving friend.
  const g = await griefTic(page, alone);
  expect(g.grieved).toBe(friend);
  expect(g.grief?.edge).toBe('east');
  expect(g.anchor.tileX).toBe(COLS - 1);

  // The one-time memory names the friend and reads as a directional loss.
  const mem = await memory(page, alone);
  expect(mem.some((m: string) => m.includes(friend) && m.includes('edge they left by'))).toBe(true);

  expect(errors).toEqual([]);
});

test('a dino whose closest friend shares its zone keeps the plain in-place ritual (control)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const friend = roster[1];
  const rest = roster.slice(2);

  // Closest friend stays in the bowl — parked in the far corner (out of company range), so the target is still
  // solitary but its friend never left. Everyone else goes to the grove.
  await page.evaluate(
    ({ alone, friend, rest }) => {
      const w = window as W;
      w.__bondPair(alone, friend, 50);
      for (const n of rest) w.__migrate(n, 'grove');
      w.__setTrait(alone, 'curiosity', 0);
    },
    { alone, friend, rest },
  );

  let invented = false;
  for (let i = 0; i < 80 && !invented; i++) {
    await page.evaluate(
      ({ alone, friend, rest }) => {
        const w = window as W;
        w.__setNeed(alone, 'hunger', 0);
        w.__setNeed(alone, 'thirst', 0);
        w.__placeDino(alone, 15, 10);
        w.__placeDino(friend, 1, 1); // same zone (bowl), far out of company range
        rest.forEach((n: string, idx: number) => w.__placeDino(n, 2 + idx, 2));
      },
      { alone, friend, rest },
    );
    await page.evaluate(() => (window as W).__stepWorld());
    invented = (await tic(page, alone)).invented;
  }
  expect(invented).toBe(true);

  // No grief: closest friend shares the zone, so the ritual settles in place, not at an edge.
  const g = await griefTic(page, alone);
  expect(g.grieved).toBeNull();
  expect(g.grief).toBeNull();

  const mem = await memory(page, alone);
  expect(mem.some((m: string) => m.includes('a little ritual of your own'))).toBe(true);
  expect(mem.some((m: string) => m.includes('edge they left by'))).toBe(false);

  expect(errors).toEqual([]);
});
