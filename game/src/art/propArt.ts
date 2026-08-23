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

// ── Crop stages (BACKLOG-317) — the plantable plot's 🌱🌿🍓 drawn as pixel props ───────────────
// Three single-frame rigs sharing a soil mound (o/m/h) so the plot reads as one place growing, with
// the plant rising stage by stage: a seeded mound → a leafy sprout → a berry-laden crop. The 'empty'
// stage keeps its emoji (no rig) as the graceful fallback.

const SOIL = { o: 0x4a2f17, m: 0x7a4a24, h: 0x9a6b3a }; // dark soil / brown / lit crown — shared base
const LEAF = { g: 0x2f6b2a, l: 0x4f9a3c }; // vein dark-green / leaf green
const BERRY = 0xc83a3a; // ripe berry red
const SEED = 0xd9c08a; // pale seed

// Seed 🌱 — a fresh soil mound with two pale seeds set on the crown.
const CROP_SEED_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......ss.......',
  '................',
  '......ommo......',
  '.....ommmmo.....',
  '....ommmmmmo....',
  '...ommmmmmmmo...',
  '...ohhhhhhhho...',
  '................',
  '................',
];

const CROP_SEED_RIG: PropRig = { size: 16, grid: CROP_SEED_GRID, palette: { ...SOIL, s: SEED } };

// Sprout 🌿 — a thin stem with two small leaves rising from the mound.
const CROP_SPROUT_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '.......g........',
  '.....llglll.....',
  '......lgl.......',
  '.......g........',
  '.......g........',
  '......ommo......',
  '.....ommmmo.....',
  '....ommmmmmo....',
  '...ohhhhhhhho...',
  '................',
  '................',
  '................',
];

const CROP_SPROUT_RIG: PropRig = { size: 16, grid: CROP_SPROUT_GRID, palette: { ...SOIL, ...LEAF } };

// Ripe 🍓 — a full leafy bush dotted with red berries over the mound.
const CROP_RIPE_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '.....lllll......',
  '....llgllll.....',
  '...llrllllrl....',
  '...llllgllll....',
  '...lrlllllrl....',
  '....llgllll.....',
  '.....lllll......',
  '.......g........',
  '......ommo......',
  '.....ommmmo.....',
  '...ohhhhhhhho...',
  '................',
  '................',
  '................',
];

const CROP_RIPE_RIG: PropRig = { size: 16, grid: CROP_RIPE_GRID, palette: { ...SOIL, ...LEAF, r: BERRY } };

// Ripe greens 🥬 (BACKLOG-418, stashed ahead of the wiring) — the grove's crop: a full rounded head of
// leaves over the shared mound, no berries. A pale-leaf highlight (p) rounds the head so it reads as a
// distinct cabbage-y green crop, not the berry bush recoloured. Renders standalone via bakePropArt.
const LEAF_PALE = 0x7fc060; // sun-caught leaf highlight
const CROP_RIPE_GREENS_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '.....lllll......',
  '....lgpppgl.....',
  '...lpllpllpl....',
  '...pllgllglp....',
  '...lplllllpl....',
  '....lgpppgl.....',
  '.....lllll......',
  '.......g........',
  '......ommo......',
  '.....ommmmo.....',
  '...ohhhhhhhho...',
  '................',
  '................',
  '................',
];

const CROP_RIPE_GREENS_RIG: PropRig = {
  size: 16,
  grid: CROP_RIPE_GREENS_GRID,
  palette: { ...SOIL, ...LEAF, p: LEAF_PALE },
};

// Ripe roots 🍠 (BACKLOG-432) — the Fernreach's crop: a plump orange tuber shouldering out of the soil
// mound under a small leaf sprig, so the third zone's ripe plot reads apart from the berry bush and the
// greens head (no berry-red, its bulk is the root, not the leaves). Warm root tones suit the sunlit fern
// flats. Renders standalone via bakePropArt, the twin of the greens rig stashed cycle 95.
const ROOT_BODY = 0xd07a2e; // starchy-root orange
const ROOT_LIT = 0xe8a24e; // sun-caught root highlight
const CROP_RIPE_ROOTS_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '......ggg.......',
  '.....glllg......',
  '......lll.......',
  '.....ttttt......',
  '....tttTttt.....',
  '....ttTTTtt.....',
  '.....ttttt......',
  '.......g........',
  '......ommo......',
  '.....ommmmo.....',
  '...ohhhhhhhho...',
  '................',
  '................',
  '................',
];

const CROP_RIPE_ROOTS_RIG: PropRig = {
  size: 16,
  grid: CROP_RIPE_ROOTS_GRID,
  palette: { ...SOIL, ...LEAF, t: ROOT_BODY, T: ROOT_LIT },
};

// ── Lean-to shelter 🛖 (BACKLOG-315/344) — the dino-built landmark beyond the cairn, drawn as branches.
// A single sloped roof of lashed wood rising from a back post down to a wide front eave, with the open
// shaded interior tapering underneath. Built of branches, so it shares the branch's wood/outline tones.
const SHELTER_GRID: ReadonlyArray<string> = [
  '................',
  '....ooooo.......',
  '...oLLLwwo......',
  '..oLLwwwwwo.....',
  '.oLLwwwwwwwo....',
  '.owwwwwwwwwwo...',
  '.ooooooooooooo..',
  '.pokkkkkkkkkkdo.',
  '.pokkkkkkkkkddo.',
  '.pokkkkkkkkdddo.',
  '.pokkkkkkkddo...',
  '.pokkkkkkddo....',
  '.pokkkkkddo.....',
  '.pokkkkddo......',
  '.pokkkddo.......',
  '.ooooooooooooo..',
];

const SHELTER_RIG: PropRig = {
  size: 16,
  grid: SHELTER_GRID,
  palette: {
    o: 0x3a2410, // dark bark outline (shared with the branch — it's made of branches)
    w: 0x8a5a2b, // wood roof body
    L: 0xb98a4e, // lit roof highlight (the weathered upper slope)
    p: 0x5e3a18, // back support post
    k: 0x2c1d0e, // deep shaded interior
    d: 0x46301a, // interior floor / lit eave underside
  },
};

// ── Frond 🌾 (BACKLOG-419) — the Fernreach's own resource (400), a golden reed tuft. A fan of stalks
// arching up from a common base to drooping seed-tips, in warm golds kept clear of the branch's wood-brown
// and the grass/fern greens so the third zone's gather reads apart. Twin of BRANCH/STONE: a static prop rig.
const FROND_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '...t........t...',
  '...ff......ff...',
  '....ff....ff....',
  '..t..ff..ff..t..',
  '..ff..ffff..ff..',
  '...ff.ffsff.ff..',
  '....fffssfff....',
  '.....ffssff.....',
  '......fssf......',
  '.......ss.......',
  '.......ss.......',
  '......osso......',
  '.......oo.......',
  '................',
];

const FROND_RIG: PropRig = {
  size: 16,
  grid: FROND_GRID,
  palette: {
    o: 0x4a3a12, // dark stem base (warm brown-olive, never pure black)
    s: 0x9a7d2e, // stalk
    f: 0xc2a94e, // frond blade (warm gold)
    t: 0xe0cf72, // pale seed tip
  },
};

// ── Frond thatch 🥻 (BACKLOG-427, stash-ahead) — the Fernreach's own built landmark BACKLOG-417 will
// raise: a woven reed stack, bound at the waist, ragged seed-tips fringing the top and the skirt
// flaring at the ground. Made of fronds, so it shares the frond's warm-gold family (the way the
// lean-to shares the branch's wood) — and its silhouette is a cinched vertical stack, apart from the
// cairn's stone tiers and the lean-to's slope. Authored ahead of 417 under the stash-ahead rule
// (renders standalone via bakePropArt); world wiring lands when 417 ships.
const THATCH_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '......tt.t......',
  '....ttfftft.....',
  '....offffffo....',
  '...offffffffo...',
  '..offsffsfffo...',
  '..offffffffffo..',
  '..obbbbbbbbbbo..',
  '..offffffffffo..',
  '.offsffsffsfffo.',
  '.offffffffffffo.',
  '.offfsffsffsffo.',
  '.oddddddddddddo.',
  '..oooooooooooo..',
  '................',
];

const THATCH_RIG: PropRig = {
  size: 16,
  grid: THATCH_GRID,
  palette: {
    o: 0x4a3a12, // dark outline (the frond family's warm brown-olive, never pure black)
    f: 0xc2a94e, // woven reed body (frond gold)
    s: 0x9a7d2e, // stalk-dark weave flecks (texture, not noise)
    t: 0xe0cf72, // pale seed-tip fringe at the crown
    b: 0x6e5420, // binding cord cinched at the waist
    d: 0x86702a, // shadowed base course where the skirt meets the ground
  },
};

// ── Granary 🏛️ (BACKLOG-454) — the food-cap-lifting landmark a built-up zone raises. Its own silhouette,
// apart from the cairn's stone tiers, the lean-to's slope, and the thatch's cinched stack: a broad domed
// storehouse — a plaster-stone body under a warm timber roof-dome, with a dark timber door — reading as a
// place a zone *stores a bigger surplus*. Neutral plaster/timber (not the frond gold, not the branch wood),
// so it doesn't read as any one zone's bias landmark: every zone earns the same granary.
const GRANARY_GRID: ReadonlyArray<string> = [
  '................',
  '......oooo......',
  '.....orrrro.....',
  '....orrrrrro....',
  '...orrrrrrrro...',
  '..orrrrrrrrrro..',
  '..ohhbbbbbbhho..',
  '..obbbbbbbbbbo..',
  '..obbbbhbbbbbo..',
  '..obbbbbbbbbbo..',
  '..obbbddddbbbo..',
  '..obbbdssdbbbo..',
  '..obbbdssdbbbo..',
  '..obbbdssdbbbo..',
  '..obbbdssdbbbo..',
  '..oobbbbbbbboo..',
];

const GRANARY_RIG: PropRig = {
  size: 16,
  grid: GRANARY_GRID,
  palette: {
    o: 0x3a2e20, // dark warm outline (never pure black)
    r: 0xb06a3a, // timber roof-dome (warm russet)
    h: 0xe8dcc0, // lit plaster highlight (eave + body fleck)
    b: 0xcdb890, // plaster-stone body (neutral — not a zone's bias colour)
    d: 0x6e4a28, // door timber frame
    s: 0x2c2018, // door interior shadow
  },
};

/**
 * Props the pixel pipeline can render; keys match ResourceKind ('branch'|'stone'|'frond') + 'cairn', plus the
 * plot's crop stages keyed `crop_<CropStage>` (BACKLOG-317) so `bakePropArt('crop_ripe')` resolves.
 */
/* ---------------------------------------------------------------------------------------------------
 * The food the hatch drops (BACKLOG-490) and the egg by the den (BACKLOG-491).
 *
 * Two rigs of the same kind and, between them, the last font glyphs of any consequence in this park. The
 * cairn, the granary, the thatch, the shelter and all three ripe crops have baked pixels; the object five
 * dinos sprint at, fight over, cede, gobble and remember for the rest of the save did not — and neither did
 * the one object in the bowl that turns into a character.
 *
 * `food_<id>` is keyed off the `FOODS` id so `dropFood` can look a rig up per piece and keep the emoji for
 * any id not yet drawn — the same graceful per-item fallback `drawPlotSprite` uses for a rig-less crop.
 * Fish and berries first, per the item's own text: the two the cast reacts to most.
 * ------------------------------------------------------------------------------------------------- */

// ── Silver fish 🐟 — side-on, nose left, one dark eye and a split tail; the curiosity favourite ────────
const FISH_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '..........oo....',
  '....ooooooshso..',
  '..oobbbbbossho..',
  '.obhhhhbbbossoo.',
  'oebhhhhhhbbsso..',
  '.obbhhhhbbbso...',
  '..oobbbbboso....',
  '....oooooooo....',
  '................',
  '................',
  '................',
  '................',
];

const FISH_RIG: PropRig = {
  size: 16,
  grid: FISH_GRID,
  palette: {
    o: 0x1c2f45, // dark outline (never pure black)
    b: 0x4a6f96, // flank shadow
    h: 0x9fc4e0, // silver highlight
    s: 0x35547a, // fin + tail
    e: 0x14202e, // eye
  },
};

// ── Sweet berries 🍓 — a cluster of three, two low and one perched, with a small green sprig ──────────
const BERRIES_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '.......gg.......',
  '....oogggoo.....',
  '...orrrgrrro....',
  '...orRrrrrro....',
  '..oorrrrrroo....',
  '.orrrooorrrro...',
  'orRrrorrorrrro..',
  'orrrrorrrorrro..',
  '.orrroorroorro..',
  '..ooo..oo..oo...',
  '................',
  '................',
  '................',
  '................',
];

const BERRIES_RIG: PropRig = {
  size: 16,
  grid: BERRIES_GRID,
  palette: {
    o: 0x4a1220, // dark outline
    r: 0xc22f43, // berry body
    R: 0xf07a86, // specular highlight (one pixel per berry, GBA-style)
    g: 0x3f7a35, // sprig
  },
};

// ── Hunk of meat 🍖 — a joint with the bone knuckle out one end; the bold dino's favourite ────────────
//
// The first draft was a red oval with a pale stripe laid across it, and at sixteen pixels that is a chilli.
// What says *meat* is the **knuckle**: a bone with two lobes at its head, sticking out of the mass at an
// angle nothing grows at. The marbling does the rest of the work — a solid red field reads as fruit, and
// this park already has a red fruit sixty pixels away in the same hatch.
const MEAT_GRID: ReadonlyArray<string> = [
  '................',
  '...bb...........',
  '..bBBb..........',
  '..bBBb..........',
  '...bBb..........',
  '...oBbo.........',
  '..orrmrro.......',
  '.orrrrrmrro.....',
  '.orrmrrrrrro....',
  '.ormrrrrrrrro...',
  '.orrrrrmrrrro...',
  '..orrrrrrrrro...',
  '...orrrrrrro....',
  '....ooooooo.....',
  '................',
  '................',
];

const MEAT_RIG: PropRig = {
  size: 16,
  grid: MEAT_GRID,
  palette: {
    o: 0x4a1a14, // dark outline (never pure black)
    r: 0xa8342c, // muscle
    m: 0xd9756a, // fat marbling — the thing that stops it reading as a berry
    b: 0x6b5a3a, // bone outline
    B: 0xe8dfc0, // bone
  },
};

// ── Leafy greens 🌿 — three broad leaves, tied. The warm dino's favourite ─────────────────────────────
//
// A bundle rather than a plant, and the **twine** is the whole distinction: this park already draws a
// fern (419) and a ripe greens crop (418), both of them things growing out of the ground. What the hatch
// drops is cut and bound, and one band of cord at the stem says so at any size.
const GREENS_GRID: ReadonlyArray<string> = [
  '................',
  '.....oo.oo......',
  '....oGGoGGo.....',
  '...oGGGoGGGo....',
  '..oGgGGoGGgGo...',
  '..oGgGGoGGgGo...',
  '.oGGgGGoGGgGGo..',
  '.oGGgGGoGGgGGo..',
  '..oGGgGoGgGGo...',
  '...oGGGoGGGo....',
  '....oGGGGGo.....',
  '....otttto......',
  '.....osso.......',
  '.....osso.......',
  '......oo........',
  '................',
];

const GREENS_RIG: PropRig = {
  size: 16,
  grid: GREENS_GRID,
  palette: {
    o: 0x1e3a1c, // dark outline
    G: 0x4f8c3a, // leaf body
    g: 0x84c05a, // lit vein
    t: 0xb08a4a, // the twine tie — cut and bound, not growing
    s: 0x3d6b2c, // cut stem
  },
};

// ── The egg by the den 🥚 — speckled shell, a warm ground-shadow so it reads as *set down* ────────────
const EGG_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '......oooo......',
  '.....oLLwwoo....',
  '....oLLwwwppo...',
  '...oLwwwppwwo...',
  '...oLwwwwwwpo...',
  '...owwppwwwwo...',
  '...owwwwwwppo...',
  '...oppwwwwwwo...',
  '...owwwwppwwo...',
  '....owwwwwwo....',
  '.....oooooo.....',
  '.....ssssss.....',
  '................',
  '................',
];

const EGG_RIG: PropRig = {
  size: 16,
  grid: EGG_GRID,
  palette: {
    o: 0x6b5334, // dark shell outline
    w: 0xf2e4c6, // shell
    L: 0xfff8ea, // top-left highlight
    p: 0xcbb188, // speckles
    s: 0x8a7a5c, // the ground-shadow it is set down on
  },
};

// ── Ruins (BACKLOG-494) — the derelict twin of a landmark rig ─────────────────────────────────
// 480 drew disrepair by turning a landmark's own sprite down to DERELICT_ALPHA, which was the honest
// placeholder while nothing was drawn and reads as *fog* rather than *ruin* — a cairn at 45% looks like a
// cairn in mist, not a cairn that fell over. With 488 shipping a founding ruin in the Grove, this is the
// first structure a new player ever walks up to, so it gets a silhouette of its own.
//
// The rule both rigs follow: **a ruin is not the same shape, shorter.** A cairn missing its top course
// just reads as a smaller cairn. What says "this fell" is the loose material lying on the ground *beside*
// the thing, at the ground line, where nobody stacked it. Palettes are the intact rigs' own — a ruin is
// the same stone and the same wood, not a greyer version of them.

// Toppled cairn 🗿 — a squat surviving stub with two stones fallen off, one to each side, lying flat.
const CAIRN_RUIN_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....oooooooo....',
  '....ohhssddo....',
  'ooo.ohsssddo.ooo',
  'oso.oooooooo.oso',
  '................',
];

const CAIRN_RUIN_RIG: PropRig = {
  size: 16,
  grid: CAIRN_RUIN_GRID,
  palette: {
    o: 0x2e2e33, // the cairn's own outline
    s: 0x7d7d86, // stone body
    h: 0xa9a9b2, // lit face
    d: 0x55555c, // shadowed face
  },
};

// Caved lean-to 🛖 — the back post snapped off short, the roof slumped to the ground, and a dark gap
// through the middle where it came in. Built of the same branches, so it keeps the branch tones.
const SHELTER_RUIN_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..p.............',
  '..p.............',
  '..p......ooo....',
  '..po....oLLwo...',
  '..po...owwwwwo..',
  '.oooo.owwwwwwwo.',
  'owwwwoowwkkwwwwo',
  'owwwwwwwkkwwwwwo',
  'oooooooooooooooo',
];

const SHELTER_RUIN_RIG: PropRig = {
  size: 16,
  grid: SHELTER_RUIN_GRID,
  palette: {
    o: 0x3a2410, // the branch/lean-to outline
    w: 0x8a5a2b, // wood body
    L: 0xb98a4e, // what is left of the lit upper slope
    p: 0x5e3a18, // the snapped back post
    k: 0x2c1d0e, // the gap it caved through
  },
};

/* ---------------------------------------------------------------------------------------------------
 * The ritual's little path (BACKLOG-496).
 *
 * The tic (405) is the most per-dino behaviour in this park and for fifty cycles it left the ground exactly
 * as it found it: a dino paces the same two tiles a hundred times, turns the same slow circle, and the grass
 * is untouched. Cycle 138 gave the ritual a **haunt** that drifts a tile per stretch (421), which is what
 * turns a mark on the ground from a smudge into a path — so the mark is worth drawing now and was not before.
 *
 * Keyed `tic_<TicKind>` so a caller can look one up per kind and draw nothing for a kind with no rig, the
 * per-item fallback 490 and 494 both ship. Stashed ahead of the `WorldScene` wiring under the cycle-91 rule:
 * both render standalone against a grass swatch, no host terrain.
 *
 * **These are ground marks, so they carry no near-black outline.** Every other prop here stands *on* the
 * grass and needs one to cut its silhouette out; these are worn *into* it, and a hard dark edge reads as a
 * hole in the world rather than a bald patch. The edge is `s` — trodden grass a shade darker and browner
 * than `GRASS_RIG`'s field green — which is what a real worn patch fades through.
 * ------------------------------------------------------------------------------------------------- */

// ── pace 🐾 — the two-tile scuff. First draft was one long oval, which at 16px is a shadow; what says
// *pacing* is that the ground is worn bare at the two **ends** and only trodden thin between them, because
// that is where the animal turns around. Wider than it is tall, and the two bare patches are disjoint.
const TIC_PACE_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..ssss....ssss..',
  '.seeees..seeees.',
  '.sedeetttteedes.',
  '.seeees..seeees.',
  '..ssss....ssss..',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const TIC_PACE_RIG: PropRig = {
  size: 16,
  grid: TIC_PACE_GRID,
  palette: {
    s: 0x3d6631, // trodden grass — the soft edge a worn patch fades through (darker than GRASS_RIG's g)
    e: 0x6b5738, // bare earth, where the turning happens
    d: 0x4e3f28, // a divot scuffed deeper
    t: 0x5d6c33, // the thin track between the two ends — trodden, never quite bare
  },
};

// ── circle 🔁 — the trodden ring. First draft was a worn disc, which is just a bigger scuff; the whole
// distinction is the **hole**: an animal turning on the spot wears the circumference and leaves the middle
// standing. Roughly as wide as it is tall, and the centre is untouched grass.
const TIC_CIRCLE_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '.....ssssss.....',
  '....seeeeees....',
  '...seeeeeeees...',
  '..sedesssseees..',
  '..sees....sees..',
  '..sees....sees..',
  '..sees....sees..',
  '..sees....sees..',
  '..seeessssedes..',
  '...seeeeeeees...',
  '....seeeeees....',
  '.....ssssss.....',
  '................',
  '................',
];

const TIC_CIRCLE_RIG: PropRig = {
  size: 16,
  grid: TIC_CIRCLE_GRID,
  palette: {
    s: 0x3d6631, // the same trodden edge the scuff uses — one worn-ground language, not two
    e: 0x6b5738,
    d: 0x4e3f28,
  },
};

export const PROP_RIGS: Record<string, PropRig> = {
  branch: BRANCH_RIG,
  stone: STONE_RIG,
  frond: FROND_RIG, // BACKLOG-419: the Fernreach's frond (400), no longer a bare emoji glyph
  cairn: CAIRN_RIG,
  crop_seed: CROP_SEED_RIG,
  crop_sprout: CROP_SPROUT_RIG,
  crop_ripe: CROP_RIPE_RIG,
  crop_ripe_greens: CROP_RIPE_GREENS_RIG, // BACKLOG-418: the grove's greens crop, stashed ahead of drawPlotSprite wiring
  crop_ripe_roots: CROP_RIPE_ROOTS_RIG, // BACKLOG-432: the Fernreach's roots crop, so all three ripe crops bake a rig
  shelter: SHELTER_RIG, // BACKLOG-344: the dino-built lean-to (315)
  thatch: THATCH_RIG, // BACKLOG-427: the frond thatch, stashed ahead of 417 (which wires it into the world)
  granary: GRANARY_RIG, // BACKLOG-454: the food-cap-lifting granary — a domed plaster storehouse
  food_fish: FISH_RIG, // BACKLOG-490: keyed `food_<id>` so `dropFood` looks one up per piece
  food_berries: BERRIES_RIG, // BACKLOG-490
  food_meat: MEAT_RIG, // BACKLOG-490 (cycle 137) — the two the hatch drops most
  food_greens: GREENS_RIG, // BACKLOG-490 (cycle 137)
  egg: EGG_RIG, // BACKLOG-491: the one prop in this park that turns into a character
  // BACKLOG-494: ruin variants, keyed `<name>_derelict` so `ruinKey` can look one up by convention.
  cairn_derelict: CAIRN_RUIN_RIG,
  shelter_derelict: SHELTER_RUIN_RIG,
  // BACKLOG-496: the ritual's worn ground, keyed `tic_<TicKind>`. `fuss` is deliberately still undrawn —
  // the per-kind fallback draws nothing for it, which is the control that keeps the graceful path live.
  tic_pace: TIC_PACE_RIG,
  tic_circle: TIC_CIRCLE_RIG,
};

/** Distinct non-transparent chars in a grid — test helper for palette discipline. */
export function propCharsUsed(grid: ReadonlyArray<string>): Set<string> {
  const out = new Set<string>();
  for (const row of grid) for (const ch of row) if (ch !== '.') out.add(ch);
  return out;
}
