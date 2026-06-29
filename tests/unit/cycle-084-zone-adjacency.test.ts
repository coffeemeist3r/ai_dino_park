import { describe, it, expect } from 'vitest';
import {
  ZONE_LINKS,
  neighborThrough,
  linkEdge,
  linkedZone,
  otherZone,
  migrationStepTarget,
  atMigrationEdge,
  crossEntryTile,
  BOWL_ID,
  GROVE_ID,
  FERNREACH_ID,
} from '../../game/src/world/zones';

/**
 * Zone adjacency graph (BACKLOG-383) — the zone links are a data-driven table read by every zone helper.
 * Updated for the third zone (BACKLOG-378): the table grew the grove↔Fernreach pair, but the **bowl↔grove
 * behavior stays byte-identical** (the migration columns / linkEdge / otherZone assertions below are the
 * guardrail that the third zone changed nothing for the original pair; cycle-059 + cycle-073 are the wider one).
 */

const COLS = 20;
const TILE = 32;
const W = COLS * TILE;

describe('ZONE_LINKS table (BACKLOG-383)', () => {
  it('holds the bowl↔grove pair plus the grove↔Fernreach pair (BACKLOG-378)', () => {
    expect(ZONE_LINKS).toEqual([
      { from: BOWL_ID, edge: 'east', to: GROVE_ID },
      { from: GROVE_ID, edge: 'west', to: BOWL_ID },
      { from: GROVE_ID, edge: 'east', to: FERNREACH_ID },
      { from: FERNREACH_ID, edge: 'west', to: GROVE_ID },
    ]);
  });

  it('neighborThrough follows a linked edge, null otherwise', () => {
    expect(neighborThrough(BOWL_ID, 'east')).toBe(GROVE_ID);
    expect(neighborThrough(GROVE_ID, 'west')).toBe(BOWL_ID);
    expect(neighborThrough(GROVE_ID, 'east')).toBe(FERNREACH_ID); // BACKLOG-378: the grove's new east link
    expect(neighborThrough(FERNREACH_ID, 'west')).toBe(GROVE_ID);
    expect(neighborThrough(BOWL_ID, 'west')).toBeNull();
    expect(neighborThrough(FERNREACH_ID, 'east')).toBeNull();
  });

  it('linkEdge gives each zone its outbound edge, null for unknown', () => {
    expect(linkEdge(BOWL_ID)).toBe('east');
    expect(linkEdge(GROVE_ID)).toBe('west');
    expect(linkEdge('nowhere')).toBeNull();
  });
});

describe('helpers stay byte-identical through the table (BACKLOG-383)', () => {
  it('linkedZone matches the pre-refactor entries', () => {
    expect(linkedZone(BOWL_ID, 'east', 200, COLS, TILE)).toEqual({ zoneId: GROVE_ID, entry: { x: TILE * 1.5, y: 200 } });
    expect(linkedZone(GROVE_ID, 'west', 120, COLS, TILE)).toEqual({
      zoneId: BOWL_ID,
      entry: { x: W - TILE * 1.5, y: 120 },
    });
    expect(linkedZone(BOWL_ID, 'west', 100, COLS, TILE)).toBeNull();
    // BACKLOG-378: the grove's east edge now opens onto the Fernreach (was null pre-third-zone).
    expect(linkedZone(GROVE_ID, 'east', 100, COLS, TILE)).toEqual({
      zoneId: FERNREACH_ID,
      entry: { x: TILE * 1.5, y: 100 },
    });
    expect(linkedZone(FERNREACH_ID, 'east', 100, COLS, TILE)).toBeNull(); // the Fernreach's far edge is unlinked
  });

  it('otherZone flips the pair and keeps the unknown→grove default', () => {
    expect(otherZone(BOWL_ID)).toBe(GROVE_ID);
    expect(otherZone(GROVE_ID)).toBe(BOWL_ID);
    expect(otherZone('nowhere')).toBe(GROVE_ID);
  });

  it('migration helpers match the pre-refactor columns', () => {
    expect(migrationStepTarget(BOWL_ID, 7, COLS)).toEqual({ tileX: COLS - 1, tileY: 7 });
    expect(migrationStepTarget(GROVE_ID, 3, COLS)).toEqual({ tileX: 0, tileY: 3 });
    expect(atMigrationEdge(BOWL_ID, { tileX: COLS - 1 }, COLS)).toBe(true);
    expect(atMigrationEdge(GROVE_ID, { tileX: 0 }, COLS)).toBe(true);
    expect(crossEntryTile(BOWL_ID, 9, COLS)).toEqual({ tileX: 1, tileY: 9 });
    expect(crossEntryTile(GROVE_ID, 2, COLS)).toEqual({ tileX: COLS - 2, tileY: 2 });
  });
});
