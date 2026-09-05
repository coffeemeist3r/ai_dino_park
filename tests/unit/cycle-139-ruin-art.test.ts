import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

/**
 * The last two ruin rigs (BACKLOG-494 — 4 of 4).
 *
 * Cycle 136 drew the toppled cairn and the caved lean-to; the thatch and the granary kept 480's alpha fade,
 * which reads as fog rather than ruin. With all four drawn, the fade is retired as a *rendering* and lives
 * on only as the per-landmark fallback for a landmark nobody has drawn yet.
 *
 * This generalises `cycle-136-ruin-art.test.ts` from the cairn to **every** registered ruin: the naming
 * convention `bakeRuinArt` looks a ruin up by, the shared-palette rule, and the silhouette rule the rigs'
 * own header states — a ruin is not the same shape, shorter, so it must spill into columns the standing
 * rig never used *and* start lower than the standing rig's crown.
 */

const RUINS = Object.keys(PROP_RIGS).filter((k) => k.endsWith('_derelict'));

// Amended cycle 151-art (BACKLOG-532): five, not four. The beacon was the one landmark whose derelict
// state was the lit rig at `DERELICT_ALPHA`, and on a ground made of black glass that reads as night.
it('all five landmarks now have a fallen twin', () => {
  expect(RUINS.sort()).toEqual([
    'beacon_derelict',
    'cairn_derelict',
    'granary_derelict',
    'shelter_derelict',
    'thatch_derelict',
  ]);
});

describe.each(RUINS)('%s', (name) => {
  const rig = PROP_RIGS[name];
  const intact = PROP_RIGS[name.replace('_derelict', '')];

  it('names a rig that is actually registered', () => {
    expect(rig).toBeDefined();
    expect(intact).toBeDefined();
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

  it('shares its intact twin s palette — a ruin is the same material, not a greyer one', () => {
    for (const [ch, colour] of Object.entries(rig.palette)) {
      if (intact.palette[ch] !== undefined) expect(intact.palette[ch]).toBe(colour);
    }
  });

  /** The silhouette rule, now asked of every ruin rather than only the cairn. */
  it('spills into columns the standing rig never used', () => {
    const cols = (g: ReadonlyArray<string>) => {
      const used = new Set<number>();
      g.forEach((row) => [...row].forEach((ch, x) => ch !== '.' && used.add(x)));
      return used;
    };
    const standing = cols(intact.grid);
    expect([...cols(rig.grid)].some((x) => !standing.has(x))).toBe(true);
  });

  it('and it came down — its crown starts lower than the standing rig s', () => {
    const topRow = (g: ReadonlyArray<string>) => g.findIndex((row) => [...row].some((ch) => ch !== '.'));
    expect(topRow(rig.grid)).toBeGreaterThan(topRow(intact.grid));
  });
});
