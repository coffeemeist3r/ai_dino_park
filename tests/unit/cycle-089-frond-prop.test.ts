import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

/**
 * Frond pixel prop (BACKLOG-419) — the Fernreach's frond (400) drawn as a baked prop instead of a bare
 * emoji glyph, a twin of the branch/stone rigs. Same discipline: square, palette ≤ 8, chars ⊆ palette,
 * visually its own thing.
 */
describe('BACKLOG-419 frond pixel prop', () => {
  it('registers a frond rig keyed to the ResourceKind', () => {
    expect(PROP_RIGS.frond).toBeDefined();
  });

  it('is a square grid with a disciplined palette (≤ 8 colours, all numbers)', () => {
    const rig = PROP_RIGS.frond;
    expect(rig.grid).toHaveLength(rig.size);
    for (const row of rig.grid) expect(row).toHaveLength(rig.size);
    const colours = Object.values(rig.palette);
    expect(colours.length).toBeLessThanOrEqual(8);
    for (const c of colours) expect(c).toBeTypeOf('number');
  });

  it('every drawn char maps to a palette colour (no stray chars)', () => {
    const rig = PROP_RIGS.frond;
    for (const ch of propCharsUsed(rig.grid)) expect(rig.palette[ch]).toBeTypeOf('number');
    expect(propCharsUsed(rig.grid).size).toBeGreaterThan(0); // non-empty
  });

  it('reads as its own prop, distinct from the branch and stone grids', () => {
    const frond = PROP_RIGS.frond.grid.join('\n');
    expect(frond).not.toBe(PROP_RIGS.branch.grid.join('\n'));
    expect(frond).not.toBe(PROP_RIGS.stone.grid.join('\n'));
  });
});
