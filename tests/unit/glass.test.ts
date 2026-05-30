import { describe, it, expect } from 'vitest';
import { cornerRadius, rimRects, edgeBands, glarePolys, toPoints, GLASS } from '../../game/src/ui/glass';

describe('glass geometry', () => {
  it('corner radius scales with tile size and is positive', () => {
    expect(cornerRadius(32)).toBe(48);
    expect(cornerRadius(16)).toBeGreaterThan(0);
  });

  it('rim rects are inset and stay within the canvas', () => {
    const rects = rimRects(640, 480);
    expect(rects.length).toBe(2);
    for (const r of rects) {
      expect(r.x).toBeGreaterThan(0);
      expect(r.x + r.width).toBeLessThanOrEqual(640);
      expect(r.y + r.height).toBeLessThanOrEqual(480);
    }
    // outer rim encloses the inner rim
    expect(rects[0].width).toBeGreaterThan(rects[1].width);
  });

  it('edge bands cover all four sides at the configured thickness', () => {
    const bands = edgeBands(640, 480);
    expect(bands.length).toBe(4);
    expect(bands[0]).toEqual({ x: 0, y: 0, width: 640, height: GLASS.edgeBand });
    expect(bands[1].y).toBe(480 - GLASS.edgeBand);
    expect(bands[3].x).toBe(640 - GLASS.edgeBand);
  });

  it('glare polys are two streaks anchored top-left, in bounds', () => {
    const polys = glarePolys(640, 480);
    expect(polys.length).toBe(2);
    for (const p of polys) {
      expect(p.length % 2).toBe(0);
      for (let i = 0; i < p.length; i += 2) {
        expect(p[i]).toBeGreaterThanOrEqual(0);
        expect(p[i]).toBeLessThanOrEqual(640);
        expect(p[i + 1]).toBeGreaterThanOrEqual(0);
        expect(p[i + 1]).toBeLessThanOrEqual(480);
      }
    }
  });

  it('toPoints pairs a flat polygon into {x,y}', () => {
    expect(toPoints([1, 2, 3, 4])).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });
});
