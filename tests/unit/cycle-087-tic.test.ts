import { describe, it, expect } from 'vitest';
import {
  signatureTic,
  undisturbed,
  inventsTic,
  ticStep,
  ticMemory,
  TIC_AFTER_STEPS,
  TIC_BY_AXIS,
} from '../../game/src/world/tic';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Solitary tic (BACKLOG-405). A lone, undisturbed dino invents its signature ritual — the tic of its
 * most-pronounced trait — after TIC_AFTER_STEPS solitary steps. Pure logic: choice, threshold, motion.
 */

const NEUTRAL: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5 };
const with_ = (over: Partial<Personality>): Personality => ({ ...NEUTRAL, ...over });

describe('signatureTic — the ritual of the most-pronounced trait', () => {
  it('is the tic of the axis furthest from neutral', () => {
    expect(signatureTic(with_({ energy: 0.95 }))).toEqual(TIC_BY_AXIS.energy); // pace
    expect(signatureTic(with_({ curiosity: 0.02 }))).toEqual(TIC_BY_AXIS.curiosity); // fuss
    expect(signatureTic(with_({ bravery: 0.98 }))).toEqual(TIC_BY_AXIS.bravery); // circle
  });

  it('is deterministic and can differ between two dinos with different dominant traits', () => {
    const pacer = with_({ energy: 0.95 });
    const fusser = with_({ curiosity: 0.95 });
    expect(signatureTic(pacer)).toEqual(signatureTic(pacer)); // stable
    expect(signatureTic(pacer).kind).toBe('pace');
    expect(signatureTic(fusser).kind).toBe('fuss');
    expect(signatureTic(pacer)).not.toEqual(signatureTic(fusser));
  });
});

describe('undisturbed / inventsTic — when a tic forms', () => {
  it('is undisturbed only with no need, no food rush, and no company', () => {
    expect(undisturbed(false, false, false)).toBe(true);
    expect(undisturbed(true, false, false)).toBe(false); // a pressing need breaks it
    expect(undisturbed(false, true, false)).toBe(false); // food to chase breaks it
    expect(undisturbed(false, false, true)).toBe(false); // company breaks it
  });

  it('invents the tic exactly at the threshold, not before', () => {
    expect(inventsTic(TIC_AFTER_STEPS - 1)).toBe(false);
    expect(inventsTic(TIC_AFTER_STEPS)).toBe(true);
    expect(inventsTic(0)).toBe(false);
  });
});

describe('ticStep — the little motion', () => {
  const anchor = { tileX: 5, tileY: 5 };

  it('keeps a pace within one tile of the anchor on the row', () => {
    for (let phase = 0; phase < 6; phase++) {
      const t = ticStep('pace', anchor, phase, 20, 15);
      expect(Math.abs(t.tileX - anchor.tileX)).toBeLessThanOrEqual(1);
      expect(t.tileY).toBe(anchor.tileY);
    }
  });

  it('keeps a circle within one tile of the anchor (Chebyshev 1)', () => {
    for (let phase = 0; phase < 8; phase++) {
      const t = ticStep('circle', anchor, phase, 20, 15);
      expect(Math.max(Math.abs(t.tileX - anchor.tileX), Math.abs(t.tileY - anchor.tileY))).toBeLessThanOrEqual(1);
    }
  });

  it('holds a fuss on the anchor tile', () => {
    expect(ticStep('fuss', anchor, 3, 20, 15)).toEqual(anchor);
  });

  it('clamps to the grid at the edges', () => {
    const corner = { tileX: 0, tileY: 0 };
    for (let phase = 0; phase < 4; phase++) {
      const t = ticStep('circle', corner, phase, 20, 15);
      expect(t.tileX).toBeGreaterThanOrEqual(0);
      expect(t.tileY).toBeGreaterThanOrEqual(0);
    }
    const edge = ticStep('pace', { tileX: 19, tileY: 7 }, 1, 20, 15); // +1 would leave the grid
    expect(edge.tileX).toBe(19);
  });
});

describe('ticMemory', () => {
  it('names the ritual as the dino s own', () => {
    expect(ticMemory('paces a fixed little path')).toBe(
      'alone a long while, you paces a fixed little path — a little ritual of your own',
    );
  });
});
