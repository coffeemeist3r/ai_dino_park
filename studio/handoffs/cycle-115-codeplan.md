# Cycle 115 — Code Plan

## Lore track — BACKLOG-215: Spring thaw relief

### Item
Spring thaw relief — winter→spring turn rewards dinos that toughed the cold.

### Files to create
- `game/src/world/thaw.ts` — pure module (mirrors `cold.ts`):
  - `THAW_TOKEN = 'shivered'` — both `coldMemory()` and `neglectMemory()` begin "shivered…"; `warmMemory()` does not contain it.
  - `THAW_LIFT = 4` — the one-off friendship lift.
  - `thawedThroughWinter(store, name): boolean` — `recall(store,name).some(e => isShareable(e) && e.includes(THAW_TOKEN))` (first-hand only; `isShareable` drops rumor-marked hearsay).
  - `thawLine(name): string` → `🌱 ${name} made it through the winter`.
  - `thawMemory(): string` → `made it through the winter 🌱`.
- `game/src/world/thaw.test.ts` — unit.

### Files to modify
- `game/src/scenes/WorldScene.ts`:
  - Import `thawedThroughWinter, thawLine, thawMemory, THAW_LIFT` from `../world/thaw`.
  - Add `private runThawRelief(): void` — iterate `this.dinos`; for each `thawedThroughWinter(this.memory, d.name)`: `this.friendship = bumpPoints(this.friendship, d.name, THAW_LIFT)`, `this.memory = remember(this.memory, d.name, thawMemory())`, `this.flashFeed(d, '🌱')`, `this.logEvent(thawLine(d.name))`; persist once if any fired.
  - In `checkSeasonTurn`, after the existing turn beats, `if (turned === 'spring') this.runThawRelief();`.
  - Dev hook near `__spoilFood`: `(window as any).__thawRelief = () => this.runThawRelief();`.

### Reuse list
- `recall`/`isShareable` (`ai/memory`, `social/gossip`) — memory read + first-hand filter, exactly as `recovered()` in cold.ts.
- `bumpPoints` (`social/friendship`) — friendship lift, as used at WorldScene:1425/4925.
- `remember`, `flashFeed`, `logEvent` — existing WorldScene helpers.
- `coldMemory`/`neglectMemory`/`warmMemory` shapes (`world/cold.ts`) — the token boundary is derived from these; do not duplicate them.

### New dependencies
none.

### Test plan
- Unit `thaw.test.ts`: `thawedThroughWinter` true for coldMemory / neglectMemory store, false for warmMemory-only, false for empty, false for a store carrying only `coldWordLine(other)` (rumor about someone else). `thawLine`/`thawMemory`/`THAW_LIFT` shape assertions.
- E2E `tests/e2e/cycle-115-thaw.spec.ts`: `__rememberCold('Rex')`, snapshot `__friendshipPoints().Rex`, `__thawRelief()`, assert points rose by `THAW_LIFT` and `__eventLog`/log contains "made it through the winter". Second dino warmed via `__rememberWarm` gets no bump.

### Risks
- Memory ring (6 entries): a cold memory can age out before the turn. Acceptable — 215 reads current memory; a dino that shivered on a late-winter night still carries it. Not a correctness bug, a design choice (documented, no persisted tally per Out-of-scope).
- `turned === 'spring'` reliably means out-of-winter on a live tick (spring only follows winter in the 4-season wrap; restore path uses `syncSeason`, no turn beat).

### Estimated touch count
~4 files (thaw.ts, thaw.test.ts, WorldScene.ts, cycle-115-thaw.spec.ts).

---

## Structure track — BACKLOG-463: The provider's say

### Item
Per-zone spend priority set by the provider, read by pantry-spend (444) + granary build (454).

### Files to create
- `game/src/world/governance.ts` — pure:
  - `export type SpendPriority = 'feed' | 'bank';`
  - `BANK_RESERVE = 1`, `FEED_BUILD_FLOOR = 4`.
  - `providerPriority(traits?: Personality): SpendPriority` → `(traits?.agreeableness ?? 0.5) >= 0.5 ? 'feed' : 'bank'`.
  - `feedReserve(p: SpendPriority | null | undefined): number` → `p === 'bank' ? BANK_RESERVE : 0`.
  - `granaryDeferredForFeeding(p: SpendPriority | null | undefined, foodTotal: number): boolean` → `p === 'feed' && foodTotal < FEED_BUILD_FLOOR`.
- `game/src/world/governance.test.ts` — unit.

### Files to modify
- `game/src/world/foodstore.ts`:
  - `pickFoodToSpend(pile, favoriteId?, reserve = 0)` — favorite branch `(pile[favoriteId] ?? 0) > reserve`; stocked filter `(pile[f.id] ?? 0) > reserve`. Default 0 = byte-identical.
- `game/src/scenes/WorldScene.ts`:
  - Import from `../world/governance`; add `SpendPriority` to types.
  - Field `private spendPriorityByZone: Record<string, SpendPriority> = {};`
  - `private spendPriorityFor(zone): SpendPriority | null` — if `providerFor(zone)` exists, compute `providerPriority(this.dinoByName(provider)?.traits)`, store + return; else return `this.spendPriorityByZone[zone] ?? null` (lingers).
  - `feedFromStores`: `const priority = this.spendPriorityFor(zone); ... pickFoodToSpend(pile, fav, feedReserve(priority))`.
  - `buildOnGather`: granary branch gated `&& !granaryDeferredForFeeding(this.spendPriorityFor(zone), foodPileTotal(this.foodStoreFor(zone)))`.
  - Save: add `spendPriorityByZone` to the serialized envelope (near `foodPileByZone`, WorldScene:5321) and restore `?? {}` (near :5397).
  - Dev hook: `(window as any).__spendPriority = (zone: string) => this.spendPriorityFor(zone);`

### Reuse list
- `providerFor(zone)` / `roleOf` (WorldScene) — the provider read; do not re-derive.
- `foodPileTotal`, `foodStoreFor`, `takeFood`, `pickFoodToSpend` (`world/foodstore`) — the spend path.
- `Personality` (`ai/personality`) — `agreeableness` axis.
- Save envelope pattern at `foodPileByZone` (WorldScene:5321/5397) — copy for the additive field.

### New dependencies
none.

### Test plan
- Unit `governance.test.ts`: `providerPriority` boundary at 0.5 (0.5→feed, 0.49→bank, undefined→feed); `feedReserve` for feed/bank/null; `granaryDeferredForFeeding` truth table incl. null.
- Extend nothing in `foodstore.test.ts` beyond a reserve case (add: `pickFoodToSpend({a:1}, undefined, 1)` → null; `reserve` default byte-identical). Add to `governance.test.ts` to avoid touching shared file if cleaner.
- E2E `tests/e2e/cycle-115-governance.spec.ts`: assert `__spendPriority(zone)` is `null` with no provider (no regression); drive a provider by banking food (`__bankFood`) enough to cross `PROVIDER_BANKS`, then assert `__spendPriority` returns `'feed'`/`'bank'` per that provider's traits. Keep light — the mechanics are unit-covered.

### Risks
- **Regression on the build/spend hooks when a provider exists in an existing spec.** Mitigation: the no-provider path returns `null` → `feedReserve(null)=0`, `granaryDeferredForFeeding(null,...)=false` → byte-identical. A spec only changes behavior if it *both* has a settled provider *and* hits the thin-store/last-unit edge. Run the full suite; if a granary/foodstore e2e turns red, confirm it's a genuine new-policy interaction (provider present) and adjust the spec's setup, not the guard. Do NOT weaken the no-provider seam.
- Provider read calls `roleOf` (mutates `this.roles`) — already the case at every `providerFor` call site; no new side effect.

### Cross-track collision
None on source files. Both add one additive save field region; thaw adds no save field, so only `spendPriorityByZone` is new — no clobber.

### Estimated touch count
~5 files (governance.ts, governance.test.ts, foodstore.ts, WorldScene.ts, cycle-115-governance.spec.ts). Combined cycle ~9 files — within the arc cap.

---

## Shipped (Coder)

### Lore track — BACKLOG-215
Files touched:
- `game/src/world/thaw.ts` (new) — `thawedThroughWinter`, `thawLine`, `thawMemory`, `THAW_TOKEN`, `THAW_LIFT`.
- `game/src/world/thaw.test.ts` (new) — 8 unit tests.
- `game/src/scenes/WorldScene.ts` — imports; `runThawRelief()`; call in `checkSeasonTurn` (spring only); `__thawRelief` dev hook.
- `tests/e2e/cycle-115-thaw.spec.ts` (new) — 2 specs.

### Structure track — BACKLOG-463
Files touched:
- `game/src/world/governance.ts` (new) — `SpendPriority`, `providerPriority`, `feedReserve`, `granaryDeferredForFeeding`, `BANK_RESERVE`, `FEED_BUILD_FLOOR`.
- `game/src/world/governance.test.ts` (new) — 14 unit tests (incl. `pickFoodToSpend` reserve coverage).
- `game/src/world/foodstore.ts` — `pickFoodToSpend` gained optional trailing `reserve = 0` (default byte-identical).
- `game/src/scenes/WorldScene.ts` — imports; `spendPriorityByZone` field; `spendPriorityFor()`; reserve read in `feedFromStores`; defer read in `buildOnGather`; save serialize + restore; `__spendPriority` dev hook.
- `game/src/world/saveGame.ts` — `spendPriorityByZone?` on `SaveData`, parse validation (rejects non-`feed`/`bank`), returned from parser.
- `tests/e2e/cycle-115-governance.spec.ts` (new) — 1 spec (integration seam; mechanics unit-covered).

### Deviations from plan
- None material. Governance e2e kept to the integration seam (null↔provider↔stable) rather than the deterministic reserve/defer behavior, because a resident's temperament (which sets feed vs bank) is name-seeded and not controllable from the spec; the reserve/defer mechanics are fully unit-covered in `governance.test.ts`. Noted for QA.

### Status
- `npm run build`: ✅ clean (type-check passes).
- `npx vitest run` (root): ✅ **1375/1375** (was 1353; +22 new).
- `npx playwright test`: **394/395** — the lone red is `cycle-094-pause-ambient` boot timeout under full parallel load (the catalogued cold Vite/Phaser boot flake, memory `e2e-boot-flake`); it and both new cycle-115 specs pass green isolated on re-run. Off this cycle's diff.
- Boundary: no `@mlc-ai/web-llm` import added (thaw/governance are pure `world/` modules). Save change additive.
