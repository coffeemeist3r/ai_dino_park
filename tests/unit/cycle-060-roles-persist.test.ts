import { describe, it, expect } from 'vitest';
import { settleRole, deriveRole } from '../../game/src/ai/roles';
import { serialize, deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';

/**
 * Roles persist (BACKLOG-032). settleRole makes an emerged role durable — a held non-wanderer role
 * never reverts to wanderer, but a different non-wanderer role still takes. Plus the additive `roles` save.
 */

describe('settleRole (BACKLOG-032)', () => {
  it('takes the derived role when none is held yet', () => {
    expect(settleRole(undefined, 'socialite')).toBe('socialite');
  });
  it('takes the derived role while still a wanderer', () => {
    expect(settleRole('wanderer', 'gossip')).toBe('gossip');
  });
  it('keeps a held non-wanderer role when behavior fades (never reverts to wanderer) — the core of 032', () => {
    expect(settleRole('socialite', 'wanderer')).toBe('socialite');
    expect(settleRole('gossip', 'wanderer')).toBe('gossip');
  });
  it('changes when a different non-wanderer role emerges', () => {
    expect(settleRole('socialite', 'gossip')).toBe('gossip');
  });
  it('a still-searching dino stays a wanderer', () => {
    expect(settleRole('wanderer', 'wanderer')).toBe('wanderer');
  });
  it('settling the live derivation is idempotent once set', () => {
    const derived = deriveRole({ meetings: 8, rumorsHeard: 0, topBond: 0 }); // socialite
    const once = settleRole(undefined, derived);
    // behavior later drops to nothing → derive wanderer, but settled stays
    expect(settleRole(once, deriveRole({ meetings: 0, rumorsHeard: 0, topBond: 0 }))).toBe('socialite');
  });
});

describe('save round-trips roles additively (BACKLOG-032)', () => {
  const base = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 100, y: 100 },
    friendship: {},
    memory: {},
    bonds: {},
    gratitude: {},
    lastTone: {},
    eggs: [],
    born: [],
  };
  it('serialize → deserialize preserves roles', () => {
    const out = deserialize(serialize({ ...base, roles: { Rex: 'gossip' } } as any));
    expect(out?.roles?.Rex).toBe('gossip');
  });
  it('a save without roles defaults to {} (old saves valid)', () => {
    const out = deserialize(serialize(base as any));
    expect(out).not.toBeNull();
    expect(out?.roles).toEqual({});
  });
});
