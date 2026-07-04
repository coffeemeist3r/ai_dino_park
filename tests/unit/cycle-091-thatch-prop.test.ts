import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

/**
 * Frond thatch rig (BACKLOG-427) — the first stash-ahead: authored ahead of the 417 structure that
 * will raise it in the world. It must render standalone (registered, well-formed) without any world
 * wiring — that standalone-ness IS the stash-ahead rule's safety condition.
 */
describe('frond thatch prop (BACKLOG-427, stash-ahead)', () => {
  it('is registered so bakePropArt can resolve it standalone', () => {
    expect(PROP_RIGS.thatch).toBeDefined();
  });

  it('keeps the frond warm-gold family and stays inside GBA palette discipline', () => {
    const rig = PROP_RIGS.thatch;
    expect(rig.palette.f).toBe(PROP_RIGS.frond.palette.f); // woven of the same reeds
    expect(rig.palette.o).toBe(PROP_RIGS.frond.palette.o);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    for (const ch of propCharsUsed(rig.grid)) expect(rig.palette[ch]).toBeTypeOf('number');
  });

  it('has the cinched-stack silhouette parts: crown fringe, waist binding, base course', () => {
    const used = propCharsUsed(PROP_RIGS.thatch.grid);
    expect(used.has('t')).toBe(true); // seed-tip fringe
    expect(used.has('b')).toBe(true); // binding cord
    expect(used.has('d')).toBe(true); // shadowed base
  });

  it('is its own grid — not the cairn, the lean-to, or the frond it is built from', () => {
    const join = (n: string) => PROP_RIGS[n].grid.join('\n');
    expect(join('thatch')).not.toBe(join('cairn'));
    expect(join('thatch')).not.toBe(join('shelter'));
    expect(join('thatch')).not.toBe(join('frond'));
  });
});
