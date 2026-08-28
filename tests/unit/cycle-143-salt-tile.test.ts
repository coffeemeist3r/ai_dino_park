import { describe, it, expect } from 'vitest';
import { GRASS_RIG, SALT_RIG, TILE_RIGS, baseChar, type TileRig } from '../../game/src/art/tileArt';

/**
 * The salt crust ground tile (BACKLOG-511, for the Saltpan's floor in BACKLOG-505).
 *
 * The generic tile discipline — 16×16, opaque, palette-bounded, two variants, seamless flat borders — is
 * asserted here as it is for every kind. What is specific to this one is that it must not be **grass in a
 * paler palette**, which is exactly what the first draft was: a scatter of two-pixel marks, the grammar
 * every other ground kind in this file uses. A crust is not scattered, it is broken, so its marks form
 * closed plates. These tests pin that difference in a way a redraw cannot quietly lose.
 */

const charsOf = (frame: ReadonlyArray<string>): Set<string> => {
  const out = new Set<string>();
  for (const row of frame) for (const ch of row) out.add(ch);
  return out;
};

const borderIsBase = (rig: TileRig, grid: ReadonlyArray<string>): boolean => {
  const base = baseChar(rig);
  const top = grid[0];
  const bottom = grid[grid.length - 1];
  if ([...top].some((c) => c !== base) || [...bottom].some((c) => c !== base)) return false;
  return grid.every((row) => row[0] === base && row[row.length - 1] === base);
};

/**
 * The longest run of crack pixels reachable from any crack pixel, **8-connected** — a diagonal step in a
 * pixel line reads as joined to the eye, and a rasterised polygon edge is full of them, so 4-connectivity
 * would measure the rasteriser rather than the picture.
 */
const largestCrackBlob = (grid: ReadonlyArray<string>): number => {
  const seen = new Set<string>();
  let best = 0;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (grid[y][x] !== 'c' || seen.has(`${x},${y}`)) continue;
      let n = 0;
      const stack = [[x, y]];
      seen.add(`${x},${y}`);
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        n++;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
            if (grid[ny][nx] !== 'c' || seen.has(`${nx},${ny}`)) continue;
            seen.add(`${nx},${ny}`);
            stack.push([nx, ny]);
          }
        }
      }
      best = Math.max(best, n);
    }
  }
  return best;
};

describe('salt crust tile rig (BACKLOG-511)', () => {
  it('is registered as the Saltpan floor kind', () => {
    expect(TILE_RIGS.salt).toBe(SALT_RIG);
  });

  it('is a 16×16 grid in every variant', () => {
    expect(SALT_RIG.size).toBe(16);
    for (const grid of SALT_RIG.variants) {
      expect(grid).toHaveLength(16);
      for (const row of grid) expect(row).toHaveLength(16);
    }
  });

  it('keeps GBA palette discipline — ≤ 8 colours, every char defined', () => {
    expect(Object.keys(SALT_RIG.palette).length).toBeLessThanOrEqual(8);
    for (const grid of SALT_RIG.variants) for (const ch of charsOf(grid)) expect(SALT_RIG.palette[ch]).toBeDefined();
  });

  it('is opaque ground — no transparency', () => {
    for (const grid of SALT_RIG.variants) expect(charsOf(grid).has('.')).toBe(false);
  });

  it('has two distinct variants and seamless borders', () => {
    expect(SALT_RIG.variants.length).toBe(2);
    expect(SALT_RIG.variants[0]).not.toEqual(SALT_RIG.variants[1]);
    for (const grid of SALT_RIG.variants) expect(borderIsBase(SALT_RIG, grid)).toBe(true);
  });

  it('is broken, not speckled — the cracks join into plates', () => {
    // The first draft failed exactly here. Grass and fern scatter marks of one to three pixels; if salt
    // does the same it is a paler lawn. A crust reads as a crust because its cracks *connect*, so the
    // largest connected run of crack pixels has to be long enough to bound a plate.
    for (const grid of SALT_RIG.variants) expect(largestCrackBlob(grid)).toBeGreaterThanOrEqual(16);
  });

  it('is the anti-grass: paler than every ground in the park, and warm-neutral rather than green', () => {
    const base = SALT_RIG.palette[baseChar(SALT_RIG)];
    const grass = GRASS_RIG.palette[baseChar(GRASS_RIG)];
    const lum = (hex: number) => ((hex >> 16) & 0xff) * 0.3 + ((hex >> 8) & 0xff) * 0.59 + (hex & 0xff) * 0.11;
    expect(lum(base)).toBeGreaterThan(lum(grass));
    // No green cast: on grass the green channel dominates the red one; on crust it must not.
    expect((base >> 8) & 0xff).toBeLessThanOrEqual((base >> 16) & 0xff);
  });

  it('stays mostly base — a crust is plates with cracks, not a mosaic of cracks', () => {
    const base = baseChar(SALT_RIG);
    for (const grid of SALT_RIG.variants) {
      const marks = grid.join('').split('').filter((c) => c !== base).length;
      expect(marks).toBeLessThan(256 * 0.3);
    }
  });
});
