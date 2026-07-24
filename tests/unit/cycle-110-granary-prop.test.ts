import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

/**
 * Granary rig (BACKLOG-454) — the food-cap-lifting landmark drawn as a pixel prop, so a built-up zone's
 * granary reads as a domed storehouse instead of a bare 🏛️ glyph. Its own silhouette, neutral plaster/timber
 * (not a zone's bias colour), inside GBA palette discipline.
 */
describe('granary prop (BACKLOG-454)', () => {
  it('is registered so bakePropArt can resolve it', () => {
    expect(PROP_RIGS.granary).toBeDefined();
  });

  it('is a well-formed square grid inside palette discipline (≤ 8 colours, every char mapped)', () => {
    const rig = PROP_RIGS.granary;
    expect(rig.grid.length).toBe(rig.size);
    for (const row of rig.grid) expect(row.length).toBe(rig.size);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    for (const ch of propCharsUsed(rig.grid)) expect(rig.palette[ch]).toBeTypeOf('number');
  });

  it('has the storehouse silhouette parts: roof dome, plaster body, a door', () => {
    const used = propCharsUsed(PROP_RIGS.granary.grid);
    expect(used.has('r')).toBe(true); // timber roof-dome
    expect(used.has('b')).toBe(true); // plaster body
    expect(used.has('d')).toBe(true); // door frame
    expect(used.has('s')).toBe(true); // door interior shadow
  });

  it('uses a neutral body colour — not the frond gold or the branch wood a zone landmark uses', () => {
    expect(PROP_RIGS.granary.palette.b).not.toBe(PROP_RIGS.frond.palette.f);
    expect(PROP_RIGS.granary.palette.b).not.toBe(PROP_RIGS.branch.palette.w);
  });

  it('is its own grid — not the cairn, the lean-to, or the thatch', () => {
    const join = (n: string) => PROP_RIGS[n].grid.join('\n');
    expect(join('granary')).not.toBe(join('cairn'));
    expect(join('granary')).not.toBe(join('shelter'));
    expect(join('granary')).not.toBe(join('thatch'));
  });
});
