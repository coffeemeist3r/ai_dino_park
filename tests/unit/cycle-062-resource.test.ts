import { describe, it, expect } from 'vitest';
import {
  noticeResource,
  resourceLanding,
  rollResource,
  pickKind,
  BIAS_WEIGHT,
  RESOURCE_RANGE,
} from '../../game/src/world/resource';
import { BOWL_ID, GROVE_ID } from '../../game/src/world/zones';
import { serialize, deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';

/**
 * Resource gathering spine (BACKLOG-146). A raw resource appears; a curious dino in range goes to fetch
 * it. Pure decisions tested here; the per-dino tally rides the save additively.
 */

describe('noticeResource (BACKLOG-146)', () => {
  it('fetches when in range and curious enough', () => {
    expect(noticeResource(0.9, 1)).toBe('fetch');
    expect(noticeResource(0.35, RESOURCE_RANGE)).toBe('fetch');
  });
  it('ignores beyond range, however curious', () => {
    expect(noticeResource(1, RESOURCE_RANGE + 1)).toBe('ignore');
  });
  it('ignores when too incurious, even on top of it', () => {
    expect(noticeResource(0.1, 0)).toBe('ignore');
  });
});

describe('resourceLanding (BACKLOG-146)', () => {
  it('always lands in-bounds and off the rim', () => {
    let r = 0;
    const rand = () => ((r = (r + 0.137) % 1), r); // spread of values in [0,1)
    for (let i = 0; i < 200; i++) {
      const t = resourceLanding(20, 15, rand);
      expect(t.tileX).toBeGreaterThanOrEqual(1);
      expect(t.tileX).toBeLessThanOrEqual(18);
      expect(t.tileY).toBeGreaterThanOrEqual(1);
      expect(t.tileY).toBeLessThanOrEqual(13);
    }
  });
});

describe('rollResource / pickKind are deterministic for a seeded rand (BACKLOG-146)', () => {
  it('rollResource fires only below the spawn chance', () => {
    expect(rollResource(() => 0.0)).toBe(true);
    expect(rollResource(() => 0.99)).toBe(false);
  });
  it('pickKind splits branch/stone on 0.5', () => {
    expect(pickKind(() => 0.1)).toBe('branch');
    expect(pickKind(() => 0.9)).toBe('stone');
  });
});

describe('zone resource bias (BACKLOG-348)', () => {
  it('the grove leans branch', () => {
    expect(pickKind(() => 0.1, GROVE_ID)).toBe('branch'); // below BIAS_WEIGHT → favored
    expect(pickKind(() => 0.5, GROVE_ID)).toBe('branch');
  });

  it('the bowl leans stone', () => {
    expect(pickKind(() => 0.1, BOWL_ID)).toBe('stone');
    expect(pickKind(() => 0.5, BOWL_ID)).toBe('stone');
  });

  it('a lean, not a lock — the off-kind still appears past BIAS_WEIGHT', () => {
    expect(pickKind(() => 0.9, GROVE_ID)).toBe('stone'); // grove can still turn up a stone
    expect(pickKind(() => 0.9, BOWL_ID)).toBe('branch'); // bowl can still drop a branch
    expect(BIAS_WEIGHT).toBeGreaterThan(0.5);
    expect(BIAS_WEIGHT).toBeLessThan(1);
  });

  it('back-compat: no zone (or an unknown zone) keeps the uniform 50/50', () => {
    expect(pickKind(() => 0.1)).toBe('branch');
    expect(pickKind(() => 0.9)).toBe('stone');
    expect(pickKind(() => 0.1, 'nowhere')).toBe('branch'); // unbiased id → uniform
    expect(pickKind(() => 0.9, 'nowhere')).toBe('stone');
  });
});

describe('gathered tally rides the save additively (BACKLOG-146)', () => {
  const base = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 9, minute: 0 },
    player: { x: 100, y: 100 },
    friendship: {},
    memory: {},
    bonds: {},
    gratitude: {},
    lastTone: {},
    eggs: [],
    born: [],
  };
  it('round-trips a gathered map', () => {
    const out = deserialize(serialize({ ...base, gathered: { Twitch: 3, Rex: 1 } } as any));
    expect(out?.gathered).toEqual({ Twitch: 3, Rex: 1 });
  });
  it('an older save without gathered loads to {}', () => {
    const out = deserialize(serialize(base as any));
    expect(out?.gathered).toEqual({});
  });
});
