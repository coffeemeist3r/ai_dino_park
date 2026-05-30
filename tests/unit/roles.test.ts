import { describe, it, expect } from 'vitest';
import { deriveRole, ROLE_ICON } from '../../game/src/ai/roles';

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
