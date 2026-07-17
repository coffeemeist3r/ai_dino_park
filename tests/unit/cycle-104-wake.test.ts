import { describe, it, expect } from 'vitest';
import { wokeHungry, wakeHungryLine, wakeHungryMemory } from '../../game/src/world/wake';
import { NEED_THRESHOLD } from '../../game/src/world/needs';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Woke hungry (BACKLOG-376) — the dawn beat's pure half: who wakes hungry, and how the morning sounds
 * coming out of a given temperament.
 */

const traits = (over: Partial<Personality> = {}): Personality => ({
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
  ...over,
});

describe('wokeHungry (BACKLOG-376)', () => {
  it('fires at the pressing bar and not a hair under', () => {
    expect(wokeHungry({ hunger: NEED_THRESHOLD - 0.001, thirst: 0 })).toBe(false);
    expect(wokeHungry({ hunger: NEED_THRESHOLD, thirst: 0 })).toBe(true);
    expect(wokeHungry({ hunger: 1, thirst: 0 })).toBe(true);
  });

  it('is silent for a sated dino and for one the needs map has never seen', () => {
    expect(wokeHungry({ hunger: 0, thirst: 0 })).toBe(false);
    expect(wokeHungry(undefined)).toBe(false);
  });

  it('still fires for a dino that is thirstier than it is hungry', () => {
    // The pressingNeed() trap: that fn answers "the MORE pressing need" and would report 'thirst' here,
    // robbing a hungry dino of its morning. Hunger is hunger, whatever else it also wants.
    expect(wokeHungry({ hunger: 0.7, thirst: 0.9 })).toBe(true);
  });
});

describe('wakeHungryLine (BACKLOG-376)', () => {
  it('names the dino and carries the 🍖', () => {
    const line = wakeHungryLine('Rex', traits());
    expect(line).toContain('Rex');
    expect(line).toContain('🍖');
    expect(line).toContain('woke hungry');
  });

  it('is deterministic — the same dino wakes the same way twice', () => {
    const t = traits({ agreeableness: 0.2 });
    expect(wakeHungryLine('Rex', t)).toBe(wakeHungryLine('Rex', t));
  });

  it('shades by temperament: a prickly dino does not wake like a warm one', () => {
    const prickly = wakeHungryLine('Thornback', traits({ agreeableness: 0.1 }));
    const warm = wakeHungryLine('Thornback', traits({ agreeableness: 0.9 }));
    expect(prickly).not.toBe(warm);
  });

  it('shades by temperament: a high-energy dino does not wake like a placid one', () => {
    const eager = wakeHungryLine('Twitch', traits({ energy: 0.95 }));
    const placid = wakeHungryLine('Twitch', traits({ energy: 0.2 }));
    expect(eager).not.toBe(placid);
  });

  it('is total — a dino with no traits gets the neutral form and never throws', () => {
    const line = wakeHungryLine('Mossback');
    expect(line).toContain('Mossback');
    expect(line).toBe(wakeHungryLine('Mossback', traits()));
  });
});

describe('wakeHungryMemory (BACKLOG-376)', () => {
  it('reads as the dino remembering the night', () => {
    expect(wakeHungryMemory()).toContain('hungry');
    expect(wakeHungryMemory().length).toBeGreaterThan(0);
  });
});
