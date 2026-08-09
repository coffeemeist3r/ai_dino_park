/**
 * BACKLOG-424 — traces of your pacing. The mark a private ritual leaves on the ground, and the rules that
 * keep it honest: one live mark per pacer, a freshness window, no reading your own scuff, and a memory that
 * names nobody.
 */
import { describe, it, expect } from 'vitest';
import {
  recordTrace,
  freshTraces,
  traceNear,
  traceMemory,
  traceKey,
  TRACE_FRESH_STEPS,
  type PaceTrace,
} from '../../game/src/world/traces';
import { ROSTER } from '../../game/src/entities/roster';

const t = (over: Partial<PaceTrace> = {}): PaceTrace => ({ zone: 'bowl', tileX: 5, tileY: 5, by: 'Mossback', at: 10, ...over });

describe('recording', () => {
  it('a dino has at most one live trace — a new one replaces its own', () => {
    const list = recordTrace(recordTrace([], t()), t({ tileX: 9, at: 20 }));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ tileX: 9, at: 20 });
  });

  it('two dinos keep two marks', () => {
    const list = recordTrace(recordTrace([], t()), t({ by: 'Twitch', tileX: 1 }));
    expect(list.map((x) => x.by)).toEqual(['Mossback', 'Twitch']);
  });
});

describe('freshness', () => {
  it('a mark older than the window is gone', () => {
    const list = [t({ at: 0 })];
    expect(freshTraces(list, TRACE_FRESH_STEPS)).toHaveLength(1);
    expect(freshTraces(list, TRACE_FRESH_STEPS + 1)).toHaveLength(0);
  });

  it('the proximity read honours the window', () => {
    const list = [t({ at: 0 })];
    expect(traceNear(list, 'bowl', { tileX: 5, tileY: 5 }, 'Twitch', TRACE_FRESH_STEPS)).not.toBeNull();
    expect(traceNear(list, 'bowl', { tileX: 5, tileY: 5 }, 'Twitch', TRACE_FRESH_STEPS + 1)).toBeNull();
  });
});

describe('the proximity read', () => {
  const list = [t()];

  it('matches within one tile and not at two', () => {
    expect(traceNear(list, 'bowl', { tileX: 5, tileY: 5 }, 'Twitch', 10)).not.toBeNull();
    expect(traceNear(list, 'bowl', { tileX: 6, tileY: 4 }, 'Twitch', 10)).not.toBeNull();
    expect(traceNear(list, 'bowl', { tileX: 7, tileY: 5 }, 'Twitch', 10)).toBeNull();
    expect(traceNear(list, 'bowl', { tileX: 5, tileY: 3 }, 'Twitch', 10)).toBeNull();
  });

  it('is zone-scoped — the same tile in another ground is not the same ground', () => {
    expect(traceNear(list, 'grove', { tileX: 5, tileY: 5 }, 'Twitch', 10)).toBeNull();
  });

  it('a dino never reads its own scuff', () => {
    expect(traceNear(list, 'bowl', { tileX: 5, tileY: 5 }, 'Mossback', 10)).toBeNull();
  });

  it('the freshest of two in range wins, deterministically', () => {
    const two = [t({ by: 'A', at: 5 }), t({ by: 'B', at: 9, tileX: 6 })];
    expect(traceNear(two, 'bowl', { tileX: 5, tileY: 5 }, 'Twitch', 10)?.by).toBe('B');
    const reversed = [two[1], two[0]];
    expect(traceNear(reversed, 'bowl', { tileX: 5, tileY: 5 }, 'Twitch', 10)?.by).toBe('B');
  });
});

describe('what the finder learns', () => {
  it('the memory names nobody', () => {
    const line = traceMemory();
    expect(line).toContain('someone');
    for (const r of ROSTER) expect(line).not.toContain(r.name);
  });

  it('the guard key identifies the event, not the tile', () => {
    expect(traceKey(t())).toBe(traceKey(t({ tileX: 99 })));
    expect(traceKey(t())).not.toBe(traceKey(t({ at: 11 })));
    expect(traceKey(t())).not.toBe(traceKey(t({ by: 'Twitch' })));
  });
});
