import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

/** Plot crop-stage pixel props (BACKLOG-317): keyed crop_<CropStage> so bakePropArt resolves them. */
const STAGES = ['crop_seed', 'crop_sprout', 'crop_ripe'] as const;

describe('plot crop-stage props (BACKLOG-317)', () => {
  it('registers a rig per crop stage', () => {
    for (const k of STAGES) expect(PROP_RIGS[k]).toBeDefined();
  });

  it('the three stages are visually distinct grids', () => {
    const [seed, sprout, ripe] = STAGES.map((k) => PROP_RIGS[k].grid.join('\n'));
    expect(seed).not.toBe(sprout);
    expect(sprout).not.toBe(ripe);
    expect(seed).not.toBe(ripe);
  });

  it('the plant grows — sprout adds leaf-green, ripe adds berry-red over the shared soil', () => {
    expect(propCharsUsed(PROP_RIGS.crop_seed.grid).has('s')).toBe(true); // seed speck
    expect(PROP_RIGS.crop_sprout.palette.l).toBeTypeOf('number'); // leaf colour
    expect(propCharsUsed(PROP_RIGS.crop_sprout.grid).has('l')).toBe(true);
    expect(PROP_RIGS.crop_ripe.palette.r).toBeTypeOf('number'); // berry colour
    expect(propCharsUsed(PROP_RIGS.crop_ripe.grid).has('r')).toBe(true);
    // all three share the soil mound (o/m/h)
    for (const k of STAGES) for (const ch of ['o', 'm', 'h']) {
      expect(propCharsUsed(PROP_RIGS[k].grid).has(ch)).toBe(true);
    }
  });
});
