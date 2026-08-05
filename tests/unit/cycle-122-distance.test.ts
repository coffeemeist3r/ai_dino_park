import { describe, it, expect } from 'vitest';
import { zoneWant } from '../../game/src/ui/lenses';
import { pickFoodCarry } from '../../game/src/world/foodstore';
import { hopToward } from '../../game/src/world/distance';
import { yearnedZone, type LeftDays } from '../../game/src/world/yearning';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, ZONES } from '../../game/src/world/zones';

/**
 * BACKLOG-475 — distance on the chain: the three cross-zone reads that now measure it. The graph maths
 * live in `game/src/world/distance.test.ts`; this is what the maths *changed*.
 */
describe('the demand read prefers the nearest grower', () => {
  it('takes the nearer ground even when a farther one has grown more', () => {
    // The bowl grows berries. The grove (1 hop) grows greens; the Hollow (3 hops) grows mushrooms and has
    // out-farmed it four to one. Pre-475 the bowl asked the Hollow, clean across the park.
    const want = zoneWant(BOWL_ID, { [GROVE_ID]: 1, [HOLLOW_ID]: 4 });
    expect(want?.from).toBe(GROVE_ID);
    expect(want?.hops).toBe(1);
  });

  it('still lets the greater harvest decide between grounds equally far off', () => {
    // From the grove, the bowl and the Fernreach are both one hop away.
    expect(zoneWant(GROVE_ID, { [BOWL_ID]: 1, [FERNREACH_ID]: 5 })?.from).toBe(FERNREACH_ID);
    expect(zoneWant(GROVE_ID, { [BOWL_ID]: 5, [FERNREACH_ID]: 1 })?.from).toBe(BOWL_ID);
  });

  it('breaks a full tie in chain order, deterministically', () => {
    const first = zoneWant(GROVE_ID, { [BOWL_ID]: 3, [FERNREACH_ID]: 3 });
    expect(first?.from).toBe(BOWL_ID); // ZONES order, never a coin flip
    for (let i = 0; i < 5; i++) {
      expect(zoneWant(GROVE_ID, { [BOWL_ID]: 3, [FERNREACH_ID]: 3 })?.from).toBe(first?.from);
    }
  });

  it('wants nothing until somebody has actually grown a surplus (the 438 floor, intact)', () => {
    expect(zoneWant(BOWL_ID, {})).toBeNull();
    expect(zoneWant(BOWL_ID, { [GROVE_ID]: 0, [HOLLOW_ID]: 0 })).toBeNull();
  });

  it('never wants a crop it grows itself', () => {
    for (const z of ZONES) {
      const harvests = Object.fromEntries(ZONES.map((o) => [o.id, 3]));
      const want = zoneWant(z.id, harvests);
      expect(want?.from).not.toBe(z.id);
    }
  });
});

describe('the ferry is unchanged by distance', () => {
  it('still moves only toward the lighter side, whatever the want names', () => {
    const src = { greens: 3 };
    const dest = { greens: 1 };
    // wantId may now name a far grower's crop; the strict dest < src rule still governs.
    expect(pickFoodCarry(src, dest, 'mushrooms')).toBe('greens'); // want not stocked → fallback
    expect(pickFoodCarry(src, dest, 'greens')).toBe('greens');
    expect(pickFoodCarry({ greens: 1 }, { greens: 3 }, 'greens')).toBeNull(); // never uphill
  });
});

describe('a longing now reaches the far end of the chain', () => {
  const chain = ZONES.map((z) => z.id);

  it('misses a ground three hops away, and steps toward it one ground at a time', () => {
    const left: LeftDays = { Mossback: { [HOLLOW_ID]: 1 } };
    // pre-475 the candidate set was the home zone's neighbours, so this read null from the bowl
    const target = yearnedZone(left, 'Mossback', BOWL_ID, 9, chain, 3);
    expect(target).toBe(HOLLOW_ID);
    expect(hopToward(BOWL_ID, target!)).toBe(GROVE_ID);
    expect(hopToward(GROVE_ID, target!)).toBe(FERNREACH_ID);
    expect(hopToward(FERNREACH_ID, target!)).toBe(HOLLOW_ID);
  });

  it('is unchanged when the only stale ground is next door', () => {
    const left: LeftDays = { Sunny: { [GROVE_ID]: 1 } };
    const target = yearnedZone(left, 'Sunny', BOWL_ID, 9, chain, 3);
    expect(target).toBe(GROVE_ID);
    expect(hopToward(BOWL_ID, target!)).toBe(GROVE_ID); // the step *is* the target — byte-identical
  });

  it('still never longs for the ground it is standing in', () => {
    const left: LeftDays = { Rex: { [BOWL_ID]: 1, [GROVE_ID]: 2 } };
    expect(yearnedZone(left, 'Rex', BOWL_ID, 9, chain, 3)).toBe(GROVE_ID);
  });
});
