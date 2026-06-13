# Cycle 48 — Code Plan

## Item
BACKLOG-208 [emergent] Nobody came — an unmended cold funk files a colder "nobody came" memory at the silent dusk thaw, before it clears; neglect made as legible as care.

## Shape
One pure string helper + one edit to the existing dusk-thaw branch. The branch already fires once on the den-window opening edge and already clears the funk; this cycle files a memory for each still-funked dino *before* the clear, then saves. No new listeners, no new state, no save-format change.

## Files to create
- `tests/e2e/cycle-048-nobody-came.spec.ts` — the seam proofs (neglect note filed at dusk, compounds with the cold note, surfaces in the greet prompt, warmed dino skipped).

## Files to modify
- `game/src/world/cold.ts` — add `neglectMemory()` returning `'shivered all morning; nobody came 😞'`. Pure; mirrors `coldMemory`/`warmMemory`. Doc-comment ties it to 208.
- `game/src/scenes/WorldScene.ts`
  - Import: add `neglectMemory` to the existing `from '../world/cold'` line (55). `remember` is already imported and used.
  - In `update()` dusk-thaw branch (~line 1255, `if (!this.wasInHuddleWindow && this.coldPending.size)`): before `this.coldPending.clear()`, loop the pending names and `this.memory = remember(this.memory, name, neglectMemory())`; after `refreshColdMarks()`, `void this.saveGame()`. Comment swaps from "silently, no memory; the 'nobody came' note is 208's" to the 208 note now landing.
- `tests/unit/cold.test.ts` — add a BACKLOG-208 `describe`: `neglectMemory()` non-empty + contains "nobody came"; the three cold memories (`coldMemory`/`warmMemory`/`neglectMemory`) pairwise distinct; the neglect note is not the plain cold note.

## Reuse list (CHARTER demands reuse — all existing, nothing invented)
- `remember` / `recall` — `game/src/ai/memory.ts` — the persisted ring buffer; the neglect note rides it exactly like the cold/warm notes.
- The dusk-thaw edge — `WorldScene.update()` ~1252-1261 — the `wasInHuddleWindow` true→false/false→true tracker cycle 43 already owns. Zero new clock listeners.
- `coldMemory` / `warmMemory` — `game/src/world/cold.ts` — sibling string helpers `neglectMemory` mirrors.
- `__coldPending` / `__memory` / `__greet` / `__greetPrompt` — existing dev hooks (WorldScene ~781/1545) the e2e drives.
- `stageColdMorning` staging shape — copy from `tests/e2e/cycle-047-warmth.spec.ts` (bond a pair past the bar, night clock, cross to morning); the other three dinos sleep cold, giving ≥2 funked dinos to test warmed-vs-neglected.

## New dependencies
none.

## Test plan
### Unit (`tests/unit/cold.test.ts`)
- `neglectMemory()` is non-empty and contains "nobody came".
- `coldMemory()`, `warmMemory()`, `neglectMemory()` are pairwise distinct (neglect ≠ cold, neglect ≠ warm).
- the neglect note carries no 🥶 of its own / is not byte-equal to the plain cold note (it's the *harder* note).

### E2E (`tests/e2e/cycle-048-nobody-came.spec.ts`)
1. **Nobody came → the colder memory, silently.** Stage a cold morning. Pick a funked dino, do NOT warm it. Cross winter dusk (`__setClock(22,19,30)` + `__stepWorld`). Assert: `__coldPending()` is `[]` (funk gone); `__memory()[name]` includes "nobody came" AND still includes the morning cold note (compounds); `__greetPrompt(name)` contains "nobody came" (tinges the next greeting).
2. **The warmed dino is spared.** Stage a cold morning with ≥2 funked dinos. `__greet` one of them (warms it, leaves the funk). Cross dusk. Assert: the warmed dino's memory has "the keeper warmed me" and NOT "nobody came"; an un-warmed funked dino's memory HAS "nobody came". Proves the neglect note only lands on dinos still in the set.

## Sentry check — cycle-047 warmth spec stays byte-identical
The cycle-047 "dusk thaws an unmended funk silently" test asserts `anyWarm === false` — it checks specifically for the *warm* memory ("the keeper warmed me"), which the neglect note does not contain. So the neglect memory does **not** trip it; the cycle-047 spec needs **no edit** (the design's worst-case constraint doesn't bite — the assertion was warm-memory-specific, not total-memory-absence). cycle-043 cold spec untouched (resolveColdMorning unchanged).

## Risks
- **Order:** file the neglect notes BEFORE `coldPending.clear()` — once cleared, the set is empty. (Loop then clear.)
- **Save churn:** the branch is already guarded by `this.coldPending.size`, so an empty/no-funk dusk edge never enters it — no extra `saveGame`. (AC: no-funk dusk files nothing.)
- **Ring buffer (max 6):** the morning cold note + the neglect note are two entries, well within the 6-deep buffer; both survive into `recall`.
- **Greet-prompt hook:** `__greetPrompt` builds the deterministic system string with "Lately: <last 3 memories>"; with cold+neglect the most recent, "nobody came" lands in the last-3 window. No model needed.

## Estimated touch count
~4 files (cold.ts, WorldScene.ts, cold.test.ts, new e2e). Logic change is a 3-line loop + a save in one existing branch; everything else is a pure string + tests. Well under the 6-file ceiling.

---

## Shipped

**Files touched:**
- `game/src/world/cold.ts` — added `neglectMemory()` ("shivered all morning; nobody came 😞"), pure, mirroring `coldMemory`/`warmMemory`.
- `game/src/scenes/WorldScene.ts` — imported `neglectMemory`; the dusk-thaw branch now files the neglect note for each still-funked dino via the already-imported `remember()` before `coldPending.clear()`, then `void this.saveGame()`. No other lines touched.
- `tests/unit/cold.test.ts` — added the BACKLOG-208 describe (3 tests: contains "nobody came"; the three cold memories pairwise distinct; carries no 🥶).
- `tests/e2e/cycle-048-nobody-came.spec.ts` — new (2 tests: unmended funk → neglect note + compounds + tinges greet prompt; warmed dino spared, only the un-warmed carry it).

**Deviations from plan:** none. Exactly the planned 4-file touch; the cycle-047 warmth spec was left untouched as predicted (its silent-thaw assertion is warm-memory-specific).

**Build + unit-test status:** `npm --prefix game run build` clean; `npm run test:unit` → 424 unit green (+3). Dev server booted, `curl http://localhost:5173/` → HTTP 200. Playwright deferred to QA.
