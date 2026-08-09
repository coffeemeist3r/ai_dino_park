/**
 * BACKLOG-478 — the chain forks. The first assertions in this repo written against a zone graph that is
 * genuinely not a line: the Grove has three neighbours, two grounds sit at the same distance from the bowl,
 * and "the nearest ground that qualifies" is no longer a synonym for "the next one east".
 */
import { describe, it, expect } from 'vitest';
import {
  BOWL_ID,
  GROVE_ID,
  FERNREACH_ID,
  HOLLOW_ID,
  RIDGE_ID,
  ZONES,
  crossing,
  edgeIndicators,
  linkedZone,
  nearLinkEdge,
  atMigrationEdge,
  crossEntryTile,
  migrationStepTarget,
  zoneChain,
  zoneNeighbors,
  zoneTileAt,
  zoneWaterTile,
  zoneTint,
  linkEdge,
  otherZone,
} from '../../game/src/world/zones';
import { hopDistances, hopToward, hopsBetween, nearestQualifying } from '../../game/src/world/distance';
import { griefEdge, griefAnchor } from '../../game/src/world/tic';
import { livableTiles, zoneCapacity } from '../../game/src/world/capacity';
import { cropOf, PLOT_TILE_BY_ZONE } from '../../game/src/world/plot';

const COLS = 20;
const ROWS = 15;
const TILE = 16;

describe('the fork exists in the graph', () => {
  it('the Grove has three neighbours, in link order', () => {
    expect(zoneNeighbors(GROVE_ID).map((l) => l.edge)).toEqual(['west', 'east', 'north']);
    expect(zoneNeighbors(GROVE_ID).map((l) => l.to)).toEqual([BOWL_ID, FERNREACH_ID, RIDGE_ID]);
  });

  it('the Grove keeps its primary neighbour (the 378/472 first-match discipline)', () => {
    expect(linkEdge(GROVE_ID)).toBe('west');
    expect(otherZone(GROVE_ID)).toBe(BOWL_ID);
  });

  it('the Ridge links back south', () => {
    expect(zoneNeighbors(RIDGE_ID).map((l) => [l.edge, l.to])).toEqual([['south', GROVE_ID]]);
  });

  it('two grounds now sit the same distance from the bowl', () => {
    expect(hopDistances(BOWL_ID)).toEqual({
      [BOWL_ID]: 0,
      [GROVE_ID]: 1,
      [FERNREACH_ID]: 2,
      [RIDGE_ID]: 2,
      [HOLLOW_ID]: 3,
    });
  });

  it('hops across the fork are symmetric', () => {
    expect(hopsBetween(RIDGE_ID, HOLLOW_ID)).toBe(3);
    expect(hopsBetween(HOLLOW_ID, RIDGE_ID)).toBe(3);
    expect(hopsBetween(RIDGE_ID, FERNREACH_ID)).toBe(2);
  });

  it('hopToward routes through the fork and terminates', () => {
    expect(hopToward(BOWL_ID, RIDGE_ID)).toBe(GROVE_ID);
    expect(hopToward(GROVE_ID, RIDGE_ID)).toBe(RIDGE_ID);
    const walked = [HOLLOW_ID];
    let at = HOLLOW_ID;
    for (let i = 0; i < 6 && at !== RIDGE_ID; i++) {
      at = hopToward(at, RIDGE_ID)!;
      walked.push(at);
    }
    expect(walked).toEqual([HOLLOW_ID, FERNREACH_ID, GROVE_ID, RIDGE_ID]);
  });

  it('the nearest qualifying ground is not simply the next one east', () => {
    expect(nearestQualifying(GROVE_ID, [HOLLOW_ID, RIDGE_ID], () => true)).toBe(RIDGE_ID);
  });

  it('zoneChain lists every ground exactly once, branch included', () => {
    const chain = zoneChain();
    expect(new Set(chain).size).toBe(chain.length);
    expect(chain).toHaveLength(ZONES.length);
    expect(chain).toContain(RIDGE_ID);
  });
});

describe('a vertical edge is a real edge', () => {
  it('crossing reads both axes', () => {
    expect(crossing(COLS * TILE, 100, COLS, ROWS, TILE)).toBe('east');
    expect(crossing(0, 100, COLS, ROWS, TILE)).toBe('west');
    expect(crossing(100, 0, COLS, ROWS, TILE)).toBe('north');
    expect(crossing(100, ROWS * TILE, COLS, ROWS, TILE)).toBe('south');
    expect(crossing(100, 100, COLS, ROWS, TILE)).toBeNull();
  });

  it('a north crossing preserves the column and enters from the far side\'s bottom', () => {
    const link = linkedZone(GROVE_ID, 'north', 96, 4, COLS, ROWS, TILE);
    expect(link?.zoneId).toBe(RIDGE_ID);
    expect(link?.entry.x).toBe(96);
    expect(link?.entry.y).toBe(ROWS * TILE - TILE * 1.5);
  });

  it('a south crossing off the Ridge lands back in the Grove', () => {
    const link = linkedZone(RIDGE_ID, 'south', 96, ROWS * TILE, COLS, ROWS, TILE);
    expect(link?.zoneId).toBe(GROVE_ID);
    expect(link?.entry.y).toBe(TILE * 1.5);
  });

  it('horizontal crossings are unchanged', () => {
    const link = linkedZone(BOWL_ID, 'east', COLS * TILE, 64, COLS, ROWS, TILE);
    expect(link).toEqual({ zoneId: GROVE_ID, entry: { x: TILE * 1.5, y: 64 } });
  });

  it('nearLinkEdge sees the vertical band', () => {
    expect(nearLinkEdge(GROVE_ID, { tileX: 9, tileY: 0 }, COLS, ROWS, 0)).toBe(RIDGE_ID);
    expect(nearLinkEdge(GROVE_ID, { tileX: 9, tileY: 7 }, COLS, ROWS, 0)).toBeNull();
    expect(nearLinkEdge(RIDGE_ID, { tileX: 9, tileY: ROWS - 1 }, COLS, ROWS, 0)).toBe(GROVE_ID);
  });

  it('a migrant crossing north holds its column', () => {
    const from = { tileX: 7, tileY: 9 };
    expect(migrationStepTarget(GROVE_ID, from, COLS, ROWS, 'north')).toEqual({ tileX: 7, tileY: 0 });
    expect(atMigrationEdge(GROVE_ID, { tileX: 7, tileY: 0 }, COLS, ROWS, 'north')).toBe(true);
    expect(atMigrationEdge(GROVE_ID, from, COLS, ROWS, 'north')).toBe(false);
    expect(crossEntryTile(GROVE_ID, from, COLS, ROWS, 'north')).toEqual({ tileX: 7, tileY: ROWS - 2 });
  });

  it('horizontal migration math is unchanged', () => {
    const from = { tileX: 5, tileY: 9 };
    expect(migrationStepTarget(BOWL_ID, from, COLS, ROWS, 'east')).toEqual({ tileX: COLS - 1, tileY: 9 });
    expect(crossEntryTile(BOWL_ID, from, COLS, ROWS, 'east')).toEqual({ tileX: 1, tileY: 9 });
    expect(atMigrationEdge(BOWL_ID, { tileX: COLS - 1, tileY: 9 }, COLS, ROWS, 'east')).toBe(true);
  });

  it('the Grove labels three edges, the Ridge one', () => {
    const grove = edgeIndicators(GROVE_ID);
    expect(grove.map((i) => i.edge)).toEqual(['west', 'east', 'north']);
    expect(grove.find((i) => i.edge === 'north')?.text).toBe('▴ The Sunward Ridge');
    expect(edgeIndicators(RIDGE_ID)).toEqual([{ edge: 'south', text: 'The Grove ▾' }]);
  });
});

describe('griefEdge reads the graph, not the chain (the 478 finding)', () => {
  it('answers north for a friend up on the Ridge', () => {
    expect(griefEdge(GROVE_ID, RIDGE_ID)).toBe('north');
    expect(griefEdge(RIDGE_ID, GROVE_ID)).toBe('south');
    // the far end of the chain, seen from the branch: the first hop is still south, off the Ridge.
    expect(griefEdge(RIDGE_ID, HOLLOW_ID)).toBe('south');
    expect(griefEdge(BOWL_ID, RIDGE_ID)).toBe('east');
  });

  it('the pre-478 answers are unchanged', () => {
    expect(griefEdge(BOWL_ID, HOLLOW_ID)).toBe('east');
    expect(griefEdge(HOLLOW_ID, BOWL_ID)).toBe('west');
    expect(griefEdge(GROVE_ID, GROVE_ID)).toBeNull();
    expect(griefEdge(BOWL_ID, 'nowhere')).toBeNull();
  });

  it('a vertical grief anchor holds the column', () => {
    expect(griefAnchor('north', { tileX: 6, tileY: 9 }, COLS, ROWS)).toEqual({ tileX: 6, tileY: 0 });
    expect(griefAnchor('south', { tileX: 6, tileY: 9 }, COLS, ROWS)).toEqual({ tileX: 6, tileY: ROWS - 1 });
    expect(griefAnchor('east', { tileX: 6, tileY: 9 }, COLS, ROWS)).toEqual({ tileX: COLS - 1, tileY: 9 });
    expect(griefAnchor('west', { tileX: 6, tileY: 9 }, COLS, ROWS)).toEqual({ tileX: 0, tileY: 9 });
  });
});

describe('the Ridge is a ground like the others, by data alone', () => {
  it('has its own terrain, tint, water and plot', () => {
    expect(zoneTileAt(RIDGE_ID, 0, 0, COLS, ROWS)).not.toBeNull();
    expect(zoneTileAt(RIDGE_ID, Math.floor(COLS / 2), 5, COLS, ROWS)).toBe('path');
    expect(zoneTileAt(RIDGE_ID, 3, ROWS - 4, COLS, ROWS)).toBe('water');
    expect(zoneWaterTile(RIDGE_ID, COLS, ROWS)).toEqual({ tileX: 3, tileY: ROWS - 4 });
    expect(zoneTint(RIDGE_ID)).not.toBe(zoneTint(BOWL_ID));
    expect(cropOf(RIDGE_ID)).toEqual({ food: 'seeds', ripe: '🌰' });
    expect(PLOT_TILE_BY_ZONE[RIDGE_ID]).toBeDefined();
  });

  it('its plot tile sits on plain grass, clear of the trail and the tarn', () => {
    const p = PLOT_TILE_BY_ZONE[RIDGE_ID];
    expect(zoneTileAt(RIDGE_ID, p.tileX, p.tileY, COLS, ROWS)).toBe('grass');
  });

  it('gets a capacity with no edit to capacity.ts (derived, per 476)', () => {
    expect(livableTiles(RIDGE_ID, COLS, ROWS)).toBeGreaterThan(0);
    expect(zoneCapacity(RIDGE_ID, COLS, ROWS)).toBeGreaterThanOrEqual(1);
  });
});
