import { describe, it, expect } from 'vitest';
import {
  deriveRole,
  ROLE_ICON,
  zoneCouncil,
  zoneProvider,
  councilSeats,
  PROVIDER_BANKS,
  type ProviderCandidate,
} from '../../game/src/ai/roles';

describe('deriveRole', () => {
  it('a heavy rumor-carrier is the gossip (checked first)', () => {
    expect(deriveRole({ meetings: 20, rumorsHeard: 3, topBond: 90 })).toBe('gossip');
  });

  it('a deeply-bonded nester is the homebody', () => {
    expect(deriveRole({ meetings: 2, rumorsHeard: 0, topBond: 60 })).toBe('homebody');
  });

  it('a high-meeting mingler is the socialite', () => {
    expect(deriveRole({ meetings: 8, rumorsHeard: 1, topBond: 10 })).toBe('socialite');
  });

  it('everyone else is a wanderer', () => {
    expect(deriveRole({ meetings: 0, rumorsHeard: 0, topBond: 0 })).toBe('wanderer');
    expect(deriveRole({ meetings: 7, rumorsHeard: 2, topBond: 59 })).toBe('wanderer');
  });

  it('every role has an icon', () => {
    for (const role of ['gossip', 'homebody', 'socialite', 'wanderer'] as const) {
      expect(ROLE_ICON[role]).toBeTruthy();
    }
  });
});

describe('the per-zone council (BACKLOG-479)', () => {
  const cand = (name: string, foodBanked: number, zoneId = 'grove'): ProviderCandidate => ({
    name,
    zoneId,
    role: foodBanked >= PROVIDER_BANKS ? 'provider' : 'wanderer',
    foodBanked,
  });

  it('seats nobody on a ground nobody lives on', () => {
    expect(zoneCouncil([], 'grove')).toEqual([]);
  });

  it('is empty park-wide on a fresh save — nobody has banked anything yet', () => {
    const fresh = [cand('Rex', 0), cand('Sunny', 0), cand('Twitch', 0, 'bowl')];
    expect(zoneCouncil(fresh, 'grove')).toEqual([]);
    expect(zoneCouncil(fresh, 'bowl')).toEqual([]);
  });

  it('seats the one resident of a hollowed ground, if it has banked', () => {
    expect(zoneCouncil([cand('Rex', 1)], 'grove')).toEqual(['Rex']);
    expect(zoneCouncil([cand('Rex', 0)], 'grove')).toEqual([]);
  });

  it('seats one voice per two residents', () => {
    const four = [cand('Rex', 9), cand('Sunny', 7), cand('Twitch', 5), cand('Mossback', 3)];
    expect(zoneCouncil(four, 'grove')).toEqual(['Rex', 'Sunny']);
  });

  it('caps at three however crowded the ground', () => {
    const eight = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((n, i) => cand(n, 10 - i));
    expect(zoneCouncil(eight, 'grove')).toEqual(['A', 'B', 'C']);
  });

  it('never seats a resident of another ground, whatever it has banked', () => {
    const mixed = [cand('Rex', 1), cand('Faraway', 99, 'bowl')];
    expect(zoneCouncil(mixed, 'grove')).toEqual(['Rex']);
  });

  it('never seats a dino that has banked nothing, even with seats free', () => {
    // 4 residents → 2 seats, but only one has ever banked.
    const four = [cand('Rex', 2), cand('Sunny', 0), cand('Twitch', 0), cand('Mossback', 0)];
    expect(zoneCouncil(four, 'grove')).toEqual(['Rex']);
  });

  it('orders banked-descending, breaks ties alphabetically, and is stable across calls', () => {
    const tied = [cand('Sunny', 4), cand('Mossback', 4), cand('Rex', 4), cand('Twitch', 1)];
    expect(zoneCouncil(tied, 'grove')).toEqual(['Mossback', 'Rex']); // 4 residents → 2 seats, alphabetical within the tie
    expect(zoneCouncil(tied, 'grove')).toEqual(zoneCouncil(tied, 'grove'));
  });

  it('always seats the zone provider first — the two reads cannot disagree', () => {
    const roster = [cand('Sunny', PROVIDER_BANKS + 2), cand('Rex', 2), cand('Twitch', 1), cand('Mossback', 1)];
    expect(zoneProvider(roster, 'grove')).toBe('Sunny');
    expect(zoneCouncil(roster, 'grove')[0]).toBe('Sunny');
  });

  it('counts seats off residents, not off who is eligible', () => {
    expect(councilSeats(0, 0)).toBe(0);
    expect(councilSeats(5, 0)).toBe(0); // nobody has banked → no council at all
    expect(councilSeats(1, 1)).toBe(1);
    expect(councilSeats(4, 4)).toBe(2);
    expect(councilSeats(9, 9)).toBe(3); // capped
  });
});
