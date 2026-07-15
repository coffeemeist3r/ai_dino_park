import { describe, it, expect } from 'vitest';
import { needSeeks, NEED_PULL_CHANCE } from '../../game/src/world/needs';
import { grovePondTile, groveTileAt } from '../../game/src/world/zones';

// Need pulls the body (BACKLOG-436) — the pure halves: the lean gate + the pond target.

describe('needSeeks gate (BACKLOG-436)', () => {
  it('fires below the chance, not at or above it (strict <)', () => {
    expect(needSeeks(0)).toBe(true);
    expect(needSeeks(0.99)).toBe(false);
    expect(needSeeks(0.1, 0.5)).toBe(true);
    expect(needSeeks(0.5, 0.5)).toBe(false); // boundary misses
  });

  it('is a lean, not a compulsion — chance strictly in (0,1)', () => {
    expect(NEED_PULL_CHANCE).toBeGreaterThan(0);
    expect(NEED_PULL_CHANCE).toBeLessThan(1);
  });
});

describe('grovePondTile (BACKLOG-436)', () => {
  it('lands on an actual grove water tile for realistic grid sizes', () => {
    for (const cols of [16, 20, 24]) {
      const rows = 15;
      const t = grovePondTile(cols);
      expect(groveTileAt(t.tileX, t.tileY, cols, rows)).toBe('water');
    }
  });
});
