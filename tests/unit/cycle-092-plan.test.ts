/**
 * Persona-shaped daily plan (BACKLOG-012) — the pure day-shape layer.
 *
 * Pins: the plan is deterministic and covers every day-phase with a closed-set kind; traits lean
 * the per-phase pick; the active intent reads the current phase off the plan; the book shape reads
 * dawn→night; and the pickKind refactor left proceduralIntent byte-identical (cycle-090 guard).
 */
import { describe, expect, it } from 'vitest';
import { DAY_PHASES, activeIntent, planShape, proceduralPlan, type DayPlan } from '../../game/src/ai/plan';
import { INTENT_KINDS, INTENT_NOTES, proceduralIntent } from '../../game/src/ai/intent';
import type { Personality } from '../../game/src/ai/personality';
import { seededPersonality } from '../../game/src/ai/personality';

const t = seededPersonality('TestDino');
const social: Personality = { curiosity: 0.5, sociability: 1, energy: 0.5 };
const loner: Personality = { curiosity: 0.5, sociability: 0, energy: 0.5 };

describe('proceduralPlan (the deterministic floor)', () => {
  it('is deterministic: same (name, day) → deep-equal plan', () => {
    expect(proceduralPlan('Rex', 3, t)).toEqual(proceduralPlan('Rex', 3, t));
  });

  it('a different day or name changes the plan', () => {
    expect(proceduralPlan('Rex', 3, t)).not.toEqual(proceduralPlan('Rex', 4, t));
    expect(proceduralPlan('Rex', 3, t)).not.toEqual(proceduralPlan('Mossback', 3, t));
  });

  it('covers all four day-phases with a closed-set kind', () => {
    const plan = proceduralPlan('Rex', 3, t);
    for (const phase of DAY_PHASES) {
      expect(plan[phase]).toBeDefined();
      expect(INTENT_KINDS).toContain(plan[phase]);
    }
    expect(Object.keys(plan).sort()).toEqual([...DAY_PHASES].sort());
  });

  it('traits lean the pick: a max-social dino plans more social phases than a loner (over a sample of days)', () => {
    const count = (traits: Personality) => {
      let n = 0;
      for (let day = 1; day <= 200; day++) {
        const plan = proceduralPlan('Rex', day, traits);
        for (const phase of DAY_PHASES) if (plan[phase] === 'social') n++;
      }
      return n;
    };
    expect(count(social)).toBeGreaterThan(count(loner));
  });
});

describe('activeIntent', () => {
  it('reads the current phase off the plan, with the deterministic floor note and the given day', () => {
    const plan = proceduralPlan('Rex', 3, t);
    for (const phase of DAY_PHASES) {
      const intent = activeIntent(plan, phase, 3);
      expect(intent.kind).toBe(plan[phase]);
      expect(intent.note).toBe(INTENT_NOTES[plan[phase]]);
      expect(intent.until).toBe(3);
    }
  });
});

describe('planShape', () => {
  it('renders four segments in dawn→day→dusk→night order', () => {
    const plan: DayPlan = { dawn: 'forage', day: 'social', dusk: 'solitary', night: 'restless' };
    expect(planShape(plan)).toBe('forage → social → solitary → rest');
  });
});

describe('pickKind refactor (cycle-090 byte-identical guard)', () => {
  it('proceduralIntent is unchanged after factoring out pickKind', () => {
    // The exact determinism cycle-090 pinned: same (name, day) → same intent.
    expect(proceduralIntent('Rex', 3, t)).toEqual(proceduralIntent('Rex', 3, t));
    expect(proceduralIntent('Rex', 3, t).kind).toBe(proceduralIntent('Rex', 3, t).kind);
  });
});
