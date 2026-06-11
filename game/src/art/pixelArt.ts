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

// ── Mossback — the stegosaurus, second through the pixel pipeline (BACKLOG-169) ─────────────
// 20×20, side view facing left: a small head bump up front (eye in it), a long low-slung body,
// the signature STAGGERED double-row plate ridge, and a thagomizer (bone spikes) off the tail
// tip. Keeps the 'steg' prefix so the cycle-35 colour-keyed bake + e2e contract is unchanged.

const MOSS_STAND: ReadonlyArray<string> = [
  '....................',
  '....p..p..p..p......',
  '...ppp.pp.pp.pp.....',
  '..p.pp.pp.pp.ppp....',
  '..ooppppppppppppo.hh',
  '..obbbbbbbbbbbbboohh',
  '.obbbbbbbbbbbbbbbboh',
  'oebbbbbbbbbbbbbbbbbo',
  'obbbbblllllllllbbbbo',
  'obbblllllllllllllbbo',
  '.obboooooooooooobbo.',
  '..oo..........oo....',
  '...o..........o.....',
  '...o..........o.....',
  '....bb......bb......',
  '....dd......dd......',
  '...odd......ddo.....',
  '...ooo......ooo.....',
  '....................',
  '....................',
];

const MOSS_STEP_L: ReadonlyArray<string> = [
  ...MOSS_STAND.slice(0, 14),
  '...bb........bb.....',
  '...dd........dd.....',
  '..odd........ddo....',
  '..ooo........ooo....',
  '....................',
  '....................',
];

const MOSS_STEP_R: ReadonlyArray<string> = [
  ...MOSS_STAND.slice(0, 14),
  '.....bb....bb.......',
  '.....dd....dd.......',
  '....odd....ddo......',
  '....ooo....ooo......',
  '....................',
  '....................',
];

function mossPalette(base: number): Record<string, number> {
  return {
    o: shade(base, -0.75), // near-black cool outline (never pure black)
    b: base,
    l: shade(base, 0.35), // belly
    d: shade(base, -0.3), // legs
    p: 0xc89048, // plates — contrasting warm ochre (the classic stego read)
    h: 0xe8dcc0, // bone — thagomizer spikes, shared with the cast's horns
    e: 0x1a0e0a, // eye
  };
}

export const MOSS_RIG: PixelRig = {
  prefix: 'steg',
  size: 20,
  frames: [MOSS_STAND, MOSS_STEP_L, MOSS_STEP_R],
  sequence: [0, 1, 0, 2],
  palette: mossPalette,
};

// ── Sunny — the brontosaurus, third through the pixel pipeline (BACKLOG-169) ────────────────
// 20×20, side view facing left: the cast's only long neck — a small head held high at the top
// left, a two-pixel neck sloping down into a deep round body, a raised tail tapering up-right
// to a high tip, and columnar sauropod legs set wide apart. Keeps the 'bro' prefix so the
// cycle-31 colour-keyed bake + e2e contract is unchanged.

const SUNNY_STAND: ReadonlyArray<string> = [
  '..ooo...............',
  '.obbbo..............',
  '.obebbo.............',
  '..obbbo.............',
  '...obbo.............',
  '...obbo.............',
  '....obbo..........oo',
  '....obbbo........obo',
  '....obbbbbo.....obo.',
  '...obbbbbbboo..obbo.',
  '...obbbbbbbbbbobbo..',
  '..obbbbbbbbbbbbbbo..',
  '..obbllllllllllbbo..',
  '...oblllllllllbo....',
  '....ddoooooooodd....',
  '....dd........dd....',
  '....dd........dd....',
  '...ooo.......ooo....',
  '....................',
  '....................',
];

const SUNNY_STEP_L: ReadonlyArray<string> = [
  ...SUNNY_STAND.slice(0, 14),
  '...dd.oooooooo.dd...',
  '...dd..........dd...',
  '..odd..........ddo..',
  '..ooo..........ooo..',
  '....................',
  '....................',
];

const SUNNY_STEP_R: ReadonlyArray<string> = [
  ...SUNNY_STAND.slice(0, 14),
  '.....ddoooooodd.....',
  '.....dd......dd.....',
  '....odd......ddo....',
  '....ooo......ooo....',
  '....................',
  '....................',
];

function sunnyPalette(base: number): Record<string, number> {
  return {
    o: shade(base, -0.75), // near-black warm outline (never pure black)
    b: base,
    l: shade(base, 0.35), // belly
    d: shade(base, -0.3), // legs
    e: 0x1a0e0a, // eye
  };
}

export const SUNNY_RIG: PixelRig = {
  prefix: 'bro',
  size: 20,
  frames: [SUNNY_STAND, SUNNY_STEP_L, SUNNY_STEP_R],
  sequence: [0, 1, 0, 2],
  palette: sunnyPalette,
};

// ── Twitch — the compsognathus, fourth through the pixel pipeline (BACKLOG-169) ──────────────
// 20×20, side view facing left: the cast's ONLY biped, which is the whole silhouette. A small
// alert head with a pointed snout and a forward eye, a short neck into a deep upright chest
// (taller than wide), a dorsal two-tone stripe down the back, a tail tapering off behind, and
// two long centred legs that scissor fore/aft for a quick, jittery sprinter's skitter — unlike
// the quadrupeds' splayed corner pairs. Keeps the 'comp' prefix so the cycle-33 bake + e2e hold.

const COMP_STAND: ReadonlyArray<string> = [
  '....................',
  '..oooo..............',
  '.obbbbo.............',
  'obebbbo.............',
  'obbbbbo.............',
  '..obbo..............',
  '..okbo..............',
  '..okbbo.............',
  '.obkbbbo............',
  '.obkbbbbo...........',
  '.obbbbbbbbbbbbbbo...',
  '.obbllbbbbbbbo......',
  '..obbllbbbo.........',
  '..obbbbbo...........',
  '...dd.dd............',
  '...dd.dd............',
  '...dd.dd............',
  '..odd.ddo...........',
  '....................',
  '....................',
];

const COMP_STEP_L: ReadonlyArray<string> = [
  ...COMP_STAND.slice(0, 14),
  '..dd.....dd.........',
  '..dd.....dd.........',
  '..dd.....dd.........',
  '.odd.....ddo........',
  '....................',
  '....................',
];

const COMP_STEP_R: ReadonlyArray<string> = [
  ...COMP_STAND.slice(0, 14),
  '....dd.dd...........',
  '....dd.dd...........',
  '....dd.dd...........',
  '...odd.ddo..........',
  '....................',
  '....................',
];

function compPalette(base: number): Record<string, number> {
  return {
    o: shade(base, -0.75), // near-black warm outline (never pure black)
    b: base,
    l: shade(base, 0.35), // belly
    d: shade(base, -0.3), // legs
    k: shade(base, -0.5), // dorsal stripe — the watchful two-tone marking
    e: 0x1a0e0a, // eye
  };
}

export const COMP_RIG: PixelRig = {
  prefix: 'comp',
  size: 20,
  frames: [COMP_STAND, COMP_STEP_L, COMP_STEP_R],
  sequence: [0, 1, 0, 2],
  palette: compPalette,
};

/** Species drawn in pixel; these override their legacy vector rigs in bake.ts. */
export const PIXEL_SPECIES: Record<string, PixelRig> = {
  triceratops: REX_RIG,
  stegosaurus: MOSS_RIG,
  brontosaurus: SUNNY_RIG,
  compsognathus: COMP_RIG,
};

/** Distinct non-transparent chars used by a frame — test helper for palette discipline. */
export function charsUsed(frame: ReadonlyArray<string>): Set<string> {
  const out = new Set<string>();
  for (const row of frame) for (const ch of row) if (ch !== '.') out.add(ch);
  return out;
}
