# Cycle 63 — Code Plan (two tracks)

## Lore track — BACKLOG-150 Stargazer's awe varies by temperament

**Item:** BACKLOG-150 — per-dino gather ring shaped by temperament during a sky event.

**Files to create:** none.

**Files to modify:**
- `game/src/world/skyEvent.ts` — add pure `gazeRing(traits: { bravery: number; curiosity: number }): 0 | 1 | 2`. boldness = (bravery + curiosity) / 2; `>= 0.6 → 0`, `>= 0.35 → 1`, else `2`. Export a `GAZE_MAX_RING = 2` const for the WorldScene/test to reference. Structural param type — no import from `ai/`.
- `game/src/scenes/WorldScene.ts` `stepSky()` — replace the uniform "step every dino to centre, register at radius 1" loop with a per-dino ring: `const ring = gazeRing(d.traits)`; step toward `SKY_GATHER_TILE` only while `!atGather(cur, SKY_GATHER_TILE, ring)`; register as gazer (memory + bubble) once `atGather(cur, SKY_GATHER_TILE, ring)` is true. Add dev hook `__skyRings = () => this.dinos.map(d => ({ name: d.name, ring: gazeRing(d.traits), ...this.tileOf(d) }))` for the e2e to assert ring vs. settled distance.

**Reuse list:**
- `atGather(tile, gather, radius)` in `skyEvent.ts` — already takes a radius; use it as the per-dino ring test (no new distance helper).
- `stepToward` (movement) + `this.tileOf(d)` — unchanged stepping primitives.
- `remember` + `this.showBubble` — gazer registration side-effects, unchanged.
- `d.traits.bravery` / `d.traits.curiosity` — the `Personality` axes (personality.ts), read off the live dino.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-063-stargazer.test.ts`): `gazeRing` returns 0 for bold+curious (e.g. {bravery:1,curiosity:1}), 1 at the middling band (e.g. {bravery:0.4,curiosity:0.4}), 2 for timid+incurious (e.g. {bravery:0,curiosity:0}); boundary checks at 0.6 and 0.35; output always in {0,1,2}.
- E2E (`tests/e2e/cycle-063-stargazer.spec.ts`): boot → advance to clear night → `__triggerSky('meteors')` → pump `__stepWorld` ~25×. Assert (a) every dino is a gazer (`__skyGazers().length === dinoCount`), (b) each dino's settled Chebyshev distance from `SKY_GATHER_TILE` equals its `__skyRings` ring (it halts at its ring), (c) the cluster spreads — `min(ring) <= 1` and `max(ring) >= 2` across the roster proves at least one presses in and one hangs back.

**Risks:** The roster traits are name-seeded and fixed, so the 5 dinos have deterministic rings — confirm the seeded roster actually spans rings 0..2 (if by chance all land ≤1, criterion (c)'s `max>=2` would need a timid dino; the roster is diverse enough — Mossback/others are low-bravery — but the e2e reads the *actual* `__skyRings` so it asserts the real spread, and the unit test pins the thresholds regardless). Chebyshev vs. the existing radius-1 `atGather` semantics: `atGather` is already Chebyshev (`abs(dx)<=r && abs(dy)<=r`), so ring distance lines up exactly.

**Estimated touch count:** ~4 files (2 src, 2 test).

## Structure track — BACKLOG-285 Resource stockpile

**Item:** BACKLOG-285 — gathered resources bank into a shared per-kind park stockpile, persisted, plaque readout.

**Files to create:** none.

**Files to modify:**
- `game/src/world/resource.ts` — add `export type Stockpile = Partial<Record<ResourceKind, number>>`; pure `bankResource(pile: Stockpile, kind: ResourceKind): Stockpile` (returns `{ ...pile, [kind]: (pile[kind] ?? 0) + 1 }`); pure `stockpileLine(pile: Stockpile): string` (joins `RESOURCE_GLYPH[k] + ' ' + count` for kinds with count > 0, `' · '` separator, `''` when empty).
- `game/src/world/saveGame.ts` — add `stockpile?: Record<string, number>` to `SaveData` (doc-comment: additive over v2, absent → {}); in `deserialize`, validate exactly like `gathered` (object, number values) defaulting `{}`, and include it in the returned object. No `SAVE_VERSION` bump.
- `game/src/ui/plaque.ts` — add optional `stockpile?: string` to `PlaqueStats`; in `plaqueLines`, push a `Stores · ${s.stockpile}` line when `s.stockpile` is truthy (two lines unchanged when absent).
- `game/src/scenes/WorldScene.ts` — add field `private stockpile: Stockpile = {}`; in `checkGather()` after the per-dino tally, `this.stockpile = bankResource(this.stockpile, kind)` then `this.refreshPlaque()`; in `refreshPlaque()` and the `__plaque` hook pass `stockpile: stockpileLine(this.stockpile)`; in `currentSaveData()` add `stockpile: this.stockpile`; in the save-restore block set `this.stockpile = save.stockpile ?? {}`; add dev hook `__stockpile = () => ({ ...this.stockpile })`.

**Reuse list:**
- `RESOURCE_GLYPH` (resource.ts) — the readout reuses the existing kind→glyph map.
- The `gathered` field's validation in `deserialize` (saveGame.ts) — copy its shape for `stockpile` (same name→number contract).
- `refreshPlaque` / `plaqueLines` (plaque.ts) — existing live-updating readout path; extend rather than add a new HUD element.
- `checkGather` (WorldScene) — the 146 pickup site; bank inline, no new flow.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-063-stockpile.test.ts`): `bankResource({}, 'branch')` → `{branch:1}`; banking a second branch → `{branch:2}`; banking a stone leaves branch untouched → `{branch:2,stone:1}` (immutability — original map unchanged). `stockpileLine({})` → `''`; `stockpileLine({branch:3,stone:1})` contains `🪵 3` and `🪨 1`; a zero-count kind is omitted.
- Unit (extend `tests/unit/plaque.test.ts`): `plaqueLines` with no `stockpile` → 2 lines (regression); with `stockpile:'🪵 3'` → 3 lines, third is `Stores · 🪵 3`.
- Unit (extend `tests/unit/saveGame.test.ts`): round-trip a save with `stockpile:{branch:2}`; a save JSON without `stockpile` deserializes with `stockpile === {}` (or absent-safe default); a malformed `stockpile` (non-number value) → null.
- E2E (`tests/e2e/cycle-063-stockpile.spec.ts`): boot → `__spawnResource('branch', tx, ty)` on a dino → `__stepWorld` → assert `__stockpile().branch === 1`; spawn a `stone`, step, assert `__stockpile().stone === 1`; assert the plaque text (via `__plaque().stockpile` or the rendered line) shows the readout; export save → assert `save.stockpile.branch >= 1`.

**Risks:** `checkGather` already calls `void this.saveGame()` after a pickup, so the new `stockpile` field is persisted on the same save — just make sure `currentSaveData` includes it (it will). The plaque's third line slightly grows the nameplate height; it's anchored bottom-centre (`setOrigin(0.5, 1)`) so it grows upward and won't clip off-canvas. Confirm no existing `__plaque`-hook test asserts an exact 2-line shape (the cycle-058 plaque spec) — if it does, it reads fields not line count, so it's safe; verify during the Coder fire.

**Cross-track collision:** both tracks edit `WorldScene.ts`. Disjoint methods — `stepSky` (lore) vs. `checkGather`/`refreshPlaque`/`currentSaveData`/save-restore (structure). No shared lines; either order is safe.

**Estimated touch count:** ~6 files (3 src + 1 shared WorldScene, 2 new tests + 2 extended). Within budget.
