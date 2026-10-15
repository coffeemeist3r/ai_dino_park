import { describe, expect, it } from 'vitest';
import { MOLT_ART_KEY, MOLT_NUDGE, moltKind, moltLine, moltMemory, moltTicker, moltTraits } from './molt';
import { RIVAL_BAR } from '../social/grudges';
import { CLOSE_BOND } from '../social/closest';
import { FOUNDING_BONDS, FOUNDING_GRUDGES } from './founding';
import { seededPersonality } from '../ai/personality';
import { worldPlacedProps } from './reachability';

describe('the molt (BACKLOG-023)', () => {
  it('a grudge hardens, a close friend softens, neither leaves it bolder — and a grudge outranks a friend', () => {
    expect(moltKind({ friendPts: CLOSE_BOND, grudgePts: 0 })).toBe('softer');
    expect(moltKind({ friendPts: CLOSE_BOND - 1, grudgePts: 0 })).toBe('bolder');
    expect(moltKind({ friendPts: 90, grudgePts: RIVAL_BAR })).toBe('harder');
  });

  it('nudges one axis and clamps', () => {
    const t = seededPersonality('Pip');
    expect(moltTraits(t, 'softer').agreeableness).toBeCloseTo(Math.min(1, t.agreeableness + MOLT_NUDGE));
    expect(moltTraits(t, 'harder').agreeableness).toBeCloseTo(Math.max(0, t.agreeableness - MOLT_NUDGE));
    expect(moltTraits(t, 'bolder').bravery).toBeCloseTo(Math.min(1, t.bravery + MOLT_NUDGE));
    expect(moltTraits({ ...t, agreeableness: 0.95 }, 'softer').agreeableness).toBe(1);
    expect(moltTraits(t, 'softer').curiosity).toBe(t.curiosity);
  });

  it('speaks, posts and remembers in its own words', () => {
    expect(moltLine('softer', 'Bramble')).toBe("🐚 All grown! I'm keeping Bramble close.");
    expect(moltLine('harder', 'Twitch')).toBe("🐚 Grown. And I haven't forgotten Twitch.");
    expect(moltLine('bolder')).toBe('🐚 Look at me — all grown up!');
    expect(moltTicker('Pip', 'softer')).toBe('🐚 Pip molted — came out softer');
    expect(moltMemory('harder')).toBe('grew up — came out harder');
  });

  it('founding Pip comes out softer: close to Bramble, no grudge', () => {
    const bramble = FOUNDING_BONDS.find(([a, b]) => [a, b].includes('Pip'))!;
    expect(bramble[2]).toBeGreaterThanOrEqual(CLOSE_BOND);
    expect(FOUNDING_GRUDGES.some(([a, b]) => a === 'Pip' || b === 'Pip')).toBe(false);
  });

  it('the shed skin has a host in the shipping world', () => {
    expect(worldPlacedProps().has(MOLT_ART_KEY)).toBe(true);
  });
});
