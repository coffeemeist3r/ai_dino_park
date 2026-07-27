import { describe, it, expect } from 'vitest';
import { seasonGrip, seasonGripLine, SEASONS } from './seasons';
import { spoilFood, spoilsAtCap, SPOIL_MARGIN } from './spoilage';
import { FOOD_STOCKPILE_CAP, type FoodPile } from './foodstore';

/**
 * The lean season (BACKLOG-461) — the year's grip on the food economy. The grip is a pure per-season
 * modifier; the seasonal cap/margin are threaded by WorldScene, so these tests pin the pure pieces:
 * `seasonGrip` and `spoilFood`'s new margin knob behaving as the grip intends.
 */

describe('seasonGrip (BACKLOG-461)', () => {
  it('is lean in winter, plenty in summer/fall, neutral in spring', () => {
    expect(seasonGrip('winter')).toEqual({ capDelta: -1, spoilMarginDelta: 1 });
    expect(seasonGrip('summer')).toEqual({ capDelta: 1, spoilMarginDelta: -1 });
    expect(seasonGrip('fall')).toEqual({ capDelta: 1, spoilMarginDelta: -1 });
    expect(seasonGrip('spring')).toEqual({ capDelta: 0, spoilMarginDelta: 0 });
  });

  it('covers every season (no undefined grip)', () => {
    for (const s of SEASONS) expect(seasonGrip(s)).toBeDefined();
  });

  it('announces the shift for the charged seasons, stays silent in spring', () => {
    expect(seasonGripLine('winter')).toContain('tightens');
    expect(seasonGripLine('summer')).toContain('eases');
    expect(seasonGripLine('fall')).toContain('eases');
    expect(seasonGripLine('spring')).toBe('');
  });
});

describe('spoilFood seasonal margin (BACKLOG-461)', () => {
  const cap = FOOD_STOCKPILE_CAP; // 6

  it('the default margin is unchanged (every existing caller byte-identical)', () => {
    // 5 spoils at the flat margin, 4 is the safe floor.
    expect(spoilsAtCap(5, cap)).toBe(true);
    expect(spoilsAtCap(4, cap)).toBe(false);
    expect(spoilFood({ berries: 5 }, cap).berries).toBe(4);
  });

  it('a widened (lean-season) margin bleeds sooner and to a deeper floor', () => {
    const winterMargin = SPOIL_MARGIN + seasonGrip('winter').spoilMarginDelta; // 2
    // 4 is safe at the flat margin but spoils in winter (band widened to cap-2 = 4).
    expect(spoilsAtCap(4, cap)).toBe(false);
    expect(spoilsAtCap(4, cap, winterMargin)).toBe(true);
    // A hoard bleeds 6→5→4→3 and settles at the winter floor (cap - margin - 1 = 3).
    let p: FoodPile = { berries: cap };
    for (let i = 0; i < 5; i++) p = spoilFood(p, cap, winterMargin);
    expect(p.berries).toBe(3);
  });

  it('a narrowed (plenty-season) margin spoils only at the very cap', () => {
    const summerMargin = SPOIL_MARGIN + seasonGrip('summer').spoilMarginDelta; // 0
    expect(spoilsAtCap(cap - 1, cap, summerMargin)).toBe(false); // 5 is safe in summer
    expect(spoilsAtCap(cap, cap, summerMargin)).toBe(true); // only the very cap bleeds
    // A pile below cap is untouched; a pile at cap drops to cap-1 and then holds.
    expect(spoilFood({ berries: cap - 1 }, cap, summerMargin)).toEqual({ berries: cap - 1 });
    expect(spoilFood({ berries: cap }, cap, summerMargin).berries).toBe(cap - 1);
  });

  it('a negative net margin is floored at 0 (never spoils below the cap)', () => {
    // Guard: spoilsAtCap floors margin, so a hypothetical over-narrowed band can't spoil a pile under cap.
    expect(spoilsAtCap(cap - 1, cap, -5)).toBe(false);
    expect(spoilsAtCap(cap, cap, -5)).toBe(true);
  });
});
