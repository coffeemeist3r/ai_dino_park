# Cycle 32 — Code Plan

## Item
BACKLOG-125 [social] Greeting the runner-up — repair the jealous runner-up's slight with an
outsized greet (😒 → 😊), one-shot, transient.

## Files to create
- `game/src/world/repair.ts` — pure repair logic (no Phaser, no WebLLM):
  - `export const REPAIR_BONUS = 6;` — extra points on top of a normal greet (≈ over half a heart more than the warmest greet).
  - `export function repairGain(traits?: Personality): number` — `greetGain(traits) + REPAIR_BONUS`. Reuses `greetGain` so warmth/sociability still scale, just bigger.
  - `export function repairLine(name: string): string` — `` `${name}: You noticed me! 😊` ``.
  - `export function repairMemory(name: string): string` — `` `the keeper noticed ${name} after all` `` (distinct from the plain greet memory; named so it reads in the store).
  - Imports: `greetGain` from `../social/friendship`, `type Personality` from `../ai/personality`.
- `tests/unit/repair.test.ts` — vitest for the pure module.
- `tests/e2e/cycle-032-repair.spec.ts` — the in-world flow.

## Files to modify
- `game/src/scenes/WorldScene.ts`:
  - Add field `private pendingRepair: string | null = null;` (transient; near `lastHomecoming`/`liveBubbles`).
  - `playHomecoming()` — after floating the jealous bubble, set `this.pendingRepair = hc.jealous.name;` (only when `hc.jealous`). When a homecoming with no jealous fires, leave `pendingRepair` untouched per spec? No — a fresh homecoming with no jealous should NOT clear a stale pending (edge unlikely); keep it simple: only *set* on jealous. (Pending is one-shot, cleared on repair; a new jealous overwrites.)
  - `recordGreet(name, traits)` — branch: `const repairing = this.pendingRepair === name;` then gain = `repairing ? repairGain(traits) : greetGain(traits)`, memory = `repairing ? repairMemory(name) : 'the human stopped by to say hello'`. If repairing: float `repairLine(name)` via `showBubble` on the matching dino and clear `this.pendingRepair = null`. Keep existing `saveGame()` + `refreshHeartsPanel()`.
  - Dev hooks (in the same block as `__homecoming`/`__bubbleTexts`): add
    `(window as any).__pendingRepair = () => this.pendingRepair;` and
    `(window as any).__friendshipPoints = () => ({ ...this.friendship });` (raw points so the e2e can prove the outsized bump precisely; hearts granularity is too coarse).
  - Import the three repair helpers + `REPAIR_BONUS` at top from `../world/repair`.

## Reuse list
- `greetGain`, `bumpPoints`, `heartsFromPoints` — `game/src/social/friendship.ts` (repair gain extends greetGain; no new affinity math).
- `remember`, `recall` — `game/src/ai/memory.ts` (the repair memory rides the existing store; no new persistence).
- `showBubble` + `this.liveBubbles` + `__bubbleTexts` — `WorldScene.ts` (the 😊 bubble reuses the exact 120 machinery).
- `playHomecoming` / `Homecoming.jealous` — `game/src/world/homecoming.ts` (consumed, not modified).
- `seededPersonality`/`Personality` type — `game/src/ai/personality.ts`.
- Existing dev hooks `__greet`, `__catchUp`, `__memory`, `__hearts` — drive the e2e.

## New dependencies
none.

## Test plan
- **Unit** (`tests/unit/repair.test.ts`):
  - `repairGain(traits) > greetGain(traits)` for representative traits (warm and cold).
  - `repairGain(undefined) > greetGain(undefined)` (the no-traits/base path) and `=== BASE_GAIN + REPAIR_BONUS`.
  - `repairGain` exceeds the normal gain by exactly `REPAIR_BONUS` for the same traits.
  - `repairLine(name)` contains the name and `😊`.
  - `repairMemory(name)` contains the name and is non-empty / distinct from the plain greet line.
- **E2E** (`tests/e2e/cycle-032-repair.spec.ts`):
  - Boot, seed two near-tied dinos' friendship via repeated `__greet` so a near-tie exists (or set via several greets), run `__catchUp(bigMs)` to stage a homecoming with a jealous runner-up; assert `__pendingRepair()` === the runner-up and `__homecoming().jealous.name` matches.
  - Record runner-up points via `__friendshipPoints()`, call `__greet(runnerUp)`, assert points rose by **> normal greetGain** (compare to a control greet of a non-jealous dino, or to the known `greetGain`), `__pendingRepair()` is now null, and `__bubbleTexts()` contains a string with the runner-up name and `😊`.
  - A second `__greet(runnerUp)` raises points by only the normal amount (one-shot) — assert the delta shrank.

## Risks
- **Near-tie setup in e2e:** friendship starts at 0 for all. `homecoming`/jealousy needs two dinos within `JEALOUS_TIE_POINTS` (10) and both > 0. Greeting bumps by `greetGain` (3 + trait bonus, varies per dino). Plan: greet two specific dinos an equal number of times; since each dino's per-greet gain is deterministic from its traits, pick the pair and counts so their totals land within 10 and are the top two. Use `__friendshipPoints()` to read actual values and assert the near-tie precondition before relying on it (fail loud if roster traits drift). Simpler: greet ALL via a couple rounds, then read points and pick the actual top-two from the hook rather than hard-coding names.
- **`__catchUp` advances the clock** (uses `fastForward`); harmless to friendship (away.ts touches bonds/memory, not player friendship). Homecoming reads `this.friendship` which the greets populated. Good.
- **One-shot semantics:** ensure `pendingRepair` is cleared inside `recordGreet` only on the repairing branch, so a normal greet of a different dino doesn't clear a pending repair (AC).
- Parallel-load boot flake on the full e2e run is known; re-run isolated if a lone spec reds.

## Estimated touch count
~4 files (1 new src, 1 modified src, 2 new tests). Under the 6-file split threshold.

---

## Shipped

**Files touched (4, as planned):**
- `game/src/world/repair.ts` (new) — `REPAIR_BONUS=6`, `repairGain=greetGain+bonus`, `repairLine` (😊), `repairMemory`. Pure; imports only `friendship.ts` + `Personality` type.
- `game/src/scenes/WorldScene.ts` — `pendingRepair` field; `playHomecoming` sets it on `hc.jealous`; `recordGreet` one-shot repair branch (outsized gain + 😊 bubble + repair memory + clear); `repair` import; `__pendingRepair` + `__friendshipPoints` dev hooks.
- `tests/unit/repair.test.ts` (new) — 5 tests.
- `tests/e2e/cycle-032-repair.spec.ts` (new) — 3 tests (outsized+one-shot, distinct memory, non-target untouched).

**Deviations:** none. No scope creep, no new deps.

**Build + unit-test status:** `npm --prefix game run build` clean; `npx vitest run` **202 passed** (26 files, +5 repair). Dev server smoke: HTTP 200. E2E left for QA.
