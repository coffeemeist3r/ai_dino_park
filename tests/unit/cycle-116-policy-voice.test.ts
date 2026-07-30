import { describe, it, expect } from 'vitest';
import { policyAside, cannedReply } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Fed first, or left short (BACKLOG-469) — a hungry dino voices its ground's spend policy (463): grateful on a
 * feed-first ground, grumbling on a bank-first one. Temperament-shaded, silent unless hungry + policy'd. The
 * canned line is the deterministic floor (behaviour never depends on the model); the LLM prompt carries the
 * same nudge.
 */
const traits = (agreeableness: number): Personality => ({
  bravery: 0.5,
  energy: 0.5,
  curiosity: 0.5,
  sociability: 0.5,
  agreeableness,
});

describe('policyAside (BACKLOG-469)', () => {
  it('feed and bank give opposite stances, each temperament-split three ways', () => {
    const feed = [policyAside('feed', traits(0.1)), policyAside('feed', traits(0.9)), policyAside('feed', traits(0.5))];
    const bank = [policyAside('bank', traits(0.1)), policyAside('bank', traits(0.9)), policyAside('bank', traits(0.5))];
    expect(new Set(feed).size).toBe(3);
    expect(new Set(bank).size).toBe(3);
    // opposite stances never collide
    expect(new Set([...feed, ...bank]).size).toBe(6);
  });

  it('every aside leads with a space so it appends cleanly onto the base line', () => {
    for (const p of ['feed', 'bank'] as const)
      for (const a of [0.1, 0.5, 0.9]) expect(policyAside(p, traits(a)).startsWith(' ')).toBe(true);
  });

  it('with no traits, returns the even line (back-compat)', () => {
    expect(policyAside('feed')).toBe(policyAside('feed', traits(0.5)));
    expect(policyAside('bank')).toBe(policyAside('bank', traits(0.5)));
  });

  it('feed reassures, bank grumbles — a legible read on the words', () => {
    expect(policyAside('feed', traits(0.5)).toLowerCase()).toContain('feeds its own first');
    expect(policyAside('bank', traits(0.5)).toLowerCase()).toContain('short');
  });
});

describe('cannedReply policy composition (BACKLOG-469)', () => {
  const base = { name: 'Rex', species: 'raptor', personality: 'loves rocks', traits: traits(0.5), affection: 8 };

  it('a hungry dino on a feed ground carries the grateful line; on a bank ground the grumble', () => {
    expect(cannedReply({ ...base, hungry: true, groundPolicy: 'feed' }).text.toLowerCase()).toContain('feeds its own first');
    expect(cannedReply({ ...base, hungry: true, groundPolicy: 'bank' }).text.toLowerCase()).toContain('short');
  });

  it('silent when not hungry, even with a policy — byte-identical to no policy', () => {
    const withPolicy = cannedReply({ ...base, groundPolicy: 'bank' });
    const none = cannedReply({ ...base });
    expect(withPolicy.text).toBe(none.text);
  });

  it('silent when hungry but the ground has no policy (undefined)', () => {
    const noPolicy = cannedReply({ ...base, hungry: true });
    const withUndef = cannedReply({ ...base, hungry: true, groundPolicy: undefined });
    expect(withUndef.text).toBe(noPolicy.text);
  });

  it('composes onto the hunger tell within the cap — both are present', () => {
    const r = cannedReply({ ...base, hungry: true, groundPolicy: 'feed' });
    const hungryOnly = cannedReply({ ...base, hungry: true });
    // the hunger tell fires first, the policy aside after it
    expect(r.text.startsWith(hungryOnly.text.slice(0, 20))).toBe(true);
    expect(r.text.length).toBeGreaterThan(hungryOnly.text.length);
    expect(r.text.length).toBeLessThanOrEqual(400);
  });
});

describe('buildMessages policy clause (BACKLOG-469)', () => {
  const ctx = { name: 'Rex', species: 'raptor', personality: 'loves rocks', traits: traits(0.5) };
  const obs = { kind: 'player_greet' as const };
  const sys = (extra: Record<string, unknown>) =>
    buildMessages({ ...ctx, ...extra }, obs).find((m) => m.role === 'system')!.content;

  it('adds a policy nudge only when hungry + policy; silent otherwise', () => {
    expect(sys({ hungry: true, groundPolicy: 'feed' }).toLowerCase()).toContain('feeds its hungry own');
    expect(sys({ hungry: true, groundPolicy: 'bank' }).toLowerCase()).toContain('banking food');
    // not hungry → no clause (byte-identical to no policy)
    expect(sys({ groundPolicy: 'bank' })).toBe(sys({}));
    // hungry but no policy → no clause
    expect(sys({ hungry: true })).toBe(sys({ hungry: true, groundPolicy: undefined }));
  });
});
