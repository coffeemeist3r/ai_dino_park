import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

describe('resource + cairn pixel props (BACKLOG-296)', () => {
  it('draws branch, stone, frond, and cairn (+ the crop stages, BACKLOG-317/419/418; + the stashed thatch, 427)', () => {
    expect(Object.keys(PROP_RIGS).sort()).toEqual([
      'branch',
      'cairn',
      'cairn_derelict', // BACKLOG-494
      'crop_ripe',
      'crop_ripe_greens', // BACKLOG-418: the grove's greens crop, stashed ahead of the drawPlotSprite wiring
      'crop_ripe_roots', // BACKLOG-432: the Fernreach's roots crop
      'crop_seed',
      'crop_sprout',
      'egg', // BACKLOG-491: the egg by the den
      'food_berries', // BACKLOG-490
      'food_fish', // BACKLOG-490: keyed `food_<id>` so `dropFood` looks one up per piece
      'food_greens', // BACKLOG-490 (cycle 137)
      'food_meat', // BACKLOG-490 (cycle 137)
      'food_mushrooms', // BACKLOG-490 (cycle 140-art — 7 of 7, the food roster closes)
      'food_roots', // BACKLOG-490 (cycle 140-art)
      'food_seeds', // BACKLOG-490 (cycle 140-art)
      'frond',
      'granary', // BACKLOG-454: the food-cap-lifting granary landmark
      'granary_derelict', // BACKLOG-494 (4 of 4, cycle 139 — the cracked dome)
      'shelter',
      'shelter_derelict', // BACKLOG-494
      'stone',
      'thatch',
      'thatch_derelict', // BACKLOG-494 (4 of 4, cycle 139 — the unravelled stack)
      'tic_circle', // BACKLOG-496: the ritual's trodden ring
      'tic_pace', // BACKLOG-496: the ritual's two-tile scuff (fuss stays undrawn — the per-kind fallback control)
    ]);
  });

  for (const [name, rig] of Object.entries(PROP_RIGS)) {
    describe(name, () => {
      it('is a square grid of `size` rows, each `size` chars wide', () => {
        expect(rig.grid.length).toBe(rig.size);
        for (const row of rig.grid) expect(row.length).toBe(rig.size);
      });

      it('every non-transparent char has a palette color, ≤ 8 colors (GBA discipline)', () => {
        const used = propCharsUsed(rig.grid);
        for (const ch of used) expect(rig.palette[ch]).toBeTypeOf('number');
        expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
      });

      it('is non-empty (actually draws something)', () => {
        expect(propCharsUsed(rig.grid).size).toBeGreaterThan(0);
      });

      // BACKLOG-496 amends this, narrowly. Every prop in this file until now stands *on* the ground and
      // needs a dark outline to cut its silhouette out of the grass. The `tic_*` marks are worn *into* the
      // ground, and a near-black edge on one reads as a hole in the world rather than a bald patch. The
      // discipline is replaced rather than dropped: `cycle-138-ticground-art` asserts the opposite property
      // (no colour in either palette is anywhere near black) so neither rig can quietly grow one.
      const isGroundMark = name.startsWith('tic_');
      it.skipIf(isGroundMark)('has a dark outline char `o`', () => {
        expect(rig.palette.o).toBeTypeOf('number');
        expect(propCharsUsed(rig.grid).has('o')).toBe(true);
      });
    });
  }

  it('the three props are visually distinct (different pixel grids)', () => {
    const join = (n: string) => PROP_RIGS[n].grid.join('\n');
    expect(join('branch')).not.toBe(join('stone'));
    expect(join('stone')).not.toBe(join('cairn'));
    expect(join('branch')).not.toBe(join('cairn'));
  });

  it('the lean-to shelter is its own distinct grid (BACKLOG-344)', () => {
    const join = (n: string) => PROP_RIGS[n].grid.join('\n');
    expect(join('shelter')).not.toBe(join('cairn'));
    expect(join('shelter')).not.toBe(join('branch'));
  });
});
