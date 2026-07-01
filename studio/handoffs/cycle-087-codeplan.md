# Cycle 87 — Code Plan

## Lore track — BACKLOG-405 Solitary tic

**Item:** BACKLOG-405 — a lone, undisturbed dino invents its signature ritual.

**Files to create:**
- `game/src/world/tic.ts` — pure module:
  - `type TicKind = 'pace' | 'fuss' | 'circle'`
  - `interface Tic { kind: TicKind; glyph: string; label: string }`
  - `const TIC_BY_AXIS: Record<keyof Personality, Tic>` — one ritual per axis (kinds repeat across 5 axes; labels keep axis flavor).
  - `signatureTic(p: Personality): Tic` — the tic of the axis furthest from 0.5 (ties by `AXES` order), same dominant-axis walk as `fidget`.
  - `const TIC_AFTER_STEPS = 20`, `const TIC_COMPANY_RANGE = 3`.
  - `undisturbed(hasPressingNeed: boolean, foodRush: boolean, companyNear: boolean): boolean`
  - `inventsTic(soloSteps: number): boolean`
  - `ticStep(kind, anchor: Tile, phase: number, cols, rows): Tile` — pace = anchor.x + (phase%2); circle = 4-tile ring by phase%4; fuss = hold anchor; all clamped in-bounds.
  - `ticMemory(label: string): string`

**Files to modify:**
- `game/src/scenes/WorldScene.ts`
  - Import from `../world/tic`.
  - New per-dino transient state: `soloSteps: Record<string, number>`, `ticAnchor: Record<string, Tile>`, `ticPhase: Record<string, number>`, `ticInvented = new Set<string>()`. (All transient — not saved.)
  - `companyNear(d): boolean` — any other dino in the same home zone within `TIC_COMPANY_RANGE` tiles (`chebyTiles`).
  - In `forceStep`'s per-dino loop, after `huddling/gathering/moping/socializing` are computed: compute `soloAlone = !huddling && !gathering && !moping && !socializing && undisturbed(!!pressingNeed(this.needs[d.name]), false, this.companyNear(d))`. Increment/reset `soloSteps[d.name]`; on reset also clear `ticInvented`/`ticAnchor`/`ticPhase` for the name. `ticcing = soloAlone && inventsTic(soloSteps[d.name])`. Add an `else if (ticcing)` branch (below `socializing`, above the plain `wanderStep` else) that anchors on first entry, advances phase, sets `next = ticStep(...)`, and calls `performTic(d, tic)`.
  - `performTic(d, tic)`: on first invention (`!ticInvented.has`) add to set, `remember(ticMemory(tic.label))`, `flashFeed(d, tic.glyph)`, `logEvent`; else flash the glyph every 6th solo step (occasional re-tell). Activity stays `wandering`.
  - Dev hook `__tic(name)` → `{ solo, invented, tic: signatureTic(traits) }`.

**Reuse list:** `AXES`/`Personality` (`ai/personality.ts`), the dominant-axis pattern from `fidget` (`world/fidget.ts` — mirror, don't import), `Tile`/`stepToward` conventions (`world/movement.ts`), `pressingNeed` (`world/needs.ts`), `chebyTiles`/`flashFeed`/`remember`/`logEvent` (WorldScene). No new symbol duplicates existing behavior.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/tic.test.ts`: `signatureTic` deterministic + two personalities → (can) differ; `undisturbed` truth table; `inventsTic` boundary at `TIC_AFTER_STEPS`; `ticStep` stays within 1 tile of anchor for pace/circle, holds for fuss, clamps at bounds; `ticMemory` shape.
- E2E `tests/e2e/cycle-087-solitary-tic.spec.ts`: move all dinos but one out to another zone (or the target alone into the Fernreach), clear its needs, step `TIC_AFTER_STEPS`+ times → `__tic().invented` true + a tic memory in `__memory()`; a control dino kept beside company never invents; zero console errors.

**Risks:** The `forceStep` decision chain is order-sensitive — `ticcing` must sit strictly below `socializing` and gate on `companyNear`, so a dino with anyone nearby never tics. `false` is passed for `foodRush` because a food-rushing dino already `continue`d earlier in the loop (kept as a param for the pure truth table + future callers).

**Estimated touch count:** ~3 files (1 new module + WorldScene + 1 unit + 1 e2e).

## Structure track — BACKLOG-358 Edge-meet barter

**Item:** BACKLOG-358 — two dinos meeting at a shared zone edge swap the kind each other's zone needs.

**Files to modify:**
- `game/src/world/resource.ts`
  - `interface BarterSwap { aGives: ResourceKind | null; bGives: ResourceKind | null }`
  - `barterSwap(pileA, pileB, recipeA = CRAFT_RECIPE, recipeB = CRAFT_RECIPE): BarterSwap` → `{ aGives: directedCarry(pileA, pileB, recipeB), bGives: directedCarry(pileB, pileA, recipeA) }`. Pure; reuses `directedCarry` (356) so each side gives what the *other* zone is short of, falling back to a spare.
- `game/src/world/zones.ts`
  - `nearLinkEdge(zoneId, tile: { tileX: number }, cols, band = 1): string | null` — over `zoneNeighbors(zoneId)`: a `west` link when `tile.tileX <= band`, an `east` link when `tile.tileX >= cols - 1 - band`; returns that link's `to`, else null.
- `game/src/scenes/WorldScene.ts`
  - Import `barterSwap` (resource) + `nearLinkEdge` (zones).
  - New state `lastBarterMs = 0`; const `BARTER_COOLDOWN_MS = 45_000` (module scope, beside `MIGRATE_COOLDOWN_MS`).
  - `maybeBarter()`: cooldown-gate on `cooldownReady(Date.now(), lastBarterMs, BARTER_COOLDOWN_MS)`; build the list of non-migrating dinos whose tile `nearLinkEdge`s out; find a pair `(a,b)` where `a.to === b.zone && b.to === a.zone`; call `doBarter` and stamp `lastBarterMs`. Called in the `forceStep` tail beside `checkFeeding`.
  - `doBarter(a, zoneA, b, zoneB)`: `swap = barterSwap(pileFor(zoneA), pileFor(zoneB), structureRecipe(zoneA), structureRecipe(zoneB))`; if both null → return (no phantom beat); apply each moving direction via `takeResource`/`bankResource` on `stockpileByZone`; `flashFeed('🔄')` on each in-view dino; `remember` a barter note on both; `logEvent`; `refreshPlaque()`; `void saveGame()`.
  - Dev hooks: `__edgeBarter(a, b)` (deterministic — run `doBarter` on two named dinos in their current zones, return both piles) and `__setZonePile(zone, pile)` (seed a pile for the e2e).

**Reuse list:** `directedCarry`/`takeResource`/`bankResource`/`structureRecipe`/`atCap` (`world/resource.ts`), `zoneNeighbors`/`zoneById` (`world/zones.ts`), `cooldownReady` (`world/clock.ts`), `pileFor`/`flashFeed`/`remember`/`logEvent`/`refreshPlaque`/`saveGame`/`chebyTiles` (WorldScene). No reinvention — barter is a second caller of the carry seams.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/barter.test.ts`: `barterSwap` picks each side's needed kind + conservation on apply (via `takeResource`/`bankResource`) + cap guard (full dest → that direction null) + empty/no-op returns `{null,null}`. `nearLinkEdge` returns the right neighbour per edge/band, null in the interior, and either neighbour for the two-link grove.
- E2E `tests/e2e/cycle-087-edge-barter.spec.ts`: seed bowl `{branch:2}` + grove `{stone:2}` via `__setZonePile`; place a dino at the bowl east edge and one at the grove west edge; one `__stepWorld` (ambient scan) → bowl gains stone, grove gains branch, totals conserved, a 🔄 event logged. A second assertion drives the deterministic `__edgeBarter` hook. Zero console errors.

**Risks — cross-track file overlap:** both tracks edit `WorldScene.ts`. **They do not overlap:** 405 edits the `forceStep` per-dino *decision branch* + adds `performTic`/`companyNear`/`__tic`; 358 edits the `forceStep` *tail* + adds `maybeBarter`/`doBarter`/hooks. Coder: apply 405's branch edit first, then 358's tail edit (they touch different line ranges of `forceStep`). The ambient `maybeBarter` is a near-no-op in existing specs (piles empty and no cross-zone edge pairs at start), so it can't perturb the current suite.

**Estimated touch count:** ~4 files (resource.ts + zones.ts + WorldScene + 1 unit + 1 e2e; WorldScene shared with 405).
