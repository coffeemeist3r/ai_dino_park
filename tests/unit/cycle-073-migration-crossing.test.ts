import { describe, it, expect } from 'vitest';
import {
  migrationStepTarget,
  atMigrationEdge,
  crossEntryTile,
  BOWL_ID,
  GROVE_ID,
} from '../../game/src/world/zones';

const COLS = 20;

describe('visible zone crossing — pure edge math (BACKLOG-334)', () => {
  it('a bowl migrant heads for the east edge column, row preserved', () => {
    expect(migrationStepTarget(BOWL_ID, 7, COLS)).toEqual({ tileX: COLS - 1, tileY: 7 });
  });

  it('a grove migrant heads for the west edge column, row preserved', () => {
    expect(migrationStepTarget(GROVE_ID, 3, COLS)).toEqual({ tileX: 0, tileY: 3 });
  });

  it('a bowl migrant has arrived only at/after the east edge column', () => {
    expect(atMigrationEdge(BOWL_ID, { tileX: COLS - 2 }, COLS)).toBe(false);
    expect(atMigrationEdge(BOWL_ID, { tileX: COLS - 1 }, COLS)).toBe(true);
  });

  it('a grove migrant has arrived only at/before the west edge column', () => {
    expect(atMigrationEdge(GROVE_ID, { tileX: 1 }, COLS)).toBe(false);
    expect(atMigrationEdge(GROVE_ID, { tileX: 0 }, COLS)).toBe(true);
  });

  it('bowl→grove enters the grove one tile in from its west edge, row preserved', () => {
    expect(crossEntryTile(BOWL_ID, 9, COLS)).toEqual({ tileX: 1, tileY: 9 });
  });

  it('grove→bowl enters the bowl one tile in from its east edge, row preserved', () => {
    expect(crossEntryTile(GROVE_ID, 2, COLS)).toEqual({ tileX: COLS - 2, tileY: 2 });
  });

  it('the entry edge is the opposite side of the edge the migrant walked to', () => {
    // bowl walks to col 19 (east), enters grove at col 1 (its west) — opposite ends.
    expect(migrationStepTarget(BOWL_ID, 5, COLS).tileX).toBe(COLS - 1);
    expect(crossEntryTile(BOWL_ID, 5, COLS).tileX).toBe(1);
  });
});
