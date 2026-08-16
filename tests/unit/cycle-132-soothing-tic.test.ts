import { describe, it, expect } from 'vitest';
import {
  TIC_AFTER_STEPS,
  TIC_AFTER_STEPS_HOMESICK,
  TIC_AFTER_STEPS_STUNG,
  STING_FADES_AFTER_STEPS,
  stingIsFresh,
  soothingTicMemory,
  ticMemory,
  inventsTic,
} from '../../game/src/world/tic';
import { ticAfterFor } from '../../game/src/ai/intent';

/**
 * Self-soothing tic (BACKLOG-412) — a dino that came away from a contested drop with nothing takes up its
 * ritual sooner. The value of the constant is not what is pinned here; its *ordering* against the other two
 * shorteners is, because a stung threshold above them would be silently ignored by the caller's `Math.min`
 * and every one of these tests would still pass on the value alone.
 */
describe('the stung onset threshold', () => {
  it('is the shortest of the three, and positive', () => {
    expect(TIC_AFTER_STEPS_STUNG).toBeGreaterThan(0);
    expect(TIC_AFTER_STEPS_STUNG).toBeLessThan(TIC_AFTER_STEPS_HOMESICK);
    expect(TIC_AFTER_STEPS_HOMESICK).toBeLessThan(TIC_AFTER_STEPS);
  });

  it('wins the compose for every intent — no shortener outranks a fresh sting', () => {
    for (const kind of ['solitary', 'social', 'forage', undefined] as const) {
      const intent = kind ? ({ kind, until: 0 } as never) : undefined;
      const composed = Math.min(ticAfterFor(intent, TIC_AFTER_STEPS), TIC_AFTER_STEPS_HOMESICK, TIC_AFTER_STEPS_STUNG);
      expect(composed).toBe(TIC_AFTER_STEPS_STUNG);
    }
  });

  it('is the threshold the tic actually forms on', () => {
    expect(inventsTic(TIC_AFTER_STEPS_STUNG, TIC_AFTER_STEPS_STUNG)).toBe(true);
    expect(inventsTic(TIC_AFTER_STEPS_STUNG - 1, TIC_AFTER_STEPS_STUNG)).toBe(false);
  });

  it('still leaves a stung dino a stretch of solitude — the sting shortens, it does not trigger', () => {
    expect(TIC_AFTER_STEPS_STUNG).toBeGreaterThan(1);
  });
});

describe('the sting window', () => {
  it('is fresh from the moment it lands until it fades', () => {
    expect(stingIsFresh(0)).toBe(true);
    expect(stingIsFresh(STING_FADES_AFTER_STEPS - 1)).toBe(true);
  });

  it('is over at the boundary and stays over', () => {
    expect(stingIsFresh(STING_FADES_AFTER_STEPS)).toBe(false);
    expect(stingIsFresh(STING_FADES_AFTER_STEPS + 500)).toBe(false);
  });

  it('rejects a negative age rather than reading it as fresh', () => {
    expect(stingIsFresh(-1)).toBe(false);
  });

  it('outlasts the shortened onset, so a stung dino can actually reach its ritual', () => {
    expect(STING_FADES_AFTER_STEPS).toBeGreaterThan(TIC_AFTER_STEPS_STUNG);
  });
});

describe('the self-soothing memory', () => {
  it('names the ritual and says why it started', () => {
    const m = soothingTicMemory('paces a fixed little path');
    expect(m).toContain('paces a fixed little path');
    expect(m).toContain('hatch');
  });

  it('is distinct from the plain 405 note for the same ritual', () => {
    const label = 'fusses over one spot';
    expect(soothingTicMemory(label)).not.toBe(ticMemory(label));
  });
});
