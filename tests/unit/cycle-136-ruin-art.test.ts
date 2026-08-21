import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

/**
 * Ruin rigs (BACKLOG-494). 480 drew disrepair by turning a landmark's own sprite down to 45% alpha, which
 * reads as fog rather than ruin. Two of the four landmarks now have a fallen twin of their own.
 *
 * The naming convention is load-bearing: `bakeRuinArt` looks a ruin up as `<name>_derelict`, so drawing the
 * remaining two is a rig plus a registry line and no wiring at all.
 */
const RUINS = ['cairn_derelict', 'shelter_derelict'] as const;

describe.each(RUINS)('%s', (name) => {
  const rig = PROP_RIGS[name];

  it('is registered', () => {
    expect(rig).toBeDefined();
  });

  it('is a square grid of its declared size', () => {
    expect(rig.grid.length).toBe(rig.size);
    for (const row of rig.grid) expect(row.length).toBe(rig.size);
  });

  it('keeps GBA palette discipline (<= 8 colours)', () => {
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
  });

  it('every drawn char has a colour, and every colour is drawn', () => {
    const used = propCharsUsed(rig.grid);
    for (const ch of used) expect(rig.palette[ch]).toBeDefined();
    for (const ch of Object.keys(rig.palette)) expect(used.has(ch)).toBe(true);
  });

  it('actually draws something', () => {
    expect(propCharsUsed(rig.grid).size).toBeGreaterThan(1);
  });

  it('shares its intact twin s palette — a ruin is the same stone, not a greyer one', () => {
    const intact = PROP_RIGS[name.replace('_derelict', '')];
    expect(intact).toBeDefined();
    for (const [ch, colour] of Object.entries(rig.palette)) {
      if (intact.palette[ch] !== undefined) expect(intact.palette[ch]).toBe(colour);
    }
  });
});

describe('a ruin is not the same shape, shorter', () => {
  /**
   * The silhouette rule from the rigs own header. A cairn missing its top course just reads as a smaller
   * cairn; what says "this fell over" is material lying on the ground *beside* the thing, out where nobody
   * stacked it. So the ruin must occupy columns the intact rig leaves empty.
   */
  it('the toppled cairn spills into columns the standing one never used', () => {
    const cols = (rig: { grid: ReadonlyArray<string> }) => {
      const used = new Set<number>();
      rig.grid.forEach((row) => [...row].forEach((ch, x) => ch !== '.' && used.add(x)));
      return used;
    };
    const standing = cols(PROP_RIGS.cairn);
    const fallen = cols(PROP_RIGS.cairn_derelict);
    expect([...fallen].some((x) => !standing.has(x))).toBe(true);
  });

  it('and it is shorter — the stack came down', () => {
    const topRow = (rig: { grid: ReadonlyArray<string> }) =>
      rig.grid.findIndex((row) => [...row].some((ch) => ch !== '.'));
    expect(topRow(PROP_RIGS.cairn_derelict)).toBeGreaterThan(topRow(PROP_RIGS.cairn));
  });
});
