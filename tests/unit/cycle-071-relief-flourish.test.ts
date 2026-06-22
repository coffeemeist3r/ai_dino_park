import { describe, it, expect } from 'vitest';
import { fidget, reliefFlourish } from '../../game/src/world/fidget';
import type { Personality } from '../../game/src/ai/personality';

const pacer: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.95 };
const bouncer: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.95, agreeableness: 0.5, bravery: 0.5 };

describe('reliefFlourish — mood lifts the motion (BACKLOG-318)', () => {
  it('is the signature quirk glyph, brightened', () => {
    for (const p of [pacer, bouncer]) {
      const f = reliefFlourish(p);
      expect(f.startsWith(fidget(p).glyph)).toBe(true);
      expect(f.endsWith('✨')).toBe(true);
    }
  });

  it('is deterministic', () => {
    expect(reliefFlourish(pacer)).toBe(reliefFlourish(pacer));
  });
});
