import { describe, it, expect } from 'vitest';
import {
  caughtRegister,
  caughtOpener,
  caughtRegisterMemory,
  teaseOpener,
  resignedOpener,
  teaseMemory,
  resignedMemory,
  bashfulOpener,
  fondOpener,
  caughtMemory,
  fondCaughtMemory,
  CAUGHT_TEASE_AT,
  CAUGHT_RESIGNED_AT,
  type CaughtRegister,
} from '../../game/src/world/tic';
import { AXES, type Personality } from '../../game/src/ai/personality';

const axes = AXES.map((a) => a.key) as (keyof Personality)[];

/**
 * Caught again (BACKLOG-420). The register table, the distinctness of the two new openers, and the
 * compatibility seam — `caughtOpener('pleased')` must *be* `fondOpener()`, not a second copy of its text,
 * which is what keeps the 408 and 413 e2e specs green by construction.
 */
describe('caughtRegister', () => {
  it('climbs across one stretch for a fond dino, then floors', () => {
    expect(caughtRegister(1, true)).toBe('pleased');
    expect(caughtRegister(CAUGHT_TEASE_AT, true)).toBe('teasing');
    expect(caughtRegister(CAUGHT_RESIGNED_AT, true)).toBe('resigned');
    expect(caughtRegister(9, true)).toBe('resigned'); // a ninth catch is a third catch
  });

  /** Warmth earns the tease. A dino you barely know reads the same however often you find it — the read. */
  it('never climbs without fondness', () => {
    for (let n = 1; n <= 9; n++) expect(caughtRegister(n, false)).toBe('bashful');
  });

  it('a zeroth catch is not a catch', () => {
    expect(caughtRegister(0, true)).toBe('pleased');
  });
});

describe('the compatibility seam', () => {
  it('the two old registers are the two old functions, for every axis', () => {
    for (const axis of axes) {
      expect(caughtOpener('bashful', axis)).toBe(bashfulOpener());
      expect(caughtOpener('pleased', axis)).toBe(fondOpener());
    }
  });

  it('...and so are their memories', () => {
    expect(caughtRegisterMemory('bashful', 'paces')).toBe(caughtMemory('paces'));
    expect(caughtRegisterMemory('pleased', 'paces')).toBe(fondCaughtMemory('paces'));
    expect(caughtRegisterMemory('teasing', 'paces')).toBe(teaseMemory('paces'));
    expect(caughtRegisterMemory('resigned', 'paces')).toBe(resignedMemory('paces'));
  });
});

describe('distinctness', () => {
  /** A single "you again?" would make all eight dinos object identically — the sameness the CHARTER calls a bug. */
  it('every axis teases in its own words', () => {
    expect(new Set(axes.map(teaseOpener)).size).toBe(axes.length);
    expect(new Set(axes.map(resignedOpener)).size).toBe(axes.length);
  });

  it('no new opener collides with the text the 408/413 specs match on', () => {
    for (const axis of axes) {
      for (const line of [teaseOpener(axis), resignedOpener(axis)]) {
        expect(line).not.toContain('caught mid-fidget');
        expect(line).not.toContain("don't mind");
      }
    }
  });

  it('every register produces a non-empty opener', () => {
    const registers: CaughtRegister[] = ['bashful', 'pleased', 'teasing', 'resigned'];
    for (const r of registers) for (const axis of axes) expect(caughtOpener(r, axis).length).toBeGreaterThan(0);
  });
});

describe('the memories', () => {
  it('name the ritual, the way 408/413 do', () => {
    expect(teaseMemory('paces a fixed little path')).toContain('paces a fixed little path');
    expect(resignedMemory('turns a slow circle')).toContain('turns a slow circle');
  });

  it('do not read as a slight or a gift', () => {
    for (const mem of [teaseMemory('paces'), resignedMemory('paces')]) {
      for (const word of ['slight', 'jealous', 'gift', 'sorry']) expect(mem).not.toContain(word);
    }
  });

  it('are distinguishable from each other and from the two older notes', () => {
    const all = [caughtMemory('paces'), fondCaughtMemory('paces'), teaseMemory('paces'), resignedMemory('paces')];
    expect(new Set(all).size).toBe(4);
  });
});
