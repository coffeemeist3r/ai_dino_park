import { describe, it, expect } from 'vitest';
import {
  providerWorkPriority,
  providerPriority,
  landmarkDeferredForGathering,
  granaryGateFor,
  workRegrowth,
  workRegrowMult,
  workGlyph,
  WORK_BUILD_FLOOR,
} from '../../game/src/world/governance';
import { regrowYield, YIELD_MAX } from '../../game/src/world/regrowth';
import { handoverBeat, workPhrase } from '../../game/src/world/handover';
import { canBuildGranary, GRANARY_AFTER_STRUCTURES, GRANARY_RECIPE } from '../../game/src/world/granary';
import { zoneMapModel } from '../../game/src/ui/lenses';
import type { Personality } from '../../game/src/ai/personality';

const traits = (p: Partial<Personality>): Personality => ({
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
  ...p,
});

describe('BACKLOG-473 — the ground’s second decision', () => {
  it('reads the provider’s energy: energetic builds, calm gathers', () => {
    expect(providerWorkPriority(traits({ energy: 0.9 }))).toBe('build');
    expect(providerWorkPriority(traits({ energy: 0.1 }))).toBe('gather');
    expect(providerWorkPriority(traits({ energy: 0.5 }))).toBe('build'); // boundary
    expect(providerWorkPriority(undefined)).toBe('build'); // absent traits → today's behaviour
  });

  it('reads a different axis from the spend call — warmth and drive decide separately', () => {
    const driven = traits({ energy: 0.9, agreeableness: 0.1 });
    expect(providerWorkPriority(driven)).toBe('build');
    expect(providerPriority(driven)).toBe('bank');
    const calmWarm = traits({ energy: 0.1, agreeableness: 0.9 });
    expect(providerWorkPriority(calmWarm)).toBe('gather');
    expect(providerPriority(calmWarm)).toBe('feed');
  });

  it('defers the bias landmark only for a gather-first ground below the floor', () => {
    for (let n = 0; n <= WORK_BUILD_FLOOR + 4; n++) {
      expect(landmarkDeferredForGathering(null, n)).toBe(false);
      expect(landmarkDeferredForGathering(undefined, n)).toBe(false);
      expect(landmarkDeferredForGathering('build', n)).toBe(false);
      expect(landmarkDeferredForGathering('gather', n)).toBe(n < WORK_BUILD_FLOOR);
    }
  });

  it('shaves the granary gate for a build-first ground, floored at 1', () => {
    expect(granaryGateFor('build', GRANARY_AFTER_STRUCTURES)).toBe(GRANARY_AFTER_STRUCTURES - 1);
    expect(granaryGateFor('build', 1)).toBe(1);
    expect(granaryGateFor('gather', GRANARY_AFTER_STRUCTURES)).toBe(GRANARY_AFTER_STRUCTURES);
    expect(granaryGateFor(null, GRANARY_AFTER_STRUCTURES)).toBe(GRANARY_AFTER_STRUCTURES);
  });

  it('threads the shaved gate all the way into canBuildGranary (no half-applied policy)', () => {
    const rich = { ...GRANARY_RECIPE } as Record<string, number>;
    const oneShort = GRANARY_AFTER_STRUCTURES - 1;
    expect(canBuildGranary(rich, oneShort, false)).toBe(false); // pre-473 caller: unchanged
    expect(canBuildGranary(rich, oneShort, false, granaryGateFor('build', GRANARY_AFTER_STRUCTURES))).toBe(true);
    expect(canBuildGranary(rich, oneShort, false, granaryGateFor('gather', GRANARY_AFTER_STRUCTURES))).toBe(false);
  });

  it('scales regrowth by the work priority, with null bit-identical to regrowYield', () => {
    for (const y of [0, 0.5, 1]) expect(workRegrowth(null, y)).toBe(regrowYield(y));
    expect(workRegrowth('gather', 0.5)).toBeGreaterThan(workRegrowth(null, 0.5));
    expect(workRegrowth(null, 0.5)).toBeGreaterThan(workRegrowth('build', 0.5));
    expect(workRegrowMult(null)).toBe(1);
    for (const p of ['gather', 'build', null] as const) {
      expect(workRegrowth(p, 1)).toBeLessThanOrEqual(YIELD_MAX);
      expect(workRegrowth(p, 0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('renders one glyph per call, and nothing for an unpolicied ground', () => {
    expect(workGlyph('gather')).toBe('🧺');
    expect(workGlyph('build')).toBe('🧱');
    expect(workGlyph(null)).toBe('');
    expect(workGlyph(undefined)).toBe('');
  });

  it('names both calls on a handover, and leaves the 4-arg beat untouched', () => {
    const four = handoverBeat(null, 'Sunny', 'The Grove', 'feed');
    expect(four).toBe("🧺 Sunny sets the Grove's table now — mouths before walls"); // BACKLOG-499
    const five = handoverBeat(null, 'Sunny', 'The Grove', 'feed', 'build');
    expect(five).toContain('mouths before walls');
    expect(five).toContain(workPhrase('build'));
    expect(handoverBeat('Sunny', 'Sunny', 'The Grove', 'feed', 'build')).toBeNull();
  });

  it('leaves the lens work read null for a caller that passes none', () => {
    for (const e of zoneMapModel(['bowl'], { bowl: 2 }, 'bowl')) expect(e.work).toBeNull();
    expect(zoneMapModel(['bowl'], { bowl: 2 }, 'bowl', {}, {}, {}, [], {}, {}, {}, { bowl: 'gather' })[0].work).toBe(
      'gather',
    );
  });
});
