import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';
import { ripeRigKey } from '../../game/src/world/plot';

/**
 * Ripe roots rig (BACKLOG-432) — the Fernreach's crop gets its own pixel rig, so all three zones' ripe
 * plots bake a distinct prop instead of the Fernreach falling back to its 🍠 glyph. Twin of the grove
 * greens rig (cycle 95): a plump orange tuber over the shared soil mound, no berry-red.
 */
describe('ripe roots rig (BACKLOG-432)', () => {
  const roots = () => PROP_RIGS.crop_ripe_roots;

  it('drawPlotSprite resolves the Fernreach crop to a real rig (no glyph fallback)', () => {
    expect(ripeRigKey('roots')).toBe('crop_ripe_roots');
    expect(PROP_RIGS[ripeRigKey('roots')]).toBeDefined();
  });

  it('is a distinct grid from the berry bush and the greens head', () => {
    expect(roots().grid.join('\n')).not.toBe(PROP_RIGS.crop_ripe.grid.join('\n'));
    expect(roots().grid.join('\n')).not.toBe(PROP_RIGS.crop_ripe_greens.grid.join('\n'));
  });

  it('the bulk is the root, not berries — an orange tuber, no berry-red', () => {
    const chars = propCharsUsed(roots().grid);
    expect(chars.has('r')).toBe(false); // no berry
    expect(chars.has('t')).toBe(true); // root body
    expect(roots().palette.t).toBeTypeOf('number');
  });

  it('shares the soil mound (o/m/h) and stays leafy (l) like the other crops', () => {
    const chars = propCharsUsed(roots().grid);
    for (const ch of ['o', 'm', 'h', 'l']) expect(chars.has(ch)).toBe(true);
  });

  it('keeps GBA palette discipline (≤ 8 colours)', () => {
    expect(Object.keys(roots().palette).length).toBeLessThanOrEqual(8);
  });
});
