import { describe, it, expect } from 'vitest';
import { ROSTER } from '../../game/src/entities/roster';
import { seededPersonality, AXES } from '../../game/src/ai/personality';

const COLS = 20;
const ROWS = 15;

describe('ROSTER', () => {
  it('has 8 entries with distinct names (CHARTER v7 — the cast ships across the map)', () => {
    expect(ROSTER).toHaveLength(8);
    expect(new Set(ROSTER.map((d) => d.name)).size).toBe(8);
  });

  it('reuses species deliberately, but never a species+colour pair', () => {
    // Species repeat as of v7 so the new grounds get residents without waiting on new art. What must stay
    // unique is the *bake key*: `ensurePixelWalk` keys its anim `${prefix}_walk_${baseColor}`, so two dinos
    // of one species sharing a colour would silently share a texture and read as the same animal.
    const pairs = ROSTER.map((d) => `${d.species}:${d.color}`);
    expect(new Set(pairs).size).toBe(ROSTER.length);
  });

  it('puts a resident on every ground the player can walk to', () => {
    const zones = new Set(ROSTER.map((d) => d.zone ?? 'bowl'));
    expect(zones.size).toBeGreaterThanOrEqual(3); // the bowl is no longer the whole park
    expect(zones.has('bowl')).toBe(true);
  });

  it('spawns on distinct in-zone, in-bounds tiles that avoid the player start (3,3)', () => {
    // Distinct *per ground* — two dinos on different grounds may hold the same tile coordinates, because
    // they are not standing in the same place. Before v7 every dino was in the bowl and this was global.
    const byZone = new Map<string, string[]>();
    for (const d of ROSTER) {
      const z = d.zone ?? 'bowl';
      byZone.set(z, [...(byZone.get(z) ?? []), `${d.tileX},${d.tileY}`]);
    }
    for (const [, tiles] of byZone) expect(new Set(tiles).size).toBe(tiles.length);
    for (const d of ROSTER) {
      expect(d.tileX).toBeGreaterThanOrEqual(0);
      expect(d.tileX).toBeLessThan(COLS);
      expect(d.tileY).toBeGreaterThanOrEqual(0);
      expect(d.tileY).toBeLessThan(ROWS);
      if ((d.zone ?? 'bowl') === 'bowl') expect(`${d.tileX},${d.tileY}`).not.toBe('3,3');
    }
  });

  it('keeps Rex as the anchor at index 0', () => {
    expect(ROSTER[0].name).toBe('Rex');
  });

  it('gives every dino a personality distinct from the others', () => {
    const ps = ROSTER.map((d) => seededPersonality(d.name));
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const differs = AXES.some((axis) => ps[i][axis.key] !== ps[j][axis.key]);
        expect(differs).toBe(true);
      }
    }
  });
});
