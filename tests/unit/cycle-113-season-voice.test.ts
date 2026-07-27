import { describe, it, expect } from 'vitest';
import { seasonAside, cannedReply } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Season in the voice (BACKLOG-173) — the turning year colours a dino's greeting. Winter grumbles, spring
 * savours, summer/fall stay quiet; temperament-shaded; composes with the other asides. The canned line is
 * the deterministic floor (behaviour never depends on the model), the LLM prompt carries the same nudge.
 */

const traits = (agreeableness: number): Personality => ({
  bravery: 0.5,
  energy: 0.5,
  curiosity: 0.5,
  sociability: 0.5,
  agreeableness,
});

describe('seasonAside (BACKLOG-173)', () => {
  it('winter and spring speak; summer and fall stay silent', () => {
    expect(seasonAside('winter', traits(0.5))).not.toBe('');
    expect(seasonAside('spring', traits(0.5))).not.toBe('');
    expect(seasonAside('summer', traits(0.5))).toBe('');
    expect(seasonAside('fall', traits(0.5))).toBe('');
  });

  it('is temperament-shaded — prickly, warm, and even each get a distinct winter line', () => {
    const prickly = seasonAside('winter', traits(0.1));
    const warm = seasonAside('winter', traits(0.9));
    const even = seasonAside('winter', traits(0.5));
    expect(new Set([prickly, warm, even]).size).toBe(3);
    // Each leads with a space so it appends cleanly onto the base line.
    for (const a of [prickly, warm, even]) expect(a.startsWith(' ')).toBe(true);
  });

  it('spring, too, splits three ways by temperament', () => {
    const s = [seasonAside('spring', traits(0.1)), seasonAside('spring', traits(0.9)), seasonAside('spring', traits(0.5))];
    expect(new Set(s).size).toBe(3);
  });

  it('with no traits, returns the even line (back-compat)', () => {
    expect(seasonAside('winter')).toBe(seasonAside('winter', traits(0.5)));
  });
});

describe('cannedReply season composition (BACKLOG-173)', () => {
  // affection 8 → the deterministic fond greeting (the mid-range generic branch is Math.random-picked).
  const base = { name: 'Rex', species: 'raptor', personality: 'loves rocks', traits: traits(0.5), affection: 8 };

  it('a winter greeting carries the grumble; summer is byte-identical to no season', () => {
    const winter = cannedReply({ ...base, season: 'winter' });
    const summer = cannedReply({ ...base, season: 'summer' });
    const none = cannedReply({ ...base });
    expect(winter.text).toContain('winter');
    expect(summer.text).toBe(none.text);
  });

  it('composes with the hunger tell — a hungry winter dino carries both, within the cap', () => {
    const r = cannedReply({ ...base, season: 'winter', hungry: true });
    expect(r.text).toContain('winter');
    expect(r.text.length).toBeLessThanOrEqual(360);
    // the hunger tell is still there too (it fires before the season aside)
    const hungryOnly = cannedReply({ ...base, hungry: true });
    expect(r.text.startsWith(hungryOnly.text.slice(0, 20))).toBe(true);
  });
});

describe('buildMessages season clause (BACKLOG-173)', () => {
  const ctx = { name: 'Rex', species: 'raptor', personality: 'loves rocks', traits: traits(0.5) };
  const obs = { kind: 'player_greet' as const };

  it('winter and spring add a season nudge to the system prompt; summer/fall do not', () => {
    const sys = (season?: 'winter' | 'spring' | 'summer' | 'fall') =>
      buildMessages({ ...ctx, season }, obs).find((m) => m.role === 'system')!.content;
    expect(sys('winter').toLowerCase()).toContain('winter');
    expect(sys('spring').toLowerCase()).toContain('spring');
    expect(sys('summer')).toBe(sys(undefined));
    expect(sys('fall')).toBe(sys(undefined));
  });
});
