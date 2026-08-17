import { describe, it, expect } from 'vitest';
import {
  billLean,
  calledWork,
  billCallLine,
  councilWorkPriority,
  workRegrowMult,
  landmarkDeferredForGathering,
  granaryGateFor,
  WORK_BUILD_FLOOR,
  GATHER_REGROW_MULT,
  type WorkPriority,
} from '../../game/src/world/governance';
import { UPKEEP_GLYPH } from '../../game/src/world/upkeep';

/**
 * The bill reaches the call (BACKLOG-485) — a ground carrying a derelict landmark leans its own work call
 * toward gathering. The load-bearing assertion is the *identity*: `calledWork(x, 0) === x` for every input
 * a ground can be in. A park with nothing derelict must be bit-identical, and the rest of the suite passing
 * unamended is the other half of that evidence.
 */

const ALL: Array<WorkPriority | null | undefined> = ['gather', 'build', null, undefined];

describe('what a ground s disrepair asks of it', () => {
  it('asks nothing at all when nothing is derelict', () => {
    expect(billLean(0)).toBeNull();
  });

  it('asks for gathering from one derelict landmark upward', () => {
    expect(billLean(1)).toBe('gather');
    expect(billLean(3)).toBe('gather');
  });

  it('does not scale — one falling-down wall is already the whole answer', () => {
    expect(billLean(1)).toBe(billLean(9));
  });
});

describe('the call as the ground lives it', () => {
  it('is the ground s own decision, untouched, with nothing derelict', () => {
    for (const x of ALL) expect(calledWork(x, 0)).toBe(x ?? null);
  });

  it('overrides a build call while the walls are coming down', () => {
    expect(calledWork('build', 1)).toBe('gather');
  });

  it('answers even for a ground that has decided nothing of its own', () => {
    expect(calledWork(null, 1)).toBe('gather');
    expect(calledWork(undefined, 1)).toBe('gather');
  });

  it('leaves a gathering ground exactly where it was', () => {
    expect(calledWork('gather', 2)).toBe('gather');
  });

  it('is a lean, not a decision: the vote it wraps is unchanged and re-emerges when the bill is paid', () => {
    const voted = councilWorkPriority(['build', 'build'], null); // what the seats actually decided
    expect(calledWork(voted, 1)).toBe('gather');
    expect(calledWork(voted, 0)).toBe('build');
  });
});

describe('the loop the lean closes', () => {
  it('reaches all three work hooks through the leaned answer', () => {
    const leaned = calledWork('build', 1);
    expect(workRegrowMult(leaned)).toBe(GATHER_REGROW_MULT); // the ground recovers faster for being worked
    expect(landmarkDeferredForGathering(leaned, WORK_BUILD_FLOOR - 1)).toBe(true); // no new cairn on a thin pile
    expect(granaryGateFor(leaned, 4)).toBe(4); // the build-first shortcut is gone
  });

  it('and releases every one of them once the landmark is patched up', () => {
    const back = calledWork('build', 0);
    expect(landmarkDeferredForGathering(back, WORK_BUILD_FLOOR - 1)).toBe(false);
    expect(granaryGateFor(back, 4)).toBe(3);
  });
});

describe('the beat', () => {
  it('is marked as upkeep, not as a ballot — no council decided this', () => {
    const line = billCallLine('Grove');
    expect(line.startsWith(UPKEEP_GLYPH)).toBe(true);
    expect(line).toContain('Grove');
    expect(line).not.toContain('🗳️');
  });
});
