import { describe, expect, it } from 'vitest';
import {
  HOLLOW_ID,
  RIDGE_ID,
  SALTPAN_ID,
  ZONE_TERRAIN,
  linkEdge,
  otherZone,
  saltpanSeepTile,
  saltpanTileAt,
  zoneChain,
  zoneTileAt,
  zoneWaterTile,
} from './zones';
import { PLOT_TILE_BY_ZONE } from './plot';
import { TILE_RIGS } from '../art/tileArt';
import { isUnsettled } from './frontier';

const COLS = 20;
const ROWS = 15;

describe('the Saltpan (BACKLOG-505)', () => {
  it('is the sixth ground, on the east end of the line, with the Ridge still the branch', () => {
    expect(zoneChain()).toEqual(['bowl', 'grove', 'fernreach', 'hollow', SALTPAN_ID, RIDGE_ID]);
  });

  it('does not change what the Hollow means by "my neighbour"', () => {
    // The first-match discipline 378/472/478 each used: a new link appended after the existing ones must
    // leave every single-neighbour default path byte-identical.
    expect(otherZone(HOLLOW_ID)).toBe('fernreach');
    expect(linkEdge(HOLLOW_ID)).toBe('west');
  });

  it('is crust, with a fringe of grass on the edge the player arrives from', () => {
    expect(saltpanTileAt(0, 7, COLS, ROWS)).toBe('grass');
    expect(saltpanTileAt(1, 7, COLS, ROWS)).toBe('grass');
    expect(saltpanTileAt(2, 7, COLS, ROWS)).toBe('salt');
    expect(saltpanTileAt(COLS - 1, ROWS - 1, COLS, ROWS)).toBe('salt');
  });

  it('has one brine seep and no other water', () => {
    let water = 0;
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (saltpanTileAt(x, y, COLS, ROWS) === 'water') water++;
    expect(water).toBe(4); // the 2x2 block, the smallest water in the park
    const seep = saltpanSeepTile(COLS);
    expect(saltpanTileAt(seep.tileX, seep.tileY, COLS, ROWS)).toBe('water');
    expect(zoneWaterTile(SALTPAN_ID, COLS, ROWS)).toEqual(seep);
  });

  it('reaches the ground through the terrain table, not a zone-id branch', () => {
    expect(ZONE_TERRAIN[SALTPAN_ID]).toBeDefined();
    expect(zoneTileAt(SALTPAN_ID, 5, 5, COLS, ROWS)).toBe('salt');
  });

  it('ships a tile kind the floor can render either way', () => {
    // The seam that has held through path/water (294) and fern (399): a kind with no rig falls back to the
    // flat checker, so adding one can never break the floor. `salt` shipped undrawn in the morning and
    // BACKLOG-511 drew it the same night — both halves of that are the point, so this asserts the rig is
    // there *and* that the fallback it shipped on is still a live path for whatever kind comes next.
    expect(TILE_RIGS.salt).toBeDefined();
    expect(TILE_RIGS.brimstone).toBeUndefined(); // the control: a ground kind nobody has invented
  });

  it('farms its fringe or not at all', () => {
    const plot = PLOT_TILE_BY_ZONE[SALTPAN_ID];
    expect(plot).toBeDefined();
    expect(saltpanTileAt(plot.tileX, plot.tileY, COLS, ROWS)).toBe('grass');
  });

  it('reads unsettled while nobody lives there, and never again once somebody does', () => {
    expect(isUnsettled(0, undefined, false)).toBe(true); // boot: no heads, no pioneer, not the origin
    expect(isUnsettled(0, 'Bramble', false)).toBe(false); // emptied later — hollowed, not frontier
    expect(isUnsettled(1, undefined, false)).toBe(false);
  });
});
