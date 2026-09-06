import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { FOUNDING_LANDMARKS, FOUNDING_RUIN } from '../../game/src/world/founding';

type W = Record<string, unknown>;
type LM = { zone: string; tileX: number; tileY: number; derelict: boolean };

/**
 * BACKLOG-528 — the skyline a fresh park actually ships, read first-hand.
 *
 * The stepped half of the reachability register found that the founding world placed exactly one landmark
 * and it was the fallen cairn, so `upkeepDue` was zero on every ground of every fresh save this park has
 * ever written — the whole upkeep economy of BACKLOG-480 dormant by calibration, and called a virtue in
 * `upkeep.ts`'s own header. This is what a player sees for the fix: walk one edge east and there are two
 * landmarks on the Grove, one standing and one down, where the suite has only ever seen the one.
 */
test('the Grove ships something standing beside the thing that fell', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const grove = (await page.evaluate(
    (z) => ((window as W).__landmarks as (z: string) => LM[])(z),
    FOUNDING_RUIN.zone,
  )) as LM[];

  expect(grove.length).toBe(1 + FOUNDING_LANDMARKS.length);
  expect(grove.filter((l) => l.derelict).length).toBe(1);

  const standing = grove.filter((l) => !l.derelict);
  expect(standing.length).toBe(FOUNDING_LANDMARKS.length);
  for (const l of FOUNDING_LANDMARKS) {
    expect(standing.some((s) => s.tileX === l.tileX && s.tileY === l.tileY)).toBe(true);
  }
});

/**
 * And the bill it owes. `__standing` and `__runUpkeep` are the production reads — the same pass the live
 * day boundary fires — so this asserts what the park charges rather than what a constant says it would.
 */
test('and once the ruin is back up, that ground is billed for it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const zone = FOUNDING_RUIN.zone;
  const before = await page.evaluate((z) => {
    const w = window as W;
    return {
      standing: (w.__standing as (z: string) => number)(z),
      pile: (w.__pilesByZone as () => Record<string, Record<string, number>>)()[z] ?? {},
    };
  }, zone);

  // A landmark standing on the first frame, and the ruin still down — one short of the bill's floor.
  expect(before.standing).toBe(FOUNDING_LANDMARKS.length);

  // Mend it, the way a resident would. `checkMend` is in-view only on purpose — a beat nobody is present
  // for is what CHARTER v7 was written about — so stand on the ground first, which is also exactly what
  // the player does: walk one edge east. `__stepMend` advances the errand one step, so walk it out.
  await page.evaluate((z) => ((window as W).__setZone as (id: string) => void)(z), zone);
  await page.evaluate(() => {
    const step = (window as W).__stepMend as () => unknown;
    for (let i = 0; i < 80; i++) step();
  });
  const mended = await page.evaluate((z) => {
    const w = window as W;
    return {
      standing: (w.__standing as (z: string) => number)(z),
      pile: (w.__pilesByZone as () => Record<string, Record<string, number>>)()[z] ?? {},
    };
  }, zone);

  expect(mended.standing).toBe(before.standing + 1);
  const total = (p: Record<string, number>) => Object.values(p).reduce((a, b) => a + b, 0);
  expect(total(mended.pile)).toBe(total(before.pile) - 1); // the mend came out of the heap

  await page.evaluate(() => ((window as W).__runUpkeep as (d?: number) => string[])());
  const after = await page.evaluate(
    (z) => ((window as W).__pilesByZone as () => Record<string, Record<string, number>>)()[z] ?? {},
    zone,
  );
  expect(total(after)).toBeLessThan(total(mended.pile)); // the first upkeep bill this park has ever charged
});
