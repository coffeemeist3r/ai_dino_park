# Cycle 47 — Code Plan

**Item** — BACKLOG-184 [social] Keeper's warmth — greeting or feeding a shivering dino clears the 🥶 early and files "the keeper warmed me"; the 125 repair shape brought to winter.

## Files to create

### `tests/e2e/cycle-047-warmth.spec.ts`

## Files to modify

### `game/src/world/cold.ts` (stays pure)
- `export const WARM_BONUS = 6` — the repair-bonus magnitude, deliberately equal to `REPAIR_BONUS`.
- `export function warmGain(traits?: Personality): number` → `greetGain(traits) + WARM_BONUS` (imports `greetGain` from `../social/friendship`, `Personality` type from `../ai/personality` — both pure).
- `export function warmLine(name: string): string` → `` `${name} stops shivering 😊` ``.
- `export function warmMemory(): string` → `'the keeper warmed me after a cold night'`.
- The trio mirrors `repair.ts` exactly (gain = base + bonus / line / memory).

### `game/src/scenes/WorldScene.ts` (thin glue)
- Fields: `private coldPending = new Set<string>()`; `private coldMarks: Phaser.GameObjects.Text[] = []` (created beside `sleepMarks` at create — one 🥶 Text per dino, hidden, same depth).
- `refreshColdMarks()` — the `refreshSleepMarks` pattern: `mark.setVisible(this.coldPending.has(d.name)).setPosition(d.x, d.y - TILE * 1.4)` (offset above the 💤 slot so a dusk overlap can't stack glyphs); called beside both existing `refreshSleepMarks()` call sites.
- `resolveColdMorning()`: after the existing loop, `this.coldPending = new Set(cold)` + `refreshColdMarks()`. (Cry/shiver/memory lines untouched.)
- Funk expiry in the step seam where `denTime` is read: on the window-OPEN edge (`denTime && !this.wasInHuddleWindow`) → `coldPending.clear()` + `refreshColdMarks()`. No new clock listeners; the tracker already exists.
- `recordGreet(name, traits)`: three-way gain —
  `repairing ? repairGain(traits) : warming ? warmGain(traits) : greetGain(traits) + this.applyKeeperBonus(traits)` where `warming = !repairing && this.coldPending.has(name)`; memory likewise three-way (`repairMemory` / `warmMemory()` / the plain hello). On `repairing` ALSO `coldPending.delete(name)` (design: repair wins, both flags clear); on `warming` delete + `showBubble(dino, warmLine(name))` + `refreshColdMarks()`.
- `recordTone(name, id, traits)`: same three-way shape (warming replaces the tone delta + keeper bonus, exactly as repair already does); `lastTone` still recorded either way.
- `eatFood(d)`: `const warming = this.coldPending.has(d.name)`; gain becomes `r.gain + (warming ? WARM_BONUS : 0)`; if warming → delete from set, second `remember(..., warmMemory())` (the eat memory stays), `showBubble(d, warmLine(d.name))`, `refreshColdMarks()`.
- Hook (dev block beside `__coldSleepers`): `__coldPending = () => [...this.coldPending]`.

### `tests/unit/cold.test.ts` (extend, +4)

## Reuse list (MUST use, not reinvent)

- `repair.ts` is the SHAPE (gain+bonus / line / memory / one-shot clear in `recordGreet`/`recordTone`) — copy the pattern, do not fork the file; `REPAIR_BONUS === WARM_BONUS === 6` keeps the two mends the same magnitude.
- `greetGain` — `game/src/social/friendship.ts` — the warm gain builds on it so personality still scales the mend.
- `refreshSleepMarks` — the persistent-mark convention (index-aligned Text array, `if (!mark) return` guards hatchlings).
- `wasInHuddleWindow` — the cycle-043 edge tracker; the open-edge is free.
- `eatFood` / `recordGreet` / `recordTone` / `showBubble` / `remember` — existing seams only; no new input path.
- E2E staging: cycle-043 `stageNight`/morning pattern; `__greet(name)` (drives `recordGreet` directly), `__friendship()`, `__dropFood`, `__warpTo`, keyboard tone path.

## New dependencies

None.

## Test plan

### Unit — extend `tests/unit/cold.test.ts` (+4)
1. `warmGain(t) === greetGain(t) + WARM_BONUS` at trait corners and for undefined traits.
2. `WARM_BONUS` ≥ 6 (at least the repair bonus).
3. `warmLine('Glade')` contains the name + 😊; differs from the shiver line.
4. `warmMemory()` says the keeper warmed it (contains 'keeper' + 'warm'), and is NOT the 🥶 cold memory.

### E2E — `tests/e2e/cycle-047-warmth.spec.ts` (~5)
1. **The funk appears** — winter staging: `__coldPending` set equals `__coldSleepers`; summer staging: both empty.
2. **A greet mends** — winter morning; pick a funked name; `f0 = __friendship()[name]`; `__greet(name)` → delta strictly > a control greet on a NON-funked dino with the same traits is overkill — assert delta === `greetGain+6` by computing greetGain bound: simpler exact assert: delta ≥ 6 + the minimum greet AND name gone from `__coldPending`, warm memory in `__memory`, 🥶 mark hidden (skip canvas introspection — the set + memory are the contract; the mark rides `refreshColdMarks` which the unit-less glue covers).
3. **The tone path mends** — second funked dino: `__warpTo` + `E` + `Digit1` → funk cleared + warm memory present (delta positive).
4. **A meal mends** — third winter run: `__dropFood` on the funked dino's tile → it eats; funk cleared; warm memory filed alongside the eat memory.
5. **Dusk thaws unwarmed funk silently** — stage morning funk, `__setClock` to winter dusk (19:00) + `__stepWorld` → `__coldPending` empty and no warm memory anywhere.

Sentries (unmodified): cycle-006 hearts, 027 favorites, 032 repair, 035 tones, 043 cold, 046 distress.

## Risks

- **Window-open edge vs staging:** any e2e that `__setClock`s into a winter evening will clear the funk — tests must do their warming BEFORE crossing dusk (ordering noted in each spec).
- **The cold cry fires during staging** (cycle-046 behavior): harmless to this feature, but `__lastDistress` will be set — don't assert on it here.
- **Greet menu vs `__greet`:** the keyboard `E` path opens the tone menu (recordTone); the plain-greet path is exercised via the `__greet` hook — both seams get a test.
- **Eater race in test 4:** drop the food exactly on the funked dino's tile (`reachedFood` is immediate adjacency) and read the eater from the friendship delta + memory rather than assuming.
- **Index-aligned marks vs hatchlings:** copy the `sleepMarks` guard; a dino born after create simply has no mark until the arrays are rebuilt (same accepted behavior as 💤).

## Estimated touch count

~4 files (2 modified src + 1 extended unit + 1 new e2e). Within budget.

## Shipped

**Files touched (4, exactly as planned):**
- `game/src/world/cold.ts` — +WARM_BONUS / warmGain / warmLine / warmMemory (pure; mirrors repair.ts)
- `game/src/scenes/WorldScene.ts` — coldPending set + 🥶 coldMarks (spawnDino-created, index-aligned), refreshColdMarks folded into refreshSleepMarks (covers both call sites — minor simplification over the plan's "beside both"), funk fill in resolveColdMorning, dusk thaw on the window-open edge, three-way gain in recordGreet/recordTone with a shared one-shot clearColdFunk (repair wins and clears both flags), WARM_BONUS on top of the food gain in eatFood, __coldPending hook
- `tests/unit/cold.test.ts` — +4 (warm trio + bonus parity with REPAIR_BONUS)
- `tests/e2e/cycle-047-warmth.spec.ts` — 5 new

**Deviations:** none of substance. refreshColdMarks is invoked from inside refreshSleepMarks rather than at each call site (equivalent coverage, fewer edits). The feed e2e uses a drop-and-race retry loop (≤6 drops) reading the eater from memory, per the plan's own risk note.

**Build:** clean. **Unit:** 410/410 (+4). **New e2e:** 5/5 first try. **Dev render:** HTTP 200.
Full Playwright run is QA's fire.
