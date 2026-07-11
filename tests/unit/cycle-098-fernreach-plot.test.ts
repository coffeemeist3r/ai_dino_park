import { describe, it, expect } from 'vitest';
import {
  PLOT_TILE,
  GROVE_PLOT_TILE,
  FERNREACH_PLOT_TILE,
  PLOT_TILE_BY_ZONE,
  cropOf,
  STAGE_GLYPH,
} from '../../game/src/world/plot';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, fernreachTileAt } from '../../game/src/world/zones';
import { FOODS, favoriteFood } from '../../game/src/world/foods';
import { seededPersonality } from '../../game/src/ai/personality';
import { SEASONS } from '../../game/src/world/seasons';

const COLS = 20;
const ROWS = 15;
const ROSTER = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];

describe('Fernreach plot (BACKLOG-432)', () => {
  it('the per-zone map points the Fernreach at its own plot tile', () => {
    expect(PLOT_TILE_BY_ZONE[FERNREACH_ID]).toEqual(FERNREACH_PLOT_TILE);
  });

  it('the Fernreach plot is a distinct tile from the bowl and grove plots', () => {
    expect(FERNREACH_PLOT_TILE).not.toEqual(PLOT_TILE);
    expect(FERNREACH_PLOT_TILE).not.toEqual(GROVE_PLOT_TILE);
  });

  it('the Fernreach plot sits on Fernreach grass — not the creek, not the fern bands', () => {
    expect(fernreachTileAt(FERNREACH_PLOT_TILE.tileX, FERNREACH_PLOT_TILE.tileY, COLS, ROWS)).toBe('grass');
  });

  it('the Fernreach plot is inside the map, off the edges', () => {
    expect(FERNREACH_PLOT_TILE.tileX).toBeGreaterThan(0);
    expect(FERNREACH_PLOT_TILE.tileX).toBeLessThan(COLS - 1);
    expect(FERNREACH_PLOT_TILE.tileY).toBeGreaterThan(0);
    expect(FERNREACH_PLOT_TILE.tileY).toBeLessThan(ROWS - 1);
  });
});

describe('roots — the farmable third crop (BACKLOG-432)', () => {
  it('roots is a real food, harvestable into the feeding loop', () => {
    expect(FOODS.some((f) => f.id === 'roots')).toBe(true);
    expect(cropOf(FERNREACH_ID).food).toBe('roots');
  });

  it("the Fernreach ripe marker (🍠) is distinct from the sprout glyph, the roots emoji, and 🍓/🥬", () => {
    const ripe = cropOf(FERNREACH_ID).ripe;
    expect(ripe).toBe('🍠');
    expect(ripe).not.toBe(STAGE_GLYPH.sprout); // 🍠 ≠ 🌿
    expect(ripe).not.toBe(FOODS.find((f) => f.id === 'roots')!.emoji); // 🍠 ≠ 🥕 (plot ≠ dropped food)
    expect(ripe).not.toBe(cropOf(BOWL_ID).ripe); // ≠ 🍓
    expect(ripe).not.toBe(cropOf(GROVE_ID).ripe); // ≠ 🥬
  });

  it('adding roots flips no roster dino\'s favorite — the 061/170/418 verdicts hold', () => {
    // roots is nobody's favorite in any season
    for (const name of ROSTER) {
      const t = seededPersonality(name);
      for (const s of SEASONS) expect(favoriteFood(t, s).id).not.toBe('roots');
      expect(favoriteFood(t).id).not.toBe('roots');
    }
    // the pinned anchors from the seasonal-palates suite still hold
    expect(favoriteFood(seededPersonality('Rex')).id).toBe('meat');
    expect(favoriteFood(seededPersonality('Rex'), 'summer').id).toBe('berries');
    expect(favoriteFood(seededPersonality('Twitch')).id).toBe('greens');
    expect(favoriteFood(seededPersonality('Glade')).id).toBe('meat');
    // favorites still span at least three distinct foods
    expect(new Set(ROSTER.map((n) => favoriteFood(seededPersonality(n)).id)).size).toBeGreaterThanOrEqual(3);
  });
});
