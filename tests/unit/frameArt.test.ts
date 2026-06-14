import { describe, it, expect } from 'vitest';
import { DIALOG_FRAME } from '../../game/src/art/frameArt';

describe('dialog box frame (BACKLOG-036)', () => {
  const { size, inset, grid, palette } = DIALOG_FRAME;

  it('is a square grid matching the declared size', () => {
    expect(grid.length).toBe(size);
    for (const row of grid) expect(row.length).toBe(size);
  });

  it('the slice inset is a valid 9-slice — corners fit, a middle is left to stretch', () => {
    expect(inset).toBeGreaterThan(0);
    expect(inset * 2).toBeLessThan(size);
  });

  it('keeps GBA palette discipline (≤ 15 colours) and carries the frame line, fill, and highlight', () => {
    expect(Object.keys(palette).length).toBeLessThanOrEqual(15);
    expect(palette.d).toBe(0x222244); // dark frame line (matches the legacy border)
    expect(palette.f).toBe(0xf0e8c8); // cream fill (matches the legacy fill)
    expect(palette.h).toBeDefined(); // inner highlight bevel
  });

  it('every grid char is a known palette key or transparent', () => {
    for (const row of grid) for (const ch of row) expect(ch === '.' || ch in palette).toBe(true);
  });

  it('the corners are rounded — the four outermost corner cells are transparent', () => {
    const last = size - 1;
    expect(grid[0][0]).toBe('.');
    expect(grid[0][last]).toBe('.');
    expect(grid[last][0]).toBe('.');
    expect(grid[last][last]).toBe('.');
  });

  it('the interior is solid fill — the stretched centre never shows a hole or a stray line', () => {
    for (let y = inset; y < size - inset; y++) {
      for (let x = inset; x < size - inset; x++) {
        expect(grid[y][x]).toBe('f');
      }
    }
  });

  it('the stretchable edge bands are uniform along their stretch axis (no smear when stretched)', () => {
    const mid = Math.floor(size / 2);
    // top + bottom edge: every middle column equals the column at the band centre, per row
    for (let y = 0; y < inset; y++) {
      for (let x = inset; x < size - inset; x++) expect(grid[y][x]).toBe(grid[y][mid]);
    }
    // left + right edge: every middle row equals the row at the band centre, per column
    for (let x = 0; x < inset; x++) {
      for (let y = inset; y < size - inset; y++) expect(grid[y][x]).toBe(grid[mid][x]);
    }
  });

  it('the frame reads from the outside in: dark line, highlight bevel, then fill', () => {
    const mid = Math.floor(size / 2);
    expect(grid[0][mid]).toBe('d'); // outermost is the dark frame line
    expect(grid[1][mid]).toBe('h'); // then the highlight bevel
    expect(grid[inset][mid]).toBe('f'); // then fill
  });
});
