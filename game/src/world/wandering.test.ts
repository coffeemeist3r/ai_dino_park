import { describe, it, expect } from 'vitest';
import {
  WANDERER_REACH,
  recordCrossing,
  crossingsOf,
  originOf,
  reachOf,
  wanderStanding,
  wanderBookLine,
  type Crossings,
} from './wandering';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, zoneById } from './zones';

describe('recordCrossing / crossingsOf (BACKLOG-361)', () => {
  it('returns 1 on the first crossing and increments monotonically', () => {
    const map: Crossings = {};
    expect(recordCrossing(map, 'Rex')).toBe(1);
    expect(recordCrossing(map, 'Rex')).toBe(2);
    expect(recordCrossing(map, 'Rex')).toBe(3);
    expect(map.Rex).toBe(3);
  });

  it('counts each dino on its own', () => {
    const map: Crossings = {};
    recordCrossing(map, 'Rex');
    recordCrossing(map, 'Sunny');
    recordCrossing(map, 'Sunny');
    expect(crossingsOf(map, 'Rex')).toBe(1);
    expect(crossingsOf(map, 'Sunny')).toBe(2);
  });

  it('reads 0 for a dino that has never crossed', () => {
    expect(crossingsOf({}, 'Mossback')).toBe(0);
    expect(crossingsOf({ Rex: 4 }, 'Glade')).toBe(0);
  });
});

describe('originOf (BACKLOG-361)', () => {
  it('is the first ground the dino was ever marked as seeing', () => {
    expect(originOf([BOWL_ID, GROVE_ID, FERNREACH_ID])).toBe(BOWL_ID);
    expect(originOf([HOLLOW_ID])).toBe(HOLLOW_ID);
  });

  it('is undefined for an absent or empty record', () => {
    expect(originOf(undefined)).toBeUndefined();
    expect(originOf([])).toBeUndefined();
  });
});

describe('reachOf (BACKLOG-361)', () => {
  it('is 0 for a dino that has only stood where it began', () => {
    expect(reachOf([BOWL_ID], BOWL_ID)).toBe(0);
  });

  it('is 1 for an adjacent ground', () => {
    expect(reachOf([BOWL_ID, GROVE_ID], BOWL_ID)).toBe(1);
  });

  it('is 3 for a bowl-born dino that has stood in the Hollow', () => {
    expect(reachOf([BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID], BOWL_ID)).toBe(3);
  });

  it('takes the farthest, not the last', () => {
    expect(reachOf([BOWL_ID, HOLLOW_ID, GROVE_ID], BOWL_ID)).toBe(3);
  });

  it('skips an unreachable ground rather than counting it as 0 hops', () => {
    expect(reachOf([BOWL_ID, 'atlantis', GROVE_ID], BOWL_ID)).toBe(1);
    expect(reachOf(['atlantis'], BOWL_ID)).toBe(0);
  });

  it('is 0 for an absent origin or an absent record', () => {
    expect(reachOf([BOWL_ID, HOLLOW_ID], undefined)).toBe(0);
    expect(reachOf(undefined, BOWL_ID)).toBe(0);
  });
});

describe('wanderStanding (BACKLOG-361)', () => {
  it('calls a dino that has never crossed a homebody, whatever its reach claims', () => {
    expect(wanderStanding(0, 0)).toBe('homebody');
    expect(wanderStanding(0, 99)).toBe('homebody');
  });

  it('calls a crossed dino below the reach threshold a rambler', () => {
    expect(wanderStanding(1, 1)).toBe('rambler');
    expect(wanderStanding(9, WANDERER_REACH - 1)).toBe('rambler');
  });

  it('calls a dino that has gone WANDERER_REACH grounds out a wanderer', () => {
    expect(wanderStanding(1, WANDERER_REACH)).toBe('wanderer');
    expect(wanderStanding(7, 3)).toBe('wanderer');
  });
});

describe('wanderBookLine (BACKLOG-361)', () => {
  it('names the ground a homebody has never left', () => {
    const line = wanderBookLine('homebody', 0, 0, zoneById(BOWL_ID).name);
    expect(line).toContain('homebody');
    expect(line).toContain('Pocket Cretaceous');
  });

  it('carries both numbers for a rambler and a wanderer', () => {
    expect(wanderBookLine('rambler', 3, 1, 'Pocket Cretaceous')).toBe('a rambler — 3 crossings, 1 ground out');
    expect(wanderBookLine('wanderer', 7, 3, 'Pocket Cretaceous')).toBe('a wanderer — 7 crossings, 3 grounds out');
  });

  it('says one crossing, not 1 crossings', () => {
    expect(wanderBookLine('rambler', 1, 1, 'The Grove')).toBe('a rambler — 1 crossing, 1 ground out');
  });
});
