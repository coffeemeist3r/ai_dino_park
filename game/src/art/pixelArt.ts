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
  /** BACKLOG-522: the sleeping pose, two frames of breathing. Optional — a species without one keeps
   *  its standing frame while it rests, which is the graceful fallback and the control for this path. */
  down?: ReadonlyArray<ReadonlyArray<string>>;
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


// ── BACKLOG-522: the down poses ──────────────────────────────────────
// A resting dino used to be its walk cycle stopped mid-stride, which reads as a standing animal that
// has forgotten to move rather than a sleeping one. A `down` pair per rig fixes that, and the brief is
// silhouette: the frill, the plates, the crest must each still be the thing you recognise the animal
// by with the legs folded under it. TWO frames, not three — a sleeping animal is a shape that
// breathes, and a three-beat amble played slowly is the exact thing this pose exists to stop.
//
// The host shipped first, which is the only reason these could be drawn at all under the cycle-145
// amendment: BACKLOG-109's `isResting` puts a dino down out in the open at 08:00 on a fresh save, so
// the pose has somewhere to be on frame one. Three species stay undrawn on purpose — they keep their
// standing frame while resting, which is this path's graceful fallback and its control.

/** Rex asleep: body settled, legs folded under the belly, brow horns and frill still reading,
 *  eye a shut two-pixel slit where the open eye was. */
const REX_DOWN_A: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '...hh...oooo........',
  '...hh..offffo.......',
  '..oooooffffffo......',
  '.obbbboffffffo......',
  'hobeebffffffffo.....',
  '.obbbbffffffffo.....',
  '.obbbbfffffffobbo...',
  '..obbofffffffbbbbo..',
  '...obbooooooobbbbbbo',
  '...obbbbbbbbbbbbbo..',
  '...obllllllllllbbo..',
  '....ollllllllllbo...',
  '....odd......ddo....',
  '.....oooooooooo.....',
  '....................',
  '....................',
];

/** ...and the same shape one breath in — the belly band lifts a row and the flank fills back. */
const REX_DOWN_B: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '...hh...oooo........',
  '...hh..offffo.......',
  '..oooooffffffo......',
  '.obbbboffffffo......',
  'hobeebffffffffo.....',
  '.obbbbffffffffo.....',
  '.obbbbfffffffobbo...',
  '..obbofffffffbbbbo..',
  '...obbooooooobbbbbbo',
  '...obbbbbbbbbbbbbo..',
  '...obbllllllllbbbo..',
  '....obllllllllbbo...',
  '....odd......ddo....',
  '.....oooooooooo.....',
  '....................',
  '....................',
];

/** Mossback asleep: the staggered plate ridge IS the silhouette, so it stays upright and untouched
 *  while everything under it settles. A stegosaurus with its plates down is a different animal. */
const MOSS_DOWN_A: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....p..p..p..p......',
  '...ppp.pp.pp.pp.....',
  '..p.pp.pp.pp.ppp....',
  '..ooppppppppppppo.hh',
  '..obbbbbbbbbbbbboohh',
  '.obbbbbbbbbbbbbbbboh',
  'oeebbbbbbbbbbbbbbbbo',
  'obbbbblllllllllbbbbo',
  'obbblllllllllllllbbo',
  '.obboooooooooooobbo.',
  '..odd........ddo....',
  '...ooooooooooooo....',
  '....................',
  '....................',
];

/** ...and one breath in. */
const MOSS_DOWN_B: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....p..p..p..p......',
  '...ppp.pp.pp.pp.....',
  '..p.pp.pp.pp.ppp....',
  '..ooppppppppppppo.hh',
  '..obbbbbbbbbbbbboohh',
  '.obbbbbbbbbbbbbbbboh',
  'oeebbbbbbbbbbbbbbbbo',
  'obbbbbllllllllbbbbbo',
  'obbbbllllllllllllbbo',
  '.obboooooooooooobbo.',
  '..odd........ddo....',
  '...ooooooooooooo....',
  '....................',
  '....................',
];

/** Rex's sleeping pair (BACKLOG-522). */
const REX_DOWN: ReadonlyArray<ReadonlyArray<string>> = [REX_DOWN_A, REX_DOWN_B];

/** Mossback's sleeping pair (BACKLOG-522). */
const MOSS_DOWN: ReadonlyArray<ReadonlyArray<string>> = [MOSS_DOWN_A, MOSS_DOWN_B];

export const REX_RIG: PixelRig = {
  prefix: 'tri',
  size: 20,
  frames: [REX_STAND, REX_STEP_L, REX_STEP_R],
  sequence: [0, 1, 0, 2],
  palette: rexPalette,
  down: REX_DOWN, // BACKLOG-522
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
  down: MOSS_DOWN, // BACKLOG-522
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

/** Sunny asleep (BACKLOG-525). A sauropod IS its neck, so the neck is the one thing that must survive
 *  the pose — it folds down and forward along the flank rather than vanishing, and the head comes to rest
 *  at the shoulder. Everything drops four rows and the legs tuck to stubs; the ground line does not move. */
const SUNNY_DOWN_A: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '...ooo..............',
  '..obbbo.............',
  '..obebbo............',
  '...obbbo..........oo',
  '....obbo.........obo',
  '....obbo........obo.',
  '...obbbbo......obbo.',
  '..obbbbbbbboo.obbo..',
  '.obbbbbbbbbbbbbbbo..',
  '.obbbbbbbbbbbbbbbo..',
  '.obbllllllllllbbbo..',
  '..obllllllllllbbo...',
  '..odd..........ddo..',
  '...ooo.......ooo....',
  '....................',
  '....................',
];

/** ...one breath in: the belly band swells a row up into the flank. */
const SUNNY_DOWN_B: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '...ooo..............',
  '..obbbo.............',
  '..obebbo............',
  '...obbbo..........oo',
  '....obbo.........obo',
  '....obbo........obo.',
  '...obbbbo......obbo.',
  '..obbbbbbbboo.obbo..',
  '.obbbbbbbbbbbbbbbo..',
  '.obbbllllllllbbbbo..',
  '.obbllllllllllbbbo..',
  '..obbllllllllbbbo...',
  '..odd..........ddo..',
  '...ooo.......ooo....',
  '....................',
  '....................',
];

const SUNNY_DOWN: ReadonlyArray<ReadonlyArray<string>> = [SUNNY_DOWN_A, SUNNY_DOWN_B];

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
  down: SUNNY_DOWN, // BACKLOG-525
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

/** Twitch asleep (BACKLOG-525). The cast's only biped, and the only one that curls: the tail comes round
 *  and the head tucks down toward it, so the standing sprite's tall upright chest reads as a coiled ring.
 *  The two-tone dorsal stripe follows the curl — it is this species' marking and it is what keeps a curled
 *  compsognathus from reading as a stone. **The first draft was rejected on a number:** it came out 18%
 *  heavier than the standing frame, and a small biped that gets *bigger* when it lies down is wrong even
 *  though the mass floor is a floor. Redrawn tighter, to 1.02. */
const COMP_DOWN_A: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '.....oooo...........',
  '....obbbbo..........',
  '...obebbbbo.........',
  '...obbkkbbo.........',
  '....obbkkbbo........',
  '.....obbkkbbo.......',
  '.....obbbkkbbbo.....',
  '....obbbbbkkbbbbo...',
  '...obbllllbbbbbbbo..',
  '...obbllllbbbbbbo...',
  '....obblllbbbbo.....',
  '....odd....ddo......',
  '....ooo....ooo......',
  '....................',
  '....................',
];

/** ...one breath in: the belly band rolls forward a column along the curl. */
const COMP_DOWN_B: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '.....oooo...........',
  '....obbbbo..........',
  '...obebbbbo.........',
  '...obbkkbbo.........',
  '....obbkkbbo........',
  '.....obbkkbbo.......',
  '.....obbbkkbbbo.....',
  '....obbbbbkkbbbbo...',
  '...obbbllllbbbbbbo..',
  '...obbllllbbbbbbo...',
  '....obbllllbbbo.....',
  '....odd....ddo......',
  '....ooo....ooo......',
  '....................',
  '....................',
];

const COMP_DOWN: ReadonlyArray<ReadonlyArray<string>> = [COMP_DOWN_A, COMP_DOWN_B];

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
  down: COMP_DOWN, // BACKLOG-525
  palette: compPalette,
};

// ── Glade — the parasaurolophus, fifth and last through the pixel pipeline (BACKLOG-169) ─────
// 20×20, side view facing left: the whole silhouette is the TUBE CREST — a bone-toned sweep
// rising up and back off the skull for three rows (a stub reads as a horn; the length is the
// species). Below it a wide duckbill snout, a short neck into a deep hadrosaur body, the tail
// rising to a high tip at the opposite corner, and the tail merged into the body's widest row
// (an outline column at that join was exactly Sunny's rejected "floating hump"). Keeps the
// 'para' prefix so the cycle-32 colour-keyed bake + e2e contract is unchanged.

const GLADE_STAND: ReadonlyArray<string> = [
  '....................',
  '.........hh.........',
  '.......hhhh.........',
  '..oooo.hhh..........',
  '.obbbbohh...........',
  'obebbbbo............',
  'obbbbbbo............',
  '.obbbbo.............',
  '..obbo..............',
  '..obbbo.........oo..',
  '..obbbbo.......obo..',
  '..obbbbbbo....obbo..',
  '.obbbbbbbbbbbbbbbo..',
  '.obblllllllllbbbo...',
  '...ddoooooooodd.....',
  '...dd........dd.....',
  '...dd........dd.....',
  '..ooo.......ooo.....',
  '....................',
  '....................',
];

const GLADE_STEP_L: ReadonlyArray<string> = [
  ...GLADE_STAND.slice(0, 14),
  '..dd.oooooooo.dd....',
  '..dd..........dd....',
  '.odd..........ddo...',
  '.ooo..........ooo...',
  '....................',
  '....................',
];

const GLADE_STEP_R: ReadonlyArray<string> = [
  ...GLADE_STAND.slice(0, 14),
  '....ddoooooodd......',
  '....dd......dd......',
  '...odd......ddo.....',
  '...ooo......ooo.....',
  '....................',
  '....................',
];

/** Glade asleep (BACKLOG-525). The tube crest is the whole silhouette — a hadrosaur with its crest down is
 *  a different animal — so the crest holds its full sweep and angle while the body settles beneath it, the
 *  same rule Mossback's plate ridge established. The duckbill lowers to the ground; the tail stays high. */
const GLADE_DOWN_A: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '..........hh........',
  '........hhhh........',
  '...oooo.hhh.........',
  '..obbbbohh..........',
  '.obebbbbo...........',
  '.obbbbbbo...........',
  '..obbbbo........oo..',
  '..obbbbo.......obo..',
  '..obbbbbo.....obbo..',
  '.obbbbbbbbo..obbo...',
  '.obbbbbbbbbbbbbbbo..',
  '..obbbbbbbbbbbbbo...',
  '..obllllllllbbbbo...',
  '..odd.........ddo...',
  '..ooo.......ooo.....',
  '....................',
  '....................',
];

/** ...one breath in: the belly band lifts a row into the flank. */
const GLADE_DOWN_B: ReadonlyArray<string> = [
  '....................',
  '....................',
  '....................',
  '..........hh........',
  '........hhhh........',
  '...oooo.hhh.........',
  '..obbbbohh..........',
  '.obebbbbo...........',
  '.obbbbbbo...........',
  '..obbbbo........oo..',
  '..obbbbo.......obo..',
  '..obbbbbo.....obbo..',
  '.obbbbbbbbo..obbo...',
  '.obbbbbbbbbbbbbbbo..',
  '..obbllllllllbbbbo..',
  '..obllllllllbbbbo...',
  '..odd.........ddo...',
  '..ooo.......ooo.....',
  '....................',
  '....................',
];

const GLADE_DOWN: ReadonlyArray<ReadonlyArray<string>> = [GLADE_DOWN_A, GLADE_DOWN_B];

function gladePalette(base: number): Record<string, number> {
  return {
    o: shade(base, -0.75), // near-black warm outline (never pure black)
    b: base,
    l: shade(base, 0.35), // belly
    d: shade(base, -0.3), // legs
    h: 0xe8dcc0, // bone — the tube crest, shared with the cast's horns and spikes
    e: 0x1a0e0a, // eye
  };
}

export const GLADE_RIG: PixelRig = {
  prefix: 'para',
  size: 20,
  frames: [GLADE_STAND, GLADE_STEP_L, GLADE_STEP_R],
  sequence: [0, 1, 0, 2],
  down: GLADE_DOWN, // BACKLOG-525
  palette: gladePalette,
};

/** Species drawn in pixel; these override their legacy vector rigs in bake.ts. */
export const PIXEL_SPECIES: Record<string, PixelRig> = {
  triceratops: REX_RIG,
  stegosaurus: MOSS_RIG,
  brontosaurus: SUNNY_RIG,
  compsognathus: COMP_RIG,
  parasaurolophus: GLADE_RIG,
};

/** Distinct non-transparent chars used by a frame — test helper for palette discipline. */
export function charsUsed(frame: ReadonlyArray<string>): Set<string> {
  const out = new Set<string>();
  for (const row of frame) for (const ch of row) if (ch !== '.') out.add(ch);
  return out;
}
