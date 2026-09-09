import { describe, expect, it } from 'vitest';
import { SESSION_MIN_MS, departureStage, shouldStamp } from './departure';

describe('BACKLOG-541 — the departure stage', () => {
  it('is here only when focused and visible', () => {
    expect(departureStage({ focused: true, hidden: false })).toBe('here');
  });

  it('is leaving when focus is lost but the canvas is still painting', () => {
    // The stage the whole item exists for: BACKLOG-119's glance is drawn here, and nowhere else.
    expect(departureStage({ focused: false, hidden: false })).toBe('leaving');
  });

  it('is gone whenever the document is hidden, focused or not', () => {
    // `hidden` wins outright — a minimised window can still report focus on some platforms, and
    // the stage is about what the player can see.
    expect(departureStage({ focused: false, hidden: true })).toBe('gone');
    expect(departureStage({ focused: true, hidden: true })).toBe('gone');
  });
});

describe('BACKLOG-541 — one stamp per departure', () => {
  it('stamps on the first step out of here', () => {
    expect(shouldStamp('here', 'leaving')).toBe(true);
    expect(shouldStamp('here', 'gone')).toBe(true);
  });

  it('does not stamp again as leaving deepens into gone', () => {
    // The ordinary alt-tab fires blur and then visibilitychange. Two events, one departure.
    expect(shouldStamp('leaving', 'gone')).toBe(false);
  });

  it('does not stamp on a return', () => {
    expect(shouldStamp('leaving', 'here')).toBe(false);
    expect(shouldStamp('gone', 'here')).toBe(false);
    expect(shouldStamp('here', 'here')).toBe(false);
  });
});

describe('BACKLOG-541 — the session floor', () => {
  it('is long enough to outlast a boot-time alt-tab and short enough for a ten-minute watch', () => {
    // Stated as a range rather than a value: the number may be tuned, but a floor above the bar's
    // own window would make BACKLOG-119 unreachable in exactly the way CHARTER v7 forbids.
    expect(SESSION_MIN_MS).toBeGreaterThanOrEqual(5_000);
    expect(SESSION_MIN_MS).toBeLessThan(10 * 60_000);
  });
});
