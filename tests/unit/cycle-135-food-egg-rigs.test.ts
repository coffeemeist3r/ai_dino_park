import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';
import { FOODS } from '../../game/src/world/foods';

/**
 * The food the hatch drops (BACKLOG-490) and the egg by the den (BACKLOG-491).
 *
 * The shared grid/palette/outline discipline is already asserted for every entry in `PROP_RIGS` by
 * `cycle-066-propart.test.ts`, which loops the whole roster — these rigs inherit it by existing. What is
 * pinned here is what is specific: the `food_<id>` key contract that lets `dropFood` fall back per piece,
 * and that each new rig actually draws something of its own.
 */
describe('BACKLOG-490 / 491 — the dropped food and the egg', () => {
  it('food rigs are keyed `food_<id>` against a real FOODS id', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    const foodKeys = Object.keys(PROP_RIGS).filter((k) => k.startsWith('food_'));
    expect(foodKeys.length).toBeGreaterThan(0);
    for (const k of foodKeys) expect(ids.has(k.slice('food_'.length))).toBe(true);
  });

  it('the roster is complete — every food the hatch drops has a rig (BACKLOG-490, cycle 140-art)', () => {
    // This assertion is the inverse of the one it replaces, and the flip is the point: 490 shipped in three
    // fires against a `drawn < FOODS.length` guard that said "if this ever fails, close it". It failed.
    // Every id in FOODS now bakes, so a food added later without a rig is what the fallback is for.
    const drawn = Object.keys(PROP_RIGS).filter((k) => k.startsWith('food_'));
    expect(drawn.sort()).toEqual(FOODS.map((f) => `food_${f.id}`).sort());
  });

  it('keeps the per-item fallback live — an unknown food id resolves no rig', () => {
    // The control the partial roster used to provide, moved somewhere it cannot be closed out from under:
    // `dropFood` looks up `food_<id>` and keeps the emoji when there is no rig, and that path must stay
    // reachable now that the seven real ids all have one.
    expect(PROP_RIGS['food_nothing-the-park-has-ever-dropped']).toBeUndefined();
  });

  it('no two foods are the same picture — seven ids, seven silhouettes', () => {
    // The whole point of drawing them at all. `food_roots` in particular must not be `crop_ripe_roots`
    // again: what the hatch drops is cut, and the crop is growing out of soil.
    const grids = FOODS.map((f) => PROP_RIGS[`food_${f.id}`].grid.join('\n'));
    expect(new Set(grids).size).toBe(FOODS.length);
    expect(PROP_RIGS.food_roots.grid.join('\n')).not.toBe(PROP_RIGS.crop_ripe_roots.grid.join('\n'));
  });

  it('the egg is set down, not floating — it draws a ground-shadow row under the shell', () => {
    const rig = PROP_RIGS.egg;
    expect(rig).toBeDefined();
    expect(propCharsUsed(rig.grid).has('s')).toBe(true);
    const shadowRow = rig.grid.findIndex((r) => r.includes('s'));
    const outlineEnd = rig.grid.map((r) => r.includes('o')).lastIndexOf(true);
    expect(shadowRow).toBeGreaterThan(outlineEnd - 1); // the shadow sits at or below the shell's base
  });

  it('every new rig is distinct from the props that were already there', () => {
    const join = (n: string) => PROP_RIGS[n].grid.join('\n');
    for (const fresh of ['food_fish', 'food_berries', 'food_roots', 'food_mushrooms', 'food_seeds', 'egg']) {
      for (const old of ['branch', 'stone', 'cairn', 'granary', 'crop_ripe']) {
        expect(join(fresh)).not.toBe(join(old));
      }
    }
  });
});
