import { describe, it, expect } from 'vitest';
import { wearKey, marksOn } from '../../game/src/world/wear';
import { PROP_RIGS } from '../../game/src/art/propArt';
import { TIC_BY_AXIS, driftHaunt, hauntSeed, type Haunts, type TicKind } from '../../game/src/world/tic';
import { GROVE_ID, BOWL_ID } from '../../game/src/world/zones';

/**
 * BACKLOG-507 — the ritual's mark, laid on the ground.
 *
 * The interesting assertions here are the two negatives. `tic_fuss` having no rig is 496's deliberate
 * per-kind fallback control, and it is asserted rather than assumed, because the day somebody draws it the
 * control moves and this test should say so. And a haunt whose dino has left the park leaving no ghost is
 * the property that keeps `wearSprites` from accumulating over a long session.
 */

const COLS = 20;
const ROWS = 15;

describe('the key convention', () => {
  it('keys a mark by its ritual kind', () => {
    expect(wearKey('pace')).toBe('tic_pace');
    expect(wearKey('circle')).toBe('tic_circle');
    expect(wearKey('fuss')).toBe('tic_fuss');
  });

  it('every ritual kind has a rig — 496 closed cycle 142-art', () => {
    // `fuss` was held back for four cycles as 496's per-kind fallback control, and this assertion read
    // `toBe(false)` for the few hours between 507 shipping and the Artist fire that closed the item. It is
    // flipped rather than deleted, because the *fact* it pins has moved rather than gone: the
    // draw-a-rig-or-draw-nothing branch in `syncWear` is still live, and its remaining control is the one
    // prop key in this park still undrawn — the feeding hatch (BACKLOG-502). When that is drawn, the
    // control has to be manufactured rather than found, and this comment is where that gets noticed.
    for (const kind of ['pace', 'circle', 'fuss'] as TicKind[]) {
      expect(wearKey(kind) in PROP_RIGS).toBe(true);
    }
  });

  it('a key nothing has drawn resolves to no rig — the branch itself, independent of any one kind', () => {
    expect(wearKey('shuffle' as TicKind) in PROP_RIGS).toBe(false);
  });

  it('every axis a dino can be born with resolves to a key', () => {
    for (const tic of Object.values(TIC_BY_AXIS)) expect(wearKey(tic.kind)).toMatch(/^tic_/);
  });
});

describe('the marks a ground shows', () => {
  const haunts: Haunts = {
    Thornback: { [GROVE_ID]: { tileX: 4, tileY: 6, drifts: 0 } },
    Bramble: { [GROVE_ID]: { tileX: 9, tileY: 2, drifts: 3 }, [BOWL_ID]: { tileX: 1, tileY: 1, drifts: 0 } },
    Mossback: { [BOWL_ID]: { tileX: 7, tileY: 7, drifts: 0 } },
  };
  const paces = () => 'pace' as TicKind;

  it('shows only the haunts laid on this ground', () => {
    expect(marksOn(haunts, GROVE_ID, paces).map((m) => m.name)).toEqual(['Bramble', 'Thornback']);
    expect(marksOn(haunts, BOWL_ID, paces).map((m) => m.name)).toEqual(['Bramble', 'Mossback']);
  });

  it('is sorted by name, not by object-key order', () => {
    const names = marksOn(haunts, GROVE_ID, paces).map((m) => m.name);
    expect(names).toEqual([...names].sort());
  });

  it('puts each mark on its own haunt tile, per ground', () => {
    const grove = marksOn(haunts, GROVE_ID, paces);
    expect(grove.find((m) => m.name === 'Bramble')).toMatchObject({ tileX: 9, tileY: 2 });
    const bowl = marksOn(haunts, BOWL_ID, paces);
    expect(bowl.find((m) => m.name === 'Bramble')).toMatchObject({ tileX: 1, tileY: 1 });
  });

  it('carries the key of the ritual actually performed', () => {
    const circled = marksOn(haunts, GROVE_ID, () => 'circle');
    expect(circled.every((m) => m.key === 'tic_circle')).toBe(true);
  });

  it('leaves no ghost for a dino the resolver does not know', () => {
    const onlyBramble = marksOn(haunts, GROVE_ID, (n) => (n === 'Bramble' ? 'pace' : null));
    expect(onlyBramble.map((m) => m.name)).toEqual(['Bramble']);
  });

  it('shows nothing on a ground nobody haunts', () => {
    expect(marksOn(haunts, 'ridge', paces)).toEqual([]);
    expect(marksOn({}, GROVE_ID, paces)).toEqual([]);
  });
});

describe('the mark moves with the habit', () => {
  it('a drift relocates the same dino mark rather than adding a second', () => {
    const start = { tileX: 8, tileY: 8, drifts: 0 };
    const haunts: Haunts = { Thornback: { [GROVE_ID]: start } };
    const before = marksOn(haunts, GROVE_ID, () => 'pace');

    const moved = driftHaunt(start, hauntSeed('Thornback'), COLS, ROWS);
    haunts.Thornback[GROVE_ID] = moved;
    const after = marksOn(haunts, GROVE_ID, () => 'pace');

    expect(after).toHaveLength(1);
    expect(before).toHaveLength(1);
    expect({ x: after[0].tileX, y: after[0].tileY }).not.toEqual({ x: before[0].tileX, y: before[0].tileY });
    expect(after[0]).toMatchObject({ tileX: moved.tileX, tileY: moved.tileY });
  });
});
