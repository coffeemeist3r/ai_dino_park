import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { unplacedRigs } from '../world/reachability';

const beacon = PROP_RIGS['beacon'];
const ruin = PROP_RIGS['beacon_derelict'];

const lit = (rig: typeof beacon) => rig.grid.join('').split('').filter((c) => c !== '.').length;
/** Which rows of the 16-box the rig actually puts pixels in — the silhouette's vertical extent. */
const topRow = (rig: typeof beacon) => rig.grid.findIndex((row) => row.includes('r') || row.includes('b'));

/**
 * BACKLOG-532 — the beacon's ruin. The fifth landmark was the only one whose derelict state was the lit
 * rig at `DERELICT_ALPHA`, which on a ground made of black glass reads as night rather than as abandoned.
 */
describe('the beacon that went out (BACKLOG-532)', () => {
  it('exists, and follows the <name>_derelict convention', () => {
    expect(ruin).toBeDefined();
    expect(ruin.size).toBe(beacon.size);
    expect(ruin.grid).toHaveLength(beacon.size);
    for (const row of ruin.grid) expect(row).toHaveLength(beacon.size);
  });

  /** The whole point. A ruin that is the same shape dimmer is the thing this item was opened over. */
  it('changes the silhouette, not only the light', () => {
    expect(ruin.grid).not.toEqual(beacon.grid);
    // The beacon is the one landmark that goes *up*. The ruin's tallest standing glass starts well below
    // where the standing rig's does — the skyline is what died.
    expect(topRow(ruin)).toBeGreaterThan(topRow(beacon) + 2);
    expect(lit(ruin)).toBeLessThan(lit(beacon));
  });

  it('has gone out — no catchlight anywhere', () => {
    expect(beacon.palette.g).toBeDefined();
    expect(ruin.palette.g).toBeUndefined();
    expect(ruin.grid.join('')).not.toContain('g');
  });

  it('keeps the family claim: every colour it uses is the standing beacon’s own', () => {
    for (const [key, value] of Object.entries(ruin.palette)) {
      expect(beacon.palette[key]).toBe(value);
    }
    expect(new Set(Object.values(ruin.palette)).size).toBeLessThanOrEqual(8);
  });

  it('every key the grid uses is in the palette', () => {
    const used = new Set(ruin.grid.join('').split('').filter((c) => c !== '.'));
    for (const key of used) expect(ruin.palette[key]).toBeDefined();
  });

  it('is placeable — the register does not call it a stashed rig', () => {
    expect(unplacedRigs()).not.toContain('beacon_derelict');
    expect(unplacedRigs()).toEqual([]);
  });
});
