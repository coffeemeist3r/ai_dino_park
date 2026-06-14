# Asset Credits

All art in AI Dino Park is **Claude-authored procedural vector code** — no image API, no asset
packs, no raster downloads. There are no binary sprite files; the art is the code under
`game/src/art/` (pure shape rigs) baked to Canvas textures at runtime. Logged here per
STYLE-GUIDE.

| Subject | Module | Origin | Date |
|---|---|---|---|
| Triceratops walk loop (Rex) | `game/src/art/dinoArt.ts` → `bake.ts` | Claude-authored procedural vector | 2026-06-03 |
| Brontosaurus walk loop (Sunny) | `game/src/art/dinoArt.ts` (`brontosaurusPose`) → `bake.ts` | Claude-authored procedural vector | 2026-06-04 |
| Parasaurolophus walk loop (Glade) | `game/src/art/dinoArt.ts` (`parasaurolophusPose`) → `bake.ts` | Claude-authored procedural vector | 2026-06-05 |
| Compsognathus walk loop (Twitch) | `game/src/art/dinoArt.ts` (`compsognathusPose`) → `bake.ts` | Claude-authored procedural vector | 2026-06-06 |
| Stegosaurus walk loop (Mossback) | `game/src/art/dinoArt.ts` (`stegosaurusPose`) → `bake.ts` | Claude-authored procedural vector | 2026-06-08 |
| Triceratops pixel walk (Rex, GBA restyle) | `game/src/art/pixelArt.ts` (`REX_RIG`) → `bake.ts` | Claude-authored procedural pixel (CHARTER v4) | 2026-06-09 |
| Stegosaurus pixel walk (Mossback, GBA restyle) | `game/src/art/pixelArt.ts` (`MOSS_RIG`) → `bake.ts` | Claude-authored procedural pixel (CHARTER v4) | 2026-06-10 |
| Brontosaurus pixel walk (Sunny, GBA restyle) | `game/src/art/pixelArt.ts` (`SUNNY_RIG`) → `bake.ts` | Claude-authored procedural pixel (CHARTER v4) | 2026-06-10 |
| Compsognathus pixel walk (Twitch, GBA restyle) | `game/src/art/pixelArt.ts` (`COMP_RIG`) → `bake.ts` | Claude-authored procedural pixel (CHARTER v4) | 2026-06-11 |

- **Glade the parasaurolophus (pixel)** — `game/src/art/pixelArt.ts` `GLADE_RIG`, cycle 044-art, 2026-06-11. Claude-authored procedural pixel (Gen3 style, original pixels). The cast's fifth and final pixel restyle — the tube crest in shared bone tone.

- **AETHER-1 "Aki" keeper avatar (pixel)** — `game/src/art/keeperArt.ts` `AKI_RIG` → `bake.ts` (`makeKeeperArt`), cycle 045-art, 2026-06-12. Claude-authored procedural pixel (Gen3 style, original pixels). First of the robot-observer roster (BACKLOG-158): a 16×20 front-facing brass diplomacy bot — cyan optic visor, antenna + chest glow, stepping legs. VANTA-9 / LUMEN-3 stay on the amber-square fallback until drawn.
- VANTA-9 "Vix" keeper avatar (pixel, 16×20 ×2) — `game/src/art/keeperArt.ts` (`VIX_RIG`) — cycle 046-art, 2026-06-12 — Claude-authored procedural pixel rig.
- LUMEN-3 "Lux" keeper avatar (pixel, 16×20 ×2) — `game/src/art/keeperArt.ts` (`LUX_RIG`) — cycle 047-art, 2026-06-12 — Claude-authored procedural pixel rig. Completes the observer roster (BACKLOG-158 3/3); keeper fallback control re-pointed to a genuine no-art id.
- Grass ground tile (pixel, 16×16 ×2, two variants) — `game/src/art/tileArt.ts` (`GRASS_RIG`) → `bake.ts` (`bakeTileMap`) — cycle 048-art, 2026-06-13 — Claude-authored procedural pixel (Gen3 style, original pixels). The bowl floor, BACKLOG-033 (1/3): the flat two-green checker becomes baked Gen3 grass — a flat field green scattered with darker blade tufts (light tip over a two-pixel stem), two variants alternating like the old checker, every tile's border flat base so it tiles seamlessly. Path + water deferred to the zone that needs them (BACKLOG-143).
- Dialog box frame (pixel 9-slice, 18×18 ×2, slice inset 6) — `game/src/art/frameArt.ts` (`DIALOG_FRAME`) → `bake.ts` (`bakeDialogFrame`) → `ui/DialogBox.ts` (Phaser NineSlice) — cycle 049-art, 2026-06-14 — Claude-authored procedural pixel (Gen3 style, original pixels). BACKLOG-036: the flat dark-rect + cream-rect message box becomes a Gen3 box — chunky dark frame line, an inner highlight bevel, cream fill, stepped (2px) rounded corners. Baked once to a 9-slice source and stretched to the box so corners stay crisp; the two flat rects remain as the graceful fallback.
