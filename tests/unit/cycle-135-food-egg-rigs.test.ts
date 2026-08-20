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

  it('the roster is deliberately partial — the per-item emoji fallback is the shipping path', () => {
    const drawn = Object.keys(PROP_RIGS).filter((k) => k.startsWith('food_')).length;
    expect(drawn).toBeLessThan(FOODS.length); // if this ever fails, 490 is complete: close it
  });

  it('fish and berries are the two drawn first, and are not the same picture', () => {
    expect(PROP_RIGS.food_fish).toBeDefined();
    expect(PROP_RIGS.food_berries).toBeDefined();
    expect(PROP_RIGS.food_fish.grid.join('\n')).not.toBe(PROP_RIGS.food_berries.grid.join('\n'));
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
    for (const fresh of ['food_fish', 'food_berries', 'egg']) {
      for (const old of ['branch', 'stone', 'cairn', 'granary', 'crop_ripe']) {
        expect(join(fresh)).not.toBe(join(old));
      }
    }
  });
});
