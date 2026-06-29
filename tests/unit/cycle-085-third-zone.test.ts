import { describe, it, expect } from 'vitest';
import {
  ZONES,
  ZONE_LINKS,
  zoneNeighbors,
  neighborThrough,
  linkEdge,
  otherZone,
  migrationStepTarget,
  atMigrationEdge,
  crossEntryTile,
  zoneTint,
  GROVE_TINT,
  FERNREACH_TINT,
  BOWL_ID,
  GROVE_ID,
  FERNREACH_ID,
} from '../../game/src/world/zones';

/**
 * Third zone spine (BACKLOG-378). The Fernreach sits east of the grove — the first zone that isn't
 * bowl-adjacent — so the grove now borders *two* neighbours. This pins the new registry/links and the
 * migration generalization (the chosen-edge param), while the cycle-084 spec guards bowl↔grove byte-identity.
 */

const COLS = 20;

describe('The Fernreach is registered (BACKLOG-378)', () => {
  it('is the third ZONES entry, east of the grove', () => {
    expect(ZONES.map((z) => z.id)).toEqual([BOWL_ID, GROVE_ID, FERNREACH_ID]);
    expect(ZONES.find((z) => z.id === FERNREACH_ID)?.name).toBe('The Fernreach');
  });

  it('links grove↔Fernreach without disturbing the grove→bowl primary', () => {
    expect(ZONE_LINKS).toContainEqual({ from: GROVE_ID, edge: 'east', to: FERNREACH_ID });
    expect(ZONE_LINKS).toContainEqual({ from: FERNREACH_ID, edge: 'west', to: GROVE_ID });
    // first-match primary stays grove→bowl, so all single-edge default paths are byte-identical.
    expect(linkEdge(GROVE_ID)).toBe('west');
    expect(otherZone(GROVE_ID)).toBe(BOWL_ID);
  });
});

describe('a zone can border more than one neighbour (BACKLOG-378)', () => {
  it('zoneNeighbors lists every outbound link', () => {
    expect(zoneNeighbors(GROVE_ID)).toEqual([
      { from: GROVE_ID, edge: 'west', to: BOWL_ID },
      { from: GROVE_ID, edge: 'east', to: FERNREACH_ID },
    ]);
    expect(zoneNeighbors(BOWL_ID).map((l) => l.to)).toEqual([GROVE_ID]); // still one
    expect(zoneNeighbors(FERNREACH_ID).map((l) => l.to)).toEqual([GROVE_ID]);
  });

  it('neighborThrough resolves both grove edges', () => {
    expect(neighborThrough(GROVE_ID, 'west')).toBe(BOWL_ID);
    expect(neighborThrough(GROVE_ID, 'east')).toBe(FERNREACH_ID);
  });
});

describe('migration generalizes past the single primary edge (BACKLOG-378)', () => {
  it('a grove dino crossing EAST walks to the east column and enters the Fernreach west side', () => {
    // chosen-edge form: heading east to the Fernreach.
    expect(migrationStepTarget(GROVE_ID, 3, COLS, 'east')).toEqual({ tileX: COLS - 1, tileY: 3 });
    expect(atMigrationEdge(GROVE_ID, { tileX: COLS - 1 }, COLS, 'east')).toBe(true);
    expect(crossEntryTile(GROVE_ID, 3, COLS, 'east')).toEqual({ tileX: 1, tileY: 3 }); // enters dest's west side
  });

  it('omitting the edge keeps the byte-identical grove→bowl (west) behavior', () => {
    expect(migrationStepTarget(GROVE_ID, 3, COLS)).toEqual({ tileX: 0, tileY: 3 });
    expect(atMigrationEdge(GROVE_ID, { tileX: 0 }, COLS)).toBe(true);
    expect(crossEntryTile(GROVE_ID, 3, COLS)).toEqual({ tileX: COLS - 2, tileY: 3 });
  });
});

describe('the Fernreach reads as its own place (BACKLOG-378)', () => {
  it('has a distinct floor tint from the bowl and the grove', () => {
    expect(zoneTint(BOWL_ID)).toBe(0xffffff);
    expect(zoneTint(GROVE_ID)).toBe(GROVE_TINT);
    expect(zoneTint(FERNREACH_ID)).toBe(FERNREACH_TINT);
    expect(FERNREACH_TINT).not.toBe(GROVE_TINT);
    expect(FERNREACH_TINT).not.toBe(0xffffff);
  });
});
