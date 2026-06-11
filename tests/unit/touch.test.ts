import { describe, it, expect } from 'vitest';
import {
  STICK,
  stickVector,
  inCircle,
  inRect,
  actionButtons,
  sheetRows,
  menuChips,
} from '../../game/src/input/touch';

const W = 640;
const H = 480;

describe('stickVector', () => {
  it('is zero at the stick center and inside the deadzone', () => {
    expect(stickVector(STICK.x, STICK.y)).toEqual({ x: 0, y: 0 });
    const dead = STICK.r * STICK.dead * 0.9;
    expect(stickVector(STICK.x + dead, STICK.y)).toEqual({ x: 0, y: 0 });
  });

  it('points toward the pointer with magnitude proportional to displacement', () => {
    const half = stickVector(STICK.x + STICK.r / 2, STICK.y);
    expect(half.x).toBeCloseTo(0.5);
    expect(half.y).toBeCloseTo(0);
    const up = stickVector(STICK.x, STICK.y - STICK.r);
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeCloseTo(-1);
  });

  it('clamps to unit length when dragged past the rim', () => {
    const far = stickVector(STICK.x + STICK.r * 5, STICK.y + STICK.r * 5);
    expect(Math.hypot(far.x, far.y)).toBeCloseTo(1);
    expect(far.x).toBeCloseTo(far.y);
  });

  it('diagonals normalize the same as cardinals (no fast diagonals)', () => {
    const diag = stickVector(STICK.x + STICK.r * 2, STICK.y - STICK.r * 2);
    expect(Math.hypot(diag.x, diag.y)).toBeCloseTo(1);
  });
});

describe('layout', () => {
  it('action buttons sit in the bottom-right quadrant, fully on canvas', () => {
    const buttons = actionButtons(W, H);
    expect(buttons.map((b) => b.id)).toEqual(['talk', 'feed', 'more']);
    for (const b of buttons) {
      expect(b.x).toBeGreaterThan(W / 2);
      expect(b.y).toBeGreaterThan(H / 2);
      expect(b.x + b.r).toBeLessThanOrEqual(W);
      expect(b.y + b.r).toBeLessThanOrEqual(H);
    }
  });

  it('the stick clears the action cluster (zones never overlap)', () => {
    for (const b of actionButtons(W, H)) {
      const gap = Math.hypot(b.x - STICK.x, b.y - STICK.y);
      expect(gap).toBeGreaterThan(STICK.grab + b.r);
    }
  });

  it('the sheet covers the whole remaining keyboard surface, rows on canvas and disjoint', () => {
    const rows = sheetRows(W);
    expect(rows.map((r) => r.id)).toEqual([
      'minds', 'gift', 'item', 'lens', 'hearts', 'keeper', 'scan', 'time', 'export',
    ]);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      expect(r.x - r.w / 2).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w / 2).toBeLessThanOrEqual(W);
      if (i > 0) expect(r.y - r.h / 2).toBeGreaterThanOrEqual(rows[i - 1].y + rows[i - 1].h / 2);
    }
  });

  it('menu chips are ◀/1/2/3/✕ above the dialog strip, ◀/✕ for a plain dialog', () => {
    const numbered = menuChips(W, H, true);
    expect(numbered.map((c) => c.id)).toEqual(['back', 'pick1', 'pick2', 'pick3', 'close']);
    for (const c of numbered) expect(c.y + c.h / 2).toBeLessThanOrEqual(H - 88 - 12); // DialogBox top
    expect(menuChips(W, H, false).map((c) => c.id)).toEqual(['back', 'close']);
  });
});

describe('hit tests', () => {
  it('inCircle includes the rim and excludes beyond it', () => {
    expect(inCircle(10, 10, 5, 15, 10)).toBe(true);
    expect(inCircle(10, 10, 5, 16, 10)).toBe(false);
  });

  it('inRect is centered half-extent containment', () => {
    const r = { id: 'x', label: 'x', x: 100, y: 100, w: 40, h: 20 };
    expect(inRect(r, 80, 90)).toBe(true);
    expect(inRect(r, 121, 100)).toBe(false);
    expect(inRect(r, 100, 111)).toBe(false);
  });
});
