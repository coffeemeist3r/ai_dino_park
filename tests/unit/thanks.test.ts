import { describe, it, expect } from 'vitest';
import { thankfulOpener } from '../../game/src/world/comfort';
import type { Personality } from '../../game/src/ai/personality';

const p = (agreeableness: number, sociability: number): Personality =>
  ({ curiosity: 0.5, energy: 0.5, bravery: 0.5, agreeableness, sociability });

describe('thankfulOpener (BACKLOG-139)', () => {
  it('names the friend in three registers read off the dino', () => {
    const prickly = thankfulOpener('Rex', p(0.1, 0.9));
    const solitary = thankfulOpener('Rex', p(0.8, 0.1));
    const plain = thankfulOpener('Rex', p(0.8, 0.8));
    for (const l of [prickly, solitary, plain]) expect(l.startsWith('Rex ')).toBe(true);
    expect(new Set([prickly, solitary, plain]).size).toBe(3);
    expect(prickly).toContain("Don't tell them I said thanks");
    expect(solitary).toContain('It helped');
    expect(plain).toContain("I won't forget it");
  });
  it('falls back to the plain register without traits', () => {
    expect(thankfulOpener('Pip')).toBe("Pip sat with me, earlier. I won't forget it.");
  });
});
