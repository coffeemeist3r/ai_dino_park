import { describe, it, expect } from 'vitest';
import { DREAM_BY_AXIS, dreamWord, dreamBookLine, murmurLine, pickMurmurMemory } from '../../game/src/world/murmur';
import { seededPersonality, AXES, type Personality } from '../../game/src/ai/personality';

/** A personality that is neutral everywhere except one axis, so the signature pick is unambiguous. */
function only(axis: keyof Personality, value: number): Personality {
  const p: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5 };
  p[axis] = value;
  return p;
}

describe('trait dreams — what a dino says asleep with no day behind it (BACKLOG-307)', () => {
  it('has one distinct word per pole of every axis', () => {
    const words = AXES.flatMap((a) => [DREAM_BY_AXIS[a.key].low, DREAM_BY_AXIS[a.key].high]);
    expect(words).toHaveLength(10);
    expect(new Set(words).size).toBe(10);
    // A dream is a fragment, not a sentence — one lowercase word, no spaces.
    for (const w of words) expect(w).toMatch(/^[a-z]+$/);
  });

  it('reads the signature axis and takes the high pole at/above 0.5, the low pole below', () => {
    for (const a of AXES) {
      expect(dreamWord(only(a.key, 0.99))).toBe(DREAM_BY_AXIS[a.key].high);
      expect(dreamWord(only(a.key, 0.01))).toBe(DREAM_BY_AXIS[a.key].low);
    }
  });

  it('matches fidget()’s convention exactly at the 0.5 boundary', () => {
    // 0.51 is the high pole; 0.49 is the low one. The dream and the idle quirk must never disagree about
    // which half of itself a dino is on.
    expect(dreamWord(only('bravery', 0.51))).toBe(DREAM_BY_AXIS.bravery.high);
    expect(dreamWord(only('bravery', 0.49))).toBe(DREAM_BY_AXIS.bravery.low);
  });

  it('is deterministic from the name-seeded traits — the same dino dreams the same word', () => {
    const rex = seededPersonality('Rex');
    expect(dreamWord(rex)).toBe(dreamWord(seededPersonality('Rex')));
  });

  it('does not give the founding cast one dream between them', () => {
    // The anti-sameness check the item exists for: five sleepers, not five identical `…zzz…`.
    const cast = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'].map((n) => dreamWord(seededPersonality(n)));
    expect(new Set(cast).size).toBeGreaterThanOrEqual(3);
  });

  it('names the word in the book line', () => {
    const p = only('curiosity', 0.99);
    expect(dreamBookLine(p)).toBe(`💭 dreams of ${DREAM_BY_AXIS.curiosity.high}`);
  });
});

describe('murmurLine’s three branches (BACKLOG-181 + 307)', () => {
  it('leaves the memory branch byte-identical when traits are passed', () => {
    const p = seededPersonality('Rex');
    expect(murmurLine('🍖 ate its favorite', p)).toBe('💭 …ate its favorite…');
    expect(murmurLine('🍖 ate its favorite', p)).toBe(murmurLine('🍖 ate its favorite'));
  });

  it('dreams the trait word when there is no memory but there are traits', () => {
    const p = only('energy', 0.99);
    expect(murmurLine(null, p)).toBe(`💭 …${DREAM_BY_AXIS.energy.high}…`);
  });

  it('still dozes generically with no memory and no traits — every pre-307 caller unchanged', () => {
    expect(murmurLine(null)).toBe('💭 …zzz…');
    expect(murmurLine(pickMurmurMemory([]))).toBe('💭 …zzz…');
  });
});
