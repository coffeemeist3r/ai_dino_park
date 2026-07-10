import { describe, it, expect } from 'vitest';
import { cannedReply, hungryAside, type NPCContext } from '../../game/src/ai/brain';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Hunger you can hear (BACKLOG-368). A dino over its hunger threshold lets the want slip into whatever it
 * was going to say — a temperament-shaded aside appended to the base greeting, composing with every
 * register (gratitude / wistful / fond / generic). Deterministic; the LLM path only colours the same fact.
 */

const traitsWith = (agreeableness: number): Personality => ({
  bravery: 0.5,
  sociability: 0.5,
  agreeableness,
  energy: 0.5,
  curiosity: 0.5,
});

const PRICKLY = traitsWith(0.2);
const WARM = traitsWith(0.8);
const EVEN = traitsWith(0.5);

describe('hungryAside — temperament-shaded (BACKLOG-368)', () => {
  it('gives three distinct variants by agreeableness', () => {
    const prickly = hungryAside(PRICKLY);
    const warm = hungryAside(WARM);
    const even = hungryAside(EVEN);
    expect(prickly).toContain('starving');
    expect(warm).toContain('spare a bite');
    expect(even).toContain('could eat');
    expect(new Set([prickly, warm, even]).size).toBe(3);
  });

  it('falls back to the plain mention with no traits (back-compat)', () => {
    expect(hungryAside(undefined)).toBe(hungryAside(EVEN));
  });
});

describe('cannedReply — the hunger tell composes with every register (BACKLOG-368)', () => {
  it('appends the aside on the gratitude register, else byte-identical when sated', () => {
    const base: NPCContext = { name: 'Rex', species: 'raptor', personality: '', traits: EVEN, gratitude: 'Twitch' };
    const sated = cannedReply(base);
    const hungry = cannedReply({ ...base, hungry: true });
    expect(hungry.text).toBe(sated.text + hungryAside(EVEN));
    expect(cannedReply({ ...base, hungry: false }).text).toBe(sated.text); // sated is unchanged
  });

  it('appends on the wistful (neglected) register', () => {
    const base: NPCContext = { name: 'Rex', species: 'raptor', personality: '', traits: PRICKLY, affection: 0 };
    const sated = cannedReply(base);
    const hungry = cannedReply({ ...base, hungry: true });
    expect(hungry.text).toBe(sated.text + hungryAside(PRICKLY));
    expect(sated.text).toContain('came to see'); // the wistful line still fired
  });

  it('appends on the fond (close) register', () => {
    const base: NPCContext = { name: 'Rex', species: 'raptor', personality: '', traits: WARM, affection: 9 };
    const sated = cannedReply(base);
    const hungry = cannedReply({ ...base, hungry: true });
    expect(hungry.text).toBe(sated.text + hungryAside(WARM));
    expect(sated.text).toContain('There you are'); // the fond line still fired
  });

  it('appends on the generic register (aside is the suffix regardless of the random opener)', () => {
    const base: NPCContext = { name: 'Rex', species: 'raptor', personality: '', traits: EVEN };
    const hungry = cannedReply({ ...base, hungry: true });
    expect(hungry.text.endsWith(hungryAside(EVEN))).toBe(true);
  });

  it('adds nothing when hungry is false/omitted', () => {
    const base: NPCContext = { name: 'Rex', species: 'raptor', personality: '', traits: EVEN, gratitude: 'Twitch' };
    expect(cannedReply(base).text).not.toContain('could eat');
  });
});
