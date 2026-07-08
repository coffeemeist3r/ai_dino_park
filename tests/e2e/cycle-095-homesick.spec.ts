import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Homesick for a friend (BACKLOG-340) — a dino whose closest friend (013) lives a zone away drifts back
 * toward it after residing a while, overriding the 341 settle-resist (company > scenery). The action-mirror
 * of the 414 grief tic. Driven deterministically via __homesickMigrate (the exact production path); the
 * migration randomness itself is unit-pinned in cycle-095-homesick.test.ts.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const settleTick = (p: Page) => p.evaluate(() => (window as W).__settleTick());
const homesick = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homesickMigrate(nn), n);
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);

test('a dino a zone away from its closest friend drifts back toward it, and names the ache', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const friend = roster[1];

  // Bond alone↔friend (its only, therefore closest, friend), then send alone into the grove — its friend
  // stays in the bowl. A freshly-crossed dino has tenure 0, so it does not yet ache.
  await page.evaluate(
    ({ alone, friend }) => {
      const w = window as W;
      w.__bondPair(alone, friend, 20); // ≥ grief floor (8)
      w.__migrate(alone, 'grove');
    },
    { alone, friend },
  );
  expect(await homesick(page, alone)).toBeNull(); // tenure 0 < HOMESICK_ROLLS

  // Let it reside two migration rolls — long enough to ache.
  await settleTick(page);
  await settleTick(page);

  // Now it's homesick: it sets off back toward the bowl (one zone west toward the friend).
  expect(await homesick(page, alone)).toBe('bowl');
  expect(await page.evaluate(() => (window as W).__migrating() as string[])).toContain(alone);

  // The one-time memory names the friend it misses; the ticker floats the beat.
  const mem = await memory(page, alone);
  expect(mem.some((m: string) => m.includes(friend) && m.includes('miss'))).toBe(true);
  const events = await page.evaluate(() => (window as W).__events() as string[]);
  expect(events.some((e) => e.includes('🧭') && e.includes(friend))).toBe(true);

  expect(errors).toEqual([]);
});

test('homesickness overrides settling — a settled lonely dino still leaves for its friend', async ({ page }) => {
  await boot(page);
  const roster = await names(page);
  const alone = roster[0];
  const friend = roster[1];

  await page.evaluate(
    ({ alone, friend }) => {
      const w = window as W;
      w.__bondPair(alone, friend, 20);
      w.__migrate(alone, 'grove');
    },
    { alone, friend },
  );

  // Reside long enough to be *settled* (SETTLE_ROLLS = 4) — scenery would normally hold it here.
  for (let i = 0; i < 5; i++) await settleTick(page);
  expect(await page.evaluate((n) => (window as W).__settled(n) as boolean, alone)).toBe(true);

  // Company overrules scenery: the settled-but-lonely dino still drifts back toward its friend.
  expect(await homesick(page, alone)).toBe('bowl');
});

test('a dino whose closest friend shares its zone is not homesick (control)', async ({ page }) => {
  await boot(page);
  const roster = await names(page);
  const alone = roster[0];
  const friend = roster[1];

  // Both in the bowl; bond them and let alone settle. Its closest friend never left → no ache.
  await page.evaluate(({ alone, friend }) => (window as W).__bondPair(alone, friend, 20), { alone, friend });
  for (let i = 0; i < 5; i++) await settleTick(page);

  expect(await homesick(page, alone)).toBeNull();
});
