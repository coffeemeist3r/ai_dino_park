import { describe, it, expect } from 'vitest';
import {
  TIC_COMPANY_RANGE,
  ECHO_WATCH_RANGE,
  watchingTic,
  kinshipMemory,
  kinshipLine,
} from '../../game/src/world/tic';

/**
 * Not the only one (BACKLOG-416) — two solitary dinos ticcing in sight of each other, neither crossing.
 *
 * The band is re-asserted here as well as in 407's spec on purpose: 416 now depends on the same predicate for
 * the opposite reason, and a future widening of `ECHO_WATCH_RANGE` must break both specs, not one.
 */
describe('BACKLOG-416 — not the only one', () => {
  it('reuses 407’s band and introduces no second distance', () => {
    expect(watchingTic(TIC_COMPANY_RANGE)).toBe(false); // 3 — any nearer and no ritual would have formed
    expect(watchingTic(TIC_COMPANY_RANGE + 1)).toBe(true); // 4 — the near edge of the window
    expect(watchingTic(ECHO_WATCH_RANGE)).toBe(true); // 8 — the far edge
    expect(watchingTic(ECHO_WATCH_RANGE + 1)).toBe(false); // 9 — out of sight
  });

  it('names the other dino without calling it a friend', () => {
    const m = kinshipMemory('Mossback');
    expect(m).toContain('Mossback');
    // The whole asymmetry with 407: no bond is required, so the note must not claim one.
    expect(m).not.toContain('friend');
  });

  it('the ticker beat names both, and neither is the subject of the other', () => {
    const line = kinshipLine('Rex', 'Sunny');
    expect(line).toContain('Rex');
    expect(line).toContain('Sunny');
  });

  it('each dino files a note about the other, never about itself', () => {
    expect(kinshipMemory('Sunny')).not.toBe(kinshipMemory('Rex'));
  });
});
