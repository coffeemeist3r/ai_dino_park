/**
 * Dialog box frame (BACKLOG-036, CHARTER v4) — the Pokemon-Gen3 message box authored as code,
 * the same "art is code" medium as the sprites and tiles. A 9-slice source: chunky dark frame
 * line, a cream off-white fill, a single inner highlight bevel, and stepped (2px) rounded corners.
 *
 * Pure TypeScript (no Phaser): Node-testable — grid is square, the slice inset is a valid 9-slice
 * (0 < inset < size/2), palette discipline holds, the corners are actually rounded (the outermost
 * corner cell is transparent), and the frame line / fill / highlight colours are all present.
 *
 * The grid is a 9-slice SOURCE: bake.ts rasterizes it at an integer scale, then Phaser's NineSlice
 * stretches only the flat middle bands to the box size, keeping the corners crisp. The edge bands
 * are uniform along their stretch axis (every middle row is identical, every middle column too) so
 * the stretch never smears a detail.
 */

export interface FrameRig {
  /** Square source grid edge in px (baked ×scale). */
  size: number;
  /** 9-slice corner inset in source px: corners ≤ inset stay fixed, the middle stretches. */
  inset: number;
  /** Char → color. '.' = transparent. */
  palette: Record<string, number>;
  /** The source grid, one char per pixel. */
  grid: ReadonlyArray<string>;
}

// d = dark frame line (matches the legacy border 0x222244), h = inner highlight bevel,
// f = cream fill (matches the legacy fill 0xf0e8c8), '.' = transparent (the rounded step).
// 18×18 with a 6px inset: each 6×6 corner carries a stepped-diagonal round; the middle bands
// are uniform, so a long box stretches cleanly to any width/height.
const DIALOG_GRID: ReadonlyArray<string> = [
  '..dddddddddddddd..',
  '.dhhhhhhhhhhhhhhd.',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  'dhffffffffffffffhd',
  '.dhhhhhhhhhhhhhhd.',
  '..dddddddddddddd..',
];

export const DIALOG_FRAME: FrameRig = {
  size: 18,
  inset: 6,
  palette: {
    d: 0x222244,
    h: 0xfffbe8,
    f: 0xf0e8c8,
  },
  grid: DIALOG_GRID,
};
