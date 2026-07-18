import { describe, it, expect } from 'vitest';
import {
  BOWL_ID,
  GROVE_ID,
  FERNREACH_ID,
  atWater,
  bowlPondTile,
  bowlTileAt,
  fernreachCreekTile,
  grovePondTile,
  zoneTileAt,
  zoneWaterTile,
} from '../../game/src/world/zones';
import { PLOT_TILE } from '../../game/src/world/plot';
import { foodLanding } from '../../game/src/world/feeding';

const COLS = 20;
const ROWS = 15;
// WorldScene's HUDDLE_TILE is scene-local (not exported); mirrored here so the clearance check is explicit.
const HUDDLE_TILE_XY = { tileX: 10, tileY: 11 };
const ZONES_WITH_WATER = [BOWL_ID, GROVE_ID, FERNREACH_ID];

describe('the bowl gets a waterhole (BACKLOG-445)', () => {
  it('is water inside the NW block and grass outside it', () => {
    expect(bowlTileAt(3, 2, COLS, ROWS)).toBe('water');
    expect(bowlTileAt(2, 3, COLS, ROWS)).toBe('water');
    expect(bowlTileAt(4, 3, COLS, ROWS)).toBe('water');
    expect(bowlTileAt(0, 0, COLS, ROWS)).toBe('grass');
    expect(bowlTileAt(5, 2, COLS, ROWS)).toBe('grass'); // one east of the block
    expect(bowlTileAt(3, 4, COLS, ROWS)).toBe('grass'); // one south of the block
  });

  it('sits clear of everything the bowl already fixes in place', () => {
    // the huddle tile (den), the plot, and the whole food-landing row must stay walkable grass
    expect(bowlTileAt(HUDDLE_TILE_XY.tileX, HUDDLE_TILE_XY.tileY, COLS, ROWS)).toBe('grass');
    expect(bowlTileAt(PLOT_TILE.tileX, PLOT_TILE.tileY, COLS, ROWS)).toBe('grass');
    const foodRow = foodLanding(COLS, ROWS, 0).tileY;
    for (let x = 0; x < COLS; x++) expect(bowlTileAt(x, foodRow, COLS, ROWS)).toBe('grass');
    // ...and clear of the east migration edge column
    for (let y = 0; y < ROWS; y++) expect(bowlTileAt(COLS - 1, y, COLS, ROWS)).toBe('grass');
  });

  it('gives the bowl a non-null terrain layout — the probe drawFloor reads', () => {
    // drawFloor picks bakeTerrainMap over the plain grass map on `tileAt(0,0) !== null`.
    expect(zoneTileAt(BOWL_ID, 0, 0, COLS, ROWS)).not.toBeNull();
    expect(zoneTileAt(BOWL_ID, 3, 2, COLS, ROWS)).toBe('water');
    expect(zoneTileAt('nowhere', 0, 0, COLS, ROWS)).toBeNull();
  });
});

describe('every zone answers where its own water is (BACKLOG-445)', () => {
  it('returns a tile for all three zones, and null for an unknown zone', () => {
    for (const zone of ZONES_WITH_WATER) expect(zoneWaterTile(zone, COLS, ROWS)).not.toBeNull();
    expect(zoneWaterTile('nowhere', COLS, ROWS)).toBeNull();
  });

  it("each zone's water tile is itself water under that zone's terrain", () => {
    // The anti-drift invariant: the seek target and the drawn ground must never disagree.
    for (const zone of ZONES_WITH_WATER) {
      const t = zoneWaterTile(zone, COLS, ROWS)!;
      expect(zoneTileAt(zone, t.tileX, t.tileY, COLS, ROWS)).toBe('water');
    }
  });

  it('leaves the grove exactly as it was', () => {
    expect(zoneWaterTile(GROVE_ID, COLS, ROWS)).toEqual(grovePondTile(COLS));
  });

  it('points the bowl and the Fernreach at their own features', () => {
    expect(zoneWaterTile(BOWL_ID, COLS, ROWS)).toEqual(bowlPondTile());
    expect(zoneWaterTile(FERNREACH_ID, COLS, ROWS)).toEqual(fernreachCreekTile(ROWS));
  });
});

describe('drinking is a zone-scoped question (BACKLOG-445)', () => {
  it('is true at each zone’s own water', () => {
    for (const zone of ZONES_WITH_WATER) {
      expect(atWater(zone, zoneWaterTile(zone, COLS, ROWS)!, COLS, ROWS)).toBe(true);
    }
  });

  it('is false on dry ground in a zone that has water elsewhere', () => {
    expect(atWater(BOWL_ID, { tileX: 10, tileY: 10 }, COLS, ROWS)).toBe(false);
    expect(atWater(GROVE_ID, { tileX: 1, tileY: 1 }, COLS, ROWS)).toBe(false);
    expect(atWater(FERNREACH_ID, { tileX: 15, tileY: 8 }, COLS, ROWS)).toBe(false);
  });

  it("does not read another zone's water", () => {
    // standing on the grove pond's coordinates while in the bowl is standing on grass
    const pond = grovePondTile(COLS);
    expect(atWater(GROVE_ID, pond, COLS, ROWS)).toBe(true);
    expect(atWater(BOWL_ID, pond, COLS, ROWS)).toBe(false);
    expect(atWater('nowhere', pond, COLS, ROWS)).toBe(false);
  });

  it('clamps at the grid edges instead of throwing', () => {
    expect(() => atWater(BOWL_ID, { tileX: 0, tileY: 0 }, COLS, ROWS)).not.toThrow();
    expect(() => atWater(FERNREACH_ID, { tileX: COLS - 1, tileY: ROWS - 1 }, COLS, ROWS)).not.toThrow();
  });
});
