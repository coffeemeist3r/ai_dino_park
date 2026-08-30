/**
 * BACKLOG-501's repair — the founder's stake gets planted.
 *
 * The register's ninth entry asked a question nobody had asked: is every rig the studio has drawn a rig the
 * park can actually put on the ground? Its first walk answered no, and named `founder_stake` and
 * `founder_stake_hollowed` — drawn on the night of cycle 144 under the stash rule, which has never carried
 * a deadline. These tests pin the host that closed the gap.
 */

import { describe, it, expect } from 'vitest';
import {
  STAKE_TILE,
  STAKE_ART_KEY,
  STAKE_NATIVE_ART_KEY,
  STAKE_HOLLOWED_ART_KEY,
  stakeArtKey,
} from '../../game/src/world/stake';
import { BANK_TILE } from '../../game/src/world/bank';
import { HATCH_TILE } from '../../game/src/world/hatch';
import { FOUNDING_RUIN } from '../../game/src/world/founding';
import { zoneChain, zoneTileAt } from '../../game/src/world/zones';
import { PROP_RIGS } from '../../game/src/art/propArt';

const COLS = 20;
const ROWS = 15;

describe('the stake tile', () => {
  it('is never underwater on any ground the player can walk to', () => {
    for (const z of zoneChain()) {
      expect(zoneTileAt(z, STAKE_TILE.tileX, STAKE_TILE.tileY, COLS, ROWS), z).not.toBe('water');
    }
  });

  it('is clear of every fixture the park already pins in place', () => {
    const taken = [
      BANK_TILE, // 504's heap
      HATCH_TILE, // 510's mouth
      { tileX: 10, tileY: 11 }, // the bowl's huddle tile
      { tileX: 2, tileY: 12 }, // the bowl's plot
      { tileX: FOUNDING_RUIN.tileX, tileY: FOUNDING_RUIN.tileY }, // the founding ruin
    ];
    for (const t of taken) {
      expect({ tileX: STAKE_TILE.tileX, tileY: STAKE_TILE.tileY }).not.toEqual({
        tileX: t.tileX,
        tileY: t.tileY,
      });
    }
  });

  it('is off the map edges, where a step is a zone handoff rather than a look', () => {
    expect(STAKE_TILE.tileX).toBeGreaterThan(0);
    expect(STAKE_TILE.tileY).toBeGreaterThan(0);
    expect(STAKE_TILE.tileX).toBeLessThan(COLS - 1);
    expect(STAKE_TILE.tileY).toBeLessThan(ROWS - 1);
  });
});

describe('which mark a ground shows', () => {
  it('sets the post in stone on ground its founder woke up on (BACKLOG-517)', () => {
    expect(stakeArtKey('born', false)).toBe(STAKE_NATIVE_ART_KEY);
  });

  it('drives it on ground somebody crossed into and claimed', () => {
    expect(stakeArtKey('crossed', false)).toBe(STAKE_ART_KEY);
  });

  it('leans it on ground somebody founded and everybody left, whichever way they got there', () => {
    // Leaving looks the same either way, which is the point of the hollowed variant winning over the kind.
    expect(stakeArtKey('born', true)).toBe(STAKE_HOLLOWED_ART_KEY);
    expect(stakeArtKey('crossed', true)).toBe(STAKE_HOLLOWED_ART_KEY);
  });

  it('shows nothing at all on ground nobody has ever founded — bare is what unclaimed looks like', () => {
    expect(stakeArtKey(null, false)).toBeNull();
    // A ground with no founder cannot be hollowed either (isHollowed needs one), but the read is total.
    expect(stakeArtKey(null, true)).toBeNull();
  });

  it('names keys the Artist actually drew — the whole reason this host exists', () => {
    expect(PROP_RIGS[STAKE_ART_KEY]).toBeDefined();
    expect(PROP_RIGS[STAKE_NATIVE_ART_KEY]).toBeDefined();
    expect(PROP_RIGS[STAKE_HOLLOWED_ART_KEY]).toBeDefined();
  });
});
