# Art Style Guide

The Artist routine reads this every fire. Humans amend; routines obey.
**Mandate: CHARTER v4 (2026-06-09) — GBA-era Pokemon Gen3 pixel art, authored as code.**

## The medium: art is code (pixels included)

We do **not** generate raster sprites from an image API, download asset packs, or rip
sprites. Claude authors every asset directly, as **procedural pixel code**:

> **A sprite is a pixel-grid rig — rows of palette-keyed characters in a pure TypeScript
> module — baked to crisp nearest-neighbour textures at an integer scale. No API keys, no
> downloads, no copyright risk: original pixels in the Gen3 *style*, never copied Nintendo art.**

- A character frame is a **`string[]` grid** (one char per pixel, `.` = transparent) plus a
  **palette map** (char → color), in `game/src/art/` with **no Phaser import** — so every
  frame is Node-testable: grid dimensions, palette discipline, frames-differ, outline closure.
- A thin Phaser glue layer (`game/src/art/bake.ts`) rasterizes grids at an **integer scale**
  (one `fillRect` per pixel) into textures + looping animations. Phaser's `pixelArt` mode
  keeps edges hard.
- The game falls back to a flat rectangle for any subject not yet drawn, and the **existing
  flat-vector rigs keep rendering until their pixel replacement lands** — the restyle rolls
  in one character at a time without ever breaking the build.

## North star

**Pokemon Ruby/Sapphire/Emerald overworld.** Chunky, warm, instantly readable sprites:
a dark (near-black, *not* pure black) outline around every silhouette, 2–3 shade ramps per
material, big expressive heads, feet that plant. A dino the player can tell apart at a glance
beats a fussy one. Charm over detail; silhouette over rendering.

Authenticity targets (style, not rips):
- **Outline:** continuous 1px dark outline; interior lines only where a part must separate.
- **Shading:** flat ramps of 2–3 tones, light from the upper-left; no anti-aliasing, no
  gradients, no sub-pixel tricks. Selective "sparkle" single pixels for eyes/highlights.
- **Proportions:** Gen3 overworld squash — heads ~40% of body height, short legs, readable
  3/4-down viewing angle.

## Per-character sub-agent workflow (unchanged — the "secret sauce")

One **dedicated sub-agent per character / asset**. Each owns one rig file and iterates hard:

1. Spawn an Artist sub-agent scoped to a single subject ("the triceratops", "the dialog box").
2. Give it STYLE-GUIDE + the subject's identity (silhouette cues, palette seed from the roster
   color). Tell it to **go all-out** on silhouette and stride, then dial back to what reads
   clean at the in-game footprint.
3. It authors a pure pixel rig in `game/src/art/` + a Node unit test (grid size, palette ≤ 15
   colors + transparency, walk frames actually differ, outline present on silhouette edges).
4. It wires the subject into `bake.ts` (`hasArt` + the factory path) and adds one e2e proving
   the sprite renders and animates.
5. Iterate until it pops. Reject your own first draft at least once.

Sub-agents run in parallel across characters; they must not touch each other's rig files.

## Specs

| Asset | Grid | Baked | Frames | Notes |
|---|---|---|---|---|
| NPC dinosaur | 20×20 px | ×2 → 40×40 | walk loop: 4-step sequence from 3 unique frames (stand / step-L / step-R, Gen3 convention) | Feet near the grid bottom, head toward upper third |
| Keeper avatars (robot observers) | 16×20 px | ×2 → 32×40 | idle + 4-step walk | Distinct silhouette per observer; cooler/mech tones vs the organic cast |
| Tile (grass / path / water) | 16×16 px | ×2 → 32×32 | 1 (water may flip 2) | Must abut seamlessly; Gen3 grass = flat green + darker tufts |
| Prop (tree, rock, den) | 16–24 px | ×2 | 1 | Occluder where tall |
| Dialog box / UI frame | 9-slice, pixel corners | — | static | Gen3 box: off-white fill, rounded 2px-step corners, dark frame line |

## Palette

**GBA discipline.** Each sprite keeps to **≤ 15 colors + transparency** (the GBA OBJ limit —
unit-tested), and most should use far fewer (Gen3 overworlds sit around 6–10). Each species
derives its ramp from one **base color** (its roster `color`): base, lighter belly, darker
legs/underside, near-black outline, plus shared bone (horns/beak) and eye tones. Day/dusk/night
coloring is applied game-side via the existing overlay tint — never bake time-of-day into art.

## Naming & location

```
game/src/art/
  pixelArt.ts    ← pixel-grid rig format + palette helpers + frame builders (pure)
  <subject>.ts   ← one rig module per character/asset family as they land (pure)
  dinoArt.ts     ← legacy flat-vector rigs; keep rendering until pixel replacements land
  bake.ts        ← Phaser glue: grids → textures → anims; hasArt(); makeDinoArt() factory
```

Texture/anim keys stay colour-keyed and idempotent (e.g. `tri_walk_8a4a3a`) so every dino of
a species reuses one bake. A pixel rig **replaces** its species' vector entry in the factory;
delete the vector rig only when its last consumer is gone.

## Source / license

Every asset is **Claude-authored procedural code** — log it in `game/public/assets/CREDITS.md`
(subject + module + cycle/date) and in `studio/chronicle.md`. **Never commit copyrighted
pixels** — no Pokemon sprite rips, no traced frames, no palette-swapped Nintendo art. The
style is Gen3; the pixels are ours.

## Avoid

- Image-API sprites, asset packs, anything needing a key or a download.
- Sprite rips or traces of existing games (style homage ≠ asset reuse).
- Anti-aliasing, gradients, sub-pixel shading, mixed vector+pixel in one sprite.
- Over-detail that turns to mush at 16–20px grids (Stardew-density dithering, HD-2D).
- Baking lighting/time-of-day into art (the overlay owns that).
- Pure-black outlines (use a dark warm/cool near-black tied to the ramp).
