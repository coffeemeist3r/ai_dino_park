# Art Style Guide

The Artist routine reads this every fire. Humans amend; routines obey.

## The medium: art is code

We do **not** generate raster sprites from an image API (that pipeline sat dark for 29
cycles waiting on keys it never got, and the game shipped colored rectangles). Instead:

> **Claude authors the art directly, as procedural vector code, baked to animated Canvas textures — no API keys, no asset downloads, no copyright risk.**

This is the approach that worked elsewhere: have Claude write the character as shapes
(SVG-shaped thinking), then convert it to procedural Canvas for animation. Here:

- A dino / prop is a **pure list of flat vector shapes** in a normalized `0..1` box
  (`game/src/art/dinoArt.ts`). No Phaser import — so every frame is **Node-testable** and
  the same rig **animates by re-posing**, not by re-drawing.
- A thin Phaser glue layer (`game/src/art/bake.ts`) turns those shapes into textures + a
  looping animation via `Graphics.generateTexture`. This is the "procedural Canvas" half.
- The game falls back to a flat shape for any species the pipeline hasn't drawn yet, so art
  rolls in **one character at a time** without ever breaking the build.

## North star

**Clean flat vector**, bold and readable at a tiny size: think modern flat illustration on a
Pokemon-overworld footprint. Big confident silhouettes, a dark unifying outline, 2–3 tones
of shading per part, a couple of accent shapes that make a species instantly recognizable
(the triceratops frill + horns; the stego plates; the bronto neck). Charm over detail —
a dino the player can tell apart at 32px beats a fussy one they can't.

Reference vibe: Pokemon overworld **legibility** + flat-vector **cleanliness**. The Gen3 pixel
mandate is retired — vector reads better at this scale and is what Claude can author well.

## Per-character sub-agent workflow (the "secret sauce")

One **dedicated sub-agent per character / asset**. Each owns one rig file and iterates hard:

1. Spawn an Artist sub-agent scoped to a single subject ("the triceratops", "the dialog box").
2. Give it STYLE-GUIDE + the species' identity (silhouette cues, palette seed from the roster
   color). Tell it to **go all-out** — push the silhouette, the pose, the stride — then dial
   back to what reads clean at 32–48px.
3. It authors/extends a pure rig in `game/src/art/` and a Node unit test (shape count, palette
   discipline, "frames actually differ" for any walk cycle).
4. It bakes + wires the species into `bake.ts` (`hasArt` + a `make…`/`ensure…` path) and adds
   one e2e proving the sprite renders and animates.
5. Iterate until it pops. Reject your own first draft at least once.

Sub-agents run in parallel across characters; they must not touch each other's rig files.

## Specs

| Asset | Box | Frames | Notes |
|---|---|---|---|
| NPC dinosaur | 40×40 baked | 4-frame walk loop (pose by phase) | Centered, feet near `y≈0.85`, head/face toward camera near `y≈0.25` |
| Player avatar | 40×40 baked | idle + walk loop | Paleontologist-ish; warm tones |
| Tile (grass / path / water) | 32×32 | 1 (or 2-frame water) | Must abut without seams |
| Prop (tree, rock, den) | 32–48 | 1, occluder where tall | Player/dino can pass behind |
| Dialog box / UI frame | vector, any | static | Soft rounded border, off-white fill |

## Palette

**Disciplined, derived palette.** Each species takes one **base color** (its roster `color`)
and derives the rest by `shade()` — belly (lighter), frill/accent (slightly lighter), legs
(darker), outline (much darker) — plus shared **bone** (horns/beak) and **eye** tones. Keep a
pose to **≤ 8 distinct colors** (unit-tested). Day/dusk/night coloring is applied game-side via
the existing overlay tint — never bake time-of-day into the art.

## Naming & location

```
game/src/art/
  dinoArt.ts     ← pure shape rigs + pose/walk-frame builders + shade()/paletteOf() helpers
  bake.ts        ← Phaser glue: shapes → textures → animation; hasArt(); make…() factory
```

Texture/anim keys are colour-keyed and idempotent (e.g. `tri_walk_8a4a3a`) so every dino of a
species reuses one bake.

## Source / license

Every asset is **Claude-authored procedural code** — log it in `game/public/assets/CREDITS.md`
(subject + module + cycle/date) and in `studio/chronicle.md`. Never commit copyrighted assets
(no sprite rips). No external model, no raster download.

## Avoid

- Raster/image-API sprites, asset packs, anything needing a key or a download.
- Over-detailed rendering that turns to mush at 32–48px (Stardew-grade pixel density, HD-2D).
- Baking lighting/time-of-day into art (the overlay owns that).
- Photorealism, anime, gradients-as-crutch. Flat tones + one clean outline.
