import { describe, it, expect } from 'vitest';
import {
  MISSED_MIN_MINUTES,
  NOTICE_BAR,
  WARM_BAR,
  missedGrade,
  missedMemory,
  missedOpener,
  missedYou,
  noticing,
  type MissedGrade,
} from '../../game/src/world/missed';
import { seededPersonality, type Personality } from '../../game/src/ai/personality';
import { ROSTER } from '../../game/src/entities/roster';

/**
 * Missed-you memory (BACKLOG-116).
 *
 * The load-bearing test here is the founding-spread one. Everything else pins the shape of the derivation;
 * that one pins the thing CHARTER v7's corollary actually demands — that the shipping park *exercises* the
 * system rather than sitting under it — and it derives the cast rather than naming dinos, so a roster change
 * or a trait tweak that collapses the three grades into two fails loudly here instead of quietly shipping a
 * park where every resident reacts the same way.
 */

function p(over: Partial<Personality>): Personality {
  return { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5, ...over };
}

/** The founding Bowl — derived, never listed: the roster rows with no explicit zone live in the bowl. */
const BOWL = ROSTER.filter((r) => !r.zone);

describe('missedGrade', () => {
  it('is pure — same inputs, same grade', () => {
    const q = p({ sociability: 0.9, agreeableness: 0.9 });
    expect(missedGrade(q, 3)).toBe(missedGrade(q, 3));
  });

  it('below the notice bar it is unmoved, however warm it is', () => {
    const shy = p({ sociability: 0.02, curiosity: 0.02, agreeableness: 1 });
    expect(noticing(shy)).toBeLessThan(NOTICE_BAR);
    expect(missedGrade(shy, 10)).toBe('unmoved');
  });

  it('above the notice bar, agreeableness decides whether it will say so', () => {
    const social = { sociability: 1, curiosity: 1 };
    expect(missedGrade(p({ ...social, agreeableness: WARM_BAR + 0.1 }), 0)).toBe('missed');
    expect(missedGrade(p({ ...social, agreeableness: WARM_BAR - 0.1 }), 0)).toBe('aloof');
  });

  it('hearts alone can move a fixed personality from aloof to missed', () => {
    const prickly = p({ sociability: 1, curiosity: 1, agreeableness: WARM_BAR - 0.2 });
    expect(missedGrade(prickly, 0)).toBe('aloof');
    expect(missedGrade(prickly, 10)).toBe('missed');
  });

  it('the two axes are independent — a warm dino that never noticed stays unmoved', () => {
    expect(missedGrade(p({ sociability: 0, curiosity: 0, agreeableness: 1 }), 10)).toBe('unmoved');
  });
});

describe('the founding park exercises all three grades (CHARTER v7 corollary)', () => {
  it("the Bowl's founding residents produce every grade at zero friendship", () => {
    const grades = BOWL.map((r) => missedGrade(seededPersonality(r.name), 0));
    expect(new Set<MissedGrade>(grades).size).toBe(3);
  });

  it('and so does the park as a whole', () => {
    const grades = ROSTER.map((r) => missedGrade(seededPersonality(r.name), 0));
    expect(new Set<MissedGrade>(grades).size).toBe(3);
  });

  it('every founding resident clears or misses the notice bar with margin', () => {
    // The bar was fitted, not picked: a resident sitting on the line would have its grade flipped by any
    // unrelated trait change. `chronotype.ts` states the same discipline for OWL_BAR.
    for (const r of ROSTER) {
      expect(Math.abs(noticing(seededPersonality(r.name)) - NOTICE_BAR)).toBeGreaterThan(0.03);
    }
  });
});

describe('the builders', () => {
  it('give each grade its own words, and unmoved none', () => {
    expect(missedMemory('missed')).not.toBe(missedMemory('aloof'));
    expect(missedOpener('missed')).not.toBe(missedOpener('aloof'));
    for (const g of ['missed', 'aloof'] as const) {
      expect(missedMemory(g)).toBeTruthy();
      expect(missedOpener(g)).toBeTruthy();
    }
    expect(missedMemory('unmoved')).toBeNull();
    expect(missedOpener('unmoved')).toBeNull();
  });
});

describe('missedYou', () => {
  const cast = ROSTER.map((r) => ({ name: r.name, traits: seededPersonality(r.name), hearts: 0 }));

  it('is empty below the threshold and non-empty at it', () => {
    expect(missedYou(cast, MISSED_MIN_MINUTES - 1)).toEqual({});
    expect(Object.keys(missedYou(cast, MISSED_MIN_MINUTES)).length).toBeGreaterThan(0);
  });

  it('omits unmoved residents entirely rather than grading them', () => {
    const out = missedYou(cast, MISSED_MIN_MINUTES);
    expect(Object.values(out)).not.toContain('unmoved');
    const unmoved = cast.filter((d) => missedGrade(d.traits, d.hearts) === 'unmoved');
    expect(unmoved.length).toBeGreaterThan(0); // the absence is the beat — there must be somebody wearing it
    for (const d of unmoved) expect(out[d.name]).toBeUndefined();
  });
});
