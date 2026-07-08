import { describe, it, expect } from 'vitest';
import { cropOf, stageGlyph, CROP_BY_ZONE, STAGE_GLYPH } from '../../game/src/world/plot';
import { FOODS } from '../../game/src/world/foods';
import { BOWL_ID, GROVE_ID, FERNREACH_ID } from '../../game/src/world/zones';

/**
 * Per-zone crop identity (BACKLOG-418) — each zone's plot grows a crop suited to it, so the farming half of
 * the economy diverges the way gathering already does (348). Bowl berries (byte-identical), grove greens.
 */
describe('per-zone crop identity (BACKLOG-418)', () => {
  it('the bowl keeps its berries and 🍓 marker (byte-identical)', () => {
    expect(cropOf(BOWL_ID)).toEqual({ food: 'berries', ripe: '🍓' });
  });

  it('the grove grows greens with its own 🥬 marker', () => {
    expect(cropOf(GROVE_ID)).toEqual({ food: 'greens', ripe: '🥬' });
  });

  it('a zone with no crop entry falls back to the bowl berry', () => {
    expect(cropOf(FERNREACH_ID)).toEqual(cropOf(BOWL_ID)); // no Fernreach plot yet
    expect(cropOf('nowhere')).toEqual(cropOf(BOWL_ID));
  });

  it('non-ripe stages share the STAGE_GLYPH; the ripe stage reads the zone crop', () => {
    for (const s of ['empty', 'seed', 'sprout'] as const) {
      expect(stageGlyph(BOWL_ID, s)).toBe(STAGE_GLYPH[s]);
      expect(stageGlyph(GROVE_ID, s)).toBe(STAGE_GLYPH[s]);
    }
    expect(stageGlyph(BOWL_ID, 'ripe')).toBe('🍓');
    expect(stageGlyph(GROVE_ID, 'ripe')).toBe('🥬');
  });

  it("the grove's ripe marker is distinct from the sprout glyph (never reads ambiguously)", () => {
    expect(stageGlyph(GROVE_ID, 'ripe')).not.toBe(STAGE_GLYPH.sprout); // 🥬 ≠ 🌿
    // ...and distinct from the greens food's own emoji, so plot ≠ dropped-food glyph.
    expect(stageGlyph(GROVE_ID, 'ripe')).not.toBe(FOODS.find((f) => f.id === 'greens')!.emoji);
  });

  it('every zone crop is a real food (harvests into the feeding loop)', () => {
    for (const crop of Object.values(CROP_BY_ZONE)) {
      expect(FOODS.some((f) => f.id === crop.food)).toBe(true);
    }
  });
});
