import { describe, it, expect } from 'vitest';
import { ZONE_FLOOR, DECLINING_MIGRATE_DAMP, bumpPeak, isDeclining, declineGlyph } from './decline';
import { SETTLED_MIGRATE_DAMP } from './belonging';

describe('bumpPeak (BACKLOG-460)', () => {
  it('raises a zone peak to a higher head count', () => {
    expect(bumpPeak({}, 'bowl', 5)).toEqual({ bowl: 5 });
    expect(bumpPeak({ bowl: 3 }, 'bowl', 5)).toEqual({ bowl: 5 });
  });

  it('no-ops (same reference) at or below the recorded peak', () => {
    const p = { bowl: 5 };
    expect(bumpPeak(p, 'bowl', 5)).toBe(p); // equal
    expect(bumpPeak(p, 'bowl', 4)).toBe(p); // below
    expect(bumpPeak(p, 'bowl', 0)).toBe(p);
  });

  it('never lowers a peak', () => {
    expect(bumpPeak({ bowl: 5 }, 'bowl', 2).bowl).toBe(5);
  });

  it('tracks each zone independently', () => {
    const p = bumpPeak(bumpPeak({}, 'bowl', 5), 'grove', 2);
    expect(p).toEqual({ bowl: 5, grove: 2 });
  });
});

describe('isDeclining (BACKLOG-460)', () => {
  it('is true when a zone has lost residents but still holds the floor', () => {
    expect(isDeclining(5, 3)).toBe(true);
    expect(isDeclining(5, 1)).toBe(true); // down to the floor still reads declining
  });

  it('is false at or above the peak (stable / growing)', () => {
    expect(isDeclining(5, 5)).toBe(false);
    expect(isDeclining(5, 6)).toBe(false);
    expect(isDeclining(0, 0)).toBe(false);
  });

  it('is false at zero residents (not a live hollowing)', () => {
    expect(isDeclining(5, 0)).toBe(false);
  });
});

describe('decline knobs', () => {
  it('a declining zone holds its people more weakly than a stable one', () => {
    expect(DECLINING_MIGRATE_DAMP).toBeLessThan(SETTLED_MIGRATE_DAMP);
  });

  it('the floor keeps at least one resident', () => {
    expect(ZONE_FLOOR).toBe(1);
  });

  it('declineGlyph is the down arrow', () => {
    expect(declineGlyph()).toBe('⬇');
  });
});
