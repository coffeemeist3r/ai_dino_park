import { describe, it, expect } from 'vitest';
import {
  BOWL_ID,
  GROVE_ID,
  FERNREACH_ID,
  HOLLOW_ID,
  RIDGE_ID,
  HOLLOW_TINT,
  ZONES,
  ZONE_TERRAIN,
  bowlTileAt,
  edgeIndicators,
  fernreachTileAt,
  groveTileAt,
  hollowTileAt,
  hollowPoolTile,
  neighborThrough,
  zoneById,
  zoneChain,
  zonePopulations,
  zoneTileAt,
  zoneTint,
  zoneWaterTile,
} from '../../game/src/world/zones';
import { CROP_BY_ZONE, PLOT_TILE_BY_ZONE, cropOf } from '../../game/src/world/plot';
import { CROP_SEASON, cropYield, YIELD_BASE, YIELD_GOOD, YIELD_LEAN } from '../../game/src/world/cropseason';
import { SEASONS } from '../../game/src/world/seasons';
import { FOODS, favoriteFood } from '../../game/src/world/foods';
import { ROSTER } from '../../game/src/entities/roster';
import { seededPersonality } from '../../game/src/ai/personality';
import { zoneMapModel } from '../../game/src/ui/lenses';

/**
 * The fourth ground (BACKLOG-472). 449 folded terrain into a table and promised "a fourth zone is a row,
 * not three branches"; ten cycles of chain economy were built on that claim without testing it. These pin
 * both halves of the item: the Hollow *is* a row, and the three founding grounds are untouched by its
 * arrival — including the one place the arrival genuinely cost something (the seasonal rotation).
 */

const COLS = 20;
const ROWS = 15;

describe('the chain grows a fourth link (BACKLOG-472)', () => {
  it('runs bowl → grove → fernreach → hollow, west to east', () => {
    // BACKLOG-478: the trunk still runs west→east and ends at the Hollow; the Ridge is appended after it
    // because no east walk reaches a north branch. Chain order is iteration order, not geography.
    expect(zoneChain()).toEqual([BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, RIDGE_ID]);
    expect(ZONES).toHaveLength(5);
    expect(zoneById(HOLLOW_ID).name).toBe('The Hollow');
  });

  it('links both ways through the Fernreach without disturbing its primary neighbour', () => {
    expect(neighborThrough(FERNREACH_ID, 'east')).toBe(HOLLOW_ID);
    expect(neighborThrough(HOLLOW_ID, 'west')).toBe(FERNREACH_ID);
    expect(neighborThrough(FERNREACH_ID, 'west')).toBe(GROVE_ID); // unchanged
    expect(neighborThrough(HOLLOW_ID, 'east')).toBeNull(); // the cold end of the chain
  });

  it('labels its edges through the existing indicator code, with no UI change', () => {
    expect(edgeIndicators(FERNREACH_ID).map((e) => e.text)).toContain('The Hollow ▸');
    expect(edgeIndicators(HOLLOW_ID)).toEqual([{ edge: 'west', text: '◂ The Fernreach' }]);
  });
});

describe("the Hollow's ground (BACKLOG-472)", () => {
  it('is a fen rim north and a standing pool centre-south, grass elsewhere', () => {
    expect(hollowTileAt(0, 1, COLS, ROWS)).toBe('fern');
    expect(hollowTileAt(19, 2, COLS, ROWS)).toBe('fern');
    expect(hollowTileAt(9, ROWS - 5, COLS, ROWS)).toBe('water');
    expect(hollowTileAt(11, ROWS - 4, COLS, ROWS)).toBe('water');
    expect(hollowTileAt(6, ROWS - 5, COLS, ROWS)).toBe('grass'); // just west of the pool
    expect(hollowTileAt(9, 8, COLS, ROWS)).toBe('grass');
    expect(hollowTileAt(0, 0, COLS, ROWS)).toBe('grass'); // the rim starts one tile in
  });

  it('reads through the table with its own tint and landmark, no dispatcher edit', () => {
    expect(zoneTileAt(HOLLOW_ID, 9, ROWS - 5, COLS, ROWS)).toBe('water');
    expect(zoneTint(HOLLOW_ID)).toBe(HOLLOW_TINT);
    expect(zoneWaterTile(HOLLOW_ID, COLS, ROWS)).toEqual(hollowPoolTile(ROWS));
  });

  it('declares a landmark that actually sits on water (the cycle-108 invariant, now four zones)', () => {
    for (const [id, terrain] of Object.entries(ZONE_TERRAIN)) {
      if (!terrain.water) continue;
      const { tileX, tileY } = terrain.water(COLS, ROWS);
      expect(terrain.tileAt(tileX, tileY, COLS, ROWS), `${id} landmark is not water`).toBe('water');
    }
  });

  it('leaves the three founding grounds tile-for-tile identical', () => {
    for (const { id, rule } of [
      { id: BOWL_ID, rule: bowlTileAt },
      { id: GROVE_ID, rule: groveTileAt },
      { id: FERNREACH_ID, rule: fernreachTileAt },
    ]) {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          expect(zoneTileAt(id, x, y, COLS, ROWS)).toBe(rule(x, y, COLS, ROWS));
        }
      }
    }
  });
});

describe('the Hollow farms its own crop (BACKLOG-472)', () => {
  it('grows pale mushrooms', () => {
    expect(cropOf(HOLLOW_ID).food).toBe('mushrooms');
    expect(FOODS.find((f) => f.id === 'mushrooms')?.kind).toBe('plant');
  });

  it('sites its plot clear of the rim, the pool and the edges', () => {
    const plot = PLOT_TILE_BY_ZONE[HOLLOW_ID];
    expect(plot).toBeDefined();
    expect(zoneTileAt(HOLLOW_ID, plot.tileX, plot.tileY, COLS, ROWS)).toBe('grass');
    expect(plot.tileX).toBeGreaterThan(0);
    expect(plot.tileX).toBeLessThan(COLS - 1);
    expect(plot.tileY).toBeGreaterThan(0);
    expect(plot.tileY).toBeLessThan(ROWS - 1);
  });

  it('gives every farmed zone crop a declared year, the fourth included', () => {
    for (const zone of Object.keys(CROP_BY_ZONE)) expect(CROP_SEASON[cropOf(zone).food]).toBeDefined();
  });

  // BACKLOG-478: relaxed from "exactly one" to "at least one" for the reason spelled out in the cycle-118
  // spec — five crops cannot each own one of four seasons. Spring being covered at all is what 472 bought,
  // and that still holds.
  it('gives every season a thriving crop — spring no longer excepted', () => {
    for (const s of SEASONS) {
      const good = Object.keys(CROP_SEASON).filter((f) => cropYield(f, s) === YIELD_GOOD);
      expect(good.length, `${s} should have a thriving crop`).toBeGreaterThanOrEqual(1);
    }
  });

  it('the fifth crop doubles up on summer rather than displacing anyone (BACKLOG-478)', () => {
    expect(Object.keys(CROP_SEASON).filter((f) => cropYield(f, 'summer') === YIELD_GOOD).sort()).toEqual([
      'berries',
      'seeds',
    ]);
    expect(cropYield('seeds', 'spring')).toBe(YIELD_BASE); // the hinge holds for the newcomer too
  });

  it('keeps the spring hinge for the founding three — a fresh boot banks what it always banked', () => {
    for (const food of ['berries', 'greens', 'roots']) expect(cropYield(food, 'spring')).toBe(YIELD_BASE);
  });

  it('makes fall the pinch season: the founding berries and the newcomer both come in thin', () => {
    expect(cropYield('berries', 'fall')).toBe(YIELD_LEAN);
    expect(cropYield('mushrooms', 'fall')).toBe(YIELD_LEAN);
    expect(cropYield('greens', 'fall')).toBe(YIELD_GOOD);
  });
});

describe('adding a food disturbs nothing (BACKLOG-472)', () => {
  it('flips no roster dino’s favorite food, in any season', () => {
    for (const r of ROSTER) {
      const p = seededPersonality(r.name);
      for (const s of SEASONS) {
        expect(favoriteFood(p, s).id, `${r.name} in ${s}`).not.toBe('mushrooms');
      }
    }
  });
});

describe('the generalized systems meet it untouched (BACKLOG-472)', () => {
  it('counts the Hollow at zero heads with no lens or tally edit', () => {
    const pops = zonePopulations({}, ['Rex', 'Sunny'], BOWL_ID);
    expect(pops[HOLLOW_ID]).toBe(0);
    expect(pops[BOWL_ID]).toBe(2);
  });

  it('renders four boxes on the zone-map lens straight off the chain', () => {
    const model = zoneMapModel(
      zoneChain(),
      { [BOWL_ID]: 2, [GROVE_ID]: 1, [FERNREACH_ID]: 1, [HOLLOW_ID]: 0, [RIDGE_ID]: 0 },
      BOWL_ID,
    );
    expect(model.map((e) => e.id)).toEqual([BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, RIDGE_ID]); // BACKLOG-478
  });
});
