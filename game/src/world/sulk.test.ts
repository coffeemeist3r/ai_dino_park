import { describe, it, expect } from 'vitest';
import { SULK_FADES_AFTER_STEPS, sulkHasFaded, shookItOffMemory, shookItOffLine } from './sulk';
import { repairMemory } from './repair';
import { STING_FADES_AFTER_STEPS } from './tic';

describe('BACKLOG-123 — the sulk has a clock', () => {
  it('lasts forty ambient steps', () => {
    expect(SULK_FADES_AFTER_STEPS).toBe(40);
  });

  it.each([
    [-1, false],
    [0, false],
    [1, false],
    [39, false],
    [40, true],
    [41, true],
  ])('%i steps since the slight → faded: %s', (steps, want) => {
    expect(sulkHasFaded(steps)).toBe(want);
  });

  it('outlasts a bad moment at the hatch but stays well inside a play session', () => {
    // The sibling decision this one is sized against (tic.ts). A slight is a longer thing than a sting,
    // and both must clear inside the ten minutes CHARTER v7 measures a fresh save over.
    expect(SULK_FADES_AFTER_STEPS).toBeGreaterThan(STING_FADES_AFTER_STEPS);
    expect(SULK_FADES_AFTER_STEPS * 3).toBeLessThan(10 * 60); // 3s per step, under ten minutes
  });
});

describe('BACKLOG-123 — what the unattended ending says', () => {
  it('names the dino', () => {
    expect(shookItOffMemory('Thornback')).toContain('Thornback');
    expect(shookItOffLine('Thornback')).toContain('Thornback');
  });

  it('does not credit the keeper, because the keeper did nothing', () => {
    // The register assertion. `repairMemory` has the keeper as its subject; this one must not, and a
    // careless reword toward "the keeper..." is exactly what this test exists to catch.
    expect(repairMemory('Thornback')).toContain('keeper');
    expect(shookItOffMemory('Thornback')).not.toContain('keeper');
  });

  it('carries no glyph — the mark family is full and liftMood already draws the recovery', () => {
    expect(shookItOffLine('Thornback')).toMatch(/^[\x20-\x7E]+$/);
  });

  it('reads differently from the repaired ending, so the book can tell them apart', () => {
    expect(shookItOffMemory('Thornback')).not.toBe(repairMemory('Thornback'));
  });
});
