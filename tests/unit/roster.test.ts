import { describe, it, expect } from 'vitest';
import { ROSTER } from '../../game/src/entities/roster';
import { seededPersonality, AXES } from '../../game/src/ai/personality';

const COLS = 20;
const ROWS = 15;

describe('ROSTER', () => {
  it('has 5 entries with distinct names and species', () => {
    expect(ROSTER).toHaveLength(5);
    expect(new Set(ROSTER.map((d) => d.name)).size).toBe(5);
    expect(new Set(ROSTER.map((d) => d.species)).size).toBe(5);
  });

  it('spawns on distinct, in-bounds tiles that avoid the player start (3,3)', () => {
    const tiles = ROSTER.map((d) => `${d.tileX},${d.tileY}`);
    expect(new Set(tiles).size).toBe(5);
    for (const d of ROSTER) {
      expect(d.tileX).toBeGreaterThanOrEqual(0);
      expect(d.tileX).toBeLessThan(COLS);
      expect(d.tileY).toBeGreaterThanOrEqual(0);
      expect(d.tileY).toBeLessThan(ROWS);
      expect(`${d.tileX},${d.tileY}`).not.toBe('3,3');
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
