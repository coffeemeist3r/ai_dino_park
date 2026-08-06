import { describe, it, expect } from 'vitest';
import {
  TILES_PER_HEAD,
  CROWD_APPEAL_DAMP,
  CROWDED_MIGRATE_DAMP,
  livableTiles,
  zoneCapacity,
  isCrowded,
  crowdedAppeal,
} from './capacity';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID } from './zones';
import { DECLINING_MIGRATE_DAMP } from './decline';
import { SETTLED_MIGRATE_DAMP } from './belonging';
import { zoneAppeal, richestNeighbor } from './scarcity';

const COLS = 20;
const ROWS = 15;

describe('livableTiles (BACKLOG-476)', () => {
  it('counts grass only — the bowl loses exactly its 3x2 waterhole', () => {
    expect(livableTiles(BOWL_ID, COLS, ROWS)).toBe(COLS * ROWS - 6);
  });

  it('excludes the grove trail and pond, the Fernreach creek and scrub, the Hollow pool and fen rim', () => {
    expect(livableTiles(GROVE_ID, COLS, ROWS)).toBe(248);
    expect(livableTiles(FERNREACH_ID, COLS, ROWS)).toBe(226);
    expect(livableTiles(HOLLOW_ID, COLS, ROWS)).toBe(250);
  });

  it('is 0 for an unknown ground', () => {
    expect(livableTiles('nowhere', COLS, ROWS)).toBe(0);
  });
});

describe('zoneCapacity (BACKLOG-476)', () => {
  it('gives the four grounds their capacities', () => {
    expect(zoneCapacity(BOWL_ID, COLS, ROWS)).toBe(5);
    expect(zoneCapacity(GROVE_ID, COLS, ROWS)).toBe(5);
    expect(zoneCapacity(FERNREACH_ID, COLS, ROWS)).toBe(4);
    expect(zoneCapacity(HOLLOW_ID, COLS, ROWS)).toBe(5);
  });

  it('never returns less than 1, including for an unknown ground', () => {
    expect(zoneCapacity('nowhere', COLS, ROWS)).toBe(1);
    expect(zoneCapacity(BOWL_ID, 1, 1)).toBeGreaterThanOrEqual(1);
  });

  it('scales with the knob, so the tuning lives in one place', () => {
    expect(zoneCapacity(BOWL_ID, COLS, ROWS)).toBe(Math.ceil(294 / TILES_PER_HEAD));
  });
});

describe('isCrowded (BACKLOG-476)', () => {
  it('is false at exactly capacity and true one past it', () => {
    expect(isCrowded(5, 5)).toBe(false);
    expect(isCrowded(6, 5)).toBe(true);
    expect(isCrowded(0, 5)).toBe(false);
  });

  // The founding state: five dinos spawn in the bowl, whose capacity is five. If this ever flips, the whole
  // pinned migration suite shifts and the knob — not the suite — is what is wrong.
  it('reads the founding five-in-the-bowl state as NOT crowded', () => {
    expect(isCrowded(5, zoneCapacity(BOWL_ID, COLS, ROWS))).toBe(false);
  });
});

describe('crowdedAppeal (BACKLOG-476)', () => {
  it('is an exact identity when not crowded', () => {
    for (const appeal of [0, 1, 7.5, 42]) {
      expect(crowdedAppeal(appeal, 3, 5)).toBe(appeal);
      expect(crowdedAppeal(appeal, 5, 5)).toBe(appeal);
    }
  });

  it('strictly decreases as the surplus grows, and stays non-negative', () => {
    const one = crowdedAppeal(30, 6, 5);
    const two = crowdedAppeal(30, 7, 5);
    const three = crowdedAppeal(30, 8, 5);
    expect(one).toBeLessThan(30);
    expect(two).toBeLessThan(one);
    expect(three).toBeLessThan(two);
    expect(three).toBeGreaterThanOrEqual(0);
  });

  it('applies exactly one damp step per surplus mouth', () => {
    expect(crowdedAppeal(30, 6, 5)).toBeCloseTo(30 / (1 + CROWD_APPEAL_DAMP));
  });

  it('stays monotonic in plenty at a fixed head count', () => {
    expect(crowdedAppeal(zoneAppeal(10, 2), 8, 5)).toBeLessThan(crowdedAppeal(zoneAppeal(10, 6), 8, 5));
    expect(crowdedAppeal(zoneAppeal(4, 3), 8, 5)).toBeLessThan(crowdedAppeal(zoneAppeal(9, 3), 8, 5));
  });

  it('makes a crowded ground genuinely less appealing than the same ground at capacity', () => {
    const same = zoneAppeal(12, 4);
    expect(crowdedAppeal(same, 7, 5)).toBeLessThan(crowdedAppeal(same, 5, 5));
  });

  it('lets an uncrowded neighbour win over a richer crowded one', () => {
    const heads: Record<string, number> = { grove: 9, fernreach: 2 };
    const raw: Record<string, number> = { grove: 30, fernreach: 20 };
    const caps: Record<string, number> = { grove: 5, fernreach: 4 };
    const appealOf = (z: string) => crowdedAppeal(raw[z], heads[z], caps[z]);
    expect(richestNeighbor(['grove', 'fernreach'], (z) => raw[z])).toBe('grove');
    expect(richestNeighbor(['grove', 'fernreach'], appealOf)).toBe('fernreach');
  });
});

describe('the crowded resist damp (BACKLOG-476)', () => {
  it('holds a resident more weakly than a stable ground does', () => {
    expect(CROWDED_MIGRATE_DAMP).toBeLessThan(SETTLED_MIGRATE_DAMP);
  });

  // WorldScene takes the *weaker* of the two holds. Pinned here so a future divergence in either constant
  // can't silently start picking the stronger one.
  it('a ground both crowded and declining takes the weaker hold', () => {
    expect(Math.min(DECLINING_MIGRATE_DAMP, CROWDED_MIGRATE_DAMP)).toBeLessThanOrEqual(SETTLED_MIGRATE_DAMP);
    expect(Math.min(DECLINING_MIGRATE_DAMP, CROWDED_MIGRATE_DAMP)).toBe(
      Math.min(CROWDED_MIGRATE_DAMP, DECLINING_MIGRATE_DAMP),
    );
  });
});
