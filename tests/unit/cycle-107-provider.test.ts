import { describe, it, expect } from 'vitest';
import { deriveRole, settleRole, ROLE_ICON, PROVIDER_BANKS, type BehaviorStats } from '../../game/src/ai/roles';
import { haulLine, haulMemory } from '../../game/src/world/foodstore';

/**
 * The provider role (BACKLOG-448) — the first emergent role read off the *economy* rather than the social
 * graph: the dino that has put the most food into the park's pantries. Milestone 6 structure arc 3.
 */
const stats = (over: Partial<BehaviorStats> = {}): BehaviorStats => ({
  meetings: 0,
  rumorsHeard: 0,
  topBond: 0,
  ...over,
});

describe('provider emerges from banked food (BACKLOG-448)', () => {
  it('needs PROVIDER_BANKS banks — one short is still a wanderer', () => {
    expect(deriveRole(stats({ foodBanked: PROVIDER_BANKS - 1 }))).toBe('wanderer');
    expect(deriveRole(stats({ foodBanked: PROVIDER_BANKS }))).toBe('provider');
    expect(deriveRole(stats({ foodBanked: PROVIDER_BANKS + 9 }))).toBe('provider');
  });

  it('outranks every social read — keeping a zone fed is the most distinctive thing you can be doing', () => {
    const busy = { rumorsHeard: 9, topBond: 90, meetings: 30 };
    expect(deriveRole(stats(busy))).toBe('gossip');
    expect(deriveRole(stats({ ...busy, foodBanked: PROVIDER_BANKS }))).toBe('provider');
  });

  it('has an icon, so the roles lens can render it', () => {
    expect(ROLE_ICON.provider).toBe('🧺');
  });

  it('settles durably: a provider whose tally goes quiet keeps the role (BACKLOG-032)', () => {
    expect(settleRole('provider', 'wanderer')).toBe('provider');
    expect(settleRole('wanderer', 'provider')).toBe('provider');
    expect(settleRole('provider', 'gossip')).toBe('gossip'); // a genuinely different role still takes over
  });

  it('leaves the four legacy roles byte-identical when nothing has been banked', () => {
    expect(deriveRole(stats({ rumorsHeard: 3 }))).toBe('gossip');
    expect(deriveRole(stats({ topBond: 60 }))).toBe('homebody');
    expect(deriveRole(stats({ meetings: 8 }))).toBe('socialite');
    expect(deriveRole(stats())).toBe('wanderer');
  });
});

describe('the hauler beat reads (BACKLOG-448)', () => {
  it('names the hauler and the zone whose stores it filled', () => {
    expect(haulLine('Sunny', 'The Fernreach')).toContain('Sunny');
    expect(haulLine('Sunny', 'The Fernreach')).toContain('The Fernreach');
    expect(haulLine('Sunny', 'The Fernreach').startsWith('🧺')).toBe(true);
    expect(haulMemory('The Fernreach')).toContain('The Fernreach');
  });
});
