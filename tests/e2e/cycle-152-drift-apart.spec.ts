import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { AWAY_BEAT_MIN_MINUTES } from '../../game/src/world/away';

type W = Record<string, unknown>;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[] };

const bonds = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__bonds as () => Record<string, number>)());

/**
 * BACKLOG-113 — the absence has a cold half, and it is reachable.
 *
 * The reachability half of this item is the whole reason it is here rather than in a unit file. Until this
 * cycle the away digest's drift beats were gated on a whole in-game day, an offline gap replays at
 * `AWAY_SCALE = 1`, and so the digest a player has actually seen — for a hundred and twenty cycles — read
 * "Barely long enough to notice" and nothing else. This spec steps away for the shortest gap the park now
 * counts and asserts the digest says two things about it.
 */
test('a five-minute step away comes back with a warm line and a cold one', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  // One companion pair (8 = the company threshold) and one acquaintance pair inside the band.
  const seeded = await page.evaluate(() => {
    const w = window as W;
    const bond = w.__bondPair as (a: string, b: string, amount?: number) => number;
    return { warm: bond('Rex', 'Glade'), cold: bond('Rex', 'Twitch', 4) };
  });
  expect(seeded.warm).toBe(8);
  expect(seeded.cold).toBe(4);

  const result = await page.evaluate(
    (ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms),
    AWAY_BEAT_MIN_MINUTES * 60_000,
  );

  // Under a day — the gate that used to silence this entirely.
  expect(result.days).toBe(0);
  expect(result.digest.some((l) => l.includes('Barely'))).toBe(false);
  expect(result.digest.some((l) => l.includes('grew closer'))).toBe(true);
  expect(result.digest.some((l) => l.includes('drifted apart'))).toBe(true);

  const after = await bonds(page);
  expect(after['Glade|Rex']).toBe(9); // the companions closed by one
  expect(after['Rex|Twitch']).toBe(3); // and the acquaintances opened by one
});

test('two dinos who have never met come back exactly as they were', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const before = await bonds(page);
  await page.evaluate(
    (ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms),
    AWAY_BEAT_MIN_MINUTES * 60_000,
  );
  const after = await bonds(page);

  // No entry invented for a pair the park has no bond for, and nothing driven negative.
  expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
  expect(Object.values(after).every((v) => v >= 0)).toBe(true);
});
