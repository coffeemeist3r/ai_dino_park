import { describe, it, expect } from 'vitest';
import { liftsLoner, foundFriendMemory, foundFriendLine, FOUND_FRIEND_GLYPH, LONER_FLOOR } from '../../game/src/world/loner';
import { strengthen, type Bonds } from '../../game/src/social/bonds';

/**
 * The loner finds a friend (BACKLOG-369). When a dino that had been a loner (135) grows its first bond
 * above the floor, `liftsLoner` reports the transition so WorldScene can fire the one-shot "not so alone"
 * beat. Pure read over two bond snapshots.
 */

const cast = ['Rex', 'Mossback', 'Sunny', 'Glade'];

describe('liftsLoner — the loner→friend transition (BACKLOG-369)', () => {
  it('is true when a meeting lifts a friendless dino over the floor', () => {
    const before: Bonds = {}; // fresh bowl: everyone is a loner
    const after = strengthen(before, 'Rex', 'Sunny', LONER_FLOOR);
    expect(liftsLoner(before, after, 'Rex', cast)).toBe(true);
    expect(liftsLoner(before, after, 'Sunny', cast)).toBe(true); // symmetric — Sunny lifts too
  });

  it('is false for a dino the bond change did not lift (still a loner after)', () => {
    const before: Bonds = {};
    const after = strengthen(before, 'Rex', 'Sunny', LONER_FLOOR);
    expect(liftsLoner(before, after, 'Mossback', cast)).toBe(false); // untouched, still alone
  });

  it('is false when the dino was already not a loner before (no transition)', () => {
    let before: Bonds = {};
    before = strengthen(before, 'Rex', 'Sunny', LONER_FLOOR); // Rex already has a friend
    const after = strengthen(before, 'Rex', 'Sunny', 5); // bond rises further, but no transition
    expect(liftsLoner(before, after, 'Rex', cast)).toBe(false);
  });

  it('is false when a weak bond stays below the floor', () => {
    const before: Bonds = {};
    const after = strengthen(before, 'Rex', 'Sunny', LONER_FLOOR - 1);
    expect(liftsLoner(before, after, 'Rex', cast)).toBe(false);
  });

  it('the memory and line are the expected beat (line carries the name + 🌱)', () => {
    expect(foundFriendMemory()).toContain('not so alone');
    expect(foundFriendLine('Rex')).toBe(`Rex ${FOUND_FRIEND_GLYPH}`);
  });
});
