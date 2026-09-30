import { describe, it, expect } from 'vitest';
import { LONG_PRESS_MS, isLongPress, sheetRows, actionButtons, inCircle, SHEET_COLUMN_ROWS } from './touch';

describe('BACKLOG-547 — the hold threshold', () => {
  it('is a tap below the threshold and a hold at or above it', () => {
    expect(isLongPress(1000, 1000 + LONG_PRESS_MS - 1)).toBe(false);
    expect(isLongPress(1000, 1000 + LONG_PRESS_MS)).toBe(true);
    expect(isLongPress(1000, 1000 + LONG_PRESS_MS + 500)).toBe(true);
  });

  it('takes a custom threshold', () => {
    expect(isLongPress(0, 100, 200)).toBe(false);
    expect(isLongPress(0, 250, 200)).toBe(true);
  });

  it('sits in the deliberate-but-not-a-wait band', () => {
    expect(LONG_PRESS_MS).toBeGreaterThan(150);
    expect(LONG_PRESS_MS).toBeLessThan(800);
  });

  it('the feed button the hold hangs on is still in the action cluster', () => {
    const feed = actionButtons(640, 480).find((b) => b.id === 'feed');
    expect(feed).toBeDefined();
    expect(inCircle(feed!.x, feed!.y, feed!.r, feed!.x, feed!.y)).toBe(true);
  });

  it('a sheet column is at the ceiling that forced the gesture — so 552 grew sideways, not down', () => {
    const rows = sheetRows(640);
    const first = rows.filter((r) => r.x === rows[0].x);
    expect(first).toHaveLength(SHEET_COLUMN_ROWS);
    const eleventh = first[first.length - 1].y + (first[1].y - first[0].y);
    const cluster = Math.min(...actionButtons(640, 480).map((b) => b.y - b.r));
    expect(eleventh).toBeGreaterThan(cluster); // an eleventh row in one column would land under the thumb
    expect(rows.length).toBeGreaterThan(SHEET_COLUMN_ROWS); // BACKLOG-552: the rest went to a second column
  });
});
