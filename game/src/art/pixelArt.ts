/**
 * GBA pixel pipeline (BACKLOG-168, CHARTER v4) — sprites authored as pixel-grid rigs: rows of
 * palette-keyed characters ('.' = transparent), baked at an integer scale with hard edges.
 * Original pixels in the Gen3 *style* — never ripped, never traced.
 *
 * Pure TypeScript (no Phaser): every frame is Node-testable (dimensions, palette discipline,
 * frames-differ). bake.ts rasterizes these; species present here override their legacy vector rig.
 */

import { shade } from './dinoArt';

export interface PixelRig {
  prefix: string; // anim-key prefix — Rex keeps 'tri' so existing colour-keyed bakes stay stable
  size: number; // square grid edge in pixels
  /** Unique frames (Gen3 convention: stand, step-left, step-right). */
  frames: ReadonlyArray<ReadonlyArray<string>>;
  /** Anim playback order into `frames` — stand between steps, the classic 4-beat amble. */
  sequence: ReadonlyArray<number>;
  /** Char → color for a roster base color. ≤ 15 colors + transparency (GBA OBJ discipline). */
  palette(base: number): Record<string, number>;
}

// ── Rex — the triceratops, first through the pixel pipeline ────────────────────────────────
// 20×20, side view facing left: nose horn, brow horns, the big frill behind the head, body,
// tapered tail, two visible legs. Three unique frames; only the legs/feet move (chunky amble).

const REX_STAND: ReadonlyArray<string> = [
  '....................',
  '....................',
  '...hh...oooo........',
  '...hh..offffo.......',
  '..oooooffffffo......',
  '.obbbboffffffo......',
  'hobebbffffffffo.....',
  '.obbbbffffffffo.....',
  '.obbbbfffffffobbo...',
  '..obbofffffffbbbbo..',
  '...obbooooooobbbbbbo',
  '...obbbbbbbbbbbbbo..',
  '...obllllllllllbbo..',
  '....ollllllllllbo...',
  '.....ddoooooodd.....',
  '.....dd......dd.....',
  '.....dd......dd.....',
  '....ooo.....ooo.....',
  '....................',
  '....................',
];

const REX_STEP_L: ReadonlyArray<string> = [
  ...REX_STAND.slice(0, 14),
  '....dd.oooooo.dd....',
  '....dd........dd....',
  '....dd........dd....',
  '...ooo.......ooo....',
  '....................',
  '....................',
];

const REX_STEP_R: ReadonlyArray<string> = [
  ...REX_STAND.slice(0, 14),
  '......ddoooodd......',
  '......dd....dd......',
  '......dd....dd......',
  '.....ooo...ooo......',
  '....................',
  '....................',
];

function rexPalette(base: number): Record<string, number> {
  return {
    o: shade(base, -0.75), // near-black warm outline (never pure black)
    b: base,
    l: shade(base, 0.35), // belly
    d: shade(base, -0.3), // legs
    f: shade(base, 0.15), // frill
    h: 0xe8dcc0, // bone
    e: 0x1a0e0a, // eye
  };
}

export const REX_RIG: PixelRig = {
  prefix: 'tri',
  size: 20,
  frames: [REX_STAND, REX_STEP_L, REX_STEP_R],
  sequence: [0, 1, 0, 2],
  palette: rexPalette,
};

/** Species drawn in pixel; these override their legacy vector rigs in bake.ts. */
export const PIXEL_SPECIES: Record<string, PixelRig> = {
  triceratops: REX_RIG,
};

/** Distinct non-transparent chars used by a frame — test helper for palette discipline. */
export function charsUsed(frame: ReadonlyArray<string>): Set<string> {
  const out = new Set<string>();
  for (const row of frame) for (const ch of row) if (ch !== '.') out.add(ch);
  return out;
}
