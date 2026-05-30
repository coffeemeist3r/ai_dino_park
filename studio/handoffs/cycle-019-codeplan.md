# Cycle 019 — BACKLOG-042 Egg phase — code plan

**Goal:** two high-bond dinos sharing a sleeping huddle on a clear night may lay an egg by the den; it hatches after 3 in-game days into a new dino with traits blended from the parents. Closes the meet→bond→huddle loop with breeding.

## New pure module — `game/src/social/breeding.ts` (no Phaser, Node-tested)
- Constants: `EGG_HATCH_DAYS=3`, `EGG_BOND_THRESHOLD=60`, `MAX_POPULATION=12`.
- Types: `Egg` (id/parentA/parentB/layedDay/hatchDay/tile), `BornDino` (name/species/personality/traits/color/tile).
- `blendTraits(a,b,rand=()=>0.5)` — per-axis average ± small jitter, clamped [0,1]; default = pure average (testable).
- `blendColor(a,b)` — channel-wise average of packed `0xRRGGBB`.
- `childName(a,b)` — prefix of one + suffix of the other, capitalized; caller dedupes.
- `shouldLay({bond,population,isClearNight,bothHuddling,hasEggForPair})` — lay predicate.
- `makeEgg`, `isHatched(egg,day)`, `hatch(egg,parents,name,rand)`.

## Save — `game/src/world/saveGame.ts` (additive, version stays 1)
- `SaveData` gains `eggs: Egg[]` and `born: BornDino[]`.
- `deserialize` shallow-validates both; absent → `[]` (old saves still load).

## Integration — `game/src/scenes/WorldScene.ts`
- Refactor spawn into `spawnDino(cfg)` (also creates the index-aligned 💤 mark); roster + born dinos both use it.
- `maybeLayEggs()` — scan huddling pairs on a clear night; `shouldLay` → `layEgg` (🥚 sprite at den+1 tile, depth 2). One pending clutch per pair.
- `checkHatch()` / `hatchEgg()` — on/after hatch day, blend parents → `spawnDino`, record in `born`, remove egg, save. Cap + missing-parent guards.
- Both called at the end of `forceStep`. Eggs/born persisted in `currentSaveData` and respawned in the save-restore callback.
- `isClearNight()` seam = `isNight()` until weather (BACKLOG-028).
- Dev hooks: `__eggs`, `__population`, `__layEgg(a,b)` (force clutch), `__forceHatch()`.

## Tests
- `tests/unit/breeding.test.ts` — 12 cases (blend math, name, lifecycle, shouldLay gates, cap).
- `tests/e2e/cycle-019-egg.spec.ts` — clutch hatches into a blended dino; born dino survives reload; long-night breeding grows pop but never exceeds the cap.

## Verdict
APPROVED. 92 unit / 39 e2e green (e2e ×2, no flake). web-llm boundary clean.
