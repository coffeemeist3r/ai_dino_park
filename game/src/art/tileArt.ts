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

// ── Path — a worn dirt trail (BACKLOG-033, the grove's path sub-region from -294). Flat warm-brown
// earth scattered with a few darker divots and lighter pebbles, light from the upper-left. Two variants;
// every border is flat base 'd' so a path strip reads as one continuous trail and tiles in any order.

const PATH_A: ReadonlyArray<string> = [
  'dddddddddddddddd',
  'dddddddddddddddd',
  'dddspddddddddddd',
  'ddddddddddpsdddd',
  'dddddddddddddddd',
  'ddpsdddddddddddd',
  'dddddddddddddddd',
  'ddddddddsddddddd',
  'dddddddddddddddd',
  'dddddddpsddddddd',
  'dddddddddddddddd',
  'dddddsdddddddddd',
  'ddddddddddddpsdd',
  'dddddddddddddddd',
  'dddddddddddddddd',
  'dddddddddddddddd',
];

const PATH_B: ReadonlyArray<string> = [
  'dddddddddddddddd',
  'dddddddddddddddd',
  'ddddddddddpsdddd',
  'dddddddddddddddd',
  'ddspdddddddddddd',
  'dddddddddddddddd',
  'dddddddspddddddd',
  'dddddddddddddddd',
  'dddddsdddddddddd',
  'dddddddddddddddd',
  'ddddddddddpsdddd',
  'dddddddddddddddd',
  'ddpsdddddddddddd',
  'dddddddddddddddd',
  'dddddddddddddddd',
  'dddddddddddddddd',
];

export const PATH_RIG: TileRig = {
  size: 16,
  palette: {
    d: 0x9a7850, // base trodden earth
    s: 0x70502f, // darker divot / packed dirt
    p: 0xb89460, // lighter pebble / upper-left lit grit
  },
  variants: [PATH_A, PATH_B],
};

// ── Water — the grove's NE pond (BACKLOG-033 / -294). Flat mid-blue with a sparse scatter of light and
// dark ripple dashes (two pixels, horizontal — water catches light in lines). Two variants; borders flat
// base 'w' so the pond body tiles seamlessly. The pond↔grass boundary is a hard shoreline edge by design.

const WATER_A: ReadonlyArray<string> = [
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwhhwwwwwwwwwwww',
  'wwwwwwwwwwhhwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwkkwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwhhwwwww',
  'wwwwwwwwwwwwwwww',
  'wwkkwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwhhwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwhhwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
];

const WATER_B: ReadonlyArray<string> = [
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwhhwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwhhwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwkkwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwhhwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwhhwwww',
  'wwwwwwwwwwwwwwww',
  'wwkkwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
];

export const WATER_RIG: TileRig = {
  size: 16,
  palette: {
    w: 0x3f7fa6, // base pond blue
    h: 0x6aa6c4, // light ripple highlight
    k: 0x2e5f80, // dark ripple trough
  },
  variants: [WATER_A, WATER_B],
};

// ── Fern — The Fernreach's scrub ground (BACKLOG-399 layout, drawn cycle 086-art). An olive bracken floor
// scattered with small fern fronds (a light tip 'l' over a two-pixel dark stem 'dd', a denser, leafier
// scatter than grass's single blades) so the third zone reads as fern flats, not lawn. A warmer, more
// olive base than grass's field green, under the zone's FERNREACH_TINT. Two variants; every border is flat
// base 'f' so the scrub tiles seamlessly. First renderable terrain art since the grove's path/water (033).

const FERN_A: ReadonlyArray<string> = [
  'ffffffffffffffff',
  'ffffffffffffffff',
  'fffflfffffffffff',
  'fffddfffffffffff',
  'ffffffffffflffff',
  'ffffffffffddffff',
  'ffffffflffffffff',
  'ffffffddffffffff',
  'ffffffffffffffff',
  'ffflffffffffffff',
  'ffddffffffffffff',
  'fffffffffffflfff',
  'fffffffffffddfff',
  'fffffffflfffffff',
  'fffffffddfffffff',
  'ffffffffffffffff',
];

const FERN_B: ReadonlyArray<string> = [
  'ffffffffffffffff',
  'ffffffffffffffff',
  'fffffffffflfffff',
  'fffffffffddfffff',
  'fffflfffffffffff',
  'fffddfffffffffff',
  'fffffffffffflfff',
  'fffffffffffddfff',
  'ffffffflffffffff',
  'ffffffddffffffff',
  'ffffffffffffffff',
  'ffflffffffffffff',
  'ffddfffffflfffff',
  'fffffffffddfffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
];

export const FERN_RIG: TileRig = {
  size: 16,
  palette: {
    f: 0x567a32, // base olive scrub (warmer/yellower than grass's field green)
    d: 0x37501f, // dark frond stem
    l: 0x7fa84a, // light frond tip / upper-left lit leaf
  },
  variants: [FERN_A, FERN_B],
};

/** Ground tiles the pixel pipeline can render today; others fall back to the flat checker. */
export const TILE_RIGS: Record<string, TileRig> = {
  grass: GRASS_RIG,
  path: PATH_RIG,
  water: WATER_RIG,
  fern: FERN_RIG,
};

/** The flat base char of a tile (its uniform border) — the seam colour. */
export function baseChar(rig: TileRig): string {
  return rig.variants[0][0][0];
}
