import { describe, it, expect } from 'vitest';
import { homesickDest, homesickMemory, HOMESICK_ROLLS } from '../../game/src/world/homesick';
import { strengthen, type Bonds } from '../../game/src/social/bonds';
import { GRIEF_BOND_FLOOR } from '../../game/src/world/tic';

/**
 * Homesick for a friend (BACKLOG-340) — a dino whose closest friend (013) lives a zone away drifts back
 * toward it after residing a while, overriding the 341 settle-resist. The action-mirror of the 414 grief
 * tic: reuses closestFriend at GRIEF_BOND_FLOOR + griefEdge. Milestone 2 lore arc 3 of 3.
 */
describe('homesick for a friend (BACKLOG-340)', () => {
  const others = ['Rex', 'Twitch', 'Mossback'];
  // Rex lives in the grove; its close friend Twitch is back in the bowl.
  const zones: Record<string, string> = { Rex: 'grove', Twitch: 'bowl', Mossback: 'grove' };
  const zoneOf = (n: string) => zones[n] ?? 'bowl';
  const bonds: Bonds = strengthen({}, 'Rex', 'Twitch', 20); // ≥ floor (8)

  it('heads one zone toward a close friend in another zone, once away long enough', () => {
    const h = homesickDest('Rex', 'grove', bonds, others, zoneOf, HOMESICK_ROLLS);
    expect(h).toEqual({ dest: 'bowl', friend: 'Twitch' });
  });

  it('is null before the away-gate — a freshly-arrived dino does not yet ache', () => {
    expect(homesickDest('Rex', 'grove', bonds, others, zoneOf, HOMESICK_ROLLS - 1)).toBeNull();
  });

  it('is null when the closest friend already shares the zone', () => {
    const together: Record<string, string> = { Rex: 'bowl', Twitch: 'bowl', Mossback: 'grove' };
    expect(homesickDest('Rex', 'bowl', bonds, others, (n) => together[n] ?? 'bowl', 5)).toBeNull();
  });

  it('is null when no bond clears the grief floor', () => {
    const weak = strengthen({}, 'Rex', 'Twitch', GRIEF_BOND_FLOOR - 1);
    expect(homesickDest('Rex', 'grove', weak, others, zoneOf, 5)).toBeNull();
  });

  it('steps to the *intermediate* neighbour toward a friend two zones away', () => {
    // Rex in the bowl, friend in the Fernreach (bowl → grove → fernreach): first hop is the grove.
    const far: Record<string, string> = { Rex: 'bowl', Twitch: 'fernreach', Mossback: 'grove' };
    const h = homesickDest('Rex', 'bowl', bonds, others, (n) => far[n] ?? 'bowl', 5);
    expect(h).toEqual({ dest: 'grove', friend: 'Twitch' });
  });

  it('is pure — never mutates the bonds map', () => {
    const snapshot = { ...bonds };
    homesickDest('Rex', 'grove', bonds, others, zoneOf, 5);
    expect(bonds).toEqual(snapshot);
  });

  it('the filed memory names the friend', () => {
    expect(homesickMemory('Twitch')).toContain('Twitch');
  });
});
