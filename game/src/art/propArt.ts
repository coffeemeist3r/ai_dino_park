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

// ── Starchy roots 🥕 — two scrubbed tubers, cut and bound for the hatch ───────────────────────────────
//
// The trap here was that this park already draws a root: `crop_ripe_roots` (432), a tuber shouldering out
// of a soil mound under a leaf sprig. The first draft of this was that picture again, smaller, which is the
// same mistake the ruins fire made in cycle 139 and the same correction: **what the hatch drops is cut.**
// So there is no soil and no sprig — two tubers, each with the pale scar of a **cropped crown** where the
// leaves were taken off, and a whisker of taproot trailing from each tail. Two of them, not one, so the
// silhouette is a pair of tapers crossing rather than a single lump that could be anything.
const FOOD_ROOTS_GRID: ReadonlyArray<string> = [
  '................',
  '....oo....oo....',
  '...occo..occo...',
  '...oTto..oTto...',
  '..otTtto.otto...',
  '..ottTto.oTtto..',
  '..otttto.ottto..',
  '..otttto.ottto..',
  '..ottto..ottto..',
  '...ootto..otto..',
  '....otto..otto..',
  '....otto..oto...',
  '.....oto..ow....',
  '.....ow....w....',
  '......w.........',
  '................',
];

const FOOD_ROOTS_RIG: PropRig = {
  size: 16,
  grid: FOOD_ROOTS_GRID,
  palette: {
    o: 0x4a2c14, // dark outline (never pure black)
    t: 0xc9762b, // scrubbed root body
    T: 0xe8a552, // sun-caught face
    c: 0xe3d6a8, // the cropped crown — the pale scar that says this was cut, not pulled up whole
    w: 0xa8895a, // trailing taproot whisker
  },
};

// ── Pale mushrooms 🍄 — a cluster of three, gills out ─────────────────────────────────────────────────
//
// The first draft was one big spotted toadstool, and it was wrong twice: a single cap at sixteen pixels is
// a lollipop, and a *red* one is a berry with a stick in it — this hatch already drops berries. The read
// is the **cluster** and the **gills**. Three caps at different heights give a lumpy, organic outline that
// nothing else in `PROP_RIGS` has, and a dark band under each cap says the underside is open, which is the
// one thing a mushroom has that no fruit does. Cool and pale on purpose: everything else the hatch drops is
// warm, so this is the odd one in the pile at a glance.
const FOOD_MUSHROOMS_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '.....oooo.......',
  '....oCCCCo......',
  '...oCDCCDCo.....',
  '...oCCCCCCo.....',
  '...ogggggo......',
  '....osso........',
  '..oooosso.oooo..',
  '.oCDCCoss.oCCDo.',
  '.oCCCCoss.oCDCo.',
  '.ogggo.ss.ogggo.',
  '..oss......oss..',
  '..oss......oss..',
  '...o........o...',
  '................',
];

const FOOD_MUSHROOMS_RIG: PropRig = {
  size: 16,
  grid: FOOD_MUSHROOMS_GRID,
  palette: {
    o: 0x2e2438, // dark outline (never pure black)
    C: 0xd8cfc0, // pale cap
    D: 0xa89a8c, // cap freckle
    g: 0x6b5f70, // the gills — the underside nothing else in the hatch has
    s: 0xe6e0d4, // stalk
  },
};

// ── Hard pine seeds 🌰 — a heap of six ────────────────────────────────────────────────────────────────
//
// A heap, not an object. Every other food the hatch drops is one thing with one silhouette; this is the
// only one that is *many*, and leaning into that is what stops it reading as a small brown berry. Six
// facetted nuts stacked three-two-one wide, each with a single lit facet — and two of them **cracked**,
// because the label is "hard pine seeds" and a crack is the cheapest way to say a thing has a shell.
const FOOD_SEEDS_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '....oo....oo....',
  '...oNno..onNo...',
  '...onno..onno...',
  '....oo....oo....',
  '.......oo.......',
  '......oNno......',
  '......onno......',
  '.oo....oo....oo.',
  'oNno..onko..oNno',
  'onno..okno..onno',
  '.oo....oo....oo.',
  '................',
  '................',
];

const FOOD_SEEDS_RIG: PropRig = {
  size: 16,
  grid: FOOD_SEEDS_GRID,
  palette: {
    o: 0x3a2a18, // dark outline (never pure black)
    n: 0x8a6236, // shell
    N: 0xc49456, // lit facet
    k: 0x5d4223, // the split in a cracked shell
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

// Unravelled thatch 🥻 — the binding cord snapped, and a reed stack with nothing holding its waist does
// not shrink, it *bursts*. A short stub still stands where the cord was tied lowest; the rest of the bundle
// has slumped sideways and loose reeds lie flat on the ground out past both edges, where nobody wove them.
// Same fronds, same gold — the ruin rule: a ruin is the same material, not a greyer version of it.
const THATCH_RUIN_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....tt..........',
  '...offo.........',
  '...offo...ttt...',
  '...offo..offfo..',
  '...obbo.offsffo.',
  '...offo.offffffo',
  '..offfo.offsfffo',
  '.odffdo.oodfffdo',
  'ffo..oddddo..off',
  'oo...oooooo...oo',
];

const THATCH_RUIN_RIG: PropRig = {
  size: 16,
  grid: THATCH_RUIN_GRID,
  palette: {
    o: 0x4a3a12, // the frond family's warm brown-olive outline
    f: 0xc2a94e, // woven reed body (frond gold)
    s: 0x9a7d2e, // stalk-dark weave flecks
    t: 0xe0cf72, // pale seed-tips, now fraying off the broken crown
    b: 0x6e5420, // what is left of the binding cord, still cinched round the stub
    d: 0x86702a, // shadowed course where the slumped bundle meets the ground
  },
};

// Cracked granary 🏛️ — the dome caved, so the storehouse is open to the sky down a dark seam through the
// middle, with two stubs of roof timber left standing either side of the gap and plaster chunks fallen out
// to both edges. The seam runs the whole body rather than stopping at the door: what makes a granary a ruin
// is that the thing it existed to keep dry is not dry any more.
const GRANARY_RUIN_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '...oo......oo...',
  '..orro....orro..',
  '..orrro..orrrro.',
  '..ohhbbssbbhho..',
  '..obbbbssbbbbo..',
  '..obbbbssbbbbo..',
  '..obbbdssdbbbo..',
  '..obbbdssdbbbo..',
  '.oobbbdssdbbboo.',
  '.obbbbdssdbbbbo.',
  '.obbbdssdbbbbbo.',
  'oboobbbbbbbbboob',
  'oo..oooooooo..oo',
];

const GRANARY_RUIN_RIG: PropRig = {
  size: 16,
  grid: GRANARY_RUIN_GRID,
  palette: {
    o: 0x3a2e20, // the granary's own warm outline
    r: 0xb06a3a, // the two roof-timber stubs left either side of the gap
    h: 0xe8dcc0, // lit plaster, now only along the broken eave
    b: 0xcdb890, // plaster-stone body
    d: 0x6e4a28, // door timber, and the frame the seam tore through
    s: 0x2c2018, // the seam itself — the same shadow the doorway always was
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

/**
 * The ground's bank, at three fullness steps (BACKLOG-506, for BACKLOG-504).
 *
 * A dino-made heap of what dinos carried, so it must read as **piled** rather than **built** — which is the
 * whole job here, because this park already has a stacked-stone prop and it is sixteen pixels away. The
 * cairn (296) is tidy: level courses, a clean taper, every stone squared to the one under it. So the bank
 * gets the opposite of all three — lumps at staggered heights whose outlines deliberately never line up
 * into a course, a crown perched off-centre, and at the full step a stone that has plainly rolled off the
 * side and a branch end shouldering out of the mass. Nobody stacked this carefully; somebody dropped it.
 *
 * The read the item asks for is **silhouette at a glance from across a ground**: a keeper standing on the
 * Grove should be able to tell a full bank from a spent one without opening the lens. So the three steps are
 * separated by outline, not by detail — a low scatter barely off the grass, a shouldered heap, and a high
 * irregular mass that breaks the sixteen-pixel box at the top. Park earth tones, not the keeper palette.
 */
const PILE_1_GRID: ReadonlyArray<string> = [
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
  '....ooo.........',
  '...ohsso.oo.....',
  '...osddoohso....',
  '....ooo..oo.....',
  '................',
  '................',
];

const PILE_2_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......oo.......',
  '......ohso......',
  '.......oo.ooo...',
  '....oooo.ohsso..',
  '...ohhssoosddo..',
  '...osssdo.ooo...',
  '....oooo........',
  '................',
  '................',
];

const PILE_3_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '.........ooooo..',
  '........okwwwo..',
  '.........ooooo..',
  '........oooo....',
  '.....ooohhsso...',
  '....ohsosssdo...',
  '....osddooooooo.',
  '..oooooooooohsso',
  '.ohhssoohhsosddo',
  '.oossdoosssdooo.',
  'ohsooo..oooo....',
  '.oo.............',
];

const PILE_STONE_PALETTE = {
  o: 0x2e2e33, // dark stone outline — the same one the loose stone and the cairn use
  s: 0x7d7d86, // stone body
  h: 0xa9a9b2, // lit face
  d: 0x55555c, // shadowed face
};

const PILE_1_RIG: PropRig = { size: 16, grid: PILE_1_GRID, palette: PILE_STONE_PALETTE };
const PILE_2_RIG: PropRig = { size: 16, grid: PILE_2_GRID, palette: PILE_STONE_PALETTE };
const PILE_3_RIG: PropRig = {
  size: 16,
  grid: PILE_3_GRID,
  // Only the full heap carries wood: a branch end shouldering out is the cheapest way to say this pile is
  // *gathering* and not masonry, and it is the one step with the room to say it.
  palette: { ...PILE_STONE_PALETTE, w: 0x8a6a3f, k: 0x5c4426 },
};

// -- fuss (the third and last TicKind, BACKLOG-496 closed cycle 142-art) -----------------------
// The scuff is two bare patches with a track between them; the ring is a circumference with the middle
// left standing. Both are *wear* — grass rubbed away by a repeated line of travel. `fuss` is not wear at
// all, and that is the whole rig: an animal that stays on one spot and picks at it **turns the ground
// over**. So this is the only one of the three with no soft trodden rim on every side and no hole: a
// single compact clump of loose earth with clods sitting proud of it, its outline deliberately ragged
// where the other two are smooth.
//
// First draft was a small filled scuff — which is to say, `tic_pace` with one patch instead of two, and at
// sixteen pixels those are the same picture. The three have to separate in *silhouette*, because a player
// reads them from across a ground: two blobs, a ring, one ragged clump. The clods are what earn the third
// shape, so they break the outline rather than sitting inside it.
const TIC_FUSS_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '.......ss.......',
  '.....sseedss....',
  '....sedeeeeds...',
  '...seeedeeeees..',
  '...seedeeedees..',
  '....seeedeees...',
  '.....sdeeeds....',
  '......sseess....',
  '.........ss.....',
  '................',
  '................',
  '................',
];

const TIC_FUSS_RIG: PropRig = {
  size: 16,
  grid: TIC_FUSS_GRID,
  palette: {
    s: 0x3d6631, // the same trodden edge the scuff and the ring use - one worn-ground language, not three
    e: 0x6b5738, // turned earth
    d: 0x4e3f28, // a clod sitting proud of it, scattered rather than outlined
  },
};

// -- Obsidian - the Ridge's black glass (BACKLOG-508, for BACKLOG-503) -------------------------
// The first prop in this table whose body is genuinely dark, and that inverts one rule the whole set has
// obeyed since 296: every other rig sits inside a *dark* outline, which is invisible around a near-black
// shard on grass that is itself dark. So the obsidian carries a **light** rim instead - the one place in
// `PROP_RIGS` where the outline is the brightest colour in the palette - and the shape is read off that rim
// rather than off any interior detail.
//
// Silhouette is the other half. A stone (296) is a rounded lump; if this read as a lump it would be a
// stone somebody painted black. Volcanic glass fractures conchoidally, so it is an **angular splinter** -
// every edge straight, no two the same length, one long axis leaning off vertical, and a single specular
// glint on the fracture face because that is the only thing that says *glass* rather than *coal*.
const OBSIDIAN_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '.........o......',
  '........obo.....',
  '.......obbgo....',
  '.......obbgo....',
  '......obbbgo....',
  '......obkbbo....',
  '.....obkkbbo....',
  '.....obkkbbo....',
  '....obkkkbbo....',
  '....obkkkbo.....',
  '....obkkbo......',
  '....obbbo.......',
  '.....ooo........',
  '................',
];

const OBSIDIAN_RIG: PropRig = {
  size: 16,
  grid: OBSIDIAN_GRID,
  palette: {
    // The outline char is `o`, as every prop in this file uses - but it is the LIGHTEST colour here, not
    // the darkest. A dark outline round a near-black shard on dark grass is no outline at all, so the
    // convention is kept and its *colour* inverted. The one rig in the table where that is true.
    o: 0x6e6a7a,
    b: 0x1b1a22, // the glass body
    k: 0x0b0b10, // the deep fracture, darker still
    g: 0xd8d4e6, // one specular glint on the fracture face - the only thing that says glass, not coal
  },
};

// -- Beacon - the Ridge's landmark, raised from the black glass (BACKLOG-508, for BACKLOG-503) --
// The park's fifth structure, and it has two things to distinguish itself from at sixteen pixels: the
// cairn, which is stacked stone, and the bank heap (506), which is dropped stone. So the beacon is the one
// landmark that goes **up** - shards set on end in a base rather than laid flat on each other, breaking the
// top of the box the way the full bank heap does, because the whole point of a thing on a ridge is that it
// is the skyline you can see is different from a ground away.
//
// First draft stacked the shards like the cairn stacks stones, which made it a black cairn. The fix is that
// nothing here rests on anything: three splinters stand in a set base, at different heights and leaning
// apart, and the base is ordinary park stone so the glass reads as the thing that was *brought*.
const BEACON_GRID: ReadonlyArray<string> = [
  '.......g........',
  '......rbr.......',
  '..g...rbr...g...',
  '.rbr..rbr..rbr..',
  '.rbr..rkr..rbr..',
  '.rbr..rkr..rbr..',
  '.rkr..rkr..rkr..',
  '.rkr..rkr..rkr..',
  '.rkr..rkr..rkr..',
  '.rkr..rkr..rkr..',
  '.rkroorkroorkr..',
  '..oosssssssoo...',
  '.ossshhhssssdo..',
  '.osssssssssddo..',
  '..oooooooooooo..',
  '................',
];

const BEACON_RIG: PropRig = {
  size: 16,
  grid: BEACON_GRID,
  palette: {
    r: 0x6e6a7a, // the same light rim the loose shard uses - one black-glass language, two objects
    b: 0x1b1a22,
    k: 0x0b0b10,
    g: 0xd8d4e6, // glints, on the two tallest - the reason you can see it from a ground away
    o: 0x2e2e33, // ordinary park stone base: dark outline, as every other landmark has
    s: 0x7d7d86,
    h: 0xa9a9b2,
    d: 0x55555c, // the base's shadowed face, the same read the stone and the cairn use
  },
};

// ── Feeding hatch 🕳️ (BACKLOG-502, wired by BACKLOG-510) — the last undrawn prop key in the park, and the
// one the player looks at most: `H` drops food through it and every social system downstream reads where
// that food lands. It is the **odd artefact** among the reed, stone and plaster landmarks, because it is the
// only object on the ground the keeper made rather than a dino. So it is drawn against every other prop's
// grammar: rectilinear where they are organic, cool steel where they are earth, and **sunk rather than
// raised** — every other rig lights its top-left and shadows its bottom, and a thing set flush *into* the
// ground does the opposite. Shadow on the inner top wall, light on the inner bottom one; that inversion is
// what says "hole" rather than "plate lying on the grass", and it is the whole drawing.
// The first draft was a bevelled ellipse, which at sixteen pixels is a burrow with a metal rim — round is
// what animals dig. The seam of the shutter is the two leaves parked at the opening's sides (`t`), the one
// detail that says the hole opens and closes rather than simply being a hole.
const HATCH_GRID: ReadonlyArray<string> = [
  '................',
  '................',
  '................',
  '................',
  '..oooooooooooo..',
  '.ollllllllllllo.',
  '.olddddddddddlo.',
  '.oldkkkkkkkkdlo.',
  '.oltkkkkkkkktlo.',
  '.oltkkkkkkkktlo.',
  '.oldkkkkkkkkdlo.',
  '.olmmmmmmmmmmlo.',
  '.ommmmmmmmmmmmo.',
  '..oooooooooooo..',
  '................',
  '................',
];

const HATCH_RIG: PropRig = {
  size: 16,
  grid: HATCH_GRID,
  palette: {
    o: 0x232830, // dark cool outline — steel, never the warm brown-olive the dino-made props outline with
    l: 0x8b95a3, // lit chamfer running the whole rim: sunlight caught on the plate flush with the grass
    m: 0x5c6672, // mid steel, and the lit *lower* inner wall — the half of the inversion that says "sunk"
    d: 0x39404b, // shadowed upper inner wall, the other half
    k: 0x101318, // the opening: the darkest value in the park, because nothing in it is lit
    t: 0xa9b3c0, // the shutter leaves, parked either side of the mouth
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
  // BACKLOG-490 (cycle 140-art) — 7 of 7. The food roster closes; the per-item fallback in `dropFood`
  // is untouched and still the shipping path for any food id a later cycle adds without a rig.
  food_roots: FOOD_ROOTS_RIG,
  food_mushrooms: FOOD_MUSHROOMS_RIG,
  food_seeds: FOOD_SEEDS_RIG,
  egg: EGG_RIG, // BACKLOG-491: the one prop in this park that turns into a character
  // BACKLOG-494: ruin variants, keyed `<name>_derelict` so `ruinKey` can look one up by convention.
  cairn_derelict: CAIRN_RUIN_RIG,
  shelter_derelict: SHELTER_RUIN_RIG,
  thatch_derelict: THATCH_RUIN_RIG,
  granary_derelict: GRANARY_RUIN_RIG,
  // BACKLOG-496: the ritual's worn ground, keyed `tic_<TicKind>`. `fuss` is deliberately still undrawn —
  // the per-kind fallback draws nothing for it, which is the control that keeps the graceful path live.
  tic_pace: TIC_PACE_RIG,
  tic_circle: TIC_CIRCLE_RIG,
  // BACKLOG-496 closes cycle 142-art. `fuss` was held back for four cycles as the per-kind fallback
  // control; with all three kinds drawn, the control for the whole draw-a-rig-or-draw-nothing pattern
  // moves to the one prop key still undrawn - the feeding hatch (BACKLOG-502).
  tic_fuss: TIC_FUSS_RIG,
  // BACKLOG-506: the ground's bank at its three fullness steps (504), keyed `pile_<step>`. Step 0 banks
  // nothing and draws nothing, so there is no `pile_0` — the null key is the empty ground.
  // BACKLOG-508: the Ridge's black glass (503) - the loose shard and the landmark set from it.
  obsidian: OBSIDIAN_RIG,
  beacon: BEACON_RIG,
  pile_1: PILE_1_RIG,
  pile_2: PILE_2_RIG,
  pile_3: PILE_3_RIG,
  // BACKLOG-502: the feeding hatch — the last undrawn prop key in the park closes, and with it the
  // draw-a-rig-or-draw-nothing control moves off the prop registry entirely and onto `NO_RIG_CONTROL`,
  // the name nothing can ever claim (declared beside this table in cycle 142-art for exactly this night).
  hatch: HATCH_RIG,
};

/**
 * The no-rig control key (BACKLOG-508, cycle 142-art).
 *
 * Five specs assert that a prop key with no rig reports false, so that the draw-a-rig-or-draw-nothing
 * fallback stays *exercised* rather than becoming a claim the code merely makes about itself. Two of them
 * spelled that key `'obsidian'` — a plausible-sounding thing nobody had drawn — and cycle 142 made obsidian
 * a real resource and then drew it, quietly taking the control with it. A third had pinned the control to
 * `tic_fuss`, which the same night's Artist fire closed.
 *
 * So the control gets a name nothing can ever claim, in one place, next to the registry it is a control
 * for. Never add a rig under this key.
 */
export const NO_RIG_CONTROL = '__no_such_prop__';

/** Distinct non-transparent chars in a grid — test helper for palette discipline. */
export function propCharsUsed(grid: ReadonlyArray<string>): Set<string> {
  const out = new Set<string>();
  for (const row of grid) for (const ch of row) if (ch !== '.') out.add(ch);
  return out;
}
