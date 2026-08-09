import { describe, it, expect } from 'vitest';
import { hopDistances, hopsBetween, hopToward, nearestQualifying } from './distance';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, RIDGE_ID, ZONES, zoneNeighbors } from './zones';

/** BACKLOG-475 — distance on the chain. */
describe('hopDistances', () => {
  it('measures the chain from the bowl', () => {
    expect(hopDistances(BOWL_ID)).toEqual({
      [BOWL_ID]: 0,
      [GROVE_ID]: 1,
      [FERNREACH_ID]: 2,
      [HOLLOW_ID]: 3,
      // BACKLOG-478: this assertion assumed every ground sat at its own depth, which is only true of a line.
      // The Ridge branches north off the Grove, so it ties the Fernreach at two hops from the bowl.
      [RIDGE_ID]: 2,
    });
  });

  it('measures it mirrored from the far end', () => {
    expect(hopDistances(HOLLOW_ID)).toEqual({
      [HOLLOW_ID]: 0,
      [FERNREACH_ID]: 1,
      [GROVE_ID]: 2,
      [BOWL_ID]: 3,
      [RIDGE_ID]: 3, // BACKLOG-478: the branch is as far from the Hollow as the bowl is
    });
  });

  it('reaches nothing from an unknown ground', () => {
    expect(hopDistances('atlantis')).toEqual({ atlantis: 0 });
  });
});

describe('hopsBetween', () => {
  it('is symmetric across every pair in the chain', () => {
    for (const a of ZONES) {
      for (const b of ZONES) {
        expect(hopsBetween(a.id, b.id)).toBe(hopsBetween(b.id, a.id));
      }
    }
  });

  it('is 0 to itself and null for an unknown ground', () => {
    expect(hopsBetween(GROVE_ID, GROVE_ID)).toBe(0);
    expect(hopsBetween(BOWL_ID, 'atlantis')).toBeNull();
    expect(hopsBetween('atlantis', BOWL_ID)).toBeNull();
  });
});

describe('hopToward', () => {
  it('steps one ground closer to a far target', () => {
    expect(hopToward(BOWL_ID, HOLLOW_ID)).toBe(GROVE_ID);
    expect(hopToward(GROVE_ID, HOLLOW_ID)).toBe(FERNREACH_ID);
    expect(hopToward(FERNREACH_ID, BOWL_ID)).toBe(GROVE_ID);
  });

  it('returns the target itself when it borders home — the byte-identity pin for every pre-475 caller', () => {
    for (const z of ZONES) {
      for (const link of zoneNeighbors(z.id)) {
        expect(hopToward(z.id, link.to)).toBe(link.to);
      }
    }
  });

  it('is null for the same ground, an unknown target and an unknown home', () => {
    expect(hopToward(BOWL_ID, BOWL_ID)).toBeNull();
    expect(hopToward(BOWL_ID, 'atlantis')).toBeNull();
    expect(hopToward('atlantis', BOWL_ID)).toBeNull();
  });

  it('walks the whole chain one ground at a time', () => {
    let at = BOWL_ID;
    const walked = [at];
    for (let i = 0; i < 10 && at !== HOLLOW_ID; i++) {
      at = hopToward(at, HOLLOW_ID)!;
      walked.push(at);
    }
    expect(walked).toEqual([BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID]);
  });

  it('is deterministic — repeated calls agree', () => {
    const once = ZONES.map((z) => hopToward(z.id, HOLLOW_ID));
    for (let i = 0; i < 5; i++) {
      expect(ZONES.map((z) => hopToward(z.id, HOLLOW_ID))).toEqual(once);
    }
  });
});

describe('nearestQualifying', () => {
  const chain = ZONES.map((z) => z.id);

  it('picks the fewest hops away, not the first that qualifies', () => {
    expect(nearestQualifying(BOWL_ID, [HOLLOW_ID, FERNREACH_ID, GROVE_ID], () => true)).toBe(GROVE_ID);
  });

  it('breaks a tie in input order', () => {
    // both one hop from the grove; the earlier candidate wins
    expect(nearestQualifying(GROVE_ID, [FERNREACH_ID, BOWL_ID], () => true)).toBe(FERNREACH_ID);
    expect(nearestQualifying(GROVE_ID, [BOWL_ID, FERNREACH_ID], () => true)).toBe(BOWL_ID);
  });

  it('never picks the ground it is asked from, and returns null when nothing qualifies', () => {
    expect(nearestQualifying(BOWL_ID, [BOWL_ID], () => true)).toBeNull();
    expect(nearestQualifying(BOWL_ID, chain, () => false)).toBeNull();
    expect(nearestQualifying(BOWL_ID, [], () => true)).toBeNull();
  });

  it('skips unreachable candidates', () => {
    expect(nearestQualifying(BOWL_ID, ['atlantis', FERNREACH_ID], () => true)).toBe(FERNREACH_ID);
  });
});
