import { describe, it, expect } from 'vitest';
import {
  COLD_SEASON,
  sleptCold,
  coldShiver,
  coldMemory,
  WARM_BONUS,
  warmGain,
  warmLine,
  warmMemory,
} from '../../game/src/world/cold';
import { REPAIR_BONUS } from '../../game/src/world/repair';
import { greetGain } from '../../game/src/social/friendship';
import { SEASONS, type Season } from '../../game/src/world/seasons';
import type { Personality } from '../../game/src/ai/personality';

const WARM: Season[] = SEASONS.filter((s) => s !== COLD_SEASON);

describe('cold-night shiver (BACKLOG-179)', () => {
  it('a winter night never huddled sleeps cold', () => {
    expect(sleptCold(false, 'winter')).toBe(true);
  });

  it('a winter night that did huddle is warm', () => {
    expect(sleptCold(true, 'winter')).toBe(false);
  });

  it('warm seasons never leave a sleeper cold, huddled or not', () => {
    for (const s of WARM) {
      expect(sleptCold(false, s)).toBe(false);
      expect(sleptCold(true, s)).toBe(false);
    }
  });

  it('huddling is never cold in any season', () => {
    for (const s of SEASONS) expect(sleptCold(true, s)).toBe(false);
  });

  it('only winter is the cold season', () => {
    expect(COLD_SEASON).toBe('winter');
  });

  it('the shiver bubble and the stored memory are distinct, non-empty, and both freezing', () => {
    expect(coldShiver().length).toBeGreaterThan(0);
    expect(coldMemory().length).toBeGreaterThan(0);
    expect(coldShiver()).toContain('🥶');
    expect(coldMemory()).toContain('🥶');
    expect(coldShiver()).not.toBe(coldMemory());
  });
});

describe("keeper's warmth (BACKLOG-184)", () => {
  const corners: Array<Personality | undefined> = [
    undefined,
    { curiosity: 0, sociability: 0, energy: 0, agreeableness: 0, bravery: 0 },
    { curiosity: 1, sociability: 1, energy: 1, agreeableness: 1, bravery: 1 },
    { curiosity: 1, sociability: 0, energy: 1, agreeableness: 0, bravery: 1 },
    { curiosity: 0, sociability: 1, energy: 0, agreeableness: 1, bravery: 0 },
  ];

  it('a warming greet is a normal greet plus the bonus — personality still scales the mend', () => {
    for (const t of corners) expect(warmGain(t)).toBe(greetGain(t) + WARM_BONUS);
  });

  it('the warm bonus matches the repair bonus — the two mends weigh the same', () => {
    expect(WARM_BONUS).toBe(REPAIR_BONUS);
    expect(WARM_BONUS).toBeGreaterThanOrEqual(6);
  });

  it('the warm line names the dino and smiles; the warm memory credits the keeper', () => {
    expect(warmLine('Glade')).toContain('Glade');
    expect(warmLine('Glade')).toContain('😊');
    expect(warmMemory()).toContain('keeper');
    expect(warmMemory()).toContain('warm');
  });

  it('the mend is not the wound — warm strings never carry the freeze', () => {
    expect(warmLine('Glade')).not.toContain('🥶');
    expect(warmMemory()).not.toContain('🥶');
    expect(warmMemory()).not.toBe(coldMemory());
  });
});
