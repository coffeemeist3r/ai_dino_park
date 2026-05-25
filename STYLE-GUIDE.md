# Art Style Guide

The Artist routine reads this every fire. Humans amend; routines obey.

## North star

**Pokemon Generation 3 (Game Boy Advance era):** FireRed, LeafGreen, Emerald. Soft saturated colors, hand-pixeled, clean tile edges.

Reference: official GBA Pokemon palette is ~32 colors per sprite, no anti-aliasing on most tile work, gentle dithering on shadows only.

## Sprite specs

| Asset | Size | Frames | Notes |
|---|---|---|---|
| Player avatar | 32×32 | 4-dir × (1 idle + 2 walk) = 12 frames | Centered, feet on bottom row |
| NPC dinosaur | 32×32 (small) / 48×48 (large) | 4-dir × (1 idle + 2 walk) = 12 frames | Size by species |
| Tile (grass, path, water) | 16×16 | 1 frame (or 2-frame water anim) | Tiles must abut without seams |
| Tree / large prop | 32×32 or 32×48 | 1 frame, occluder | Player walks behind |
| Dialog box | 240×56 px | static | 6px Gen3 border, off-white fill |
| UI icons (heart, item) | 16×16 | static | High contrast |

## Palette

Use the **GBA-faithful palette** (max 64 distinct colors total across the project). When generating, pin: warm pastel greens for grass, ochre paths, deep teal water, dawn/dusk overlays via game-side tint, not in source asset.

## Style words for image generators

`pixel art, Game Boy Advance era, Pokemon FireRed style, 32x32 sprite, soft pastel colors, no anti-aliasing, clean outlines, top-down view, sprite sheet 4-direction walk cycle, transparent background`

Avoid: modern hi-bit pixel art (Stardew Valley is too detailed for this project), Octopath-style HD-2D, painted/anime, photorealism.

## Naming convention

```
game/public/assets/sprites/
  dino_triceratops_walk.png         ← sheet, all frames horizontal
  player_paleontologist_walk.png
  ui_dialog_box.png
game/public/assets/tilesets/
  outdoor_grass.png                  ← 16x16 grid
```

## Source / license

Artist routine MUST log source of every asset:
- If AI-generated: model name + prompt → log in `studio/chronicle.md`
- If CC0 (OpenGameArt, Kenney): URL + license note in `game/public/assets/CREDITS.md`
- Never commit copyrighted assets (no Pokemon sprite rips)
