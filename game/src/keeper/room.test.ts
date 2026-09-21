import { describe, it, expect } from 'vitest';
import { canReadRoom, roomLines, roomRefusal, ROOM_RADIUS, EASE_BOND, type RoomMember } from './room';
import { KEEPERS, keeperById } from './keepers';
import { pairKey } from '../social/meetings';

// BACKLOG-157 — AETHER-1's Read the Room. Pure, so the whole readout is testable in Node.

const at = (name: string, tileX: number, tileY: number, zone = 'bowl'): RoomMember => ({
  name,
  tileX,
  tileY,
  zone,
});

const bond = (a: string, b: string, n: number) => ({ [pairKey(a, b)]: n });

describe('canReadRoom', () => {
  it('is the diplomat alone', () => {
    expect(canReadRoom(keeperById('aether'))).toBe(true);
    for (const k of KEEPERS.filter((x) => x.id !== 'aether')) {
      expect(canReadRoom(k)).toBe(false);
    }
  });
});

describe('roomRefusal', () => {
  it('is empty for the one who can', () => {
    expect(roomRefusal(keeperById('aether'))).toBe('');
  });

  it('is distinct and in-character for every other seat on the roster', () => {
    const others = KEEPERS.filter((k) => k.id !== 'aether');
    const lines = others.map((k) => roomRefusal(k));
    for (const l of lines) expect(l.length).toBeGreaterThan(0);
    expect(new Set(lines).size).toBe(others.length);
  });
});

describe('roomLines — who is standing with whom', () => {
  it('pairs two dinos at the edge of the radius', () => {
    const out = roomLines([at('Rex', 5, 5), at('Sable', 5, 5 + ROOM_RADIUS)], {});
    expect(out).toContain('Rex & Sable — edgy');
    expect(out.some((l) => l.startsWith('alone:'))).toBe(false);
  });

  it('does not pair two dinos one tile past it', () => {
    const out = roomLines([at('Rex', 5, 5), at('Sable', 5, 6 + ROOM_RADIUS)], {});
    expect(out.some((l) => l.includes('&'))).toBe(false);
    expect(out).toContain('alone: Rex, Sable');
  });

  // The CHARTER v7 zone bug, inherited for free from stargazingPairs: each ground is its own grid,
  // so identical tiles on different grounds are a whole zone apart in the world.
  it('does not pair two dinos standing on identical tiles of different grounds', () => {
    const out = roomLines([at('Rex', 5, 5, 'bowl'), at('Sable', 5, 5, 'grove')], {});
    expect(out.some((l) => l.includes('&'))).toBe(false);
    expect(out).toContain('alone: Rex, Sable');
  });

  it('reads a warm pair as at ease and a cold one as edgy, on the exact boundary', () => {
    const near: RoomMember[] = [at('Rex', 5, 5), at('Sable', 5, 6)];
    expect(roomLines(near, bond('Rex', 'Sable', EASE_BOND))).toContain('Rex & Sable — at ease');
    expect(roomLines(near, bond('Rex', 'Sable', EASE_BOND - 1))).toContain('Rex & Sable — edgy');
  });

  it('names whoever nobody is standing near', () => {
    const out = roomLines([at('Rex', 5, 5), at('Sable', 5, 6), at('Thornback', 18, 14)], {});
    expect(out).toContain('Rex & Sable — edgy');
    expect(out).toContain('alone: Thornback');
  });
});

describe('roomLines — the closers, which must never assert what the input does not support', () => {
  it('says everyone has somebody only when nobody is alone', () => {
    const out = roomLines([at('Rex', 5, 5), at('Sable', 5, 6)], {});
    expect(out).toContain('everyone here has somebody');
    expect(out).not.toContain('nobody here is standing near anybody');
  });

  it('says nobody is near anybody when there are no pairs at all', () => {
    const out = roomLines([at('Rex', 0, 0), at('Sable', 10, 10), at('Thornback', 19, 2)], {});
    expect(out).toContain('nobody here is standing near anybody');
    expect(out).not.toContain('everyone here has somebody');
  });

  it('a room of one gets the alone line and neither closer', () => {
    const out = roomLines([at('Rex', 5, 5)], {});
    expect(out).toContain('alone: Rex');
    expect(out).not.toContain('everyone here has somebody');
    expect(out).not.toContain('nobody here is standing near anybody');
  });

  it('an empty room is a header and nothing else', () => {
    expect(roomLines([], {})).toEqual(['— Read the Room —']);
    expect(roomLines([], {}, 'Pocket Cretaceous')).toEqual(['— Read the Room —', 'Pocket Cretaceous']);
  });

  it('a mixed room gets a pair line, an alone line, and no closer', () => {
    const out = roomLines([at('Rex', 5, 5), at('Sable', 5, 6), at('Thornback', 18, 14)], {});
    expect(out).not.toContain('everyone here has somebody');
    expect(out).not.toContain('nobody here is standing near anybody');
  });
});

describe('roomLines — determinism and shape', () => {
  it('is byte-identical however the cast is ordered', () => {
    const cast = [at('Thornback', 5, 5), at('Rex', 5, 6), at('Sable', 4, 5), at('Bramble', 18, 2)];
    const a = roomLines(cast, {}, 'Pocket Cretaceous');
    const b = roomLines([...cast].reverse(), {}, 'Pocket Cretaceous');
    expect(a).toEqual(b);
  });

  it('sorts pairs alphabetically, and names each pair smaller-first', () => {
    const out = roomLines(
      [at('Zed', 1, 1), at('Yara', 1, 2), at('Bram', 10, 10), at('Ada', 10, 11)],
      {},
    ).filter((l) => l.includes('&'));
    expect(out).toEqual(['Ada & Bram — edgy', 'Yara & Zed — edgy']);
  });

  it('renders the place only when one is given', () => {
    expect(roomLines([at('Rex', 5, 5)], {}, 'The Grove')[1]).toBe('The Grove');
    expect(roomLines([at('Rex', 5, 5)], {})[1]).toBe('alone: Rex');
  });
});
