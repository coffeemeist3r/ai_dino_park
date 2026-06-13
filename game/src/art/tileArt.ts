/**
 * Ground tiles (BACKLOG-033, CHARTER v4) — the floor authored as Gen3 pixel art instead of a
 * flat two-green checker. Same "art is code" medium as the sprites: 16×16 pixel-grid tiles,
 * palette-keyed chars, baked at an integer scale (×2 → 32×32 = one world tile) by bake.ts.
 *
 * Pure TypeScript (no Phaser): Node-testable — grid dimensions, palette discipline, and the
 * SEAMLESS guarantee (every tile's border is the flat base colour, so any tile abuts any other
 * with no visible seam). Tiles are opaque (no '.' transparency) and use a FIXED ground palette,
 * not a colour-keyed ramp — the floor is the floor.
 *
 * Shipped this fire: grass (the whole visible bowl floor). Path + water remain for the zone that
 * needs them (BACKLOG-143) — they have nowhere to render on the all-grass bowl yet.
 */

export interface TileRig {
  /** Square grid edge in pixels (16 → baked ×2 to a 32px world tile). */
  size: number;
  /** Char → color. Fixed ground colours; ≤ 15 + (opaque, so no transparency). */
  palette: Record<string, number>;
  /** Spatial variants the ground alternates like the classic checker (not animation frames). */
  variants: ReadonlyArray<ReadonlyArray<string>>;
}

// ── Grass — flat Gen3 field green with a sparse scatter of darker blade tufts (a light tip over
// a two-pixel dark stem, light from the upper-left). Two variants so the checker reads alive
// rather than as one stamped tile. Every tuft sits in the interior (rows 2–13, cols 3–13), so
// all four borders are flat 'g' — seamless by construction, in any A/B arrangement.

const GRASS_A: ReadonlyArray<string> = [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'ggglgggggggggggg',
  'gggdggggglgggggg',
  'gggdgggggdgggggg',
  'gggggggggdgggdgg',
  'gggggggggggggggg',
  'gggggglggggggggg',
  'ggggggdggggglggg',
  'ggggggdgggggdggg',
  'ggggggggggggdggg',
  'gggglggggggggggg',
  'ggggdggdgggdgggg',
  'ggggdggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
];

const GRASS_B: ReadonlyArray<string> = [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'ggggglggggggdggg',
  'gggggdggggglgggg',
  'gggggdgggggdgggg',
  'gggggggdgggdgggg',
  'gggggggggggggggg',
  'gggggggglggggggg',
  'ggglggggdggggggg',
  'gggdggggdggggggg',
  'gggdggggggggglgg',
  'ggggggdggggggdgg',
  'gggggggggggggdgg',
  'gggggggggggggggg',
  'gggggggggggggggg',
];

export const GRASS_RIG: TileRig = {
  size: 16,
  palette: {
    g: 0x4a7a3a, // base field green
    l: 0x6a9a4a, // blade tip / upper-left highlight
    d: 0x356030, // blade stem / darker tuft
  },
  variants: [GRASS_A, GRASS_B],
};

/** Ground tiles the pixel pipeline can render today; others fall back to the flat checker. */
export const TILE_RIGS: Record<string, TileRig> = {
  grass: GRASS_RIG,
};

/** The flat base char of a tile (its uniform border) — the seam colour. */
export function baseChar(rig: TileRig): string {
  return rig.variants[0][0][0];
}
