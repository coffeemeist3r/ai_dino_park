import { describe, it, expect } from 'vitest';
import { firstGroveArrival, groveArrivalMemory, groveArrivalLine } from '../../game/src/world/arrival';
import { murmurLine } from '../../game/src/world/murmur';
import { BOWL_ID, GROVE_ID } from '../../game/src/world/zones';

describe('first steps in the grove (BACKLOG-339)', () => {
  it('fires on an unvisited dino crossing into the grove', () => {
    expect(firstGroveArrival([], 'Rex', GROVE_ID)).toBe(true);
    expect(firstGroveArrival(['Sunny'], 'Rex', GROVE_ID)).toBe(true);
  });

  it('does not fire on a dino that has already been to the grove (once ever)', () => {
    expect(firstGroveArrival(['Rex'], 'Rex', GROVE_ID)).toBe(false);
  });

  it('never fires on a crossing into the bowl (the beat is grove-only)', () => {
    expect(firstGroveArrival([], 'Rex', BOWL_ID)).toBe(false);
    expect(firstGroveArrival(['Rex'], 'Rex', BOWL_ID)).toBe(false);
  });

  it('the arrival memory is a non-empty, distinct line', () => {
    expect(groveArrivalMemory()).toMatch(/grove/i);
    expect(groveArrivalMemory()).not.toBe(groveArrivalLine());
  });

  it('the arrival memory reads as a fragment, not a log line, when a sleeper later dreams it (181 cross-check)', () => {
    // The murmur (181) strips a leading event glyph; the grove memory leads with 🌿, so a dino that
    // crossed today and later murmurs about it must surface a clean fragment, not "🌿 …🌿 first…".
    const dream = murmurLine(groveArrivalMemory());
    expect(dream).toContain('first time across');
    expect(dream.startsWith('💭 …')).toBe(true);
    expect(dream).not.toContain('🌿');
  });
});
