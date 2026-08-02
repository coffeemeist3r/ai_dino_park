import { describe, it, expect } from 'vitest';
import {
  CROP_SEASON,
  cropYield,
  harvestYieldLine,
  seasonCropLine,
  YIELD_BASE,
  YIELD_GOOD,
  YIELD_LEAN,
} from '../../game/src/world/cropseason';
import { SEASONS, type Season } from '../../game/src/world/seasons';
import { CROP_BY_ZONE, cropOf } from '../../game/src/world/plot';
import { FOODS } from '../../game/src/world/foods';

/**
 * Per-crop seasonal yield (BACKLOG-465) — the half 461 deferred. The table and its derived lines are pure;
 * WorldScene threads the yield into the harvest loop. These pin the table's *shape* (the rotation), the
 * spring hinge that keeps a fresh boot byte-identical, and the fact that the season-turn sentence is
 * generated from the table rather than written beside it.
 */

const FARMED = Object.keys(CROP_BY_ZONE).map((z) => CROP_BY_ZONE[z].food);
/** The three crops that existed before the fourth ground (BACKLOG-472) — what the spring hinge protects. */
const FOUNDING = ['berries', 'greens', 'roots'];

describe('cropYield (BACKLOG-465)', () => {
  it('is thick in a crop the good season, thin in its lean one, base otherwise', () => {
    for (const food of Object.keys(CROP_SEASON)) {
      const year = CROP_SEASON[food];
      expect(cropYield(food, year.good)).toBe(YIELD_GOOD);
      expect(cropYield(food, year.lean)).toBe(YIELD_LEAN);
      for (const s of SEASONS) {
        if (s !== year.good && s !== year.lean) expect(cropYield(food, s)).toBe(YIELD_BASE);
      }
    }
  });

  // BACKLOG-472 amended this from "every crop" to "the founding three". The hinge exists so that a fresh
  // boot (day 1, spring) banks exactly what it always banked; that is a statement about the crops that
  // existed before, and the Hollow's mushrooms did not. Its spring bounty changes nothing retroactively.
  it('leaves spring the hinge for the founding three — a fresh boot banks exactly what it always did', () => {
    for (const food of FOUNDING) expect(cropYield(food, 'spring')).toBe(YIELD_BASE);
    expect(cropYield('fish', 'spring')).toBe(YIELD_BASE);
  });

  it('yields the base in every season for a food with no row (the compatibility seam)', () => {
    for (const s of SEASONS) expect(cropYield('fish', s)).toBe(YIELD_BASE);
    for (const s of SEASONS) expect(cropYield('nonesuch', s)).toBe(YIELD_BASE);
  });

  // BACKLOG-472: with a fourth crop the rotation generalizes to all four seasons on the *good* side —
  // every season now has exactly one thriving ground, spring included. It does NOT stay one-thin-per-season,
  // and that is a decision: the founding three hold fall/winter/summer as their lean seasons, so the only
  // free lean slot was spring, which mushrooms already claims as its good. Squaring the table would have
  // meant re-pointing roots' lean at spring and breaking the hinge above. Fall carries two thin crops instead.
  it('rotates: every season has exactly one thriving crop; every season but spring has thin ones', () => {
    for (const s of SEASONS) {
      const good = FARMED.filter((f) => cropYield(f, s) === YIELD_GOOD);
      const lean = FARMED.filter((f) => cropYield(f, s) === YIELD_LEAN);
      expect(good, `${s} thriving`).toHaveLength(1);
      // Spring is the one season nothing goes thin — the hinge, still doing its job.
      if (s === 'spring') expect(lean).toHaveLength(0);
      else expect(lean.length, `${s} thin`).toBeGreaterThanOrEqual(1);
      expect(lean).not.toContain(good[0]);
    }
  });

  it('never leaves a crop good and lean in the same season', () => {
    for (const food of Object.keys(CROP_SEASON)) {
      expect(CROP_SEASON[food].good).not.toBe(CROP_SEASON[food].lean);
    }
  });

  it('gives every farmed zone crop a declared year (a new crop must declare one)', () => {
    for (const zone of Object.keys(CROP_BY_ZONE)) {
      expect(CROP_SEASON[cropOf(zone).food]).toBeDefined();
    }
  });
});

describe('harvestYieldLine (BACKLOG-465)', () => {
  it('is silent at the base yield — a spring harvest reads exactly as it did before 465', () => {
    expect(harvestYieldLine('🍓', 'berries', 'spring')).toBe('');
    expect(harvestYieldLine('🍓', 'fish', 'winter')).toBe('');
  });

  it('says thick in a good season and lean in a lean one, carrying the crop glyph and label', () => {
    const thick = harvestYieldLine('🍓', 'berries', 'summer');
    expect(thick).toContain('thick');
    expect(thick).toContain('🍓');
    expect(thick).toContain(FOODS.find((f) => f.id === 'berries')!.label);

    const thin = harvestYieldLine('🥬', 'greens', 'winter');
    expect(thin).toContain('lean');
    expect(thin).toContain('🥬');
    expect(thin).toContain(FOODS.find((f) => f.id === 'greens')!.label);
  });
});

describe('seasonCropLine (BACKLOG-465)', () => {
  // BACKLOG-472: spring now has a thriving crop but still no thin one, so the sentence — which names both —
  // stays silent. The Hollow's spring bounty is announced where it happens, on the harvest line.
  it('is silent in spring — something thrives, but nothing goes thin', () => {
    expect(seasonCropLine('spring')).toBe('');
  });

  it('names this season winner and *every* loser, straight off the table', () => {
    for (const s of SEASONS.filter((x) => x !== 'spring') as Season[]) {
      const line = seasonCropLine(s);
      const good = FARMED.find((f) => cropYield(f, s) === YIELD_GOOD)!;
      expect(line).toContain(FOODS.find((f) => f.id === good)!.label);
      // BACKLOG-472: fall thins two crops; the line names them all rather than whichever comes first.
      for (const lean of FARMED.filter((f) => cropYield(f, s) === YIELD_LEAN)) {
        expect(line).toContain(FOODS.find((f) => f.id === lean)!.label);
      }
      expect(line).toContain(s);
    }
  });
});
