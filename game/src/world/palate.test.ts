import { describe, it, expect } from 'vitest';
import { FOODS } from './foods';
import { WARM_AT, isWarm, justWarmed, mealCount, noteMeal, warmedTo } from './palate';

/**
 * BACKLOG-068 — acquired taste. A palate is a habit, not a fact.
 */
describe('the warming record', () => {
  it('an unknown dino has eaten nothing and has come round to nothing', () => {
    expect(mealCount({}, 'nobody', 'greens')).toBe(0);
    expect(isWarm({}, 'nobody', 'greens')).toBe(false);
    expect(warmedTo({}, 'nobody')).toEqual([]);
  });

  it('two meals of the same food is not warm; the third is', () => {
    let rec = {};
    for (let i = 0; i < WARM_AT - 1; i++) rec = noteMeal(rec, 'Rex', 'greens');
    expect(isWarm(rec, 'Rex', 'greens')).toBe(false);
    rec = noteMeal(rec, 'Rex', 'greens');
    expect(isWarm(rec, 'Rex', 'greens')).toBe(true);
  });

  it('three different foods, once each, warms the dino to nothing', () => {
    let rec = {};
    for (const f of FOODS.slice(0, WARM_AT)) rec = noteMeal(rec, 'Rex', f.id);
    expect(warmedTo(rec, 'Rex')).toEqual([]);
  });

  it('a warming is one dino only — the keeper has to do it again for the next one', () => {
    let rec = {};
    for (let i = 0; i < WARM_AT; i++) rec = noteMeal(rec, 'Rex', 'greens');
    expect(isWarm(rec, 'Rex', 'greens')).toBe(true);
    expect(isWarm(rec, 'Mossback', 'greens')).toBe(false);
  });

  it('returns the same object once the count is at WARM_AT — the identity contract the save leans on', () => {
    let rec = {};
    for (let i = 0; i < WARM_AT; i++) rec = noteMeal(rec, 'Rex', 'greens');
    expect(noteMeal(rec, 'Rex', 'greens')).toBe(rec);
  });

  it('never mutates its input', () => {
    const before = { Rex: { greens: 1 } };
    const snapshot = JSON.stringify(before);
    noteMeal(before, 'Rex', 'greens');
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('justWarmed', () => {
  it('is true on exactly the crossing meal, and false either side of it', () => {
    let rec: Record<string, Record<string, number>> = {};
    for (let i = 0; i < WARM_AT - 1; i++) {
      const next = noteMeal(rec, 'Rex', 'greens');
      expect(justWarmed(rec, next, 'Rex', 'greens'), `meal ${i + 1}`).toBe(false);
      rec = next as Record<string, Record<string, number>>;
    }
    const crossing = noteMeal(rec, 'Rex', 'greens');
    expect(justWarmed(rec, crossing, 'Rex', 'greens')).toBe(true);
    expect(justWarmed(crossing, noteMeal(crossing, 'Rex', 'greens'), 'Rex', 'greens')).toBe(false);
  });
});

describe('warmedTo', () => {
  it('omits whatever is currently the favorite, so one food never reads two clauses at once', () => {
    let rec = {};
    for (let i = 0; i < WARM_AT; i++) rec = noteMeal(rec, 'Rex', 'greens');
    expect(warmedTo(rec, 'Rex')).toEqual(['greens']);
    expect(warmedTo(rec, 'Rex', 'greens')).toEqual([]);
  });

  it('answers in FOODS order, like every other food-set read in this park', () => {
    let rec = {};
    // Fed in reverse FOODS order on purpose — the answer must not be insertion order.
    for (const f of [...FOODS].reverse()) for (let i = 0; i < WARM_AT; i++) rec = noteMeal(rec, 'Rex', f.id);
    expect(warmedTo(rec, 'Rex')).toEqual(FOODS.map((f) => f.id));
  });
});
