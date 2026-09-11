import { describe, it, expect } from 'vitest';
import {
  SULK_FADES_AFTER_STEPS,
  sulkHasFaded,
  shookItOffMemory,
  shookItOffLine,
  shookOffShoulderMemory,
  shookOffShoulderLine,
  shoulderMendedMemory,
  shoulderMendedLine,
} from './sulk';
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

describe('BACKLOG-544 — the standoff funk has the same two endings', () => {
  it('names the dino in all four strings', () => {
    for (const s of [
      shookOffShoulderMemory('Thornback'),
      shookOffShoulderLine('Thornback'),
      shoulderMendedMemory('Thornback'),
      shoulderMendedLine('Thornback'),
    ]) {
      expect(s).toContain('Thornback');
    }
  });

  it('the unattended ending does not credit the keeper, and the attended one does', () => {
    // BACKLOG-123's register assertion, applied to its sibling. The book must read differently depending
    // on whether the keeper turned up, and it can only do that if the unattended line refuses the credit.
    expect(shookOffShoulderMemory('Thornback')).not.toContain('keeper');
    expect(shoulderMendedMemory('Thornback')).toContain('keeper');
  });

  it('reads as a different beat from the jealous sulk it sits beside', () => {
    // Same feeling, different door. If these ever collapse into one string the player loses the ability
    // to tell "you came home to somebody else" from "I lost a scramble" in the collection book.
    expect(shookOffShoulderMemory('Thornback')).not.toBe(shookItOffMemory('Thornback'));
    expect(shookOffShoulderLine('Thornback')).not.toBe(shookItOffLine('Thornback'));
  });
});
