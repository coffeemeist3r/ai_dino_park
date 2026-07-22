import { describe, it, expect, afterEach } from 'vitest';
import {
  BOWL_ID,
  GROVE_ID,
  FERNREACH_ID,
  GROVE_TINT,
  FERNREACH_TINT,
  ZONE_TERRAIN,
  atWater,
  bowlPondTile,
  bowlTileAt,
  fernreachCreekTile,
  fernreachTileAt,
  grovePondTile,
  groveTileAt,
  zoneTileAt,
  zoneTint,
  zoneWaterTile,
  type ZoneTerrain,
} from '../../game/src/world/zones';

/**
 * One terrain per zone, as data (BACKLOG-449). A zone's ground used to be three hand-written `*TileAt`
 * functions dispatched by an `if` chain, with two more `if` chains beside it for the water landmark and
 * the floor tint. It's one table now. This file is the pin: the refactor must be *byte-identical* for the
 * three real zones, and a fourth zone must be a row rather than a branch.
 *
 * The landmark invariant below is the point of the whole item — it replaces the hand-maintained
 * "kept in sync with the water block in groveTileAt" comments with a mechanism that fails CI.
 */

const COLS = 20;
const ROWS = 15;

const REAL_ZONES = [
  { id: BOWL_ID, rule: bowlTileAt },
  { id: GROVE_ID, rule: groveTileAt },
  { id: FERNREACH_ID, rule: fernreachTileAt },
];

describe('zoneTileAt reads the table (BACKLOG-449 — byte-identical)', () => {
  for (const { id, rule } of REAL_ZONES) {
    it(`${id}: every tile matches its own rule`, () => {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          expect(zoneTileAt(id, x, y, COLS, ROWS)).toBe(rule(x, y, COLS, ROWS));
        }
      }
    });
  }

  it('an unknown zone still returns null, so drawFloor keeps its plain-grass fallback', () => {
    expect(zoneTileAt('nope', 0, 0, COLS, ROWS)).toBeNull();
  });
});

describe('the landmark invariant (BACKLOG-449)', () => {
  // Table-driven on purpose: it must cover a fourth zone the day its row is added, which naming the
  // three real zones would not. This is what the "kept in sync with" comments used to (not) do.
  it('every declared water landmark actually sits on water under its own zone rule', () => {
    for (const [id, terrain] of Object.entries(ZONE_TERRAIN)) {
      if (!terrain.water) continue;
      const { tileX, tileY } = terrain.water(COLS, ROWS);
      expect(terrain.tileAt(tileX, tileY, COLS, ROWS), `${id} landmark is not water`).toBe('water');
    }
  });
});

describe('zoneWaterTile / zoneTint are unchanged (BACKLOG-449)', () => {
  it('each zone returns exactly the landmark it returned before', () => {
    expect(zoneWaterTile(BOWL_ID, COLS, ROWS)).toEqual(bowlPondTile());
    expect(zoneWaterTile(GROVE_ID, COLS, ROWS)).toEqual(grovePondTile(COLS));
    expect(zoneWaterTile(FERNREACH_ID, COLS, ROWS)).toEqual(fernreachCreekTile(ROWS));
  });

  it('the landmark values themselves are the pre-refactor ones', () => {
    expect(zoneWaterTile(BOWL_ID, COLS, ROWS)).toEqual({ tileX: 3, tileY: 2 });
    expect(zoneWaterTile(GROVE_ID, COLS, ROWS)).toEqual({ tileX: COLS - 3, tileY: 3 });
    expect(zoneWaterTile(FERNREACH_ID, COLS, ROWS)).toEqual({ tileX: 3, tileY: Math.floor(ROWS / 2) });
  });

  it('an unknown zone has no water', () => {
    expect(zoneWaterTile('nope', COLS, ROWS)).toBeNull();
  });

  it('tints are unchanged, unknown zones untinted', () => {
    expect(zoneTint(BOWL_ID)).toBe(0xffffff);
    expect(zoneTint(GROVE_ID)).toBe(GROVE_TINT);
    expect(zoneTint(FERNREACH_ID)).toBe(FERNREACH_TINT);
    expect(zoneTint('nope')).toBe(0xffffff);
  });
});

describe('a fourth zone is a table row, not a code branch (BACKLOG-449)', () => {
  const FOURTH = 'testflats';
  // Deliberately unlike all three real layouts, so a stale lookup can't pass by coincidence.
  const fourth: ZoneTerrain = {
    tileAt: (x) => (x < 2 ? 'water' : 'fern'),
    tint: 0x123456,
    water: () => ({ tileX: 1, tileY: 4 }),
  };

  afterEach(() => {
    delete ZONE_TERRAIN[FOURTH];
  });

  it('gets ground, tint, a landmark and working atWater with zero dispatcher edits', () => {
    expect(zoneTileAt(FOURTH, 5, 5, COLS, ROWS)).toBeNull(); // not registered yet

    ZONE_TERRAIN[FOURTH] = fourth;

    expect(zoneTileAt(FOURTH, 0, 0, COLS, ROWS)).toBe('water');
    expect(zoneTileAt(FOURTH, 5, 5, COLS, ROWS)).toBe('fern');
    expect(zoneTint(FOURTH)).toBe(0x123456);
    expect(zoneWaterTile(FOURTH, COLS, ROWS)).toEqual({ tileX: 1, tileY: 4 });
    expect(atWater(FOURTH, { tileX: 1, tileY: 4 }, COLS, ROWS)).toBe(true);
    expect(atWater(FOURTH, { tileX: 10, tileY: 10 }, COLS, ROWS)).toBe(false);
  });

  it('is covered by the landmark invariant the moment it is registered', () => {
    ZONE_TERRAIN[FOURTH] = fourth;
    const t = ZONE_TERRAIN[FOURTH];
    const { tileX, tileY } = t.water!(COLS, ROWS);
    expect(t.tileAt(tileX, tileY, COLS, ROWS)).toBe('water');
  });
});
