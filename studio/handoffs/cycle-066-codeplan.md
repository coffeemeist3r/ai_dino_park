# Cycle 66 — Code Plan

Two tracks. Cross-track collision is **minimal**: the lore track changes one line in `refreshActivityMarks` + adds a hook; the structure track adds a P-key handler, a `checkPlot()` tail call in `forceStep`, a sprite, and additive save fields. Different methods — no clobber. Sequence: land the lore track first (tiny), then the structure track.

---

## Lore track — BACKLOG-298 Idle fidgets

**Item:** BACKLOG-298 — a wandering dino shows a trait-derived signature quirk glyph instead of the generic 🚶.

**Files to create:**
- `game/src/world/fidget.ts` — pure, no Phaser, no `ai/` runtime import (takes a structural `Personality`).
  - `export interface Quirk { glyph: string; label: string }`
  - `export const IDLE_QUIRKS: Record<keyof Personality, { low: Quirk; high: Quirk }>` — one quirk per axis pole. Suggested (glyphs **disjoint** from `ACTIVITY_GLYPH` values ✨👀🆘🍖💤🪵💬🚶):
    - curiosity: high `{ '👆', 'pokes at the glass' }`, low `{ '🧍', 'stands warily' }`
    - sociability: high `{ '💭', 'looks for company' }`, low `{ '🌀', 'keeps to itself' }`
    - energy: high `{ '🤸', 'bounces about' }`, low `{ '😪', 'dozes on its feet' }`
    - agreeableness: high `{ '🎵', 'hums to itself' }`, low `{ '🙄', 'grumbles' }`
    - bravery: high `{ '🐾', 'paces' }`, low `{ '🫣', 'peeks around timidly' }`
  - `export function fidget(p: Personality): Quirk` — pick the **dominant axis** (max `|v - 0.5|`; tie → `AXES` order, imported from `personality.ts`), return that axis's `high` quirk if `v >= 0.5` else `low`.

**Files to modify:**
- `game/src/scenes/WorldScene.ts`
  - `refreshActivityMarks()` (~line 1549): when the dino's activity is `wandering`, set the mark text to `fidget(d.traits).glyph` instead of `ACTIVITY_GLYPH['wandering']`. One branch. All other states unchanged. (`activityById` is **not** touched — 295's `__activity` still returns `'wandering'`.)
  - Add dev hook near the other hooks (~line 936): `(window as any).__fidget = (name) => { const d = this.dinoByName(name); return d ? fidget(d.traits) : null; }`.
  - Import `fidget` from `../world/fidget`.

**Reuse list (MUST):**
- `Personality` + `AXES` from `game/src/ai/personality.ts` — the dominant-axis pick reuses `AXES` for the key list + tie order; do not re-list axes.
- `ACTIVITY_GLYPH` from `world/activity.ts` — only the `wandering` entry is overridden at render; the others still drive the mark.
- `Dino.traits` + `this.dinoByName` already on the scene.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-066-fidget.test.ts`:
  - `fidget` is deterministic (same `Personality` → same `Quirk`).
  - Dominant-axis selection: a `Personality` with `bravery` furthest-and-high → `🐾`; furthest-and-low → `🫣` (the two named examples).
  - The 5 name-seeded founders (`seededPersonality('Rex'|'Mossback'|'Sunny'|'Twitch'|'Glade')`) yield **≥ 3 distinct glyphs**.
  - Every quirk glyph in `IDLE_QUIRKS` is **disjoint** from `Object.values(ACTIVITY_GLYPH)`.
- E2E `tests/e2e/cycle-066-fidget.spec.ts`:
  - Boot (08:00, clear — dinos idle/wander), `__stepWorld()`, then for a dino whose `__activity` reads `wandering`, assert its rendered activity-mark text equals `__fidget(name).glyph` and is **not** 🚶. (Read the mark via a small hook or the existing mark inspection pattern; if no mark-text hook exists, add `__activityMark(name)` returning the mark's current text.)
  - Console-error-free (no-GPU policy).

**Risks:**
- If a founder's idle step happens to be feeding/gathering/socializing rather than wandering, the spec must pick whichever dino currently reads `wandering` (don't hard-code a name). Loop the roster, find one `wandering`, assert on it; at 08:00 with no food/resource at least one will wander.
- Emoji width: keep single-codepoint glyphs (the suggested set is). No ZWJ sequences.

**Estimated touch count:** ~4 files (1 new src, 1 WorldScene, 1 new unit, 1 new e2e). Well under ceiling.

---

## Structure track — BACKLOG-145 Plantable plot

**Item:** BACKLOG-145 — one plot, plant with **P**, grows 🍓 over realtime days, harvest releases the crop into the feeding loop.

**Files to create:**
- `game/src/world/plot.ts` — pure, no Phaser.
  - `export type CropStage = 'seed' | 'sprout' | 'ripe'`
  - `export const STAGE_GLYPH: Record<CropStage | 'empty', string> = { empty:'🟫', seed:'🌱', sprout:'🌿', ripe:'🍓' }`
  - `export const CROP_FOOD_ID = 'berries'` (harvest yields the existing 🍓 FOODS entry — "into the existing food set")
  - `export const SPROUT_DAY = 1`, `export const RIPE_DAY = 2` (days since planting)
  - `export function cropStage(daysElapsed: number): CropStage` — `>= RIPE_DAY → 'ripe'`, `>= SPROUT_DAY → 'sprout'`, else `'seed'` (negative clamped to seed).
  - `export const PLOT_TILE = { tileX: 2, tileY: 12 }` (bottom-left; clear of HUDDLE_TILE {10,11}, the feeding row tileY≈6, and the sky gather centre).
  - `export function plotAdjacent(keeper: Tile, plot: Tile): boolean` — Chebyshev ≤ 1 (reuse the `reachedFood` shape or inline; import `Tile` from `./movement`).

**Files to modify:**
- `game/src/world/saveGame.ts`
  - `SaveData`: add `plot?: { plantedDay: number } | null` and `harvested?: number` (additive over v2, like `cairns` at line 69). Document "absent → null / 0; no version bump."
  - In `deserialize`: validate additively — `plot` is `null` or `{ plantedDay:number }` (else reject); `harvested` a finite number ≥ 0 (else 0). Mirror the `cairns` validation block (~line 216). Always present in output (`plot: …`, `harvested: …`).
- `game/src/scenes/WorldScene.ts`
  - New fields: `private plot: { plantedDay: number } | null = null;`, `private plotSprite: Phaser.GameObjects.Text | null = null;`, `private harvested = 0;`, `private plotStageShown: CropStage | 'empty' = 'empty';`.
  - `create()`/setup: draw the plot marker sprite at `PLOT_TILE` (depth 2, like the resource/cairn glyph), text = current stage glyph; call a `refreshPlot()` helper. Register the **P** key: `this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P).on('down', () => this.handlePlot())` (place beside the H handler ~line 545).
  - `handlePlot()`:
    - `if (!plotAdjacent(this.playerTile(), PLOT_TILE)) return;`
    - empty (`!this.plot`) → `this.plot = { plantedDay: getWorldClock().now().day }`, log "🌱 you planted a seed", `refreshPlot()`, `void this.saveGame()`.
    - ripe (`cropStage(now.day - plot.plantedDay) === 'ripe'`) → `this.dropFood(PLOT_TILE.tileX, CROP_FOOD_ID)` (reuse the hatch drop, lands at the plot column; if a food is already in play it no-ops — acceptable), `this.plot = null`, `this.harvested++`, log "🍓 you harvested the crop", `refreshPlot()`, `void this.saveGame()`.
    - growing → log "🌿 not ready yet"; no state change.
  - `refreshPlot()`: compute the current stage (`empty` if `!plot`, else `cropStage(now.day - plantedDay)`); set the sprite text to `STAGE_GLYPH[stage]`. If it **just** became `'ripe'` (was not ripe in `plotStageShown`), log "🍓 the crop ripened" once; store `plotStageShown = stage`.
  - `forceStep()` tail: add `this.checkPlot();` next to `this.maybeSpawnResource()` (~line 1542). `checkPlot()` = just `if (this.plot) this.refreshPlot();` (drives the once-only ripen note + sprite update as days pass). Keep it a separate method so it doesn't touch the lore-track lines.
  - `currentSaveData()` (~line 2870): add `plot: this.plot, harvested: this.harvested,`.
  - `setupSave()` restore (~line 2931, beside `cairns`): `this.plot = save.plot ?? null; this.harvested = save.harvested ?? 0; this.plotStageShown = 'empty'; this.refreshPlot();`.
  - Dev hooks (~line 936): `__plot = () => this.plot ? { plantedDay: this.plot.plantedDay, stage: cropStage(getWorldClock().now().day - this.plot.plantedDay) } : null;`, `__plantPlot = () => { /* force plant ignoring adjacency */ }`, `__harvested = () => this.harvested`. (A force-plant hook lets the e2e plant without walking the keeper onto the tile.)
  - Imports from `../world/plot`.

**Reuse list (MUST):**
- `dropFood(col?, foodId?)` (WorldScene ~line 581) — harvest reuses it verbatim with `PLOT_TILE.tileX` + `CROP_FOOD_ID`. Do **not** write a second food-spawn path; the swarm/eat/favorites loop (checkFeeding, 059/061) then applies for free.
- `getWorldClock().now().day` (clock.ts) — growth reads the realtime day; no new timer.
- `FOODS` 🍓 berries entry (foods.ts) — the crop is an existing food, not a new one.
- The `cairns` additive-save pattern (saveGame.ts ~line 69/216, WorldScene save/restore) — copy it for `plot`/`harvested`.
- The resource/cairn glyph-sprite pattern (depth 2 text) for the plot marker.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-066-plot.test.ts`:
  - `cropStage`: 0→seed, `SPROUT_DAY`→sprout, `RIPE_DAY`→ripe, large→ripe, negative→seed.
  - `plotAdjacent`: true for Chebyshev ≤ 1, false at distance 2.
  - `STAGE_GLYPH` has all four states; `CROP_FOOD_ID` matches a real `FOODS` id.
- Unit (extend `tests/unit/saveGame.test.ts` or a new `cycle-066-plot-save.test.ts`): a round-trip with `plot`/`harvested` set survives; a save object **without** those fields deserializes to `plot:null, harvested:0` (additive, no version bump); a malformed `plot` (e.g. `{plantedDay:'x'}`) is rejected.
- E2E `tests/e2e/cycle-066-plot.spec.ts`:
  - Plant: `__plantPlot()` (or walk + P), `__plot()` reports `{ stage:'seed' }`.
  - Grow: `__setClock(plantedDay + RIPE_DAY, 8, 0)`, `__stepWorld()`, `__plot().stage === 'ripe'`.
  - Harvest: trigger harvest (a `__harvestPlot()` hook or P while adjacent), assert a 🍓 food is in play (`__foodInPlay` or existing food hook), `__plot()` is `null`, `__harvested() === 1`.
  - Console-error-free.

**Risks:**
- `dropFood` no-ops if a food is already in play — the harvest e2e must ensure none is mid-air (boot is clean; don't drop food first). Note in the spec.
- `__setClock` does **not** fire clock listeners (it `set`s + re-anchors); growth reads the day directly in `checkPlot`/`__plot`, so a `set` + `__stepWorld()` is enough — verified against the cycle-40 season pattern.
- Plot tile must not sit on a dino spawn or block the keeper; {2,12} is open. Coder: confirm no roster dino spawns there (roster.ts tiles).

**Estimated touch count:** ~6 files (1 new src, saveGame.ts, WorldScene.ts, 2 new unit (or 1 new + extend saveGame test), 1 new e2e). At ceiling, acceptable — the WorldScene edits are localized.
