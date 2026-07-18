import { describe, it, expect } from 'vitest';
import {
  nearPond,
  firstPondSight,
  pondSightMemory,
  pondSightLine,
  POND_SIGHT_RADIUS,
  groveArrivalMemory,
} from '../../game/src/world/arrival';
import { BOWL_ID, GROVE_ID, groveTileAt } from '../../game/src/world/zones';

const COLS = 20;
const ROWS = 15;

// The grove pond is the NE block groveTileAt marks 'water': x∈[15,18], y∈[2,4].
const pondTile = { tileX: 16, tileY: 3 };

describe('first sight of the pond (BACKLOG-359)', () => {
  it('the pond water exists where nearPond expects it (294 terrain pin)', () => {
    expect(groveTileAt(pondTile.tileX, pondTile.tileY, COLS, ROWS)).toBe('water');
  });

  it('nearPond is true on the water and within the sight radius, false beyond it', () => {
    expect(nearPond(pondTile, COLS, ROWS)).toBe(true);
    // one tile south of the pond's bottom row (y=4) → within radius
    expect(nearPond({ tileX: 16, tileY: 5 }, COLS, ROWS)).toBe(true);
    // far corner of the grove, nowhere near the water
    expect(nearPond({ tileX: 1, tileY: 13 }, COLS, ROWS)).toBe(false);
  });

  it('nearPond honours POND_SIGHT_RADIUS exactly (in at R, out at R+1)', () => {
    // nearest water row is y=4; from x=16 a tile at y=4+R is in, y=4+R+1 is out
    expect(nearPond({ tileX: 16, tileY: 4 + POND_SIGHT_RADIUS }, COLS, ROWS)).toBe(true);
    expect(nearPond({ tileX: 16, tileY: 4 + POND_SIGHT_RADIUS + 1 }, COLS, ROWS)).toBe(false);
  });

  it('fires for an unseen grove dino within sight of the pond', () => {
    expect(firstPondSight([], 'Rex', GROVE_ID, pondTile, COLS, ROWS)).toBe(true);
  });

  it('fires once per dino ever (a dino in pondSeen does not re-fire)', () => {
    expect(firstPondSight(['Rex'], 'Rex', GROVE_ID, pondTile, COLS, ROWS)).toBe(false);
  });

  it('is distinct from the grove-entry beat (339): a grove dino away from the pond does not fire', () => {
    expect(firstPondSight([], 'Rex', GROVE_ID, { tileX: 1, tileY: 13 }, COLS, ROWS)).toBe(false);
  });

  it('never fires for a bowl dino, even on a tile that would be water in grove space', () => {
    expect(firstPondSight([], 'Rex', BOWL_ID, pondTile, COLS, ROWS)).toBe(false);
  });

  it('the pond memory/line are distinct, non-empty, and not the 339 grove-arrival memory', () => {
    expect(pondSightMemory()).toMatch(/pond/i);
    expect(pondSightMemory()).not.toBe(pondSightLine());
    expect(pondSightMemory()).not.toBe(groveArrivalMemory());
  });
});

/**
 * BACKLOG-445 regression fence. The waterhole made thirst a per-zone question, but the pond-sight beat
 * (359) and the pond-swap gossip (346) are *grove lore* — they mean "the grove's pond", not "any water".
 * If `nearPond` ever widens to the zone-generic `atWater`, a once-ever beat retro-fires for every dino
 * standing in the Fernreach creek or the bowl waterhole, and `pondSeen` fills up in existing saves.
 */
describe('nearPond stays pointed at the grove (BACKLOG-445 guard)', () => {
  it('is false on the bowl waterhole and the Fernreach creek', () => {
    expect(nearPond({ tileX: 3, tileY: 2 }, COLS, ROWS)).toBe(false); // bowl waterhole (bowlTileAt)
    expect(nearPond({ tileX: 3, tileY: 7 }, COLS, ROWS)).toBe(false); // Fernreach creek (fernreachTileAt)
  });

  it('still fires only for a grove dino', () => {
    expect(firstPondSight([], 'Rex', BOWL_ID, pondTile, COLS, ROWS)).toBe(false);
    expect(firstPondSight([], 'Rex', GROVE_ID, pondTile, COLS, ROWS)).toBe(true);
  });
});
