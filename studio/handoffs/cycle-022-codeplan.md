# Cycle 022 — BACKLOG-056 The Glass (vivarium frame) — code plan

**Goal:** reframe the world as a sealed glass vivarium (operator: "mini dino fishbowl"). Draw the bowl. Purely visual — no sim change.

## Lore
- New `studio/lore/vivarium.md` — The Vivarium premise: a kept glass biodome; player = keeper looking in. Names what the emergent stack already is. Design rule unchanged (nudge inputs, never author outcomes).

## New pure module — `game/src/ui/glass.ts` (no Phaser, Node-tested)
- `GLASS` config (rim/edgeBand/colors/alphas).
- `cornerRadius(tile)`, `rimRects(w,h)` (2 inset rounded-rect specs), `edgeBands(w,h)` (4 edge shadow rects, corners overlap), `glarePolys(w,h)` (2 flat reflection polygons top-left), `toPoints(flat)`.

## Integration — `game/src/scenes/WorldScene.ts`
- `setupGlass()` (called at end of `create()`): one Graphics at **depth 8** (over night overlay 5 + bond lines 6, under HUD 10+):
  1. edge vignette via `edgeBands` fills,
  2. glass rim + inner highlight via `rimRects` rounded strokes,
  3. reflection streaks via `glarePolys` → `fillPoints`,
  4. curved top light-catch via `arc`.
- Dev hook `__glass()` → `{width,height,radius}`.

## Backlog seeded (fishbowl)
057 tap-the-glass, 058 the plaque, 059 feeding hatch, 060 idle/ambient mode.

## Tests
- `tests/unit/glass.test.ts` (5): radius scaling, rim insets in-bounds + nesting, edge bands cover all sides, glare polys in-bounds/even-length, toPoints pairing.
- `tests/e2e/cycle-022-glass.spec.ts` (1): glass reports bowl dims, sim still moves inside it, zero page errors.

## Verdict
APPROVED. 114 unit / 45 e2e green (e2e ×2, no flake). web-llm boundary clean. Visually verified in a live preview.
