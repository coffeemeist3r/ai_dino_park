# Cycle 142 — Code Plan

Build order: **structure track first** (it lands in `resource.ts` and the migration/landmark regions of
`WorldScene`), then the lore track (the tic/sprite region). The two meet only in the import block and the
dev-hook block.

---

## Structure track — BACKLOG-503 (obsidian, the beacon, the quarry errand)

### Prior art to reuse (checked before writing anything)

| Need | Already exists | Where |
|---|---|---|
| Per-zone kind selection | `ZONE_BIAS` + `pickKind` | `world/resource.ts` |
| Per-zone structure selection | `STRUCTURE_BY_BIAS` / `zoneStructure` / `structureRecipe` / `buildStructureFor` | `world/resource.ts` |
| A fourth landmark array + sprites + save field | the thatch (417), mirrored exactly | `WorldScene` ×15 sites |
| Multi-hop routing to a named ground | `hopToward(from, to)` | `world/distance.ts` |
| A migration destination tier | `yearnDestOf` / `plentyDestOf` / `scarcityDestOf` | `WorldScene.scarcityMigrate` |
| Carrying the shard home | `pickCarry` fallback inside `directedCarry` | `world/resource.ts` — **not touched** |
| Pile writes that keep the heap honest | `setPile` | `WorldScene` |

### Files

1. **`game/src/world/resource.ts`** (edit)
   - `ResourceKind` gains `'obsidian'`; `RESOURCE_GLYPH` gains it **last** (`🌑`) so every `KINDS`-order
     tie-break for the existing three is unchanged.
   - New `ZONE_EXCLUSIVE: Record<string, ResourceKind>` = `{ [RIDGE_ID]: 'obsidian' }`, with the doc comment
     stating the difference from `ZONE_BIAS`: a lean vs a lock.
   - `pickKind` consults `ZONE_EXCLUSIVE` first and returns that kind unconditionally. Every other branch
     untouched.
   - `Structure` gains `'beacon'`; `BEACON_RECIPE = { obsidian: 3 }`, `BEACON_GLYPH = '🗼'`;
     `STRUCTURE_BY_BIAS.obsidian = 'beacon'`; `structureRecipe` routes it.
   - `ZONE_BIAS[RIDGE_ID] = 'obsidian'` — required, not cosmetic: `zoneStructure` reads the bias, and
     without it the Ridge would keep `CRAFT_RECIPE` (branch+stone), which under exclusivity it can now
     never afford. Exclusivity without the matching structure row silently kills Ridge building.

2. **`game/src/world/quarry.ts`** (new, pure)
   - `QUARRY_KIND`, `quarryGround()` → the ground that holds the exclusive kind (derived from
     `ZONE_EXCLUSIVE`, not a second hard-coded constant).
   - `needsQuarry(pile)` — true iff the pile holds none of the exclusive kind.
   - `quarryDest(home, pile)` — `null` when home is the quarry ground or the pile already holds some, else
     `hopToward(home, quarryGround())`. Deterministic: `hopToward` walks `zoneNeighbors` in `ZONE_LINKS`
     order.
   - `quarryEvent(name, groundName)` — the ticker line.
   - `quarryMemory(groundName)` — the trace the errand leaves, in `greenerGroundMemory`'s register.

3. **`game/src/world/granary.ts`** (edit) — `GRANARY_RECIPE` gains `obsidian: 1`. One line; `canBuildGranary`
   and `buildGranary` both iterate the recipe, so nothing else changes.

4. **`game/src/scenes/WorldScene.ts`** (edit)
   - Fourth landmark, mirroring the thatch at all 15 sites: `beacons: Landmark[]`, `beaconSprites`,
     `drawBeacon`, `placeBeacon`, the `kind === 'beacon'` branch in the build switch, `baseLandmarks`,
     `allLandmarks`, `showLandmarks` in `applyObjectVisibility`, the plaque `of(...)` row, the save field,
     the restore, and the `__beacons` dev hook.
   - `quarryDestOf(d)` + the tier insertion in `scarcityMigrate`: `primed ?? missed ?? quarry ?? scarcityDest`.
     The quarry sits below hearsay and yearning and above `scarcityDestOf` (which itself carries the
     frontier tier), matching the spec. A quarry move is **not** a scarcity move — it must not fire 457's
     greener-ground beat, exactly as a yearning move must not.
   - `__quarryDest(name)` dev hook.

5. **`tests/unit/cycle-142-obsidian.test.ts`** (new) — exclusivity at rand boundaries 0 / 0.5 / 0.74 / 0.75 /
   0.999 across every ground in `zoneChain()`; the beacon recipe; the other four grounds' `zoneStructure`
   unchanged; the granary gate; `needsQuarry` / `quarryDest`; and a byte-identity check that the existing
   three kinds' `pickKind` results are unchanged on every non-Ridge ground.

6. **`tests/e2e/cycle-142-obsidian.spec.ts`** (new) — `__biasKind` proves exclusivity from the production
   bundle both ways; `__zoneStructure('ridge')` is `beacon`; `__quarryDest` on a bowl dino points at the
   next hop toward the Ridge.

### Blocker watch

`RESOURCE_GLYPH` is iterated as `KINDS` by `spendOne` (upkeep) and by `pickCarry` / `directedCarry` /
`pressuredCarry` / `stockpileLine`. Appending obsidian **last** is what keeps all of those unchanged for
existing piles. Any test that enumerates `RESOURCE_GLYPH` length is expected to move by one; that is the
only intended ripple.

---

## Lore track — BACKLOG-507 (the ritual's mark)

### Files

1. **`game/src/world/wear.ts`** (new, pure)
   - `wearKey(kind: TicKind): string` → `tic_${kind}`.
   - `interface WornMark { name: string; tileX: number; tileY: number; key: string }`.
   - `marksOn(haunts: Haunts, zone: string, kindOf: (name: string) => TicKind | null): WornMark[]` —
     name-sorted, omitting dinos with no haunt on that ground and dinos whose kind resolves `null`.
   - The module owns no art knowledge beyond the key convention; whether a key has a rig is
     `hasPropArt`'s question, asked in the scene (exactly as `pileArtKey` leaves it to `syncBank`).

2. **`game/src/scenes/WorldScene.ts`** (edit)
   - `wearSprites: Record<string, Phaser.GameObjects.Image>` keyed `<name>:<zone>`.
   - `syncWear()` — `marksOn(this.ticHaunts, this.zoneId, kindOf)` where `kindOf` is `ticFor(d).kind` for a
     live dino and `null` otherwise; bake `wearKey`, create/move the image, destroy sprites no longer in the
     list. Depth **1** (under the resource/landmark depth 2, over the tiles).
   - Called from `applyObjectVisibility()` — the one place per-zone visibility is already resolved, and it
     is already called on a zone cross, on founding, and on restore. That is one call site rather than
     four, and it is why `syncBank` was moved there in 504.
   - One extra call at the end of `anchorForTic`, so a haunt laid or drifted mid-stretch shows immediately
     rather than at the next zone event.
   - `__wornMarks()` dev hook returning the drawn marks on the active ground.

3. **`tests/unit/cycle-142-wear.test.ts`** (new) — key convention; the `hasPropArt` assertion for
   `tic_pace` true / `tic_fuss` false (the fallback control, asserted); name ordering; the two omission
   rules; a drift moving the mark rather than adding one.

4. **`tests/e2e/cycle-142-wear.spec.ts`** (new) — a pace/circle dino's mark appears at its haunt; a drift
   moves it; a `fuss` dino leaves none.

### Blocker watch

`ticFor` is private and reads `ticEchoes`; `syncWear` must go through it (never `signatureTic`) or the
player can be shown one ritual and the book another — the exact hazard `ticFor`'s own doc comment names.

---

## Test plan

- `npm run build` — type-check clean.
- `npx vitest run` — full unit suite from the **repo root** (the root config covers `tests/unit` + `game/src`).
- `npx --yes kill-port 5173 && npx playwright test` — full e2e.
- Boundary grep: `@mlc-ai/web-llm` imported only under `game/src/ai/`.

---

## Shipped

Both tracks built, in the planned order. `npm run build` clean, `npx vitest run` 2125 passed / 2 skipped
across 211 files, `npx playwright test` 602 passed / 1 failed (`cycle-139-glad`, a cold-boot
canvas-visible timeout, green in an isolated 6/6 re-run — the catalogued flake, not a regression). The
`@mlc-ai/web-llm` import stays confined to `game/src/ai/`.

**14 files.** New: `world/quarry.ts`, `world/wear.ts`, and two unit + two e2e specs. Edited:
`world/resource.ts`, `world/granary.ts`, `world/saveGame.ts`, `scenes/WorldScene.ts`, and four existing
test files whose fixtures moved with the schema.

### One finding, and one design change made mid-build

**The quarry tier as specced took the scarcity system dormant.** The design put the errand above the
appeal read, on the reasoning that "a thing that exists in exactly one place is a harder fact than a
comparison of two prosperity scores". That reasoning is sound and the placement was wrong, because on a
fresh save *no ground holds any obsidian* — so every ground has an errand, every migrant runs it, and the
whole of 450's scarcity migration, 458's hearsay-into-appeal fallback and 111's wry welcome stop
happening. Thirteen e2e specs said so.

That is CHARTER v7's corollary arrived at from the other side: a new system made reachable by taking an
old one dormant is not a win. The fix moves the errand *inside* `scarcityDestOf`, below the frontier tier
and below a genuinely richer neighbour: **the errand is what a dino does when nothing else is pulling it.**
The appeal read keeps its claim (mouths move toward plenty), and a walk with no better argument fetches the
one thing the ground cannot grow. `cycle-142-obsidian.spec.ts` pins the ordering in both directions — the
errand live and losing to plenty, then winning when the plenty is taken away.

**And one hook that was a copy of a constant.** Five of the thirteen failures were not about migration at
all: `__seedGranaryReady` hardcoded `{branch: 3, stone: 3}` beside `GRANARY_RECIPE` rather than reading it,
so the day the recipe grew an obsidian, three upkeep specs and two bill-call specs went red about a granary
none of them was testing. The hook now spreads the recipe. Same class of finding as BACKLOG-483 and
BACKLOG-495: a claim written down twice is a claim that goes stale in one of the two places.
