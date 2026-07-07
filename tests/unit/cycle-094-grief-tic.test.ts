import { describe, it, expect } from 'vitest';
import { griefEdge, griefAnchor, griefTicMemory, GRIEF_BOND_FLOOR } from '../../game/src/world/tic';
import { closestFriend, strengthen, type Bonds } from '../../game/src/social/bonds';
import { BOWL_ID, GROVE_ID, FERNREACH_ID } from '../../game/src/world/zones';

/**
 * A ritual for the missing friend (BACKLOG-414). A dino whose closest friend has crossed to another zone aims
 * its tic at the edge they left by. Pure logic: the direction along the chain, the edge anchor, the memory,
 * and the shared 013 closest-friend pick the grief reads.
 */

describe('griefEdge — the direction a departed friend left by', () => {
  it('points east when the friend is further east in the west→east chain', () => {
    expect(griefEdge(BOWL_ID, GROVE_ID)).toBe('east');
    expect(griefEdge(BOWL_ID, FERNREACH_ID)).toBe('east'); // two zones over, still east
    expect(griefEdge(GROVE_ID, FERNREACH_ID)).toBe('east');
  });

  it('points west when the friend is further west', () => {
    expect(griefEdge(GROVE_ID, BOWL_ID)).toBe('west');
    expect(griefEdge(FERNREACH_ID, GROVE_ID)).toBe('west');
    expect(griefEdge(FERNREACH_ID, BOWL_ID)).toBe('west');
  });

  it('is null when the friend shares the zone (no departure) or a zone is off-chain', () => {
    expect(griefEdge(BOWL_ID, BOWL_ID)).toBeNull();
    expect(griefEdge(GROVE_ID, GROVE_ID)).toBeNull();
    expect(griefEdge(BOWL_ID, 'nowhere')).toBeNull();
    expect(griefEdge('nowhere', GROVE_ID)).toBeNull();
  });
});

describe('griefAnchor — the edge tile the ritual faces', () => {
  it('west → column 0, east → last column, preserving the row', () => {
    expect(griefAnchor('west', 7, 20)).toEqual({ tileX: 0, tileY: 7 });
    expect(griefAnchor('east', 7, 20)).toEqual({ tileX: 19, tileY: 7 });
    expect(griefAnchor('east', 3, 12)).toEqual({ tileX: 11, tileY: 3 });
  });
});

describe('griefTicMemory — the ache named', () => {
  it('names the friend and the ritual, reading as a directional loss', () => {
    const m = griefTicMemory('paces a fixed little path', 'Twitch');
    expect(m).toContain('Twitch');
    expect(m).toContain('paces a fixed little path');
    expect(m).toContain('edge they left by');
  });
});

describe('closestFriend — the shared 013 pick', () => {
  const bonds: Bonds = strengthen(strengthen(strengthen({}, 'Rex', 'Twitch', 40), 'Rex', 'Sunny', 20), 'Rex', 'Glade', 5);

  it('returns the highest-bond peer above the floor', () => {
    expect(closestFriend('Rex', bonds, ['Twitch', 'Sunny', 'Glade'], GRIEF_BOND_FLOOR)).toBe('Twitch');
  });

  it('respects the floor — a bond below it does not count as a friend', () => {
    // Only Glade (bond 5) is present, below the floor of 8 → nobody close enough.
    expect(closestFriend('Rex', bonds, ['Glade'], GRIEF_BOND_FLOOR)).toBeNull();
    // With no floor, the weak bond still wins over an unbonded peer.
    expect(closestFriend('Rex', bonds, ['Glade', 'Mossback'], 0)).toBe('Glade');
  });

  it('breaks ties to the lexicographically-smallest name and skips self', () => {
    const tied = strengthen(strengthen({}, 'Rex', 'Zed', 10), 'Rex', 'Ada', 10);
    expect(closestFriend('Rex', tied, ['Rex', 'Zed', 'Ada'], 0)).toBe('Ada');
  });

  it('is null when the roster is only the dino itself', () => {
    expect(closestFriend('Rex', bonds, ['Rex'], 0)).toBeNull();
  });
});
