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
      'minds', 'sound', 'gift', 'item', 'lens', 'hearts', 'keeper', 'scan', 'time', 'export',
      'room', 'plot', 'book', 'help',
    ]);
    const overlap = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      expect(r.x - r.w / 2).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w / 2).toBeLessThanOrEqual(W);
      expect(r.y - r.h / 2).toBeGreaterThanOrEqual(0);
      for (let j = i + 1; j < rows.length; j++) expect(overlap(r, rows[j])).toBe(false);
    }
  });

  it('BACKLOG-552: the first column is byte-identical to the ten-row sheet, the rest sits to its left', () => {
    const rows = sheetRows(W);
    rows.slice(0, 10).forEach((r, i) => {
      expect(r).toMatchObject({ x: W - 12 - 84, y: 64 + i * 36, w: 168, h: 30 });
    });
    const second = rows.slice(10);
    expect(second.length).toBeGreaterThan(0);
    for (const r of second) {
      expect(r.x).toBe(second[0].x);
      expect(r.x + r.w / 2).toBeLessThan(rows[0].x - rows[0].w / 2);
    }
  });

  // The first column's tenth row (`export`, y=388) has always overlapped the top of the Talk circle
  // (y=396, r=30); buttons dispatch first, so that sliver is Talk. Pinned as found rather than moved,
  // because the first column is held byte-identical — the claim here is that the new column adds none.
  it('BACKLOG-552: no second-column row lands on the action cluster or the stick', () => {
    const hitsCircle = (r: ReturnType<typeof sheetRows>[number], cx: number, cy: number, rad: number) => {
      const nx = Math.max(r.x - r.w / 2, Math.min(cx, r.x + r.w / 2));
      const ny = Math.max(r.y - r.h / 2, Math.min(cy, r.y + r.h / 2));
      return Math.hypot(nx - cx, ny - cy) < rad;
    };
    for (const r of sheetRows(W).slice(10)) {
      for (const b of actionButtons(W, H)) expect(hitsCircle(r, b.x, b.y, b.r)).toBe(false);
      expect(hitsCircle(r, STICK.x, STICK.y, STICK.grab)).toBe(false);
    }
  });

  it('menu chips are ◀/1..N/✕ above the dialog strip, ◀/✕ for a plain dialog', () => {
    // BACKLOG-212: the third argument is the option COUNT, not a boolean. It was a boolean that always
    // drew 1/2/3, which is why a fourth observer would have rendered in the picker and been untappable.
    const numbered = menuChips(W, H, 3);
    expect(numbered.map((c) => c.id)).toEqual(['back', 'pick1', 'pick2', 'pick3', 'close']);
    for (const c of numbered) expect(c.y + c.h / 2).toBeLessThanOrEqual(H - 88 - 12); // DialogBox top
    expect(menuChips(W, H, 0).map((c) => c.id)).toEqual(['back', 'close']);
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
