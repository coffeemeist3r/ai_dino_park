import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';
import { FOODS } from '../../game/src/world/foods';

/**
 * The hunk of meat and the leafy greens (BACKLOG-490, 4 of 7).
 *
 * The generic discipline — square grid, ≤ 8 colours, a dark `o` outline, actually draws something — is
 * already asserted for every entry in `PROP_RIGS` by `cycle-066-propart.test.ts`. What is pinned here is
 * the *reading*: each of these two rigs had a first draft that was a plausible picture of the wrong thing,
 * and the fix in both cases was one distinguishing feature. A test that only checked "it is a grid" would
 * have passed the drafts too.
 */
describe('BACKLOG-490 — meat and greens', () => {
  it('both are keyed against real FOODS ids', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    expect(ids.has('meat')).toBe(true);
    expect(ids.has('greens')).toBe(true);
    expect(PROP_RIGS.food_meat).toBeDefined();
    expect(PROP_RIGS.food_greens).toBeDefined();
  });

  it('the meat reads as meat because of the bone, and as flesh because of the marbling', () => {
    const rig = PROP_RIGS.food_meat;
    const used = propCharsUsed(rig.grid);
    // The knuckle: its own outline + body, and it must sit *above* the muscle mass rather than inside it —
    // a bone drawn through the middle is a stripe, and a stripe on a red oval is a chilli.
    expect(used.has('B')).toBe(true);
    expect(used.has('b')).toBe(true);
    const firstBone = rig.grid.findIndex((r) => r.includes('B'));
    const firstMuscle = rig.grid.findIndex((r) => r.includes('r'));
    expect(firstBone).toBeLessThan(firstMuscle);
    // The marbling, which is what stops a solid red field reading as the berries two tiles away in the
    // same hatch. More than one streak, or it is a highlight rather than marbling.
    const marbled = rig.grid.filter((r) => r.includes('m')).length;
    expect(marbled).toBeGreaterThan(1);
  });

  it('the greens are cut and bound, not growing — the twine is the whole distinction', () => {
    const rig = PROP_RIGS.food_greens;
    expect(propCharsUsed(rig.grid).has('t')).toBe(true);
    // The tie sits below every leaf and above the cut stem: a bundle has an order to it.
    const lastLeaf = rig.grid.map((r) => r.includes('G')).lastIndexOf(true);
    const tie = rig.grid.findIndex((r) => r.includes('t'));
    const stem = rig.grid.findIndex((r) => r.includes('s'));
    expect(tie).toBeGreaterThan(lastLeaf);
    expect(stem).toBeGreaterThan(tie);
  });

  it('neither is a recolour of the plants this park already draws', () => {
    const join = (n: string) => PROP_RIGS[n].grid.join('\n');
    for (const fresh of ['food_meat', 'food_greens']) {
      for (const old of ['frond', 'crop_ripe_greens', 'crop_ripe', 'food_berries', 'food_fish']) {
        expect(join(fresh)).not.toBe(join(old));
      }
    }
  });

  it('the roster is still deliberately partial — the emoji fallback stays a live control', () => {
    const drawn = Object.keys(PROP_RIGS).filter((k) => k.startsWith('food_')).length;
    expect(drawn).toBe(4);
    expect(drawn).toBeLessThan(FOODS.length); // when this fails, 490 is complete: close it
  });
});
