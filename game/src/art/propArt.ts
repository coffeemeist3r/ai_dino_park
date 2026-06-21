/**
 * Resource + cairn pixel props (BACKLOG-296, CHARTER v4) — the gathering→craft arc's objects drawn
 * as Gen3-style pixel art instead of emoji glyphs: a fallen branch 🪵, a stone 🪨, and the crafted
 * cairn 🗿. Static single-frame rigs (props don't walk), each a fixed palette (not colour-keyed —
 * a branch is always wood-brown). Original pixels in the Gen3 style; never ripped.
 *
 * Pure TypeScript (no Phaser): every grid is Node-testable (square, palette discipline, non-empty,
 * distinct). bake.ts rasterizes these to one texture per prop; WorldScene swaps the emoji text
 * sprite for the baked image where a rig exists and keeps the emoji as the graceful fallback.
 */

export interface PropRig {
  size: number; // square grid edge in pixels
  grid: ReadonlyArray<string>; // one row per line; '.' = transparent
  palette: Record<string, number>; // char → color (fixed; ≤ 8 colors, GBA discipline)
}

// ── Branch 🪵 — a short fallen log, side-on, with a pale cut end (rings) on the left ───────────
const BRANCH_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '...oooooooooo...',
  '...oLLLLLLLLo...',
  '...okkwwwwwwo...',
  '...okkwwwwwwo...',
  '...okkkkkkkko...',
  '...oooooooooo...',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const BRANCH_RIG: PropRig = {
  size: 16,
  grid: BRANCH_GRID,
  palette: {
    o: 0x3a2410, // dark bark outline (never pure black)
    w: 0x8a5a2b, // wood body
    L: 0xb98a4e, // top highlight
    k: 0x5e3a18, // cut-end rings + underside shadow
  },
};

// ── Stone 🪨 — a rounded boulder, top-left highlight, bottom-right shadow ──────────────────────
const STONE_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhssssso...',
  '..ohhsssssssso..',
  '..osssssssssdo..',
  '..osssssssdddo..',
  '...osssdddddo...',
  '....oddddddo....',
  '.....oooooo.....',
  '................',
  '................',
  '................',
];

const STONE_RIG: PropRig = {
  size: 16,
  grid: STONE_GRID,
  palette: {
    o: 0x2e2e33, // dark stone outline
    s: 0x7d7d86, // stone body
    h: 0xa9a9b2, // lit face (top-left)
    d: 0x55555c, // shadowed face (bottom-right)
  },
};

// ── Cairn 🗿 — three stacked stones, bottom widest, the crafted marker (branches + stones) ─────
const CAIRN_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '.....ohhsso.....',
  '.....osssdo.....',
  '....oooooooo....',
  '...ohhhssssdo...',
  '...osssssssdo...',
  '...osssddddddo..',
  '..oooooooooooo..',
  '.ohhhssssssssddo',
  '.ossssssssssddo.',
  '.oddddddddddddo.',
  '..oooooooooooo..',
  '................',
];

const CAIRN_RIG: PropRig = {
  size: 16,
  grid: CAIRN_GRID,
  palette: {
    o: 0x2e2e33, // dark stone outline
    s: 0x7d7d86, // stone body
    h: 0xa9a9b2, // lit face
    d: 0x55555c, // shadowed face
  },
};

/** Props the pixel pipeline can render; keys match ResourceKind ('branch'|'stone') + 'cairn'. */
export const PROP_RIGS: Record<string, PropRig> = {
  branch: BRANCH_RIG,
  stone: STONE_RIG,
  cairn: CAIRN_RIG,
};

/** Distinct non-transparent chars in a grid — test helper for palette discipline. */
export function propCharsUsed(grid: ReadonlyArray<string>): Set<string> {
  const out = new Set<string>();
  for (const row of grid) for (const ch of row) if (ch !== '.') out.add(ch);
  return out;
}
