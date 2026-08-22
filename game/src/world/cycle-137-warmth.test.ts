import { describe, it, expect } from 'vitest';
import {
  catchWarmth,
  catchWarmedLine,
  CATCH_WARMTH,
  CATCH_WARMTH_PER_STRETCH,
  CATCH_WARMTH_LIFETIME,
  caughtRegister,
} from './tic';

describe('BACKLOG-422 — warmed by the catch', () => {
  it('the unfond catch never warms', () => {
    // Criterion 1, and the one that must not be "fixed": 420's flatness is the tell, so it is worth zero
    // however deep into a stretch the keeper is. `caughtRegister(n, false)` is always 'bashful'.
    for (const n of [1, 2, 3, 9]) {
      expect(catchWarmth(caughtRegister(n, false), 0, 0)).toBe(0);
    }
    expect(CATCH_WARMTH.bashful).toBe(0);
  });

  it('a full climb in one stretch grants 2, then 3, then 4', () => {
    // Criterion 2 — driven through `caughtRegister` rather than the register names, so the prices stay
    // attached to the climb 420 actually produces instead of to a table this spec agrees with privately.
    let stretch = 0;
    const grants: number[] = [];
    for (let n = 1; n <= 3; n++) {
      const g = catchWarmth(caughtRegister(n, true), stretch, 0);
      grants.push(g);
      stretch += g;
    }
    expect(grants).toEqual([2, 3, 4]);
    expect(stretch).toBe(CATCH_WARMTH_PER_STRETCH);
  });

  it('the fourth catch in a stretch is free — of charge and of value', () => {
    // Criterion 3: one stretch is worth exactly one climb. The *sentence* is not gated on this (the opener
    // is chosen upstream), which is what stops the cap reading as a bug to the player.
    expect(catchWarmth(caughtRegister(4, true), CATCH_WARMTH_PER_STRETCH, 0)).toBe(0);
    expect(caughtRegister(4, true)).toBe('resigned'); // still says its line
  });

  it('the lifetime ceiling holds across fresh stretches', () => {
    // Criterion 4 — the cycle-133 lesson: a ceiling that only lives in the stretch is a ceiling with a
    // reload button. A dino at the lifetime cap grants nothing on the first catch of a brand-new stretch.
    expect(catchWarmth('pleased', 0, CATCH_WARMTH_LIFETIME)).toBe(0);
    expect(catchWarmth('resigned', 0, CATCH_WARMTH_LIFETIME)).toBe(0);
    // ...and exactly four full climbs fit under it.
    expect(CATCH_WARMTH_LIFETIME).toBe(CATCH_WARMTH_PER_STRETCH * 4);
  });

  it('a partial room is clamped, not overshot', () => {
    // Criterion 5 — both ceilings are one expression, so neither can be honoured at one call site and
    // forgotten at another. 8 of 9 spent this stretch: a teasing catch worth 3 pays 1.
    expect(catchWarmth('teasing', 8, 0)).toBe(1);
    expect(catchWarmth('resigned', 0, CATCH_WARMTH_LIFETIME - 1)).toBe(1);
    // The tighter of the two wins, whichever it is.
    expect(catchWarmth('resigned', 7, CATCH_WARMTH_LIFETIME - 3)).toBe(2);
    expect(catchWarmth('resigned', CATCH_WARMTH_PER_STRETCH + 5, 0)).toBe(0); // never negative
  });

  it('the beat names the dino', () => {
    expect(catchWarmedLine('Twitch')).toContain('Twitch');
    expect(catchWarmedLine('Twitch')).toContain('being found');
  });
});
