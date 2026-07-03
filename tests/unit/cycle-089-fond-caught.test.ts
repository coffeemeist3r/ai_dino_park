import { describe, it, expect } from 'vitest';
import {
  fondOfBeingCaught,
  fondOpener,
  fondCaughtMemory,
  bashfulOpener,
  caughtMemory,
} from '../../game/src/world/tic';
import { FOND_MIN } from '../../game/src/ai/brain';

/**
 * Fond of being caught (BACKLOG-413) — the 408 catch forks on bond. A dino at/above the close-friend floor
 * (FOND_MIN hearts) reads pleased, not bashful: its own opener + its own glad memory, distinct from the sheepish
 * ones. Pure + deterministic — no model, no sim state.
 */
describe('BACKLOG-413 fond of being caught', () => {
  it('is fond exactly at/above the close-friend floor (FOND_MIN), bashful below', () => {
    expect(fondOfBeingCaught(FOND_MIN)).toBe(true); // boundary is inclusive (mirrors the 272 fond greeting)
    expect(fondOfBeingCaught(FOND_MIN + 1)).toBe(true);
    expect(fondOfBeingCaught(10)).toBe(true);
    expect(fondOfBeingCaught(FOND_MIN - 1)).toBe(false);
    expect(fondOfBeingCaught(0)).toBe(false);
  });

  it('the fond opener is warm, non-empty, and distinct from the bashful one', () => {
    expect(fondOpener().length).toBeGreaterThan(0);
    expect(fondOpener()).not.toBe(bashfulOpener());
    expect(fondOpener()).toContain("don't mind"); // shows the ritual off instead of hiding it
  });

  it('the fond memory names the ritual, reads glad, and differs from the sheepish memory', () => {
    const label = 'paces a fixed little path';
    expect(fondCaughtMemory(label)).toContain(label);
    expect(fondCaughtMemory(label)).toContain('glad');
    expect(fondCaughtMemory(label)).not.toBe(caughtMemory(label));
    expect(caughtMemory(label)).toContain('bashful'); // the 408 path is unchanged
  });
});
